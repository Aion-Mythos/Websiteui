"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia(QUERY).matches;
}

/** Server and first paint assume reduced motion so nothing animates from a wrong state. */
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => true);
}
