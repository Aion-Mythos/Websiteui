import Link from "next/link";
import { BRAND, FOOTER, RELEASE } from "@/content/site";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Footer() {
  return (
    <footer id="footer" className="relative border-t border-hairline bg-page">
      <div className="wrap grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-[360px]">
          <p className="text-[17px] font-semibold tracking-[-0.02em] text-ink">{BRAND.short}</p>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-2">{FOOTER.licenceNote}</p>
          <p className="mono-label mt-4">
            {BRAND.licence} · {RELEASE.version}
          </p>
        </div>
        {FOOTER.columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="mono-label">{col.title}</h2>
            <ul className="mt-4 space-y-1">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.href.startsWith("/") ? (
                    <Link href={l.href} className="inline-block rounded-chip py-1.5 text-[14px] text-ink-2 hover:text-ink">
                      {l.label}
                    </Link>
                  ) : (
                    <a href={l.href} className="inline-block rounded-chip py-1.5 text-[14px] text-ink-2 hover:text-ink">
                      {l.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-hairline">
        <div className="wrap flex flex-wrap items-center justify-between gap-4 py-6">
          <p className="mono-label">
            {FOOTER.madeIn} · © {RELEASE.date.slice(0, 4)} {BRAND.name}
          </p>
          <div className="flex items-center gap-3">
            <span className="mono-label">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
