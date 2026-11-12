import { AROUND, VSM } from "@/content/site";
import { KineticTextReveal } from "@/components/componentry/kinetic-text-reveal";

export function Around() {
  return (
    <section id="around" data-cue="around" aria-labelledby="around-h" className="relative py-28 lg:py-40">
      <div className="wrap">
        <div className="max-w-[560px]">
          <p className="mono-label text-accent-text">{AROUND.eyebrow}</p>
          <KineticTextReveal
            id="around-h"
            text={AROUND.heading}
            className="mt-3 text-[clamp(1.75rem,3.6vw,2.75rem)] text-ink"
          />
        </div>

        <ul className="mt-14 max-w-[560px] divide-y divide-hairline border-y border-hairline lg:mt-20">
          {AROUND.facts.map((f) => (
            <li key={f.label} className="grid gap-1 py-6 sm:grid-cols-[132px_1fr] sm:gap-6 lg:py-10">
              <span className="mono-label pt-1 text-accent-text">{f.label}</span>
              <div>
                <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-ink">{f.title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{f.text}</p>
              </div>
            </li>
          ))}
        </ul>

        <figure className="mt-16 max-w-[560px] lg:mt-24">
          <figcaption className="mono-label mb-3">System manager · {VSM.binary}</figcaption>
          <div className="overflow-hidden rounded-card border border-hairline bg-sunken">
            <div className="flex items-center gap-1.5 border-b border-hairline px-4 py-2.5" aria-hidden="true">
              <span className="size-2 rounded-full bg-line" />
              <span className="size-2 rounded-full bg-line" />
              <span className="size-2 rounded-full bg-line" />
              <span className="ml-3 font-mono text-[12px] text-ink-3">~</span>
            </div>
            <dl className="space-y-3 p-4 font-mono text-[13px] leading-relaxed sm:p-5 sm:text-[14px]">
              {VSM.commands.map((c) => (
                <div key={c.cmd} className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                  <dt className="shrink-0 text-ink sm:w-[200px]">
                    <span className="select-none text-accent-text" aria-hidden="true">
                      ${" "}
                    </span>
                    <code>{c.cmd}</code>
                  </dt>
                  <dd className="text-ink-3">
                    <span aria-hidden="true"># </span>
                    {c.note}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </figure>
      </div>
    </section>
  );
}
