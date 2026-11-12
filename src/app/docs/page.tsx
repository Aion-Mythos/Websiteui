import type { Metadata } from "next";
import Link from "next/link";
import { BRAND, RELEASE, VSM, formatDate } from "@/content/site";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ArrowIcon } from "@/components/ui/button";

export const metadata: Metadata = {
  title: `Docs · ${BRAND.name}`,
  description: `Install, verify and use ${BRAND.name}.`,
};

export default function DocsPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-hairline">
        <div className="wrap flex h-16 items-center justify-between">
          <Link href="/" className="rounded-chip text-[17px] font-semibold tracking-[-0.02em] text-ink">
            {BRAND.short}
            <span className="sr-only"> home</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="wrap max-w-[760px] py-16">
        <p className="mono-label text-accent-text">Documentation</p>
        <h1 className="mt-3 text-[clamp(2rem,5vw,3rem)] text-ink">Docs are on their way.</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-ink-2">
          This is a placeholder while the handbook is written. The essentials are below.
        </p>

        <section id="install" className="mt-14 scroll-mt-20 border-t border-hairline pt-8">
          <h2 className="text-[22px] text-ink">Install</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-[16px] leading-relaxed text-ink-2">
            <li>Download {RELEASE.isoFile} and verify it (below).</li>
            <li>Write it to a USB stick and boot it in UEFI mode. Legacy BIOS is not supported.</li>
            <li>
              Run <code className="font-mono text-ink">isu</code>. It creates its own EFI partition and never deletes or resizes
              another operating system. You need at least {RELEASE.minDiskGB} GB free.
            </li>
          </ol>
        </section>

        <section id="verify" className="mt-12 scroll-mt-20 border-t border-hairline pt-8">
          <h2 className="text-[22px] text-ink">Verify the ISO</h2>
          <p className="mt-4 text-[16px] leading-relaxed text-ink-2">Compare the SHA-256 checksum before writing the image.</p>
          <pre className="mt-4 overflow-x-auto rounded-card border border-hairline bg-sunken p-4 font-mono text-[13px] text-ink">
            <code>{`sha256sum ${RELEASE.isoFile}\n# expected: ${RELEASE.sha256}`}</code>
          </pre>
        </section>

        <section id="vsm" className="mt-12 scroll-mt-20 border-t border-hairline pt-8">
          <h2 className="text-[22px] text-ink">System manager</h2>
          <dl className="mt-4 space-y-3 font-mono text-[14px]">
            {VSM.commands.map((c) => (
              <div key={c.cmd}>
                <dt className="text-ink">{c.cmd}</dt>
                <dd className="text-ink-3">{c.note}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="release-notes" className="mt-12 scroll-mt-20 border-t border-hairline pt-8">
          <h2 className="text-[22px] text-ink">
            Release notes · {RELEASE.version} ({formatDate(RELEASE.date)})
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[16px] leading-relaxed text-ink-2">
            {RELEASE.changelog.map((c) => (
              <li key={c.text}>{c.text}</li>
            ))}
          </ul>
        </section>

        <Link href="/" className="mt-14 inline-flex items-center gap-2 rounded-chip text-[15px] text-accent-text hover:underline">
          Back to {BRAND.short}
          <ArrowIcon />
        </Link>
      </main>
    </div>
  );
}
