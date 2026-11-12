// Checks every text/background token pair used by the UI against WCAG AA,
// in both themes. Run: node scripts/check-contrast.mjs
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/styles/wernix-colors.css", import.meta.url), "utf8");

function block(selectorRe) {
  const out = {};
  const re = new RegExp(selectorRe.source + String.raw`\s*\{([^}]*)\}`, "g");
  let m;
  while ((m = re.exec(css))) {
    for (const d of m[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[d[1]] = d[2].trim();
  }
  return out;
}

const raw = block(/:root/);
const dark = { ...raw, ...block(/:root,\s*\[data-theme="dark"\]/) };
const light = { ...dark, ...block(/\[data-theme="light"\]/) };

function resolve(vars, v, depth = 0) {
  if (v === undefined) throw new Error("unknown token");
  if (depth > 10) throw new Error("var loop " + v);
  const m = /^var\((--[\w-]+)\)$/.exec(v);
  return m ? resolve(vars, vars[m[1]], depth + 1) : v;
}
function lum(hex) {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// [foreground, background, minimum ratio]. Text needs 4.5:1; icons, focus
// rings and control parts need 3:1 (WCAG 1.4.11).
const TEXT_BGS = ["--background-default", "--surface-default", "--surface-sunken", "--card-bg"];
const pairs = [
  ...["--text-primary", "--text-secondary", "--text-tertiary", "--text-link"].flatMap((fg) => TEXT_BGS.map((bg) => [fg, bg, 4.5])),
  ["--button-primary-fg", "--button-primary-bg", 4.5],
  ["--button-primary-fg", "--button-primary-bg-hover", 4.5],
  ["--button-primary-fg", "--button-primary-bg-active", 4.5],
  ["--button-secondary-fg", "--button-secondary-bg", 4.5],
  ["--button-secondary-fg", "--button-secondary-bg-hover", 4.5],
  ["--nav-item-fg", "--background-default", 4.5],
  ["--nav-item-fg", "--nav-item-bg-hover", 4.5],
  ["--text-primary", "--nav-item-bg-hover", 4.5],
  ["--success-text", "--success-bg", 4.5],
  ["--warning-text", "--warning-bg", 4.5],
  ["--error-text", "--error-bg", 4.5],
  ["--info-text", "--info-bg", 4.5],
  ["--success-icon", "--success-bg", 3],
  ["--warning-icon", "--warning-bg", 3],
  ["--error-icon", "--error-bg", 3],
  ["--info-icon", "--info-bg", 3],
  ["--focus-ring", "--background-default", 3],
  ["--focus-ring", "--card-bg", 3],
  ["--control-checked-fg", "--control-checked-bg", 3],
  ["--control-border", "--background-default", 3],
];

let failed = 0;
for (const [name, vars] of [["dark", dark], ["light", light]]) {
  console.log(`\n${name}`);
  for (const [fg, bg, min] of pairs) {
    const r = ratio(resolve(vars, vars[fg]), resolve(vars, vars[bg]));
    const ok = r >= min;
    if (!ok) failed++;
    console.log(`${ok ? "pass" : "FAIL"}  ${r.toFixed(2).padStart(5)}  ${fg} on ${bg} (min ${min})`);
  }
}
if (failed) {
  console.error(`\n${failed} pair(s) below AA`);
  process.exit(1);
}
console.log("\nall pairs pass WCAG AA");
