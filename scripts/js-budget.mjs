// Sums the JavaScript a visitor downloads for "/" (including the lazily
// loaded engine chunk), raw and gzip. Fonts are excluded by the brief.
// Usage: node scripts/js-budget.mjs [baseUrl]
import { chromium } from "playwright-core";
import { gzipSync } from "node:zlib";

const base = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? "/opt/pw-browsers/chromium",
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage();
const files = [];
page.on("response", async (r) => {
  if (!r.url().endsWith(".js") && r.request().resourceType() !== "script") return;
  try {
    const body = await r.body();
    files.push({ url: r.url().replace(base, ""), raw: body.length, gz: gzipSync(body, { level: 9 }).length });
  } catch {}
});
await page.goto(`${base}/`);
await page.waitForFunction(() => ["ready", "fallback"].includes(document.documentElement.dataset.stage ?? ""), null, { timeout: 90000 });
await page.waitForTimeout(1000);
await browser.close();
files.sort((a, b) => b.gz - a.gz);
const kb = (n) => (n / 1024).toFixed(1).padStart(7);
for (const f of files) console.log(`${kb(f.raw)} kB raw ${kb(f.gz)} kB gz  ${f.url}`);
const raw = files.reduce((s, f) => s + f.raw, 0);
const gz = files.reduce((s, f) => s + f.gz, 0);
console.log(`\nTotal: ${kb(raw)} kB raw, ${kb(gz)} kB gzip (budget 650 kB)`);
