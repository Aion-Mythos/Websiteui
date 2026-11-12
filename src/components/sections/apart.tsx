import { APART, LAYERS } from "@/content/site";
import { KineticTextReveal } from "@/components/componentry/kinetic-text-reveal";

/**
 * The exploded view. On wide screens the floating callouts (rendered by the
 * stage, aria-hidden) label the parts, and this list is for assistive tech
 * only. On narrow screens, or without WebGL, the list is shown instead.
 */
export function Apart() {
  return (
    <section id="apart" data-cue="apart" aria-labelledby="apart-h" className="relative h-[300svh]">
      <div className="sticky top-0 flex h-[100svh] flex-col">
        <div className="wrap pt-24 lg:pt-28">
          <div className="max-w-[520px]">
            <p className="mono-label text-accent-text">{APART.eyebrow}</p>
            <KineticTextReveal
              id="apart-h"
              text={APART.heading}
              className="mt-3 text-[clamp(1.75rem,3.6vw,2.75rem)] text-ink"
            />
            <p className="mt-4 hidden text-[16px] leading-relaxed text-ink-2 sm:block">{APART.body}</p>
          </div>
        </div>

        <div className="wrap mt-auto pb-6 lg:pb-0">
          <ol className="apart-list grid gap-px overflow-hidden rounded-card border border-hairline bg-hairline lg:sr-only">
            {LAYERS.map((l) => (
              <li key={l.id} className="flex items-baseline gap-3 bg-page px-4 py-2.5">
                <span className="mono-label w-[88px] shrink-0 text-accent-text">{l.part}</span>
                <span className="min-w-0">
                  <span className="text-[14px] font-medium text-ink">{l.title}</span>
                  <span className="sr-only">. {l.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
