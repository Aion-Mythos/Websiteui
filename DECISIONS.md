# Decisions

Every assumption made while building from the brief, newest last within each section.

## Setup

- **D1. `wernix-colors.css` was not provided.** The brief says to copy it in exactly as given, but no file was attached and none was in the repo. I built it from the three named anchors (Ebony `#070504` = `--neutral-950`, Bone `#f2f0ec` = `--neutral-100`, Verdigris `#337774` = `--verdigris-500`), with full warm-neutral and verdigris scales, four status colours of three shades each, and semantic tokens per theme. Every text pair the UI uses is checked to WCAG AA by `npm run contrast` (`scripts/check-contrast.mjs`). **Replace the file with the official one** when it exists. Components use only semantic tokens (`--background-default`, `--text-primary`, `--accent-*`, `--border-subtle`, `--focus-ring`, `--scene-*`), so a swap only needs those names kept.
- **D2. Two contrast fixes in my token file.** In dark mode, hovering the accent darkens it (`--verdigris-600`) rather than lightening it, because Bone text on `--verdigris-400` was only 3.2:1. Status text sits on `--neutral-900` rather than a deep status shade, which also failed AA.
- **D3. Git.** The repo already existed (with one commit enabling Claude Code plugins), so I didn't run `git init`. Work happens on the session branch `ccr-926078d4-ewfzmo`.
- **D4. Next.js 16.4.6** (latest at build time) with the App Router, TypeScript, Tailwind CSS v4 and the scaffold's defaults (`cacheComponents`, Turbopack). The page is fully static.
- **D5. Tailwind's default palette, radii and shadows are disabled** (`--color-*: initial`) so a component can't reach for `bg-blue-500` by accident. The utilities that exist map onto tokens: `bg-page`, `text-ink`, `text-ink-2`, `border-hairline`, `bg-accent` and so on, with `rounded-control` (8px) and `rounded-card` (14px).
- **D6. Theme without flash.** An inline script in `<head>` sets `data-theme` before first paint. A saved choice (`localStorage["wernix-theme"]`) wins; otherwise it follows `prefers-color-scheme` on that first visit only. The server default is dark.
- **D7. `cn()` is a 3-line helper** instead of `clsx` + `tailwind-merge`, to save bytes.
