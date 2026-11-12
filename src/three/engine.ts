/**
 * The one engine class. Owns the renderer, the studio, Ortiplex, the post
 * chain, the scroll-directed camera, the shared clock and adaptive quality.
 * Plain three.js; no react-three-fiber.
 */
import {
  ACESFilmicToneMapping,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import { readPalette, type Palette } from "./palette";
import { StudioEnvironment } from "./studio";
import { makeTextures, type Textures } from "./textures";
import { makeMaterials, retint, type MaterialSet } from "./materials";
import { Ortiplex } from "./ortiplex";
import { Post } from "./post";
import { CUES, STILLS, lerpShot, shotFor, type Shot } from "./cues";
import { brandAudio } from "./audio";
import { stage } from "@/lib/store";
import { tilt } from "@/lib/tilt";
import type { PartId } from "./parts";

export type ProjectedAnchor = { id: PartId; x: number; y: number };
export type FrameInfo = {
  anchors: ProjectedAnchor[];
  centre: { x: number; y: number };
  explode: number;
  width: number;
  height: number;
};

type Options = {
  canvas: HTMLCanvasElement;
  snap?: boolean;
  reducedMotion?: boolean;
};

const VFOV = 30;
const BEAT = 2.4; // clock seconds per beat
const NARROW = 768;

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const damp = (k: number, dt: number) => 1 - Math.exp(-k * dt);

export class Engine {
  readonly renderer: WebGLRenderer;
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(VFOV, 1, 1, 6000);
  private palette!: Palette;
  private textures!: Textures;
  private materials!: MaterialSet;
  private studio!: StudioEnvironment;
  private ortiplex!: Ortiplex;
  private post!: Post;

  private shot: Shot = { ...CUES[0].shot };
  private target: Shot = { ...CUES[0].shot };
  private cueY: number[] = [];
  private lastLayout = 0;

  private time = 0;
  private beatIndex = 0;
  private beatFlash = 0;
  private flare = 0;
  private spin = 0;
  private angMid = 0.6;
  private angInner = 1.1;
  private lastIgnitions = 0;

  private pointer = { x: 0.5, y: 0.5 };
  private env = { yaw: 0, pitch: 0 };

  private raf = 0;
  private last = 0;
  private running = false;
  private disposed = false;
  private width = 1;
  private height = 1;

  private quality = { cap: 1.75, scale: 1, bloom: true, frames: 0, acc: 0, settleUntil: 0 };
  private listeners = new Set<(f: FrameInfo) => void>();
  private unsub: Array<() => void> = [];
  private tmp = new Vector3();
  private tmp2 = new Vector3();
  private frameInfo: FrameInfo = { anchors: [], centre: { x: 0, y: 0 }, explode: 0, width: 1, height: 1 };

  constructor(private opts: Options) {
    this.renderer = new WebGLRenderer({
      canvas: opts.canvas,
      antialias: false, // MSAA happens in the HDR target
      alpha: false,
      powerPreference: "high-performance",
      stencil: false,
    });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    const phone = window.matchMedia("(pointer: coarse)").matches && Math.min(screen.width, screen.height) < 820;
    this.quality.cap = phone ? 1.5 : 1.75;
  }

  /** Builds everything behind the loader. Reports progress 0..1. */
  async init(onProgress: (p: number) => void) {
    const tick = () => new Promise((r) => setTimeout(r, 0));
    this.palette = readPalette();
    this.resize();
    onProgress(0.1);
    await tick();

    this.textures = makeTextures();
    this.materials = makeMaterials(this.palette, this.textures);
    onProgress(0.25);
    await tick();

    this.ortiplex = new Ortiplex(this.materials);
    this.scene.add(this.ortiplex.root);
    onProgress(0.55);
    await tick();

    this.studio = new StudioEnvironment(this.renderer);
    this.scene.environment = this.studio.bake(this.palette);
    this.applyExposure();
    this.post = new Post(this.renderer, this.scene, this.camera);
    this.post.setBackground(this.palette.backgroundCss);
    this.resize();
    onProgress(0.7);
    await tick();

    this.layoutCues();
    this.updateTarget(true);
    this.shot = { ...this.target };
    this.placeCamera();
    await this.renderer.compileAsync(this.scene, this.camera);
    if (this.disposed) return;
    onProgress(1);

    this.bind();
    this.start();

    // Heavy extras once the page is idle: blueprint edge geometry.
    const idle = (cb: () => void) =>
      typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(cb, { timeout: 4000 }) : setTimeout(cb, 1500);
    idle(() => !this.disposed && this.ortiplex.buildEdges());
  }

  onFrame(cb: (f: FrameInfo) => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private bind() {
    const onResize = () => {
      this.resize();
      this.layoutCues();
    };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      this.pointer.x = e.clientX / window.innerWidth;
      this.pointer.y = e.clientY / window.innerHeight;
    };
    const onTheme = () => this.setTheme();
    const obs = new MutationObserver(onTheme);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    const canvas = this.opts.canvas;
    const onLost = (e: Event) => {
      e.preventDefault();
      this.stop();
      stage.set({ webgl: "failed" });
      document.documentElement.classList.add("no-webgl");
    };
    canvas.addEventListener("webglcontextlost", onLost);

    let blueprint = stage.get().blueprint;
    const unsubStage = stage.subscribe(() => {
      const s = stage.get();
      if (s.blueprint !== blueprint) {
        blueprint = s.blueprint;
        this.ortiplex.setBlueprint(blueprint);
        this.post.bloomEnabled = !blueprint && this.quality.bloom;
      }
    });

    this.unsub.push(
      () => window.removeEventListener("resize", onResize),
      () => window.removeEventListener("pointermove", onPointer),
      () => canvas.removeEventListener("webglcontextlost", onLost),
      () => obs.disconnect(),
      unsubStage,
    );
  }

  private applyExposure() {
    this.renderer.toneMappingExposure = this.palette.light ? 1.05 : 1.0;
    this.scene.environmentIntensity = this.palette.light ? 1.0 : 1.0;
  }

  setTheme() {
    if (!this.post) return;
    this.palette = readPalette();
    this.scene.environment = this.studio.bake(this.palette);
    retint(this.materials, this.palette);
    this.post.setBackground(this.palette.backgroundCss);
    this.applyExposure();
  }

  private pixelRatio() {
    return Math.max(0.5, Math.min(window.devicePixelRatio || 1, this.quality.cap) * this.quality.scale);
  }

  resize() {
    const w = window.innerWidth;
    // Use the large viewport on phones so the URL bar showing/hiding never resizes the canvas.
    const h = Math.max(window.innerHeight, document.documentElement.clientHeight);
    this.width = w;
    this.height = h;
    const pr = this.pixelRatio();
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.post?.setSize(w, h, pr);
  }

  /** Converts each cue into an absolute scroll position from its section's layout. */
  private layoutCues() {
    const vh = window.innerHeight;
    const y = window.scrollY;
    this.cueY = CUES.map((c) => {
      const el = document.getElementById(c.section);
      if (!el) return 0;
      const top = el.getBoundingClientRect().top + y;
      const run = Math.max(1, el.offsetHeight - vh);
      return top + c.at * run;
    });
    // Keep them monotonic, so blending never runs backwards.
    for (let i = 1; i < this.cueY.length; i++) this.cueY[i] = Math.max(this.cueY[i], this.cueY[i - 1] + 1);
    this.cueY[0] = 0;
    this.lastLayout = performance.now();
  }

  private sectionInView() {
    const mid = window.innerHeight / 2;
    for (const id of Object.keys(STILLS)) {
      const el = document.getElementById(id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) return id;
    }
    return "hero";
  }

  private updateTarget(force = false) {
    const narrow = this.width < NARROW;
    if (this.opts.reducedMotion || stage.get().reducedMotion) {
      const id = STILLS[this.sectionInView()] ?? "hero";
      const cue = CUES.find((c) => c.id === id) ?? CUES[0];
      Object.assign(this.target, shotFor(cue, narrow));
      return;
    }
    if (!force && performance.now() - this.lastLayout > 800) this.layoutCues();
    const y = window.scrollY;
    const Y = this.cueY;
    let i = 0;
    while (i < Y.length - 2 && y >= Y[i + 1]) i++;
    const t = Math.max(0, Math.min(1, (y - Y[i]) / (Y[i + 1] - Y[i] || 1)));
    lerpShot(shotFor(CUES[i], narrow), shotFor(CUES[i + 1], narrow), smoothstep(t), this.target);
  }

  /** Frame by size: fit `frame` mm on the shorter axis, then pan by screen fractions. */
  private placeCamera() {
    const s = this.shot;
    const cam = this.camera;
    const polar = (s.polar * Math.PI) / 180;
    const az = (s.azimuth * Math.PI) / 180;
    const tanHalf = Math.tan(((VFOV / 2) * Math.PI) / 180);
    const aspect = cam.aspect;
    const d = s.frame / 2 / (tanHalf * Math.min(1, aspect));
    const dir = this.tmp.set(Math.sin(polar) * Math.sin(az), Math.cos(polar), Math.sin(polar) * Math.cos(az));
    cam.position.copy(dir).multiplyScalar(d);
    cam.up.set(0, 1, 0);
    cam.lookAt(0, 0, 0);
    const visH = 2 * d * tanHalf;
    const visW = visH * aspect;
    const right = this.tmp2.setFromMatrixColumn(cam.matrixWorld, 0);
    cam.position.addScaledVector(right, -s.offsetX * visW);
    const up = this.tmp2.setFromMatrixColumn(cam.matrixWorld, 1);
    cam.position.addScaledVector(up, -s.offsetY * visH);
    cam.updateMatrixWorld();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.quality.settleUntil = this.last + 2500;
    const loop = (now: number) => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      this.frame(now);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private frame(now: number) {
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    const st = stage.get();
    const reduced = this.opts.reducedMotion || st.reducedMotion;
    const snap = this.opts.snap || reduced;

    // ── Camera: blend cues by scroll, then ease toward the result.
    this.updateTarget();
    const k = snap ? 1 : damp(3.2, dt);
    for (const key of Object.keys(this.target) as (keyof Shot)[]) {
      this.shot[key] += (this.target[key] - this.shot[key]) * k;
    }
    this.placeCamera();

    // ── One clock that everything reads. Reduced motion freezes auto-motion.
    const timeScale = reduced ? 0 : this.shot.timeScale;
    const dts = dt * timeScale;
    this.time += dts;
    const beat = Math.floor(this.time / BEAT);
    if (beat !== this.beatIndex) {
      this.beatIndex = beat;
      this.beatFlash = 1;
      if (st.sound) brandAudio.beat(this.flare);
    }
    this.beatFlash *= Math.exp(-dt * 2.5);

    // ── Hold to ignite.
    if (st.ignitions !== this.lastIgnitions) {
      this.lastIgnitions = st.ignitions;
      this.flare = 1;
      if (!reduced) this.spin = 7;
    }
    this.flare *= Math.exp(-dt * 1.4);
    const windUp = reduced ? 0 : st.ignite * 2.4;
    this.spin += (windUp - this.spin) * damp(this.spin > windUp ? 0.9 : 3, dt);

    // Rings rotate slowly on their pins; the core breathes.
    const ringRate = reduced ? 0 : 1;
    this.angMid += (0.3 * ringRate * timeScale + this.spin) * dt;
    this.angInner += (0.46 * ringRate * timeScale + this.spin * 1.45) * dt;
    const o = this.ortiplex;
    o.ringMid.rotation.x = this.angMid;
    o.ringInner.rotation.z = this.angInner;
    const breath = reduced ? 0 : 0.5 + 0.5 * Math.sin((this.time / BEAT) * Math.PI * 2);
    const glow = 0.16 + breath * 0.16 + this.beatFlash * 0.3 + st.ignite * 2.4 + this.flare * 9;
    this.materials.core.emissiveIntensity = glow;
    o.core.rotation.y = this.time * 0.05;

    // ── Exploded view.
    o.explode(this.shot.explode);

    // ── Environment follows the cursor (or phone tilt).
    const px = tilt.active ? tilt.x * 0.5 + 0.5 : this.pointer.x;
    const py = tilt.active ? tilt.y * 0.5 + 0.5 : this.pointer.y;
    const ek = damp(2.2, dt);
    this.env.yaw += ((px - 0.5) * 0.9 - this.env.yaw) * ek;
    this.env.pitch += ((py - 0.5) * 0.3 - this.env.pitch) * ek;
    this.scene.environmentRotation.set(this.env.pitch, this.env.yaw, 0);

    this.post.render(dt, now / 1000, this.shot.dim, this.shot.scrim);
    this.emit();
    if (!snap) this.adapt(dt, now);
  }

  private emit() {
    if (!this.listeners.size) return;
    const f = this.frameInfo;
    f.width = this.width;
    f.height = this.height;
    f.explode = this.shot.explode;
    f.anchors.length = 0;
    for (const a of this.ortiplex.anchors) {
      const v = this.tmp.copy(a.local);
      a.object.localToWorld(v);
      v.project(this.camera);
      f.anchors.push({ id: a.id, x: (v.x * 0.5 + 0.5) * this.width, y: (-v.y * 0.5 + 0.5) * this.height });
    }
    const c = this.tmp.set(0, 0, 0).project(this.camera);
    f.centre.x = (c.x * 0.5 + 0.5) * this.width;
    f.centre.y = (-c.y * 0.5 + 0.5) * this.height;
    this.listeners.forEach((l) => l(f));
  }

  /** Under 40 fps: step resolution down, then turn bloom off. */
  private adapt(dt: number, now: number) {
    const q = this.quality;
    if (now < q.settleUntil || document.hidden) return;
    q.frames++;
    q.acc += dt;
    if (q.acc < 1.5) return;
    const fps = q.frames / q.acc;
    q.frames = 0;
    q.acc = 0;
    if (fps >= 40) return;
    if (q.scale > 0.62) {
      q.scale = Math.max(0.6, q.scale * 0.8);
      this.resize();
    } else if (q.bloom) {
      q.bloom = false;
      this.post.bloomEnabled = false;
    }
    q.settleUntil = now + 1200;
  }

  dispose() {
    this.disposed = true;
    this.stop();
    this.unsub.forEach((u) => u());
    this.listeners.clear();
    this.ortiplex?.dispose();
    this.post?.dispose();
    this.studio?.dispose();
    Object.values(this.textures ?? {}).forEach((t) => t.dispose());
    Object.values(this.materials ?? {}).forEach((m) => m.dispose());
    this.renderer.dispose();
  }
}
