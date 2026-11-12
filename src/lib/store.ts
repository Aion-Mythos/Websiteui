"use client";

import { useSyncExternalStore } from "react";

/**
 * A tiny shared store between the HTML UI and the three.js engine. The engine
 * subscribes outside React; components read it with useStage().
 */
export type StageState = {
  /** "pending" until the engine reports back, "failed" means CSS fallback. */
  webgl: "pending" | "ok" | "failed";
  /** Loader progress 0..1 while materials compile. */
  loading: number;
  ready: boolean;
  blueprint: boolean;
  /** User toggle for sound. Starts off; the first hold turns it on. */
  sound: boolean;
  /** True once a gesture has unlocked the AudioContext. */
  audioUnlocked: boolean;
  holding: boolean;
  /** 0..1 progress of the current hold. */
  ignite: number;
  /** Increments each time a hold completes. */
  ignitions: number;
  reducedMotion: boolean;
};

const initial: StageState = {
  webgl: "pending",
  loading: 0,
  ready: false,
  blueprint: false,
  sound: false,
  audioUnlocked: false,
  holding: false,
  ignite: 0,
  ignitions: 0,
  reducedMotion: false,
};

let state: StageState = initial;
const listeners = new Set<() => void>();

export const stage = {
  get: () => state,
  set(patch: Partial<StageState>) {
    let changed = false;
    for (const k in patch) {
      const key = k as keyof StageState;
      if (state[key] !== patch[key]) {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useStage<T>(select: (s: StageState) => T): T {
  return useSyncExternalStore(
    stage.subscribe,
    () => select(state),
    () => select(initial),
  );
}
