// Behaviour checks for the Definition of done.
// Usage: node scripts/verify.mjs [baseUrl] [outDir]
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
const out = process.argv[3] ?? "screenshots/checks";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? "/opt/pw-browsers/chromium",
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"],
});

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "pass" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
};
const ready = (page) =>
  page.waitForFunction(() => ["ready", "fallback"].includes(document.documentElement.dataset.stage ?? ""), null, { timeout: 90000 });
const status = (page) => page.locator("#ignite-status").textContent();

// ── Theme: first visit follows the OS, choice is remembered, applied before paint.
{
  const ctx = await browser.newContext({ colorScheme: "light", viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  let early = null;
  await page.route("**/*", (r) => r.continue());
  page.on("domcontentloaded", async () => {
    early = await page.evaluate(() => document.documentElement.getAttribute("data-theme")).catch(() => null);
  });
  await page.goto(`${base}/?snap`);
  check("first visit follows prefers-color-scheme", (await page.getAttribute("html", "data-theme")) === "light");
  check("theme applied before hydration", early === "light", `at DOMContentLoaded: ${early}`);
  await page.getByRole("button", { name: /switch to dark theme/i }).first().click();
  const stored = await page.evaluate(() => localStorage.getItem("wernix-theme"));
  check("toggle stores the choice", stored === "dark");
  await page.reload();
  check("stored choice wins over the OS on reload", (await page.getAttribute("html", "data-theme")) === "dark");
  // A synchronous inline script in <head> runs before <body> is parsed, so before first paint.
  const inHead = await page.evaluate(() => [...document.head.querySelectorAll("script:not([src])")].some((s) => s.textContent.includes("wernix-theme")));
  check("theme script is an inline script in <head>", inHead);
  await ctx.close();
}

// ── Hold to ignite: mouse, keyboard, touch; early release decays.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}/?snap`);
  await ready(page);
  const btn = page.getByRole("button", { name: /hold to ignite/i });
  const box = await btn.boundingBox();

  // Early release with the mouse.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(350);
  await page.mouse.up();
  await page.waitForTimeout(300);
  check("early release does not ignite", !/ignited/i.test(await status(page)), await status(page));

  // Full hold with the mouse.
  await page.mouse.down();
  await page.waitForTimeout(1700);
  const midHold = await status(page);
  await page.mouse.up();
  check("mouse hold ignites", /ignited/i.test(midHold), midHold);
  const soundOn = await page.getByRole("button", { name: /sound on/i }).count();
  check("first hold switches sound on", soundOn === 1);

  // Keyboard: Space held.
  await page.waitForTimeout(2500);
  await btn.focus();
  await page.keyboard.down("Space");
  await page.waitForTimeout(1700);
  const kb = await status(page);
  await page.keyboard.up("Space");
  check("keyboard (Space) hold ignites", /ignited/i.test(kb), kb);
  await page.waitForTimeout(2500);
  await page.keyboard.down("Enter");
  await page.waitForTimeout(1700);
  const kb2 = await status(page);
  await page.keyboard.up("Enter");
  check("keyboard (Enter) hold ignites", /ignited/i.test(kb2), kb2);

  // Focus ring present on the ignite button.
  const outline = await btn.evaluate((el) => getComputedStyle(el).outlineStyle);
  check("focus-visible outline on ignite", outline !== "none", outline);

  // Blueprint switch.
  const sw = page.getByRole("switch", { name: /blueprint/i });
  await sw.click();
  await page.waitForTimeout(1500);
  check("blueprint switch toggles", (await sw.getAttribute("aria-checked")) === "true");
  await page.screenshot({ path: `${out}/blueprint-dark.png` });
  await page.evaluate(() => {
    const el = document.getElementById("apart");
    window.scrollTo({ top: el.offsetTop + (el.offsetHeight - innerHeight) * 0.62, behavior: "instant" });
  });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/blueprint-apart.png` });
  await sw.click();
  check("blueprint switch toggles back", (await sw.getAttribute("aria-checked")) === "false");
  check("no page errors during interaction", errors.length === 0, errors.join(" | "));
  await ctx.close();
}

// ── Touch hold (CDP touch events, held for 1.6 s).
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto(`${base}/?snap`);
  await ready(page);
  const btn = page.getByRole("button", { name: /hold to ignite/i });
  await btn.scrollIntoViewIfNeeded();
  const box = await btn.boundingBox();
  const cdp = await ctx.newCDPSession(page);
  const pt = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [pt] });
  await page.waitForTimeout(1700);
  const s = await status(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  check("touch hold ignites", /ignited/i.test(s), s);
  await ctx.close();
}

// ── Reduced motion: static poses, reveals shown instantly.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(`${base}/`);
  await ready(page);
  await page.evaluate(() => {
    const el = document.getElementById("apart");
    window.scrollTo({ top: el.offsetTop + (el.offsetHeight - innerHeight) * 0.3, behavior: "instant" });
  });
  await page.waitForTimeout(5000);
  const hidden = await page.evaluate(
    () => [...document.querySelectorAll("[data-word]")].filter((w) => getComputedStyle(w).opacity !== "1").length,
  );
  check("reduced motion: every heading word visible", hidden === 0, `${hidden} hidden`);
  await page.screenshot({ path: `${out}/reduced-motion-apart.png` });
  await page.evaluate(() => window.scrollTo({ top: document.getElementById("closeup").offsetTop + 300, behavior: "instant" }));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${out}/reduced-motion-closeup.png` });
  await ctx.close();
}

// ── No WebGL: CSS ring and the visible layer list.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/?nowebgl`);
  await ready(page);
  const cls = await page.evaluate(() => document.documentElement.className);
  check("no-WebGL fallback class set", cls.includes("no-webgl"));
  check("canvas hidden", (await page.locator("canvas").evaluate((c) => getComputedStyle(c).display)) === "none");
  check("CSS ring shown", (await page.locator(".css-ring").evaluate((c) => getComputedStyle(c).display)) !== "none");
  await page.screenshot({ path: `${out}/no-webgl-hero.png` });
  await page.evaluate(() => {
    const el = document.getElementById("apart");
    window.scrollTo({ top: el.offsetTop + (el.offsetHeight - innerHeight) * 0.6, behavior: "instant" });
  });
  await page.waitForTimeout(800);
  const listVisible = await page.locator(".apart-list").evaluate((el) => el.getBoundingClientRect().height > 100);
  check("layer list visible without WebGL", listVisible);
  await page.screenshot({ path: `${out}/no-webgl-apart.png` });
  await ctx.close();
}

// ── Also with WebGL disabled at the browser level.
{
  const b2 = await chromium.launch({ executablePath: process.env.CHROME ?? "/opt/pw-browsers/chromium", args: ["--disable-webgl", "--disable-3d-apis"] });
  const page = await b2.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${base}/`);
  await ready(page);
  const cls = await page.evaluate(() => document.documentElement.className);
  check("browser with WebGL disabled falls back", cls.includes("no-webgl"));
  await b2.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
