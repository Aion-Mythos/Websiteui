"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { BRAND, NAV, RELEASE } from "@/content/site";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LinkButton, DownloadIcon } from "@/components/ui/button";
import { onScroll } from "@/lib/scroll";
import { cn } from "@/lib/cn";

export function Nav() {
  const ref = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const menuId = useId();

  useEffect(
    () =>
      onScroll((y) => {
        ref.current?.toggleAttribute("data-scrolled", y > 24);
      }),
    [],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      ref={ref}
      className={cn(
        "group fixed inset-x-0 top-0 z-40 border-b border-transparent bg-page transition-colors duration-300",
        "data-[scrolled]:border-hairline",
        open && "border-hairline",
      )}
    >
      <nav aria-label="Main" className="wrap flex h-16 items-center justify-between gap-4">
        <Link href="/" className="rounded-chip text-[17px] font-semibold tracking-[-0.02em] text-ink">
          {BRAND.short}
          <span className="sr-only"> home</span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {NAV.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className="rounded-control px-3 py-2 text-[14px] text-nav-fg transition-colors hover:bg-nav-hover hover:text-ink"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LinkButton
            href={RELEASE.downloadUrl}
            size="sm"
            className="hidden sm:inline-flex"
            aria-label={`Download ${BRAND.name} ${RELEASE.version}`}
          >
            <DownloadIcon />
            Download
          </LinkButton>
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-control border border-hairline px-3 text-[14px] text-ink-2 md:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </nav>

      <div id={menuId} hidden={!open} className="border-t border-hairline md:hidden">
        <ul className="wrap flex flex-col py-2">
          {NAV.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-control py-3 text-[16px] text-nav-fg hover:text-ink"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li className="py-2 sm:hidden">
            <LinkButton href={RELEASE.downloadUrl} size="sm" className="w-full">
              <DownloadIcon />
              Download {RELEASE.version}
            </LinkButton>
          </li>
        </ul>
      </div>
    </header>
  );
}
