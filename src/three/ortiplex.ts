/**
 * Ortiplex, assembled from code. Every part has a base position, a lift
 * vector and an order (0..1) for the exploded view: top/outer parts leave
 * first and come back last.
 */
import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LineSegments,
  Matrix4,
  Mesh,
  Object3D,
  PlaneGeometry,
  Quaternion,
  Vector3,
  type Material,
} from "three";
import { arc, circle, rect, smooth, smoothSubtract, subtract, union, type Field } from "./sdf";
import { extrudeField, lathe, profile, ringProfile, type ProfileSegment } from "./geometry";
import { BASE, CAGE, CORE, OUTER_RING, PIN, RING_INNER, RING_MID } from "./parts";
import type { MaterialSet } from "./materials";
import type { PartId } from "./parts";

export type ExplodePart = {
  id: PartId;
  group: Group;
  base: Vector3;
  lift: Vector3;
  order: number;
};

export type Anchor = { id: PartId; object: Object3D; local: Vector3 };

const rot =
  (f: Field, deg: number): Field =>
  (x, y) => {
    const a = (deg * Math.PI) / 180;
    const c = Math.cos(a),
      s = Math.sin(a);
    return f(x * c + y * s, -x * s + y * c);
  };

export class Ortiplex {
  readonly root = new Group();
  readonly parts: ExplodePart[] = [];
  readonly anchors: Anchor[] = [];
  readonly core: Mesh;
  readonly ringMid = new Group();
  readonly ringInner = new Group();
  private meshes: Mesh[] = [];
  private edges: LineSegments[] = [];
  private shadow: Mesh;

  constructor(private m: MaterialSet) {
    this.root.name = "ortiplex";

    // ── Core ───────────────────────────────────────────────────────────
    const coreGroup = this.part("core", new Vector3(0, 0, 0), 0);
    this.core = this.mesh(new IcosahedronGeometry(CORE.diameter / 2, CORE.detail), m.core, coreGroup);
    this.anchor("core", coreGroup, new Vector3(CORE.diameter / 2, 0, 0));

    // ── Inner gimbal rings ────────────────────────────────────────────
    const rings = this.part("rings", new Vector3(), 0.5, new Vector3(0, 10, 0));
    rings.add(this.ringMid);
    this.ringMid.add(this.ringInner);
    const midGeo = lathe(ringProfile(RING_MID.diameter / 2 - RING_MID.width, RING_MID.diameter / 2, RING_MID.height, RING_MID.chamfer));
    this.mesh(midGeo, [m.gunmetalFace, m.polished], this.ringMid);
    const innerGeo = lathe(
      ringProfile(RING_INNER.diameter / 2 - RING_INNER.width, RING_INNER.diameter / 2, RING_INNER.height, RING_INNER.chamfer),
    );
    this.mesh(innerGeo, [m.gunmetalFace, m.polished], this.ringInner);
    // Pivot pins: mid ring pivots on X into the cage; inner ring pivots on Z into the mid ring.
    const pinGeo = new CylinderGeometry(PIN.diameter / 2, PIN.diameter / 2, PIN.length, 20);
    for (const s of [-1, 1]) {
      const pm = this.mesh(pinGeo, m.polished, this.ringMid);
      pm.rotation.z = Math.PI / 2;
      pm.position.x = s * (RING_MID.diameter / 2 + PIN.length / 2 - 0.4);
      const pi = this.mesh(pinGeo, m.polished, this.ringInner);
      pi.rotation.x = Math.PI / 2;
      pi.position.z = s * (RING_INNER.diameter / 2 + PIN.length / 2 - 0.3);
    }
    this.anchor("rings", rings, new Vector3(-RING_MID.diameter / 2, 0, 0));

    // ── Containment cage ──────────────────────────────────────────────
    const ribGeo = this.ribGeometry();
    const collarY = CAGE.radius * Math.sin((CAGE.halfSpan * Math.PI) / 180) + 1.3;
    for (let i = 0; i < CAGE.ribs; i++) {
      const phi = (i / CAGE.ribs) * Math.PI * 2;
      const dir = new Vector3(Math.cos(phi), 0, Math.sin(phi));
      const g = this.part("cage", new Vector3(), 0.75, dir.clone().multiplyScalar(20).add(new Vector3(0, 14, 0)));
      g.rotation.y = -phi;
      this.mesh(ribGeo, [m.patina, m.patinaEdge], g);
      if (i === 1) this.anchor("cage", g, new Vector3(CAGE.radius + CAGE.width / 2, 0, 0));
    }
    const collarGeo = lathe(ringProfile(CAGE.collar.inner, CAGE.collar.outer, CAGE.collar.height, 0.3));
    for (const s of [-1, 1]) {
      const g = this.part("cage", new Vector3(0, s * collarY, 0), 0.75, new Vector3(0, 14 + s * 22, 0));
      this.mesh(collarGeo, [m.patinaDeep, m.patinaEdge], g);
    }

    // ── Outer ring (bezel) ────────────────────────────────────────────
    const outer = this.part("outer", new Vector3(), 1, new Vector3(0, 34, -70));
    this.mesh(this.bezelGeometry(), [m.gunmetalFace, m.polished], outer);
    outer.add(this.ticks());
    this.anchor("outer", outer, new Vector3(-Math.SQRT1_2 * 60, Math.SQRT1_2 * 60, 0));

    // ── Base plate ────────────────────────────────────────────────────
    const base = this.part("base", new Vector3(), 0.15, new Vector3(0, -28, 0));
    this.buildBase(base);
    this.anchor("base", base, new Vector3(BASE.plate.width / 2, BASE.stepTop - BASE.step.height - BASE.plate.height / 2, BASE.plate.depth / 2));

    const floorY = BASE.stepTop - BASE.step.height - BASE.plate.height - 0.05;
    this.shadow = new Mesh(new PlaneGeometry(130, 82), m.shadow);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = floorY;
    this.shadow.renderOrder = -1;
    base.add(this.shadow);
  }

  private part(id: PartId, base: Vector3, order: number, lift = new Vector3()) {
    const group = new Group();
    group.name = id;
    group.position.copy(base);
    this.root.add(group);
    this.parts.push({ id, group, base: base.clone(), lift, order });
    return group;
  }

  private anchor(id: PartId, object: Object3D, local: Vector3) {
    this.anchors.push({ id, object, local });
  }

  private mesh(geo: BufferGeometry, mat: Material | Material[], parent: Object3D) {
    const mesh = new Mesh(geo, mat);
    parent.add(mesh);
    this.meshes.push(mesh);
    return mesh;
  }

  private ribGeometry() {
    const R = CAGE.radius;
    const rb = CAGE.width / 2;
    const end = (CAGE.halfSpan * Math.PI) / 180;
    const ex = R * Math.cos(end),
      ey = R * Math.sin(end);
    let f: Field = arc(R, rb, CAGE.halfSpan);
    // Feet that land on the polar collars, filleted into the rib.
    f = smooth(1.4, f, union(rect(ex - 0.6, ey + 0.4, 5.6, 3.4, 0.7), rect(ex - 0.6, -ey - 0.4, 5.6, 3.4, 0.7)));
    // A boss at the equator where the gimbal pin seats.
    f = smooth(1.2, f, circle(R, 0, rb + 1.3));
    // Slotted cut-outs along the arc, bevelled by the fillet.
    const slots: Field[] = [];
    const n = CAGE.slots.count;
    for (let k = 0; k < n; k++) {
      const deg = (k - (n - 1) / 2) * 34;
      if (deg === 0) continue;
      slots.push(rot(arc(R, CAGE.slots.width / 2, CAGE.slots.halfDeg), deg));
    }
    slots.push(rot(arc(R, CAGE.slots.width / 2, 4), 52), rot(arc(R, CAGE.slots.width / 2, 4), -52));
    f = subtract(f, circle(R, 0, 1.15));
    f = smoothSubtract(0.5, f, union(...slots));
    return extrudeField(f, { minX: 8, minY: -38, maxX: R + rb + 3, maxY: 38 }, CAGE.thickness, { cell: 0.18, span: 84 });
  }

  private bezelGeometry() {
    const ro = OUTER_RING.diameter / 2;
    const ri = OUTER_RING.innerDiameter / 2;
    const rl = OUTER_RING.lip.innerDiameter / 2;
    const h = OUTER_RING.thickness / 2;
    const hl = OUTER_RING.lip.thickness / 2;
    const c = OUTER_RING.chamfer;
    const cl = 0.3;
    const segs: ProfileSegment[] = profile([
      [ri + c, -h, 0],
      [ro - c, -h, 1],
      [ro, -h + c, 0],
      [ro, h - c, 1],
      [ro - c, h, 0],
      [ri + c, h, 1],
      [ri, h - c, 0],
      [ri, hl, 0],
      [rl + cl, hl, 1],
      [rl, hl - cl, 0],
      [rl, -hl + cl, 1],
      [rl + cl, -hl, 0],
      [ri, -hl, 0],
      [ri, -h + c, 1],
    ]);
    const g = lathe(segs, 192);
    g.rotateX(Math.PI / 2); // ring plane faces ±z
    return g;
  }

  /** Engraved bezel ticks on both faces: one instanced mesh. */
  private ticks() {
    const t = OUTER_RING.ticks;
    const ro = OUTER_RING.diameter / 2 - 1.4;
    const z = OUTER_RING.thickness / 2 - t.depth / 2 + 0.02;
    const box = new BoxGeometry(1, 1, t.depth);
    const mesh = new InstancedMesh(box, this.m.engraving, t.minor * 2);
    const m4 = new Matrix4();
    const q = new Quaternion();
    const s = new Vector3();
    const p = new Vector3();
    let i = 0;
    for (const face of [1, -1]) {
      for (let k = 0; k < t.minor; k++) {
        const major = k % t.majorEvery === 0;
        const len = major ? t.majorLength : t.minorLength;
        const w = major ? t.majorWidth : t.minorWidth;
        const a = (k / t.minor) * Math.PI * 2;
        const r = ro - len / 2;
        p.set(Math.cos(a) * r, Math.sin(a) * r, face * z);
        q.setFromAxisAngle(new Vector3(0, 0, 1), a - Math.PI / 2);
        s.set(w, len, 1);
        mesh.setMatrixAt(i++, m4.compose(p, q, s));
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    this.meshes.push(mesh);
    return mesh;
  }

  private buildBase(base: Group) {
    const m = this.m;
    const { plate, step, cradle, screw } = BASE;
    const stepBottom = BASE.stepTop - step.height;
    const plateBottom = stepBottom - plate.height;

    const plateGeo = extrudeField(rect(0, 0, plate.width, plate.depth, plate.corner), {
      minX: -plate.width / 2,
      minY: -plate.depth / 2,
      maxX: plate.width / 2,
      maxY: plate.depth / 2,
    }, plate.height, { cell: 0.3, span: plate.width });
    plateGeo.rotateX(-Math.PI / 2);
    plateGeo.translate(0, plateBottom + plate.height / 2, 0);
    this.mesh(plateGeo, [m.gunmetalFace, m.polished], base);

    const stepGeo = extrudeField(rect(0, 0, step.width, step.depth, step.corner), {
      minX: -step.width / 2,
      minY: -step.depth / 2,
      maxX: step.width / 2,
      maxY: step.depth / 2,
    }, step.height, { cell: 0.3, span: step.width });
    stepGeo.rotateX(-Math.PI / 2);
    stepGeo.translate(0, stepBottom + step.height / 2, 0);
    this.mesh(stepGeo, [m.deepFace, m.polished], base);

    // The cradle: a block with the ring's circle cut out, filleted.
    const ringR = OUTER_RING.diameter / 2 + cradle.gap;
    const top = -52;
    const cradleField = smoothSubtract(
      0.8,
      smooth(1.6, rect(0, (BASE.stepTop + top) / 2, cradle.width, top - BASE.stepTop, 1.2), rect(0, BASE.stepTop + 1.5, cradle.width + 8, 3, 1)),
      circle(0, 0, ringR),
    );
    const cradleGeo = extrudeField(cradleField, { minX: -cradle.width / 2 - 5, minY: BASE.stepTop - 1, maxX: cradle.width / 2 + 5, maxY: top + 1 }, cradle.depth, {
      cell: 0.2,
      span: 60,
    });
    this.mesh(cradleGeo, [m.gunmetalFlat, m.polished], base);

    // Cap screws at the plate corners.
    const headR = screw.diameter / 2;
    const head: ProfileSegment[] = [
      { from: [0.01, 0], to: [headR, 0], mat: 0 },
      { from: [headR, 0], to: [headR, screw.head - 0.4], mat: 0 },
      { from: [headR, screw.head - 0.4], to: [headR - 0.4, screw.head], mat: 1 },
      { from: [headR - 0.4, screw.head], to: [0.01, screw.head], mat: 0 },
    ];
    const headGeo = lathe(head, 32);
    const socketGeo = new CylinderGeometry(headR * 0.45, headR * 0.45, 0.2, 6);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const x = sx * (plate.width / 2 - screw.inset);
        const z = sz * (plate.depth / 2 - screw.inset);
        const h = this.mesh(headGeo, [m.gunmetalFace, m.polished], base);
        h.position.set(x, stepBottom, z);
        const sock = this.mesh(socketGeo, m.engraving, base);
        sock.position.set(x, stepBottom + screw.head + 0.02, z);
      }
    }
  }

  /** Edge lines for blueprint mode. Built once, lazily, when the page is idle. */
  buildEdges() {
    if (this.edges.length) return;
    for (const mesh of this.meshes) {
      let geo: BufferGeometry;
      if (mesh instanceof InstancedMesh) {
        const box = new EdgesGeometry(mesh.geometry);
        const src = box.getAttribute("position");
        const out: number[] = [];
        const m4 = new Matrix4();
        const v = new Vector3();
        for (let i = 0; i < mesh.count; i++) {
          mesh.getMatrixAt(i, m4);
          for (let k = 0; k < src.count; k++) {
            v.fromBufferAttribute(src, k).applyMatrix4(m4);
            out.push(v.x, v.y, v.z);
          }
        }
        geo = new BufferGeometry();
        geo.setAttribute("position", new Float32BufferAttribute(out, 3));
        box.dispose();
      } else {
        geo = new EdgesGeometry(mesh.geometry, mesh === this.core ? 1 : 24);
      }
      const lines = new LineSegments(geo, this.m.line);
      lines.position.copy(mesh.position);
      lines.quaternion.copy(mesh.quaternion);
      lines.scale.copy(mesh.scale);
      lines.visible = false;
      mesh.parent!.add(lines);
      this.edges.push(lines);
    }
  }

  setBlueprint(on: boolean) {
    if (on) this.buildEdges();
    for (const m of this.meshes) m.visible = !on;
    for (const e of this.edges) e.visible = on;
    this.shadow.visible = !on;
  }

  /** Applies the explode amount (0 assembled, 1 apart) with per-part delay. */
  explode(e: number) {
    for (const p of this.parts) {
      const delay = (1 - p.order) * 0.42;
      const t = easeInOut(clamp01((e - delay) / 0.58));
      p.group.position.copy(p.base).addScaledVector(p.lift, t);
    }
  }

  dispose() {
    const geos = new Set<BufferGeometry>();
    this.root.traverse((o) => {
      if (o instanceof Mesh || o instanceof LineSegments) geos.add(o.geometry);
    });
    geos.forEach((g) => g.dispose());
  }
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
