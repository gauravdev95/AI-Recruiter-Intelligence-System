/**
 * 20-second auth-flow video driver (kiosk/fullscreen, no browser UI).
 * Real registration typed out -> submit -> protected account page.
 * Signals readiness via READY_FILE; recorder starts ffmpeg after load.
 */
import puppeteer from "puppeteer-core";
import { writeFileSync } from "node:fs";

const CHROME = `${process.env.HOME}/.cache/puppeteer/chrome/linux-154.0.8037.57/chrome-linux64/chrome`;
const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5173";
const READY_FILE = process.env.READY_FILE || "/tmp/demo-ready";
const TOUR_MS = 20000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function typeSlow(page, selector, text) {
  for (const ch of text) {
    await page.type(selector, ch, { delay: 0 });
    await sleep(40);
  }
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: false,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    `--app=${FRONTEND}/register`,
    "--window-size=1280,800",
    "--window-position=0,0",
    "--force-device-scale-factor=1",
  ],
});
const [page] = await browser.pages();
await page.setViewport({ width: 1280, height: 800 });

await page.goto(`${FRONTEND}/register`, { waitUntil: "networkidle2" });
await sleep(1200);
writeFileSync(READY_FILE, "ready");
const t0 = Date.now();

await typeSlow(page, "#register-name", "Demo User");
await sleep(250);
await typeSlow(page, "#register-email", `demo.${Date.now()}@example.com`);
await sleep(250);
await typeSlow(page, "#register-password", "DemoPass123");
await sleep(700);

// submit -> protected account page proves the session end-to-end
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle2" }),
  page.click('button[type="submit"]'),
]);
await sleep(2200);
await page.evaluate(() => window.scrollTo({ top: 100, behavior: "smooth" }));
const remaining = TOUR_MS - (Date.now() - t0);
if (remaining > 400) await sleep(remaining);
await browser.close();
