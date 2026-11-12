"use client";

/**
 * One shared rAF-throttled scroll/resize loop for every scroll-driven DOM
 * effect. Reveals are driven by scroll position (pitfall 4), never by
 * IntersectionObserver, so a fast scroll can't skip one.
 */
type Listener = (y: number, vh: number) => void;

const listeners = new Set<Listener>();
let scheduled = false;
let bound = false;

function run() {
  scheduled = false;
  const y = window.scrollY;
  const vh = window.innerHeight;
  listeners.forEach((l) => l(y, vh));
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(run);
}

export function onScroll(l: Listener) {
  if (!bound) {
    bound = true;
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
  }
  listeners.add(l);
  l(window.scrollY, window.innerHeight);
  return () => {
    listeners.delete(l);
  };
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
