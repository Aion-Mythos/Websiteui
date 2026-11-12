# Wernix OS website

The marketing site for Wernix OS: a single landing page around Ortiplex, a procedural three.js instrument, plus a `/docs` placeholder.

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
npm run typecheck && npm run lint
npm run contrast     # WCAG AA check of every token pair, both themes
```

With a production server running (`npx next start`):

```bash
node scripts/screenshots.mjs http://localhost:3000 screenshots   # every section, 390×844 and 1440×900, both themes
node scripts/verify.mjs http://localhost:3000 screenshots/checks # ignite, blueprint, reduced motion, no-WebGL, theme
node scripts/js-budget.mjs http://localhost:3000                 # JS shipped for "/"
```

- Content and release data: `src/content/site.ts`
- Colour tokens: `src/styles/wernix-colors.css` (generated, do not edit) plus `src/styles/wernix-extensions.css` (radii and 3D scene inputs)
- 3D: `src/three/` (`engine.ts`, `parts.ts`, `sdf.ts`, `ortiplex.ts`, `cues.ts`, `post.ts`, `audio.ts`)
- `PROGRESS.md` tracks milestones; `DECISIONS.md` lists every assumption.
