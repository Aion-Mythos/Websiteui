/**
 * Metal is a mirror: every finish is MeshPhysicalMaterial with metalness 1,
 * lit only by the baked studio. Each part gets two materials, a satin face
 * and a polished bevel, for the machined contrast. Patina parts (the cage)
 * use deep verdigris with higher, mottled roughness. The core adds a
 * clearcoat over an emissive lattice.
 */
import { DoubleSide, LineBasicMaterial, MeshBasicMaterial, MeshPhysicalMaterial, type Texture } from "three";
import type { Palette } from "./palette";
import type { Textures } from "./textures";

export type MaterialSet = ReturnType<typeof makeMaterials>;

function brushed(map: Texture, repeat = 1) {
  const t = map.clone();
  t.needsUpdate = true;
  t.repeat.set(repeat, repeat);
  return t;
}

export function makeMaterials(p: Palette, tx: Textures) {
  const gunmetalFace = new MeshPhysicalMaterial({
    color: p["metal-face"],
    metalness: 1,
    roughness: 0.36,
    anisotropy: 0.65,
    anisotropyMap: tx.striped,
  });
  const gunmetalFlat = new MeshPhysicalMaterial({
    color: p["metal-face"],
    metalness: 1,
    roughness: 0.34,
    anisotropy: 0.6,
    anisotropyMap: brushed(tx.circular, 1),
  });
  const deepFace = new MeshPhysicalMaterial({
    color: p["metal-deep"],
    metalness: 1,
    roughness: 0.42,
    anisotropy: 0.5,
    anisotropyMap: tx.striped,
  });
  const polished = new MeshPhysicalMaterial({
    color: p["metal-edge"],
    metalness: 1,
    roughness: 0.08,
  });
  const patina = new MeshPhysicalMaterial({
    color: p.patina,
    metalness: 1,
    roughness: 0.62,
    roughnessMap: tx.patinaRough,
  });
  const patinaDeep = new MeshPhysicalMaterial({
    color: p["patina-deep"],
    metalness: 1,
    roughness: 0.7,
    roughnessMap: tx.patinaRough,
  });
  /** Worn copper on patina edges: polished through the green. */
  const patinaEdge = new MeshPhysicalMaterial({
    color: p.patina.clone().lerp(p["metal-edge"], 0.45),
    metalness: 1,
    roughness: 0.2,
  });
  const engraving = new MeshPhysicalMaterial({
    color: p["metal-deep"].clone().multiplyScalar(0.35),
    metalness: 1,
    roughness: 0.75,
  });
  const core = new MeshPhysicalMaterial({
    color: p.core,
    metalness: 0.85,
    roughness: 0.46,
    clearcoat: 1,
    clearcoatRoughness: 0.14,
    emissive: p["core-glow"],
    emissiveMap: tx.lattice,
    emissiveIntensity: 0.4,
    flatShading: true,
  });
  const shadow = new MeshBasicMaterial({
    color: p.shadow,
    alphaMap: tx.shadow,
    transparent: true,
    opacity: p.light ? 0.16 : 0,
    depthWrite: false,
    side: DoubleSide,
  });
  const line = new LineBasicMaterial({ color: p.line, toneMapped: false, transparent: true, opacity: 0.9 });

  return {
    gunmetalFace,
    gunmetalFlat,
    deepFace,
    polished,
    patina,
    patinaDeep,
    patinaEdge,
    engraving,
    core,
    shadow,
    line,
  };
}

/** Re-tint every material from a fresh palette after a theme toggle. */
export function retint(m: MaterialSet, p: Palette) {
  m.gunmetalFace.color.copy(p["metal-face"]);
  m.gunmetalFlat.color.copy(p["metal-face"]);
  m.deepFace.color.copy(p["metal-deep"]);
  m.polished.color.copy(p["metal-edge"]);
  m.patina.color.copy(p.patina);
  m.patinaDeep.color.copy(p["patina-deep"]);
  m.patinaEdge.color.copy(p.patina.clone().lerp(p["metal-edge"], 0.45));
  m.engraving.color.copy(p["metal-deep"].clone().multiplyScalar(0.35));
  m.core.color.copy(p.core);
  m.core.emissive.copy(p["core-glow"]);
  m.shadow.color.copy(p.shadow);
  m.shadow.opacity = p.light ? 0.16 : 0;
  m.line.color.copy(p.line);
}

