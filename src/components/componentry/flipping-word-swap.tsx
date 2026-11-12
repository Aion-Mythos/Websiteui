"use client";

/**
 * Adapted from Componentry "Flipping Word Swap" (MIT, Harsh Jadhav,
 * github.com/harshjdhv/componentry). Changes for Wernix:
 * - GSAP replaced with CSS transitions (per-character rotateX with stagger);
 * - cycles through a list on its own instead of swapping on hover, and
 *   stops on the last word after one pass (under 5 s, WCAG 2.2.2);
 * - colour and font come from the surrounding text (tokens, Plex);
 * - reduced motion: the final word is shown with no animation.
 */
import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

type Props = {
  words: readonly string[];
  /** Time each word is shown before flipping, in ms. */
  hold?: number;
  /** Delay between neighbouring characters, in ms. */
  stagger?: number;
  /** Delay before the first flip, in ms. */
  startDelay?: number;
  className?: string;
};

export function FlippingWordSwap({ words, hold = 1500, stagger = 40, startDelay = 900, className }: Props) {
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState(-1);
  // Once the last word lands, the other words are dropped so the grid hugs it.
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      const id = requestAnimationFrame(() => {
        setActive(words.length - 1);
        setDone(true);
      });
      return () => cancelAnimationFrame(id);
    }
    const timers: number[] = [];
    for (let i = 1; i < words.length; i++) {
      timers.push(
        window.setTimeout(() => {
          setPrev(i - 1);
          setActive(i);
        }, startDelay + hold * (i - 1)),
      );
    }
    timers.push(window.setTimeout(() => setDone(true), startDelay + hold * (words.length - 2) + 900));
    return () => timers.forEach(clearTimeout);
  }, [words, hold, startDelay]);

  return (
    <span className={className}>
      <span className="sr-only">{words[words.length - 1]}</span>
      <span aria-hidden="true" className="relative inline-grid align-baseline [perspective:600px]">
        {words.map((w, wi) => {
          if (done && wi !== active) return null;
          const state = wi === active ? "on" : wi === prev ? "out" : "wait";
          return (
            <span
              key={w}
              className="col-start-1 row-start-1 inline-flex whitespace-pre"
              style={{ justifySelf: "start" }}
            >
              {Array.from(w).map((ch, ci) => (
                <span
                  key={ci}
                  className="inline-block [backface-visibility:hidden]"
                  style={{
                    transformOrigin: state === "out" ? "50% 0%" : "50% 100%",
                    transform: state === "on" ? "rotateX(0deg)" : state === "out" ? "rotateX(82deg)" : "rotateX(-82deg)",
                    opacity: state === "on" ? 1 : 0,
                    transition:
                      state === "wait"
                        ? "none"
                        : `transform 420ms cubic-bezier(.22,1,.36,1) ${ci * stagger + (state === "on" ? 160 : 0)}ms, opacity 300ms ease ${ci * stagger + (state === "on" ? 160 : 0)}ms`,
                  }}
                >
                  {ch}
                </span>
              ))}
            </span>
          );
        })}
      </span>
    </span>
  );
}
