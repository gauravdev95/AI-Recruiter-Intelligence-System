/**
 * 20-second landing tour video driver (kiosk/fullscreen, no browser UI).
 * Run under Xvfb (DISPLAY=:99). Signals readiness via READY_FILE; the
 * recorder starts ffmpeg only after the page is fully loaded, so the 20s
 * window is exactly the tour.
 */
import puppeteer from "puppeteer-core";
import { writeFileSync } from "node:fs";

const CHROME = `${process.env.HOME}/.cache/puppeteer/chrome/linux-154.0.8037.57/chrome-linux64/chrome`;
const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5173";
const READY_FILE = process.env.READY_FILE || "/tmp/demo-ready";
const TOUR_MS = 20000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: false,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    `--app=${FRONTEND}`,
    "--window-size=1280,800",
    "--window-position=0,0",
    "--force-device-scale-factor=1",
  ],
});
const [page] = await browser.pages();
await page.setViewport({ width: 1280, height: 800 });
await page.goto(FRONTEND, { waitUntil: "networkidle2" });
await sleep(2500); // hero entrance animation completes

writeFileSync(READY_FILE, "ready");
const t0 = Date.now();

const stops = ["#status", "#stack", "#endpoints", "#auth-flow"];
for (const sel of stops) {
  await page.evaluate((s) => {
    document.querySelector(s)?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, sel);
  await sleep(3400); // linger while reveal animations play
}
await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
const remaining = TOUR_MS - (Date.now() - t0);
if (remaining > 400) await sleep(remaining);
await browser.close();
