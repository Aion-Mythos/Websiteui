import { BRAND, HERO, RELEASE } from "@/content/site";
import { LinkButton, DownloadIcon, ArrowIcon } from "@/components/ui/button";
import { FlippingWordSwap } from "@/components/componentry/flipping-word-swap";
import { SplitFlapDisplay } from "@/components/componentry/split-flap-display";
import { IgniteControl } from "@/components/stage/ignite-control";

export function Hero() {
  const meta = RELEASE.version;
  const spec = `${RELEASE.isoSizeGB} GB · UEFI`;
  return (
    <section id="hero" data-cue="hero" className="relative flex min-h-[100svh] flex-col">
      <div className="wrap flex flex-1 flex-col justify-center pb-10 pt-28 lg:pb-16">
        <div className="max-w-[640px]">
          <h1 className="text-[clamp(2.5rem,5.4vw,5rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-ink lg:w-max">
            {HERO.titleLines.map((line, i) => (
              <span key={i} className="block lg:whitespace-nowrap">
                {line}
              </span>
            ))}
          </h1>

          <p className="mt-6 max-w-[34rem] text-[17px] leading-relaxed text-ink-2">
            {HERO.supportBefore}{" "}
            <FlippingWordSwap words={HERO.rotating} className="font-medium text-ink" /> {HERO.supportAfter}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <LinkButton href={RELEASE.downloadUrl} aria-label={`${HERO.primaryCta} ${RELEASE.version}`}>
              <DownloadIcon />
              {HERO.primaryCta}
            </LinkButton>
            <LinkButton href="/docs" variant="secondary">
              {HERO.secondaryCta}
              <ArrowIcon />
            </LinkButton>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2">
            <SplitFlapDisplay
              size="xs"
              columns={meta.length + spec.length + 2}
              rows={[{ label: meta, value: spec }]}
              label={`${BRAND.name} ${RELEASE.version} ${RELEASE.channel}, ${RELEASE.isoSizeGB} GB ISO, ${RELEASE.firmware}`}
            />
            <span className="mono-label">
              {RELEASE.channel} · {RELEASE.arch} · {RELEASE.minDiskGB} GB minimum
            </span>
          </div>
        </div>
      </div>

      <div className="wrap needs-webgl pb-20 sm:pb-10 lg:absolute lg:bottom-10 lg:right-[14%] lg:w-auto lg:pb-0">
        <IgniteControl />
      </div>
    </section>
  );
}
