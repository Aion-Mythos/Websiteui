"use client";

import { useSyncExternalStore } from "react";
import { applyTheme, readTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/cn";

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, readTheme, () => "dark");
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme();
  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => applyTheme(next)}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-control border border-hairline text-ink-2",
        "transition-colors hover:border-line hover:text-ink",
        className,
      )}
    >
      {/* Both icons are rendered; CSS picks one so the server HTML is already right. */}
      <svg aria-hidden="true" viewBox="0 0 20 20" className="size-[18px] [[data-theme=light]_&]:hidden">
        <circle cx="10" cy="10" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <path d="M10 1.8v2M10 16.2v2M1.8 10h2M16.2 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" />
        </g>
      </svg>
      <svg aria-hidden="true" viewBox="0 0 20 20" className="hidden size-[18px] [[data-theme=light]_&]:block">
        <path
          d="M16.5 12.3A7 7 0 0 1 7.7 3.5a7 7 0 1 0 8.8 8.8Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
