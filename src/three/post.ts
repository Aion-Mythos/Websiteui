/**
 * Finish it like film: MSAA HDR render target → bloom (high threshold, glints
 * only) → ACES tone mapping (OutputPass) → subtle grain.
 *
 * The scene renders over a transparent clear. A tap pass saves the scene's
 * alpha before bloom (bloom writes alpha everywhere), and the final pass
 * composites the exact page colour from the CSS tokens behind the object,
 * so the canvas matches the page to the pixel in both themes.
 */
import {
  Color,
  HalfFloatType,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
  type Camera,
  type Scene,
  type WebGLRenderer,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FullScreenQuad, Pass } from "three/examples/jsm/postprocessing/Pass.js";

const copyVert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

/** Copies the current read buffer into its own target without swapping. */
class TapPass extends Pass {
  target: WebGLRenderTarget;
  private quad: FullScreenQuad;
  private material: ShaderMaterial;

  constructor() {
    super();
    this.needsSwap = false;
    this.target = new WebGLRenderTarget(1, 1, { type: HalfFloatType });
    this.material = new ShaderMaterial({
      uniforms: { tDiffuse: { value: null } },
      vertexShader: copyVert,
      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse; varying vec2 vUv;
        void main() { gl_FragColor = texture2D(tDiffuse, vUv); }`,
    });
    this.quad = new FullScreenQuad(this.material);
  }

  setSize(w: number, h: number) {
    this.target.setSize(w, h);
  }

  render(renderer: WebGLRenderer, _write: WebGLRenderTarget, read: WebGLRenderTarget) {
    this.material.uniforms.tDiffuse.value = read.texture;
    renderer.setRenderTarget(this.target);
    this.quad.render(renderer);
  }

  dispose() {
    this.target.dispose();
    this.material.dispose();
    this.quad.dispose();
  }
}

const finalShader = {
  uniforms: {
    tDiffuse: { value: null },
    tAlpha: { value: null },
    uBg: { value: new Color() },
    uDim: { value: 0 },
    uScrim: { value: 0 },
    uGrain: { value: 0.035 },
    uTime: { value: 0 },
    uRes: { value: new Vector2(1, 1) },
  },
  vertexShader: copyVert,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform sampler2D tAlpha;
    uniform vec3 uBg;
    uniform float uDim;
    uniform float uScrim;
    uniform float uGrain;
    uniform float uTime;
    uniform vec2 uRes;
    varying vec2 vUv;
    float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;   // tone mapped, sRGB, premultiplied over black
      float a = clamp(texture2D(tAlpha, vUv).a, 0.0, 1.0);
      vec3 col = c + uBg * (1.0 - a);
      col = mix(col, uBg, uDim);
      // Text-side scrim: the object fades into the page where the copy sits.
      col = mix(col, uBg, uScrim * (1.0 - smoothstep(0.18, 0.56, vUv.x)));
      float n = hash(floor(vUv * uRes) + fract(uTime) * 61.0) - 0.5;
      col += n * uGrain * (0.35 + 0.65 * a);
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export class Post {
  composer: EffectComposer;
  bloom: UnrealBloomPass;
  final: ShaderPass;
  private tap: TapPass;
  private renderPass: RenderPass;

  constructor(renderer: WebGLRenderer, scene: Scene, camera: Camera) {
    const size = renderer.getDrawingBufferSize(new Vector2());
    const rt = new WebGLRenderTarget(size.x, size.y, { type: HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(renderer, rt);
    this.renderPass = new RenderPass(scene, camera, undefined, new Color(0, 0, 0), 0);
    this.tap = new TapPass();
    this.bloom = new UnrealBloomPass(new Vector2(size.x, size.y), 0.42, 0.32, 0.9);
    this.final = new ShaderPass(finalShader);
    this.final.uniforms.tAlpha.value = this.tap.target.texture;
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.tap);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.composer.addPass(this.final);
  }

  /** The page colour, as written in CSS (sRGB). */
  setBackground(css: string) {
    const c = this.final.uniforms.uBg.value as Color;
    // Keep it in sRGB: the final pass runs after the colour-space conversion.
    c.setStyle(css);
    c.convertLinearToSRGB();
  }

  setSize(w: number, h: number, pixelRatio: number) {
    this.composer.setPixelRatio(pixelRatio);
    this.composer.setSize(w, h);
    this.final.uniforms.uRes.value.set(w * pixelRatio, h * pixelRatio);
  }

  set bloomEnabled(on: boolean) {
    this.bloom.enabled = on;
  }

  render(dt: number, time: number, dim: number, scrim: number) {
    this.final.uniforms.uTime.value = time;
    this.final.uniforms.uDim.value = dim;
    this.final.uniforms.uScrim.value = scrim;
    this.composer.render(dt);
  }

  dispose() {
    this.composer.dispose();
    this.tap.dispose();
    this.bloom.dispose();
  }
}
