import { cn } from "@/lib/cn";

type Tone = "success" | "warning" | "error" | "info";

const TONE: Record<Tone, string> = {
  success: "text-success bg-success-bg border-success-line",
  warning: "text-warning bg-warning-bg border-warning-line",
  error: "text-error bg-error-bg border-error-line",
  info: "text-info bg-info-bg border-info-line",
};

const ICON: Record<Tone, string> = {
  success: "text-success-icon",
  warning: "text-warning-icon",
  error: "text-error-icon",
  info: "text-info-icon",
};

/** Status colour is always paired with an icon and a word. */
function Icon({ tone }: { tone: Tone }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className={`size-3 ${ICON[tone]}`}>
      {tone === "success" && <path d="M2.5 6.2 5 8.5l4.5-5" {...common} />}
      {tone === "warning" && <path d="M6 2.2v4.6M6 9.4v.1" {...common} />}
      {tone === "error" && <path d="M3 3l6 6M9 3 3 9" {...common} />}
      {tone === "info" && <path d="M6 5.4v3.8M6 2.6v.1" {...common} />}
    </svg>
  );
}

export function StatusTag({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-chip border px-1.5 py-0.5 font-mono text-[11px] font-medium leading-none",
        TONE[tone],
        className,
      )}
    >
      <Icon tone={tone} />
      {children}
    </span>
  );
}
