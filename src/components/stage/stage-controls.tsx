"use client";

import { useEffect, useRef } from "react";
import { stage, useStage } from "@/lib/store";
import { brandAudio } from "@/three/audio";
import { onScroll } from "@/lib/scroll";
import { cn } from "@/lib/cn";

/**
 * A small fixed dock: the Blueprint switch (every surface swaps to its
 * edges, proving it's live geometry) and the speaker toggle (sound is off
 * by default). Fades out over the footer.
 */
export function StageControls() {
  const ref = useRef<HTMLDivElement>(null);
  const blueprint = useStage((s) => s.blueprint);
  const sound = useStage((s) => s.sound);
  const ready = useStage((s) => s.ready);

  useEffect(
    () =>
      onScroll((_y, vh) => {
        const footer = document.getElementById("footer");
        const el = ref.current;
        if (!footer || !el) return;
        const hide = footer.getBoundingClientRect().top < vh - 40;
        el.toggleAttribute("data-hidden", hide);
      }),
    [],
  );

  return (
    <div
      ref={ref}
      className={cn(
        "needs-webgl fixed bottom-4 right-4 z-30 flex items-center gap-1 rounded-control border border-hairline bg-page p-1 transition-opacity duration-300 sm:bottom-6 sm:right-6",
        "data-[hidden]:pointer-events-none data-[hidden]:opacity-0",
        !ready && "pointer-events-none opacity-0",
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={blueprint}
        aria-label="Blueprint"
        onClick={() => stage.set({ blueprint: !blueprint })}
        className="flex h-8 items-center gap-2 rounded-chip px-2 text-ink-2 hover:text-ink"
      >
        <span
          aria-hidden="true"
          className={cn(
            "relative h-4 w-7 rounded-full border transition-colors",
            blueprint ? "border-control-checked bg-control-checked" : "border-control-border bg-control-thumb",
          )}
        >
          <span
            className={cn(
              "absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full transition-[left,background-color]",
              blueprint ? "left-[14px] bg-control-checked-fg" : "left-[2px] bg-control-border",
            )}
          />
        </span>
        <span aria-hidden="true" className="hidden font-mono text-[12px] sm:inline">Blueprint</span>
      </button>
      <span className="h-5 w-px bg-hairline" aria-hidden="true" />
      <button
        type="button"
        aria-pressed={sound}
        aria-label={sound ? "Sound on. Turn sound off" : "Sound off. Turn sound on"}
        title={sound ? "Sound on" : "Sound off"}
        onClick={() => {
          brandAudio.unlock();
          brandAudio.setEnabled(!sound);
          stage.set({ sound: !sound, audioUnlocked: true });
        }}
        className="flex size-8 items-center justify-center rounded-chip text-ink-2 hover:text-ink"
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M2.5 6v4h2.5l3.5 3V3L5 6H2.5Z" strokeLinejoin="round" />
          {sound ? (
            <path d="M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.8a6 6 0 0 1 0 8.4" strokeLinecap="round" />
          ) : (
            <path d="m11 6 3.5 4M14.5 6 11 10" strokeLinecap="round" />
          )}
        </svg>
      </button>
    </div>
  );
}
