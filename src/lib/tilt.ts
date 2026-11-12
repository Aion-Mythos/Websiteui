"use client";

/**
 * Phone tilt drives the studio environment rotation. iOS gates it behind a
 * permission prompt that must come from a gesture, so it's requested on the
 * first hold. Values are normalised to -1..1.
 */
export const tilt = { x: 0, y: 0, active: false };

let requested = false;

function onOrientation(e: DeviceOrientationEvent) {
  if (e.gamma == null || e.beta == null) return;
  tilt.active = true;
  tilt.x = Math.max(-1, Math.min(1, e.gamma / 35));
  tilt.y = Math.max(-1, Math.min(1, (e.beta - 45) / 35));
}

type PermissionCtor = { requestPermission?: () => Promise<"granted" | "denied"> };

export function enableTilt() {
  if (requested || typeof window === "undefined" || !("DeviceOrientationEvent" in window)) return;
  if (!window.matchMedia("(pointer: coarse)").matches) return;
  requested = true;
  const ctor = window.DeviceOrientationEvent as unknown as PermissionCtor;
  const listen = () => window.addEventListener("deviceorientation", onOrientation);
  if (typeof ctor.requestPermission === "function") {
    ctor
      .requestPermission()
      .then((state) => state === "granted" && listen())
      .catch(() => {
        requested = false;
      });
  } else {
    listen();
  }
}
