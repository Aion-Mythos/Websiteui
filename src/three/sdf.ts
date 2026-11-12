/**
 * A small 2D signed-distance toolkit for machined profiles, in millimetres.
 * Negative inside, positive outside. Fields compose with union, subtract and
 * a smooth union whose blend radius is a real fillet radius in mm.
 * traceLoops() turns a field into closed polylines with marching squares,
 * and toShapes() turns those into THREE.Shapes (outer contours with holes).
 */
import { Shape, Vector2 } from "three";

export type Field = (x: number, y: number) => number;

export const circle =
  (cx: number, cy: number, r: number): Field =>
  (x, y) =>
    Math.hypot(x - cx, y - cy) - r;

export const capsule =
  (ax: number, ay: number, bx: number, by: number, r: number): Field =>
  (x, y) => {
    const pax = x - ax,
      pay = y - ay,
      bax = bx - ax,
      bay = by - ay;
    const h = Math.max(0, Math.min(1, (pax * bax + pay * bay) / (bax * bax + bay * bay)));
    return Math.hypot(pax - bax * h, pay - bay * h) - r;
  };

/** Rounded rectangle centred at (cx, cy), full width/height, corner radius r. */
export const rect =
  (cx: number, cy: number, w: number, h: number, r = 0): Field =>
  (x, y) => {
    const qx = Math.abs(x - cx) - w / 2 + r;
    const qy = Math.abs(y - cy) - h / 2 + r;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
  };

/** Arc band of centre radius `ra`, half-thickness `rb`, symmetric about +x, half aperture `deg`. Round ends. */
export const arc =
  (ra: number, rb: number, deg: number): Field =>
  (x, y) => {
    // iq's sdArc, rotated so the arc is centred on +x.
    const px = Math.abs(y);
    const py = x;
    const a = (deg * Math.PI) / 180;
    const sx = Math.sin(a),
      sy = Math.cos(a);
    return (sy * px > sx * py ? Math.hypot(px - sx * ra, py - sy * ra) : Math.abs(Math.hypot(px, py) - ra)) - rb;
  };

export const union =
  (...fs: Field[]): Field =>
  (x, y) => {
    let d = Infinity;
    for (const f of fs) d = Math.min(d, f(x, y));
    return d;
  };

export const subtract =
  (a: Field, ...bs: Field[]): Field =>
  (x, y) => {
    let d = a(x, y);
    for (const b of bs) d = Math.max(d, -b(x, y));
    return d;
  };

export const intersect =
  (a: Field, b: Field): Field =>
  (x, y) =>
    Math.max(a(x, y), b(x, y));

/** Smooth union with a fillet of radius k mm (polynomial smooth-min). */
export const smooth =
  (k: number, a: Field, b: Field): Field =>
  (x, y) => {
    const da = a(x, y),
      db = b(x, y);
    const h = Math.max(k - Math.abs(da - db), 0) / k;
    return Math.min(da, db) - h * h * k * 0.25;
  };

/** Smooth subtraction (a minus b) with a fillet of radius k mm. */
export const smoothSubtract =
  (k: number, a: Field, b: Field): Field =>
  (x, y) => {
    const da = a(x, y),
      db = -b(x, y);
    const h = Math.max(k - Math.abs(da - db), 0) / k;
    return Math.max(da, db) + h * h * k * 0.25;
  };

export type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

/**
 * Marching squares over the field. Returns closed loops of points on the
 * zero contour, linearly interpolated along cell edges. Saddles are resolved
 * with the cell-centre sample.
 */
export function traceLoops(field: Field, b: Bounds, cell = 0.25): Vector2[][] {
  const pad = cell * 2;
  const x0 = b.minX - pad,
    y0 = b.minY - pad;
  const nx = Math.ceil((b.maxX - b.minX + pad * 2) / cell) + 1;
  const ny = Math.ceil((b.maxY - b.minY + pad * 2) / cell) + 1;
  const v = new Float64Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) v[j * nx + i] = field(x0 + i * cell, y0 + j * cell);

  // Edge point ids: horizontal edges (i,j)-(i+1,j) and vertical edges (i,j)-(i,j+1).
  const pts = new Map<number, Vector2>();
  const H = (i: number, j: number) => (j * nx + i) * 2;
  const V = (i: number, j: number) => (j * nx + i) * 2 + 1;
  const point = (id: number) => {
    let p = pts.get(id);
    if (p) return p;
    const e = id >> 1;
    const i = e % nx,
      j = Math.floor(e / nx);
    const a = v[j * nx + i];
    if ((id & 1) === 0) {
      const c = v[j * nx + i + 1];
      const t = a / (a - c);
      p = new Vector2(x0 + (i + t) * cell, y0 + j * cell);
    } else {
      const c = v[(j + 1) * nx + i];
      const t = a / (a - c);
      p = new Vector2(x0 + i * cell, y0 + (j + t) * cell);
    }
    pts.set(id, p);
    return p;
  };

  // Adjacency between edge ids; each contour vertex joins exactly two segments.
  const adj = new Map<number, number[]>();
  const link = (a: number, c: number) => {
    (adj.get(a) ?? adj.set(a, []).get(a)!).push(c);
    (adj.get(c) ?? adj.set(c, []).get(c)!).push(a);
  };

  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = v[j * nx + i] < 0 ? 1 : 0; // bottom-left
      const bb = v[j * nx + i + 1] < 0 ? 2 : 0; // bottom-right
      const c = v[(j + 1) * nx + i + 1] < 0 ? 4 : 0; // top-right
      const d = v[(j + 1) * nx + i] < 0 ? 8 : 0; // top-left
      const k = a | bb | c | d;
      if (k === 0 || k === 15) continue;
      const bot = H(i, j),
        top = H(i, j + 1),
        left = V(i, j),
        right = V(i + 1, j);
      const centre = () => field(x0 + (i + 0.5) * cell, y0 + (j + 0.5) * cell) < 0;
      switch (k) {
        case 1:
        case 14:
          link(left, bot);
          break;
        case 2:
        case 13:
          link(bot, right);
          break;
        case 3:
        case 12:
          link(left, right);
          break;
        case 4:
        case 11:
          link(right, top);
          break;
        case 6:
        case 9:
          link(bot, top);
          break;
        case 7:
        case 8:
          link(left, top);
          break;
        case 5:
          if (centre()) {
            link(left, top);
            link(bot, right);
          } else {
            link(left, bot);
            link(right, top);
          }
          break;
        case 10:
          if (centre()) {
            link(left, bot);
            link(right, top);
          } else {
            link(left, top);
            link(bot, right);
          }
          break;
      }
    }
  }

  const loops: Vector2[][] = [];
  const seen = new Set<number>();
  for (const startId of adj.keys()) {
    if (seen.has(startId)) continue;
    const loop: Vector2[] = [];
    let prev = -1;
    let cur = startId;
    while (cur !== undefined && !seen.has(cur)) {
      seen.add(cur);
      loop.push(point(cur));
      const n = adj.get(cur)!;
      const next = n[0] !== prev ? n[0] : n[1];
      prev = cur;
      cur = next;
    }
    if (loop.length >= 3) loops.push(simplify(loop, cell * 0.08));
  }
  return loops;
}

/** Drops nearly collinear points to keep vertex counts low. */
function simplify(loop: Vector2[], tol: number) {
  const out: Vector2[] = [];
  const n = loop.length;
  for (let i = 0; i < n; i++) {
    const a = out.length ? out[out.length - 1] : loop[n - 1];
    const b = loop[i];
    const c = loop[(i + 1) % n];
    const cross = Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
    const len = Math.hypot(c.x - a.x, c.y - a.y) || 1;
    if (cross / len > tol) out.push(b);
  }
  return out.length >= 3 ? out : loop;
}

function area(loop: Vector2[]) {
  let s = 0;
  for (let i = 0, n = loop.length; i < n; i++) {
    const a = loop[i],
      b = loop[(i + 1) % n];
    s += a.x * b.y - b.x * a.y;
  }
  return s / 2;
}

function inside(p: Vector2, loop: Vector2[]) {
  let c = false;
  for (let i = 0, j = loop.length - 1; i < loop.length; j = i++) {
    const a = loop[i],
      b = loop[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}

/**
 * Builds shapes from loops: nesting depth decides outer vs hole. Outer
 * contours are made counter-clockwise and holes clockwise.
 */
export function toShapes(loops: Vector2[][]): Shape[] {
  const depth = loops.map((l, i) => loops.reduce((d, o, j) => (j !== i && inside(l[0], o) ? d + 1 : d), 0));
  const shapes: { shape: Shape; loop: Vector2[]; depth: number }[] = [];
  loops.forEach((l, i) => {
    if (depth[i] % 2 !== 0) return;
    const pts = area(l) < 0 ? [...l].reverse() : l;
    shapes.push({ shape: new Shape(pts), loop: l, depth: depth[i] });
  });
  loops.forEach((l, i) => {
    if (depth[i] % 2 === 0) return;
    const pts = area(l) > 0 ? [...l].reverse() : l;
    // The hole belongs to the deepest outer contour that contains it.
    let host: (typeof shapes)[number] | undefined;
    for (const s of shapes) if (s.depth === depth[i] - 1 && inside(l[0], s.loop)) host = s;
    host?.shape.holes.push(new Shape(pts));
  });
  return shapes.map((s) => s.shape);
}
