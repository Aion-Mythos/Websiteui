/**
 * Ortiplex: an artificial neutron-star core in a machined containment
 * instrument. Every dimension is in real millimetres; the scene unit is 1 mm.
 *
 * Hero frame (the thumbnail): assembled, three-quarter front, object right
 * of centre with the outer ring arcing behind the title. See cues.ts "hero".
 */

export const CORE = {
  /** Ø 18 mm faceted sphere. */
  diameter: 18,
  /** Icosahedron subdivision: dense facets read as a micro-patterned surface. */
  detail: 4,
} as const;

/** Inner gimbal rings on perpendicular axes. Section: radial width × axial height. */
export const RING_INNER = { diameter: 40, width: 1.6, height: 2.4, chamfer: 0.35 } as const;
export const RING_MID = { diameter: 54, width: 1.9, height: 3.0, chamfer: 0.4 } as const;
/** Pivot pins joining the gimbal rings. */
export const PIN = { diameter: 2.2, length: 4.6 } as const;

/** Containment cage: machined meridian ribs with slotted cut-outs. */
export const CAGE = {
  ribs: 8,
  /** Radius to the rib centreline. */
  radius: 33.5,
  /** Radial width of a rib. */
  width: 4.2,
  /** Rib thickness (extrusion depth, tangential). */
  thickness: 2.4,
  /** Half of the polar opening each rib spans, measured from the equator. */
  halfSpan: 62,
  /** Slots cut through each rib (count, half-length in degrees, width). */
  slots: { count: 3, halfDeg: 7.5, width: 1.5 },
  /** Polar collars the ribs land on. */
  collar: { inner: 11.5, outer: 16.2, height: 2.2 },
} as const;

/** The outer bezel ring: Ø 120 mm, 6 mm thick, engraved ticks like a watch bezel. */
export const OUTER_RING = {
  diameter: 120,
  innerDiameter: 101,
  thickness: 6,
  chamfer: 0.6,
  /** Inner stepped lip. */
  lip: { innerDiameter: 97, thickness: 3 },
  ticks: { minor: 60, majorEvery: 5, minorLength: 3.2, majorLength: 5.6, minorWidth: 0.45, majorWidth: 0.9, depth: 0.12 },
} as const;

/** Base plate: a machined plinth with a cradle that holds the outer ring. */
export const BASE = {
  plate: { width: 78, depth: 46, height: 6, corner: 6 },
  step: { width: 62, depth: 34, height: 3, corner: 4 },
  cradle: { width: 30, depth: 12, gap: 0.4 },
  screw: { diameter: 4.2, head: 1.6, inset: 6 },
  /** Heights in object space: the ring's lowest point (y = -60) sits in the cradle. */
  stepTop: -70,
} as const;

/** Overall size, used for framing and the contact shadow. */
export const OVERALL = { width: 120, height: 133 } as const;

export type PartId = "core" | "rings" | "cage" | "outer" | "base";
