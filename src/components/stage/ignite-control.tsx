"use client";

import { useEffect, useRef, useState } from "react";
import { stage, useStage } from "@/lib/store";
import { brandAudio } from "@/three/audio";
import { enableTilt } from "@/lib/tilt";
import { cn } from "@/lib/cn";

const HOLD_SECONDS = 1.2;
const DECAY_PER_SECOND = 1.6;
const R = 26;
const C = 2 * Math.PI * R;

/**
 * Hold to ignite. Press and hold (mouse, touch, or Space/Enter) to fill the
 * ring over ~1.2 s. Completing it ignites the core; letting go early decays.
 * The first hold also unlocks audio (switching sound on) and phone tilt.
 */
export function IgniteControl({ className }: { className?: string }) {
  const arc = useRef<SVGCircleElement>(null);
  const holding = useRef(false);
  const progress = useRef(0);
  const raf = useRef(0);
  const last = useRef(0);
  const timer = useRef(0);
  const [status, setStatus] = useState<"idle" | "holding" | "ignited">("idle");
  const ignitions = useStage((s) => s.ignitions);

  const draw = () => {
    if (arc.current) arc.current.style.strokeDashoffset = String(C * (1 - progress.current));
  };

  // Progress follows real time held, so a slow frame rate can't stretch the hold.
  const loop = (now: number) => {
    const dt = Math.min(0.5, (now - last.current) / 1000);
    last.current = now;
    let p = progress.current;
    if (holding.current) p = Math.min(1, p + dt / HOLD_SECONDS);
    else p -= dt * DECAY_PER_SECOND * (p >= 1 ? 0.6 : 1);
    p = Math.max(0, p);
    progress.current = p;
    stage.set({ ignite: p });
    draw();
    if (holding.current || p > 0) raf.current = requestAnimationFrame(loop);
    else raf.current = 0;
  };

  const kick = () => {
    if (raf.current) return;
    last.current = performance.now();
    raf.current = requestAnimationFrame(loop);
  };

  const complete = () => {
    if (!holding.current) return;
    holding.current = false;
    progress.current = 1;
    stage.set({ ignitions: stage.get().ignitions + 1, holding: false, ignite: 1 });
    brandAudio.stopDrone(0.25);
    brandAudio.chord();
    setStatus("ignited");
    kick();
  };

  const start = () => {
    if (holding.current) return;
    // First gesture: unlock audio and switch sound on (it was off by default).
    if (!stage.get().audioUnlocked) {
      brandAudio.unlock();
      brandAudio.setEnabled(true);
      stage.set({ audioUnlocked: true, sound: true });
    }
    enableTilt();
    holding.current = true;
    stage.set({ holding: true });
    setStatus("holding");
    brandAudio.startDrone();
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(complete, (1 - progress.current) * HOLD_SECONDS * 1000);
    kick();
  };

  const end = () => {
    // iOS only grants motion permission from a click-like gesture, so ask again on release.
    enableTilt();
    window.clearTimeout(timer.current);
    if (!holding.current) return;
    holding.current = false;
    stage.set({ holding: false });
    brandAudio.stopDrone();
    setStatus("idle");
    kick();
  };

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      window.clearTimeout(timer.current);
    },
    [],
  );

  const message =
    status === "holding" ? "Igniting, keep holding" : status === "ignited" ? "Core ignited" : "Press and hold";

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <button
        type="button"
        aria-label="Hold to ignite the core. Press and hold, or hold Space or Enter."
        aria-describedby="ignite-status"
        className="group relative size-16 shrink-0 touch-none select-none rounded-full outline-offset-4 [-webkit-touch-callout:none]"
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          start();
        }}
        onPointerUp={end}
        onPointerCancel={end}
        onLostPointerCapture={end}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            if (!e.repeat) start();
          }
        }}
        onKeyUp={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            end();
          }
        }}
        onBlur={end}
        onContextMenu={(e) => e.preventDefault()}
      >
        <svg viewBox="0 0 64 64" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
          <circle cx="32" cy="32" r={R} fill="none" strokeWidth="1.5" className="stroke-line" />
          <circle
            ref={arc}
            cx="32"
            cy="32"
            r={R}
            fill="none"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="stroke-accent-text"
            style={{ strokeDasharray: C, strokeDashoffset: C }}
          />
        </svg>
        <span
          aria-hidden="true"
          className={cn(
            "absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent-text transition-[transform,background-color] duration-300",
            status === "holding" && "scale-150 bg-accent",
            status === "ignited" && "bg-accent-text",
          )}
        />
      </button>
      <div className="flex flex-col">
        <span className="font-mono text-[13px] font-medium text-ink">Hold to ignite</span>
        <span id="ignite-status" className="mono-label" aria-live="polite">
          {status === "idle" && ignitions > 0 ? `Ignited ×${ignitions}` : message}
        </span>
      </div>
    </div>
  );
}
