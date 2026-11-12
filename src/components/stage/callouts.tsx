"use client";

import { useEffect, useRef } from "react";
import type { Engine, FrameInfo } from "@/three/engine";
import type { PartId } from "@/three/parts";
import { LAYERS } from "@/content/site";

const SIDE: Record<PartId, "left" | "right"> = {
  outer: "left",
  rings: "left",
  base: "left",
  cage: "right",
  core: "right",
};

const LABEL_W = 236;
const MIN_GAP = 112;

/**
 * Exploded-view callouts. Anchor points are projected from 3D every frame;
 * labels stack in two clean columns with leader lines. These are a visual
 * duplicate of the list in the Apart section, so they're aria-hidden.
 * Hidden under 1024 px, where the list is shown instead.
 */
export function Callouts({ engine }: { engine: Engine }) {
  const root = useRef<HTMLDivElement>(null);
  const labels = useRef<Partial<Record<PartId, HTMLDivElement | null>>>({});
  const lines = useRef<Partial<Record<PartId, SVGPolylineElement | null>>>({});
  const dots = useRef<Partial<Record<PartId, SVGCircleElement | null>>>({});

  useEffect(() => {
    const ys: Record<string, number> = {};
    return engine.onFrame((f: FrameInfo) => {
      const el = root.current;
      if (!el) return;
      const wide = f.width >= 1024;
      const t = Math.max(0, Math.min(1, (f.explode - 0.55) / 0.35));
      const opacity = wide ? t * t * (3 - 2 * t) : 0;
      el.style.opacity = String(opacity);
      el.style.visibility = opacity > 0.01 ? "visible" : "hidden";
      if (opacity <= 0.01) return;

      const gap = Math.min(430, Math.max(270, f.width * 0.27));
      const columns = {
        left: { x: f.centre.x - gap, min: f.height * 0.42, items: [] as { id: PartId; ax: number; ay: number }[] },
        right: { x: f.centre.x + gap, min: 96, items: [] as { id: PartId; ax: number; ay: number }[] },
      };
      for (const a of f.anchors) columns[SIDE[a.id]].items.push({ id: a.id, ax: a.x, ay: a.y });

      for (const side of ["left", "right"] as const) {
        const col = columns[side];
        const max = f.height - 70;
        col.items.sort((a, b) => a.ay - b.ay);
        // Forward pass keeps spacing; backward pass keeps everything on screen.
        let prev = -Infinity;
        for (const it of col.items) {
          const y = Math.max(col.min, it.ay, prev + MIN_GAP);
          ys[it.id] = y;
          prev = y;
        }
        let next = Infinity;
        for (let i = col.items.length - 1; i >= 0; i--) {
          const it = col.items[i];
          const y = Math.min(ys[it.id], max, next - MIN_GAP);
          ys[it.id] = y;
          next = y;
        }
        for (const it of col.items) {
          const y = ys[it.id];
          const lab = labels.current[it.id];
          const line = lines.current[it.id];
          const dot = dots.current[it.id];
          const left = side === "left" ? Math.max(16, col.x - LABEL_W) : Math.min(f.width - LABEL_W - 16, col.x);
          if (lab) lab.style.transform = `translate3d(${left}px, ${y - 18}px, 0)`;
          const edge = side === "left" ? left + LABEL_W + 10 : left - 10;
          const elbow = side === "left" ? edge + 22 : edge - 22;
          line?.setAttribute("points", `${edge},${y} ${elbow},${y} ${it.ax},${it.ay}`);
          dot?.setAttribute("cx", String(it.ax));
          dot?.setAttribute("cy", String(it.ay));
        }
      }
    });
  }, [engine]);

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="needs-webgl pointer-events-none fixed inset-0 z-[5] hidden lg:block"
      style={{ opacity: 0, visibility: "hidden" }}
    >
      <svg className="absolute inset-0 size-full overflow-visible">
        {LAYERS.map((l) => (
          <g key={l.id}>
            <polyline
              ref={(n) => {
                lines.current[l.id] = n;
              }}
              fill="none"
              strokeWidth="1"
              className="stroke-line-strong"
            />
            <circle
              ref={(n) => {
                dots.current[l.id] = n;
              }}
              r="3"
              strokeWidth="1.5"
              className="fill-page stroke-accent-text"
            />
          </g>
        ))}
      </svg>
      {LAYERS.map((l) => (
        <div
          key={l.id}
          ref={(n) => {
            labels.current[l.id] = n;
          }}
          className={`absolute left-0 top-0 w-[236px] ${SIDE[l.id] === "left" ? "text-right" : "text-left"}`}
        >
          <p className="font-mono text-[11px] tracking-[0.04em] text-accent-text">
            {l.part} · {l.label}
          </p>
          <p className="mt-1 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-ink">{l.title}</p>
          <p className="mt-1 text-[13px] leading-snug text-ink-2">{l.detail}</p>
        </div>
      ))}
    </div>
  );
}
