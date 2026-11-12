import { BRAND, OUTRO, RELEASE, formatDate } from "@/content/site";
import { KineticTextReveal } from "@/components/componentry/kinetic-text-reveal";
import { SplitFlapDisplay } from "@/components/componentry/split-flap-display";
import { LinkButton, DownloadIcon, ArrowIcon } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { StatusTag } from "@/components/ui/status-tag";

const KIND = {
  added: { tone: "success", word: "Added" },
  changed: { tone: "info", word: "Changed" },
  fixed: { tone: "success", word: "Fixed" },
} as const;

export function Outro() {
  const isPlaceholder = /^0+$/.test(RELEASE.sha256);
  return (
    <section id="outro" data-cue="outro" aria-labelledby="outro-h" className="relative pb-24 pt-40 lg:pb-32 lg:pt-[50svh]">
      <div className="wrap">
        <div className="max-w-[560px]">
          <p className="mono-label text-accent-text">{OUTRO.eyebrow}</p>
          <KineticTextReveal
            id="outro-h"
            text={OUTRO.heading}
            className="mt-3 text-[clamp(1.75rem,3.6vw,2.75rem)] text-ink"
          />
          <p className="mt-4 text-[16px] leading-relaxed text-ink-2 sm:text-[17px]">{OUTRO.body}</p>
        </div>

        <div
          id="download"
          className="mt-12 max-w-[640px] scroll-mt-24 rounded-card border border-hairline bg-page p-5 sm:p-7"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
                {BRAND.name} {RELEASE.version}
              </h3>
              <p className="mono-label mt-1">
                {RELEASE.channel} · “{RELEASE.codename}” · {RELEASE.arch}
              </p>
            </div>
            <StatusTag tone="info">{RELEASE.firmware}</StatusTag>
          </div>

          <SplitFlapDisplay
            className="mt-6 max-w-full overflow-hidden"
            size="xs"
            columns={22}
            rows={[
              { label: "VERSION", value: RELEASE.version },
              { label: "RELEASED", value: formatDate(RELEASE.date).toUpperCase() },
              { label: "ISO SIZE", value: `${RELEASE.isoSizeGB} GB` },
            ]}
            label={`Version ${RELEASE.version}, released ${formatDate(RELEASE.date)}, ISO size ${RELEASE.isoSizeGB} GB`}
          />

          <dl className="mt-6 grid gap-4 text-[14px]">
            <div>
              <dt className="mono-label">File</dt>
              <dd className="mt-1 font-mono text-ink">{RELEASE.isoFile}</dd>
            </div>
            <div>
              <dt className="mono-label flex items-center gap-2">
                SHA-256
                {isPlaceholder && <StatusTag tone="warning">Placeholder</StatusTag>}
              </dt>
              <dd className="mt-1 flex flex-wrap items-center gap-3">
                <code className="min-w-0 break-all font-mono text-[12px] leading-relaxed text-ink-2">{RELEASE.sha256}</code>
                <CopyButton value={RELEASE.sha256} label="Copy" />
              </dd>
            </div>
          </dl>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <LinkButton href={RELEASE.downloadUrl} aria-label={`Download ${RELEASE.isoFile}, ${RELEASE.isoSizeGB} GB`}>
              <DownloadIcon />
              Download ISO · {RELEASE.isoSizeGB} GB
            </LinkButton>
            <LinkButton href={RELEASE.verifyUrl} variant="secondary">
              {OUTRO.verifyLabel}
              <ArrowIcon />
            </LinkButton>
          </div>

          <div className="mt-8 border-t border-hairline pt-6">
            <h4 className="mono-label">What changed</h4>
            <ul className="mt-3 space-y-2.5">
              {RELEASE.changelog.map((c) => {
                const k = KIND[c.kind];
                return (
                  <li key={c.text} className="flex items-start gap-3 text-[14px] text-ink-2">
                    <StatusTag tone={k.tone} className="mt-px shrink-0">
                      {k.word}
                    </StatusTag>
                    <span>{c.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
