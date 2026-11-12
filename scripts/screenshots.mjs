// Screenshots every section at 390x844 and 1440x900 in both themes.
// Usage: node scripts/screenshots.mjs [baseUrl] [outDir]
// Screenshots check layout and colour only. Headless WebGL runs at a few fps,
// so `?snap` tells the engine to jump straight to each camera cue.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
const out = process.argv[3] ?? "screenshots";
const only = process.env.ONLY?.split(",");
mkdirSync(out, { recursive: true });

const viewports = [
  { name: "mobile", width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 },
  { name: "desktop", width: 1440, height: 900, deviceScaleFactor: 1 },
];
const themes = ["dark", "light"];

// Where to stop in each section, as a fraction of the scrollable run.
const shots = [
  { name: "1-hero", id: "hero", at: 0 },
  { name: "2-closeup", id: "closeup", at: 0.45 },
  { name: "3-apart", id: "apart", at: 0.62 },
  { name: "4-around", id: "around", at: 0.0 },
  { name: "5-around-terminal", id: "around", at: 1, align: "end" },
  { name: "6-outro", id: "download", at: 0, align: "center" },
  { name: "7-footer", id: "footer", at: 1, align: "end" },
];

const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? "/opt/pw-browsers/chromium",
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});

const problems = [];
for (const vp of viewports) {
  for (const theme of themes) {
    const ctx = await browser.newContext({ ...vp, viewport: { width: vp.width, height: vp.height }, colorScheme: theme });
    await ctx.addInitScript((t) => {
      try {
        localStorage.setItem("wernix-theme", t);
      } catch {}
    }, theme);
    const page = await ctx.newPage();
    page.on("pageerror", (e) => problems.push(`${vp.name}/${theme}: ${e.message}`));
    page.on("console", (m) => m.type() === "error" && problems.push(`${vp.name}/${theme} console: ${m.text()}`));
    await page.goto(`${base}/?snap`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.documentElement.dataset.stage !== "loading", null, { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(1500);

    // Horizontal overflow check.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 0) problems.push(`${vp.name}/${theme}: horizontal overflow ${overflow}px`);

    for (const s of shots) {
      if (only && !only.includes(s.name)) continue;
      await page.evaluate(({ id, at, align }) => {
        const el = document.getElementById(id);
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY;
        const h = el.offsetHeight;
        const vh = window.innerHeight;
        let y = top + Math.max(0, h - vh) * at;
        if (align === "end") y = top + h - vh;
        if (align === "center") y = top + h / 2 - vh / 2;
        window.scrollTo({ top: y, behavior: "instant" });
      }, s);
      await page.waitForTimeout(1800);
      await page.screenshot({ path: `${out}/${vp.name}-${theme}-${s.name}.png` });
    }
    await ctx.close();
  }
}
await browser.close();
if (problems.length) {
  console.log("Problems:\n" + [...new Set(problems)].join("\n"));
} else {
  console.log("No page errors or overflow.");
}
