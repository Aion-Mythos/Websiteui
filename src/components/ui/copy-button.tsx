"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export function CopyButton({ value, label, className }: { value: string; label: string; className?: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 items-center rounded-control border border-hairline px-2.5 font-mono text-[12px] text-ink-2 transition-colors hover:border-line hover:text-ink",
        className,
      )}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setState("done");
        } catch {
          setState("failed");
        }
        window.setTimeout(() => setState("idle"), 1800);
      }}
    >
      <span aria-live="polite">{state === "done" ? "Copied" : state === "failed" ? "Copy failed" : label}</span>
    </button>
  );
}
