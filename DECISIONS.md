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

## Componentry

- **D8. Licence.** Componentry (github.com/harshjdhv/componentry) is MIT-licensed (© 2026 Harsh Jadhav), which allows use in a free-software project. Each adapted file keeps an attribution header.
- **D9. Install route.** `componentry.dev` and `ui.shadcn.com` are blocked by this environment's network policy, so `npx shadcn@latest init` / `add @componentry/...` couldn't run. Following the brief's fallback, I read each component's source from the GitHub repo and recreated it locally under `src/components/componentry/`. I didn't run `shadcn init` either: it also needs the blocked registry, and it would add its own colour variables, which conflicts with D5.
- **D10. Components used.**

  | Component | Upstream install command | Where | Why | Cost (gzip) |
  |---|---|---|---|---|
  | Split Flap Display | `npx shadcn@latest add @componentry/split-flap-display` | hero footer line, download block | version, size and release date as a departures board | ~1.5 kB |
  | Kinetic Text Reveal | `npx shadcn@latest add @componentry/kinetic-text-reveal` | every section heading | word-by-word reveal | ~0.8 kB |
  | Flipping Word Swap | `npx shadcn@latest add @componentry/flipping-word-swap` | the one rotating word in the hero line | "kept precise / simple / quiet on the surface" | ~0.7 kB |

  Not used: Sticky Scroll Cards or Scroll Choreography (the "Around" facts read better as a plain hairline list beside the orbiting object, and stay in step with the camera because they're plain scroll), and Magnetic Dock (the footer links felt calmer static). None of the banned effects (Aurora Flow, Silk Aurora, Liquid Chrome, Animated Gradient, Grain Gradient, Mac Keyboard) and no second canvas.
- **D11. Restyling.** All three are rewritten to the tokens: no hard-coded hex, no gradients, no glow, Plex Sans and Mono only. The split flap's green indicator strip became a 3px `--accent-default` bar.
- **D12. No framer-motion or GSAP.** Kinetic Text Reveal used framer-motion with a timer and Flipping Word Swap used GSAP. The brief wants reveals driven by scroll position (pitfall 4), so the reveal is now scrubbed from one shared scroll loop that writes styles directly, and the word swap uses CSS transitions. That removes ~40 kB gzip of framer-motion and ~25 kB of GSAP from the budget.
- **D13. Reduced motion.** All three show their final state instantly. The word swap also stops on its last word after one pass (under 5 s, WCAG 2.2.2).

## Content and copy

- **D14. All dynamic content is in `src/content/site.ts`**: `BRAND` (name, short name, star, city, licence), `RELEASE` (version, codename, date, size, file name, checksum, changelog), the `vsm` commands, and all section copy. Every mention of the name goes through `BRAND`.
- **D15. Placeholder release data.** Version 0.9.2 "Patina" (Preview), dated 2026-11-04, 2.4 GB, with an all-zero SHA-256. A zero checksum shows a "Placeholder" warning tag next to it automatically.
- **D16. Licence** is shown as GPL-3.0-or-later, an assumption for "free software". Change `BRAND.licence`.
- **D17. Nav links.** Features → `#around`, Desktop → `#apart` (where the Hyprland layer is labelled), Docs → `/docs`, Community → the footer. Footer community links are `#` placeholders until real URLs exist.
- **D18. isu** appears only as the base-plate layer, in the Around facts and in the docs placeholder, never as its own download or CTA.

## 3D

- **D19. Units and sizes.** 1 scene unit = 1 mm. Every part's real size is in `src/three/parts.ts`. The cage sits outside the gimbal rings (rib centreline r = 33.5 mm) so the Ø 40/54 rings stay visible inside it.
- **D20. Milestones 3 to 9 share one commit.** The engine, parts, cues, post chain, ignite and fallbacks import each other, so a separate build-and-commit per milestone would have meant committing code that doesn't build. Everything was built, typechecked, linted and checked with `scripts/verify.mjs` before that commit; milestones 1, 2 and 10 have their own commits.
- **D21. Bevels.** Extruded parts use the specified 0.05 mm bevel. That's under a pixel in most shots, so the visible polished lines come from explicit 0.3 to 0.6 mm chamfers in the lathe profiles (rings, bezel, collars, screws), which use the polished material.
- **D22. Extruded wall normals** use creased normals (32°) so traced curves shade smoothly while machined edges stay sharp.
- **D23. Exact page colour.** Bloom writes alpha everywhere, so a tap pass saves the scene's alpha before bloom. The final pass composites the exact `--background-default` behind the object after ACES, so the canvas matches the page in both themes, with no tone-mapped tint.
- **D24. Text-side scrim.** Each cue has a `scrim` (and a `dim` under 768 px) that fades the object into the page colour where the copy sits. Without it, the cage ribs ran under the close-up copy. It's a fade to the page colour, not a coloured gradient.
- **D25. Close-up** looks into the core between two cage ribs (azimuth 22.5°), and time runs at 1/12.
- **D26. Glass.** Ortiplex has no glass part. The clearcoat on the core is lit only by the baked environment; the scene has no direct lights at all, so no fake hot spot.
- **D27. Hold timing** follows real time held (a timer completes it at 1.2 s), not frame count, so a slow frame rate can't stretch it. Releasing early decays the ring at 1.6 per second.
- **D28. Audio defaults.** Sound is off by default, and nothing is created until a gesture. The brief also says the first hold enables audio, so the first hold unlocks the AudioContext and switches sound on. The speaker toggle in the dock turns it off again. Phone tilt is requested on the same first hold (iOS asks for permission).
- **D29. Engine loading.** The engine is code-split and starts only after the page has loaded and gone idle. The HTML is complete without it, which keeps first paint and LCP free of 3D work.
- **D30. `?snap` and `?nowebgl`** are test switches. `?snap` jumps the camera straight to each cue (headless browsers run WebGL at about 1 fps, pitfall 5); `?nowebgl` forces the CSS fallback.
- **D31. Callout sides are fixed** (outer ring, rings and base on the left; cage and core on the right) instead of chosen from projected x, so labels never swap columns mid-orbit. The left column starts below the section heading.
- **D32. CSS ring fallback** draws its bezel ticks with a `repeating-conic-gradient` mask in token colours. That draws tick marks; it isn't a gradient background.

## Budget and scores

- **D33. JS budget.** `node scripts/js-budget.mjs` measures everything `/` downloads, including the lazy engine chunk: **303 kB gzip (1,106 kB raw)** against the ~650 kB budget, fonts excluded. I've read the budget as transfer size (gzip), which is how JS budgets are usually stated. Raw (unminified-size) it would be over: three.js alone is 614 kB raw / 155 kB gzip, and the Next.js and React runtime about 390 kB raw. Componentry adds about 3 kB gzip in total, since framer-motion was not needed.
- **D34. Lighthouse (mobile, this container):** Accessibility 100, Best Practices 100, SEO 100, Performance 61 (FCP 0.9 s, LCP 2.7 s, CLS 0.002). Total blocking time is about 12 s because this container has no GPU: WebGL runs on SwiftShader (CPU) under Lighthouse's 4× CPU throttle, so every frame blocks the main thread. Expect a much better Performance score on a real phone with a GPU; that needs measuring on a device.
