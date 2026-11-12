"use client";

/**
 * Adapted from Componentry "Split Flap Display" (MIT, Harsh Jadhav,
 * github.com/harshjdhv/componentry). Changes for Wernix:
 * - every colour, gradient and font replaced with Wernix tokens and Plex Mono
 *   (no hard-coded hex, no gradients, no glow on the indicator strip);
 * - one requestAnimationFrame loop drives all cells instead of a timer per cell;
 * - starts when the board scrolls into view, checked by scroll position;
 * - reduced motion: the final text is shown instantly.
 */
import { useEffect, useRef, useState } from "react";
import { onScroll } from "@/lib/scroll";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/cn";

const CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:+-/·";

type Row = { label: string; value: string };

type Props = {
  rows: Row[];
  columns?: number;
  size?: "xs" | "sm" | "md";
  staggerDelay?: number;
  flipSpeed?: number;
  /** Accessible summary; the cells themselves are hidden from assistive tech. */
  label: string;
  className?: string;
};

const SIZES = {
  xs: "w-[13px] h-[20px] text-[11px] sm:w-[15px] sm:h-[22px] sm:text-[12px]",
  sm: "w-[19px] h-[28px] text-[15px]",
  md: "w-[26px] h-[38px] text-[20px]",
};

function compose(row: Row, columns: number) {
  const gap = Math.max(1, columns - row.label.length - row.value.length);
  return `${row.label}${" ".repeat(gap)}${row.value}`.toUpperCase().padEnd(columns, " ").slice(0, columns);
}

function idx(c: string) {
  const i = CHARS.indexOf(c);
  return i < 0 ? 0 : i;
}

export function SplitFlapDisplay({
  rows,
  columns = 22,
  size = "sm",
  staggerDelay = 28,
  flipSpeed = 30,
  label,
  className,
}: Props) {
  const targets = rows.map((r) => compose(r, columns));
  const targetKey = targets.join("|");
  const [shown, setShown] = useState<string[]>(() => targets.map((t) => " ".repeat(t.length)));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finals = targetKey.split("|");
    // `?snap` is the screenshot switch: headless browsers are too slow to finish the flips.
    if (prefersReducedMotion() || new URLSearchParams(window.location.search).has("snap")) {
      const id = requestAnimationFrame(() => setShown(finals));
      return () => cancelAnimationFrame(id);
    }
    let raf = 0;
    let started = false;
    const startAnim = () => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = now - t0;
        let busy = false;
        const next = finals.map((row, r) =>
          Array.from(row)
            .map((ch, i) => {
              const steps = idx(ch);
              const local = t - (i + r * 3) * staggerDelay;
              const step = Math.max(0, Math.min(steps, Math.floor(local / flipSpeed)));
              if (step < steps) busy = true;
              return CHARS[step];
            })
            .join(""),
        );
        setShown(next);
        if (busy) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const stop = onScroll((_y, vh) => {
      if (started || !ref.current) return;
      const r = ref.current.getBoundingClientRect();
      if (r.top < vh * 0.95 && r.bottom > 0) {
        started = true;
        startAnim();
      }
    });
    return () => {
      stop();
      cancelAnimationFrame(raf);
    };
  }, [targetKey, staggerDelay, flipSpeed]);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      className={cn("inline-flex flex-col gap-1.5 rounded-card border border-hairline bg-sunken p-2.5", className)}
    >
      {shown.map((row, r) => (
        <div key={r} className="flex items-center gap-1.5" aria-hidden="true">
          <span className="w-[3px] self-stretch rounded-full bg-accent" />
          <div className="flex gap-[2px]">
            {Array.from(row).map((ch, i) => (
              <FlapCell key={i} ch={ch} size={SIZES[size]} speed={flipSpeed} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FlapCell({ ch, size, speed }: { ch: string; size: string; speed: number }) {
  return (
    <span
      className={cn(
        "relative inline-block select-none overflow-hidden rounded-[3px] bg-raised font-mono font-medium text-ink [perspective:300px]",
        size,
      )}
    >
      <span className="absolute inset-0 flex items-center justify-center leading-none">{ch === " " ? "" : ch}</span>
      {/* The falling top flap: keyed on the char so each change replays it. */}
      <span
        key={ch}
        className="flap-fall absolute inset-x-0 top-0 h-1/2 origin-bottom bg-raised"
        style={{ animationDuration: `${speed * 0.8}ms` }}
      />
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-page" />
    </span>
  );
}
