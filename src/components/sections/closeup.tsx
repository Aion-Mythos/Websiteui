import { CLOSE_UP } from "@/content/site";
import { KineticTextReveal } from "@/components/componentry/kinetic-text-reveal";

export function CloseUp() {
  return (
    <section id="closeup" data-cue="closeup" aria-labelledby="closeup-h" className="relative h-[190svh]">
      <div className="sticky top-0 flex h-[100svh] items-center">
        <div className="wrap">
          <div className="max-w-[560px]">
            <p className="mono-label text-accent-text">{CLOSE_UP.eyebrow}</p>
            <KineticTextReveal
              id="closeup-h"
              text={CLOSE_UP.heading}
              className="mt-4 text-[clamp(2rem,4.6vw,3.5rem)] text-ink"
            />
            <div className="mt-6 space-y-4 text-[16px] leading-relaxed text-ink-2 sm:text-[17px]">
              {CLOSE_UP.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
