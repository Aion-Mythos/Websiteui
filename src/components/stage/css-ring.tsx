/**
 * CSS-only fallback for browsers without WebGL (or after a lost context):
 * Ortiplex drawn as a large bezel ring with borders in theme tokens.
 */
export function CssRing() {
  return (
    <div aria-hidden="true" className="css-ring pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute left-1/2 top-1/2 aspect-square w-[150vmin] -translate-x-1/2 -translate-y-1/2 opacity-40 md:left-[68%] md:w-[110vmin] md:opacity-100">
        <div className="absolute inset-0 rounded-full border border-line" />
        <div className="absolute inset-[3%] rounded-full border border-hairline" />
        <div className="absolute inset-[3%] rounded-full [background:repeating-conic-gradient(var(--border-default)_0_0.25deg,transparent_0.25deg_6deg)] [mask:radial-gradient(farthest-side,transparent_calc(100%-14px),black_calc(100%-13px))]" />
        <div className="absolute inset-[30%] rounded-full border border-hairline" />
        <div className="absolute inset-[36%] rounded-full border border-line" />
        <div className="absolute inset-[44%] rounded-full border border-accent-line opacity-70" />
        <div className="absolute inset-[46.5%] rounded-full bg-accent-subtle" />
      </div>
    </div>
  );
}
