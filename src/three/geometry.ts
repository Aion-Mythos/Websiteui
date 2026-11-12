/**
 * Geometry builders. Round parts are lathed from profiles drawn
 * counter-clockwise in (radius, height), so faces never render inside out
 * (pitfall 2). Each profile segment is lathed separately, which keeps hard
 * edges crisp and lets every segment pick a material group: 0 = satin face,
 * 1 = polished bevel. Flat parts are traced from SDF fields and extruded
 * with a 0.05 mm bevel; caps are group 0, walls and bevel are group 1.
 */
import {
  BufferGeometry,
  ExtrudeGeometry,
  LatheGeometry,
  Vector2,
  type ExtrudeGeometryOptions,
  type Shape,
} from "three";
import { mergeGeometries, toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { toShapes, traceLoops, type Bounds, type Field } from "./sdf";

export type ProfileSegment = { from: [number, number]; to: [number, number]; mat: 0 | 1 };

/** Builds a closed CCW profile from points, tagging each edge with a material. */
export function profile(points: Array<[number, number, 0 | 1]>): ProfileSegment[] {
  return points.map((p, i) => {
    const q = points[(i + 1) % points.length];
    return { from: [p[0], p[1]], to: [q[0], q[1]], mat: p[2] };
  });
}

export function lathe(segments: ProfileSegment[], radial = 128): BufferGeometry {
  const parts = segments.map((s) =>
    new LatheGeometry([new Vector2(s.from[0], s.from[1]), new Vector2(s.to[0], s.to[1])], radial),
  );
  const merged = mergeGeometries(parts, true)!;
  merged.groups.forEach((g, i) => (g.materialIndex = segments[i].mat));
  parts.forEach((p) => p.dispose());
  return mergeGroups(merged);
}

/** Merges consecutive groups that share a material, so each mesh has at most two draw calls. */
function mergeGroups(g: BufferGeometry) {
  // Groups are contiguous index ranges; reorder index buffer so material 0 comes first.
  const index = g.getIndex();
  if (!index) return g;
  const a = index.array;
  const out: number[][] = [[], []];
  for (const grp of g.groups) {
    const dst = out[grp.materialIndex ?? 0];
    for (let i = grp.start; i < grp.start + grp.count; i++) dst.push(a[i]);
  }
  g.setIndex([...out[0], ...out[1]]);
  g.clearGroups();
  g.addGroup(0, out[0].length, 0);
  g.addGroup(out[0].length, out[1].length, 1);
  return g;
}

/** Ring section with chamfers: rectangle [ri, ro] × [-h/2, h/2], chamfer c, CCW. */
export function ringProfile(ri: number, ro: number, h: number, c: number): ProfileSegment[] {
  const y0 = -h / 2,
    y1 = h / 2;
  return profile([
    [ri + c, y0, 0], // bottom face →
    [ro - c, y0, 1], // chamfer
    [ro, y0 + c, 0], // outer face ↑
    [ro, y1 - c, 1], // chamfer
    [ro - c, y1, 0], // top face ←
    [ri + c, y1, 1], // chamfer
    [ri, y1 - c, 0], // inner face ↓
    [ri, y0 + c, 1], // chamfer back to start
  ]);
}

/**
 * Traces an SDF field into shapes and extrudes it along +z by `depth`,
 * centred on z = 0. Cap UVs are normalised to the given span around the
 * origin so planar anisotropy maps (circular, radial) line up with the part.
 */
export function extrudeField(field: Field, bounds: Bounds, depth: number, opts: { cell?: number; span?: number } = {}) {
  const shapes: Shape[] = toShapes(traceLoops(field, bounds, opts.cell ?? 0.25));
  const span = opts.span ?? Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
  const bevel = 0.05;
  const settings: ExtrudeGeometryOptions = {
    depth: depth - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: 2,
    curveSegments: 1,
    UVGenerator: {
      generateTopUV(_g, vertices, a, b, c) {
        const uv = (i: number) => new Vector2(vertices[i * 3] / span + 0.5, vertices[i * 3 + 1] / span + 0.5);
        return [uv(a), uv(b), uv(c)];
      },
      generateSideWallUV(_g, vertices, a, b, c, d) {
        const uv = (i: number) => new Vector2((vertices[i * 3] + vertices[i * 3 + 1]) / span, vertices[i * 3 + 2] / span);
        return [uv(a), uv(b), uv(c), uv(d)];
      },
    },
  };
  const raw = new ExtrudeGeometry(shapes, settings);
  raw.translate(0, 0, -depth / 2 + bevel);
  // Traced contours are polylines: smooth normals along curved walls, keep machined edges sharp.
  const g = toCreasedNormals(raw, (32 * Math.PI) / 180);
  if (g !== raw) raw.dispose();
  return g;
}
