/**
 * The scroll directs the camera. Each cue is pinned to a section: `at` is
 * how far through that section's scroll run the shot is fully reached.
 * Between cues the shots blend by scroll progress, and every frame the
 * camera eases toward the blended result.
 *
 * Shots frame by size, not distance: `frame` is how many millimetres must
 * fit on screen (the shorter axis), so a cue reads the same on a phone and
 * on a monitor. `offsetX`/`offsetY` move the object across the screen as a
 * fraction of the view; `explode` is 0 assembled to 1 apart; `timeScale`
 * slows the shared clock (1/12 in the close-up). `dim` fades the object
 * toward the page colour so text on top stays readable.
 */

export type Shot = {
  frame: number;
  polar: number;
  azimuth: number;
  offsetX: number;
  offsetY: number;
  explode: number;
  timeScale: number;
  dim: number;
  /** Fades the object into the page colour on the text side (left), so copy stays readable. */
  scrim: number;
};

export type Cue = {
  id: string;
  /** Section id the cue is pinned to. */
  section: string;
  at: number;
  shot: Shot;
  /** Overrides under 768 px wide, where the object sits behind the text. */
  narrow?: Partial<Shot>;
};

const base: Shot = { frame: 100, polar: 84, azimuth: -16, offsetX: 0, offsetY: 0, explode: 0, timeScale: 1, dim: 0, scrim: 0 };

export const CUES: Cue[] = [
  {
    id: "hero",
    section: "hero",
    at: 0,
    // The hero/thumbnail frame: the 120 mm ring overfills a 112 mm frame, so it arcs behind the title.
    shot: { ...base, frame: 112, polar: 84, azimuth: -14, offsetX: 0.2, offsetY: 0.03, scrim: 0.45 },
    narrow: { frame: 128, offsetX: 0, offsetY: 0.08, dim: 0.76, scrim: 0 },
  },
  {
    id: "closeup",
    section: "closeup",
    at: 0.42,
    // Push into the core, between two cage ribs. Time slows to 1/12.
    shot: { ...base, frame: 40, polar: 80, azimuth: 22.5, offsetX: 0.21, offsetY: 0, timeScale: 1 / 12, scrim: 0.9 },
    narrow: { frame: 52, offsetX: 0, offsetY: 0.16, dim: 0.78, scrim: 0 },
  },
  {
    id: "apart-in",
    section: "apart",
    at: 0.12,
    shot: { ...base, frame: 200, polar: 72, azimuth: 30, offsetX: 0.14, offsetY: 0.02, explode: 0.15, scrim: 0.4 },
    narrow: { frame: 230, offsetX: 0, offsetY: 0.04, dim: 0.1, scrim: 0 },
  },
  {
    id: "apart",
    section: "apart",
    at: 0.62,
    // The money shot: fully apart, slightly from above.
    shot: { ...base, frame: 244, polar: 70, azimuth: 36, offsetX: 0.13, offsetY: 0.0, explode: 1, scrim: 0.25 },
    narrow: { frame: 262, offsetX: 0, offsetY: 0.04, dim: 0.1, scrim: 0 },
  },
  {
    id: "around-in",
    section: "around",
    at: 0,
    shot: { ...base, frame: 136, polar: 78, azimuth: 70, offsetX: 0.24, explode: 0.2, scrim: 0.75 },
    narrow: { frame: 150, offsetX: 0, dim: 0.82, scrim: 0 },
  },
  {
    id: "around-out",
    section: "around",
    at: 1,
    // Orbit while the defaults scroll past.
    shot: { ...base, frame: 128, polar: 86, azimuth: 250, offsetX: 0.24, explode: 0, scrim: 0.75 },
    narrow: { frame: 150, offsetX: 0, dim: 0.82, scrim: 0 },
  },
  {
    id: "outro",
    section: "outro",
    at: 0.55,
    // Rebuilt: the ring settles back to the hero framing.
    shot: { ...base, frame: 116, polar: 84, azimuth: 346, offsetX: 0.25, offsetY: 0.03, scrim: 0.8 },
    narrow: { frame: 128, offsetX: 0, offsetY: 0.12, dim: 0.84, scrim: 0 },
  },
];

/** Reduced motion: one static pose per section, no blending. */
export const STILLS: Record<string, string> = {
  hero: "hero",
  closeup: "hero",
  apart: "apart",
  around: "hero",
  outro: "hero",
};

export function shotFor(cue: Cue, narrow: boolean): Shot {
  return narrow && cue.narrow ? { ...cue.shot, ...cue.narrow } : cue.shot;
}

export function lerpShot(a: Shot, b: Shot, t: number, out: Shot): Shot {
  for (const k of Object.keys(a) as (keyof Shot)[]) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}
