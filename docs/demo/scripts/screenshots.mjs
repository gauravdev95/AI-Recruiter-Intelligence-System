/**
 * Phase 1 demo screenshots.
 * Usage: node scripts/screenshots.mjs [output-dir]
 * Requires: frontend dev server + backend API running.
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const OUT = resolve(process.argv[2] || `${ROOT}/docs/demo/screenshots`);
mkdirSync(OUT, { recursive: true });

const CHROME = `${process.env.HOME}/.cache/puppeteer/chrome/linux-154.0.8037.57/chrome-linux64/chrome`;
const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5173";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--force-device-scale-factor=1"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

async function shot(name, fn) {
  if (fn) await fn();
  await sleep(1500); // let entrance animations + reveal settle
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log("saved", `${name}.png`);
}

async function scrollTo(selector) {
  await page.evaluate((sel) => {
    document.querySelector(sel)?.scrollIntoView({ block: "start", behavior: "instant" });
  }, selector);
  await sleep(900);
}

// 1 — hero
await page.goto(FRONTEND, { waitUntil: "networkidle2" });
await shot("01-hero");

// 2 — live status terminal
await scrollTo("#status");
await shot("02-live-status");

// 3 — tech stack
await scrollTo("#stack");
await shot("03-tech-stack");

// 4 — API endpoints
await scrollTo("#endpoints");
await shot("04-api-endpoints");

// 5 — auth flow
await scrollTo("#auth-flow");
await shot("05-auth-flow");

// 6 — register page
await page.goto(`${FRONTEND}/register`, { waitUntil: "networkidle2" });
await shot("06-register");

// 7 — account page (real registration through the UI)
const stamp = Date.now();
await page.type("#register-name", "Demo User");
await page.type("#register-email", `demo.${stamp}@example.com`);
await page.type("#register-password", "DemoPass123");
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle2" }),
  page.click('button[type="submit"]'),
]);
await shot("07-account");

await browser.close();
console.log("done ->", OUT);
