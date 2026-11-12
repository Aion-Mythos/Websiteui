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

// [foreground, background, minimum ratio]
const pairs = [
  ["--text-primary", "--background-default", 4.5],
  ["--text-secondary", "--background-default", 4.5],
  ["--text-muted", "--background-default", 4.5],
  ["--text-primary", "--background-raised", 4.5],
  ["--text-secondary", "--background-raised", 4.5],
  ["--text-muted", "--background-raised", 4.5],
  ["--accent-text", "--background-default", 4.5],
  ["--accent-text", "--background-raised", 4.5],
  ["--accent-on", "--accent-default", 4.5],
  ["--accent-on", "--accent-hover", 4.5],
  ["--status-success-fg", "--status-success-bg", 4.5],
  ["--status-warning-fg", "--status-warning-bg", 4.5],
  ["--status-error-fg", "--status-error-bg", 4.5],
  ["--status-info-fg", "--status-info-bg", 4.5],
  ["--focus-ring", "--background-default", 3],
  ["--border-strong", "--background-default", 3],
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
