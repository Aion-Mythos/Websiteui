/**
 * Textures generated in code at boot: anisotropy direction maps for brushed
 * finishes (circular, radial, striped), a mottled roughness map for patina,
 * a lattice emissive map for the core, and a soft contact shadow.
 *
 * Anisotropy maps encode the tangent-space direction in RG (mapped from
 * -1..1 to 0..1) and the strength in B, as MeshPhysicalMaterial expects.
 */
import {
  CanvasTexture,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
} from "three";

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function valueNoise(x: number, y: number) {
  const xi = Math.floor(x),
    yi = Math.floor(y);
  const xf = x - xi,
    yf = y - yi;
  const u = xf * xf * (3 - 2 * xf),
    v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi),
    b = hash(xi + 1, yi),
    c = hash(xi, yi + 1),
    d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x: number, y: number) {
  let s = 0,
    a = 0.5,
    f = 1;
  for (let i = 0; i < 4; i++) {
    s += valueNoise(x * f, y * f) * a;
    f *= 2.03;
    a *= 0.5;
  }
  return s;
}

function data(size: number, fn: (u: number, v: number, out: number[]) => void, wrap = false) {
  const buf = new Uint8Array(size * size * 4);
  const px = [0, 0, 0, 255];
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      fn((i + 0.5) / size, (j + 0.5) / size, px);
      const o = (j * size + i) * 4;
      buf[o] = px[0];
      buf[o + 1] = px[1];
      buf[o + 2] = px[2];
      buf[o + 3] = px[3];
    }
  }
  const t = new DataTexture(buf, size, size, RGBAFormat, UnsignedByteType);
  t.colorSpace = NoColorSpace;
  t.generateMipmaps = true;
  t.minFilter = LinearMipmapLinearFilter;
  t.magFilter = LinearFilter;
  if (wrap) t.wrapS = t.wrapT = RepeatWrapping;
  t.needsUpdate = true;
  return t;
}

const enc = (v: number) => Math.round((v * 0.5 + 0.5) * 255);

export type Textures = ReturnType<typeof makeTextures>;

export function makeTextures() {
  /** Lathe UVs run u around the axis, so (1,0) brushes in circles. Strength varies in fine stripes. */
  const striped = data(
    256,
    (u, v, o) => {
      const stripe = 0.72 + 0.28 * fbm(u * 3, v * 220);
      o[0] = enc(1);
      o[1] = enc(0);
      o[2] = Math.round(stripe * 255);
    },
    true,
  );

  /** Planar UVs centred at 0.5: brushing follows circles around the centre. */
  const circular = data(256, (u, v, o) => {
    const x = u - 0.5,
      y = v - 0.5;
    const r = Math.hypot(x, y) || 1e-6;
    const strength = 0.7 + 0.3 * fbm(r * 260, 0.5);
    o[0] = enc(-y / r);
    o[1] = enc(x / r);
    o[2] = Math.round(strength * 255);
  });

  /** Planar UVs centred at 0.5: brushing runs outward like a turned face. */
  const radial = data(256, (u, v, o) => {
    const x = u - 0.5,
      y = v - 0.5;
    const r = Math.hypot(x, y) || 1e-6;
    const a = Math.atan2(y, x);
    const strength = 0.7 + 0.3 * fbm(a * 40, 0.5);
    o[0] = enc(x / r);
    o[1] = enc(y / r);
    o[2] = Math.round(strength * 255);
  });

  /** Patina mottling: green channel is roughness. */
  const patinaRough = data(
    256,
    (u, v, o) => {
      const n = fbm(u * 9, v * 9);
      const g = 0.45 + 0.4 * n;
      o[0] = o[1] = o[2] = Math.round(g * 255);
    },
    true,
  );

  /** Core emissive: faint micro-seams and soft hot spots, so the glow lives in the surface, not a grid. */
  const lattice = data(
    512,
    (u, v, o) => {
      const gu = Math.abs(((u * 96) % 1) - 0.5),
        gv = Math.abs(((v * 48) % 1) - 0.5);
      const seam = Math.max(0, 1 - Math.min(gu, gv) / 0.06) * 0.22;
      const hot = Math.pow(fbm(u * 14, v * 7), 2.4) * 1.1;
      const val = Math.round(Math.min(1, 0.06 + seam + hot) * 255);
      o[0] = o[1] = o[2] = val;
    },
    true,
  );
  lattice.colorSpace = SRGBColorSpace;

  /** Soft contact shadow under the plinth. */
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.3, "rgba(255,255,255,0.5)");
  grad.addColorStop(0.65, "rgba(255,255,255,0.12)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const shadow = new CanvasTexture(c);

  return { striped, circular, radial, patinaRough, lattice, shadow };
}
