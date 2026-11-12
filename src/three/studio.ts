/**
 * A tiny photo studio, baked into an environment map. One off-axis key
 * softbox and two strip lights; nothing else. Metal is a mirror, so these
 * panels are what draws every highlight and edge line. In dark mode the
 * studio is low-key with deep falloff; in light mode it is brighter and
 * softer so the metal reads as satin on paper.
 */
import {
  BackSide,
  Color,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  SphereGeometry,
  Vector3,
  type WebGLRenderer,
  type Texture,
} from "three";
import type { Palette } from "./palette";

function panel(w: number, h: number, color: Color, intensity: number, pos: Vector3, look = new Vector3()) {
  const m = new Mesh(
    new PlaneGeometry(w, h),
    new MeshBasicMaterial({ color: color.clone().multiplyScalar(intensity), toneMapped: false }),
  );
  m.position.copy(pos);
  m.lookAt(look);
  // lookAt turns the plane's front (+z) toward the target, where the bake camera sits.
  return m;
}

export function buildStudio(p: Palette) {
  const s = new Scene();
  const L = p.light;

  // The room. Dark: near black with a faint warm floor bounce. Light: soft paper grey.
  const room = new Mesh(
    new SphereGeometry(20, 32, 16),
    new MeshBasicMaterial({ color: p.fill.clone().multiplyScalar(L ? 0.2 : 0.04), side: BackSide, toneMapped: false }),
  );
  s.add(room);

  // Floor bounce: a broad dim panel below.
  s.add(panel(30, 30, p.fill, L ? 0.28 : 0.06, new Vector3(0, -9, 0)));

  // Key softbox: off-axis, above-left-front. The main shape on every face.
  s.add(panel(L ? 8 : 6.5, L ? 5.5 : 4.5, p.key, L ? 2.6 : 3.6, new Vector3(-7, 6, 6)));

  // Two strip lights that draw thin edge lines on bevels and rings.
  s.add(panel(0.4, 9, p.strip, L ? 1.8 : 2.2, new Vector3(8.5, 1.5, -2.5)));
  s.add(panel(0.3, 8, p.strip, L ? 1.2 : 1.4, new Vector3(-6.5, 0.5, -7)));

  // A faint top scrim so polished tops are not black.
  s.add(panel(6, 6, p.key, L ? 0.7 : 0.25, new Vector3(1, 11, -1)));

  return s;
}

export class StudioEnvironment {
  private pmrem: PMREMGenerator;
  private current: { texture: Texture; dispose: () => void } | null = null;

  constructor(renderer: WebGLRenderer) {
    this.pmrem = new PMREMGenerator(renderer);
  }

  bake(p: Palette) {
    const studio = buildStudio(p);
    const rt = this.pmrem.fromScene(studio, 0.035);
    studio.traverse((o) => {
      if (o instanceof Mesh) {
        o.geometry.dispose();
        (o.material as MeshBasicMaterial).dispose();
      }
    });
    const prev = this.current;
    this.current = { texture: rt.texture, dispose: () => rt.dispose() };
    prev?.dispose();
    return rt.texture;
  }

  dispose() {
    this.current?.dispose();
    this.pmrem.dispose();
  }
}
