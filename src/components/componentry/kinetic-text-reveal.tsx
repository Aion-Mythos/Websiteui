"use client";

/**
 * Adapted from Componentry "Kinetic Text Reveal" (MIT, Harsh Jadhav,
 * github.com/harshjdhv/componentry). Changes for Wernix:
 * - driven by scroll position instead of a timer/autoPlay (pitfall 4),
 *   so the reveal is scrubbed and can never be missed by a fast scroll;
 * - no framer-motion: word styles are written directly from one shared
 *   scroll loop, which keeps the bundle small;
 * - inherits Plex Sans and token colours from the heading it sits in;
 * - reduced motion shows the final state instantly.
 */
import { useLayoutEffect, useRef } from "react";
import { clamp01, onScroll } from "@/lib/scroll";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/cn";

type Props = {
  text: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  id?: string;
  /** Viewport fraction where the reveal starts (element top at this point). */
  start?: number;
  /** Viewport fraction where the reveal completes. */
  end?: number;
  /** Distance each word rises from, in px. */
  distance?: number;
};

export function KineticTextReveal({
  text,
  as = "h2",
  className,
  id,
  start = 0.92,
  end = 0.55,
  distance = 18,
}: Props) {
  const ref = useRef<HTMLHeadingElement>(null);
  const Tag = as;
  const words = text.split(/\s+/);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const spans = Array.from(el.querySelectorAll<HTMLSpanElement>("[data-word]"));
    if (prefersReducedMotion()) return;

    const n = spans.length;
    let last = -1;
    return onScroll((_y, vh) => {
      const top = el.getBoundingClientRect().top;
      const p = clamp01((vh * start - top) / (vh * (start - end)));
      if (Math.abs(p - last) < 0.001) return;
      last = p;
      // Words overlap: each takes 40% of the run, staggered across the rest.
      const span = 0.4;
      for (let i = 0; i < n; i++) {
        const t0 = n > 1 ? (i / (n - 1)) * (1 - span) : 0;
        const t = clamp01((p - t0) / span);
        const e = 1 - Math.pow(1 - t, 3);
        const s = spans[i].style;
        s.opacity = String(e);
        s.transform = e >= 1 ? "" : `translate3d(0, ${((1 - e) * distance).toFixed(2)}px, 0)`;
        s.filter = e >= 1 ? "" : `blur(${((1 - e) * 5).toFixed(2)}px)`;
      }
    });
  }, [text, start, end, distance]);

  return (
    <Tag ref={ref} id={id} className={cn(className)} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden="true">
          <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
            <span data-word className="inline-block will-change-transform">
              {w}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}
