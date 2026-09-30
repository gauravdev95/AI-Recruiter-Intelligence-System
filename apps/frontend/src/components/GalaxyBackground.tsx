import { useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  GalaxyBackground — OpenAI GPT-6 Astra style hero backdrop.          */
/*                                                                     */
/*  A full-screen canvas behind the page:                              */
/*   - deep-space base with a subtle twinkling starfield everywhere    */
/*   - a slowly rotating particle spiral galaxy (3 arms, bright core,  */
/*     cool white/blue particles with warm amber accents) centered     */
/*     behind the hero headline, fading out as you scroll past it      */
/*                                                                     */
/*  Performance:                                                       */
/*   - offscreen render at 50% scale, additive blending for glow       */
/*   - devicePixelRatio capped, rAF loop, pauses when tab hidden       */
/*   - honors prefers-reduced-motion (renders one static frame)        */
/* ------------------------------------------------------------------ */

const ARMS = 3;
const SPIRAL_TURNS = 1.15; // how tightly the arms wind, in full turns
const SQUASH = 0.66; // vertical squash of the galaxy ellipse
const TILT = -0.14; // tilt of the ellipse, radians
const ROT_SPEED = 0.05; // base rotation speed, rad/s (slow & calm)

type GalaxyParticle = {
  arm: number;
  rFrac: number; // radius as fraction of galaxy radius (0..1)
  spread: number; // perpendicular jitter seed (-1..1)
  size: number; // px at offscreen scale
  color: string;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  core: boolean; // bright dense core particle
};

type Star = {
  x: number; // 0..1
  y: number; // 0..1
  r: number;
  color: string;
  twinkleSpeed: number;
  twinklePhase: number;
  drift: number;
};

function pickColor(core: boolean): { color: string; baseAlpha: number } {
  const roll = Math.random();
  if (core) {
    // Hot bright core: mostly pale blue-white, rarely pure white.
    if (roll < 0.3) return { color: "#ffffff", baseAlpha: 0.85 };
    if (roll < 0.65) return { color: "#e0f2fe", baseAlpha: 0.8 };
    return { color: "#c7d2fe", baseAlpha: 0.75 };
  }
  // Arms: fine colorful grain — blues/violet/teal dominate, white is rare.
  if (roll < 0.3) return { color: "#93c5fd", baseAlpha: 0.6 }; // pale blue
  if (roll < 0.48) return { color: "#a5b4fc", baseAlpha: 0.55 }; // soft indigo
  if (roll < 0.6) return { color: "#67e8f9", baseAlpha: 0.5 }; // teal
  if (roll < 0.72) return { color: "#e2e8f0", baseAlpha: 0.55 }; // cool silver
  if (roll < 0.8) return { color: "#f1f5f9", baseAlpha: 0.6 }; // sparse white
  if (roll < 0.9) return { color: "#64748b", baseAlpha: 0.45 }; // dim slate dust
  return { color: roll < 0.95 ? "#fcd34d" : "#fb923c", baseAlpha: 0.65 }; // warm amber accents
}

function makeGalaxy(count: number): GalaxyParticle[] {
  const out: GalaxyParticle[] = [];
  for (let i = 0; i < count; i++) {
    const core = i < Math.floor(count * 0.1);
    const { color, baseAlpha } = pickColor(core);
    out.push({
      arm: i % ARMS,
      rFrac: core ? Math.pow(Math.random(), 1.6) * 0.16 : 0.06 + Math.pow(Math.random(), 0.65) * 0.94,
      spread: (Math.random() + Math.random() + Math.random() - 1.5) / 1.5,
      // Fine grain: small dots, not blobs.
      size: core ? 0.5 + Math.random() * 0.9 : 0.3 + Math.random() * 0.8,
      color,
      baseAlpha,
      twinkleSpeed: 0.5 + Math.random() * 2.4,
      twinklePhase: Math.random() * Math.PI * 2,
      core,
    });
  }
  return out;
}

function makeStars(count: number): Star[] {
  const out: Star[] = [];
  const tints = ["#ffffff", "#e0f2fe", "#cbd5e1", "#bfdbfe"];
  for (let i = 0; i < count; i++) {
    out.push({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.1,
      color: tints[Math.floor(Math.random() * tints.length)],
      twinkleSpeed: 0.3 + Math.random() * 1.8,
      twinklePhase: Math.random() * Math.PI * 2,
      drift: 0.002 + Math.random() * 0.008,
    });
  }
  return out;
}

export default function GalaxyBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SCALE = 0.5;
    const off = document.createElement("canvas");
    const octx = off.getContext("2d");
    if (!octx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = true;
    let scrollFade = 1;
    const mouse = { x: 0.5, tx: 0.5 };
    const galaxy = makeGalaxy(2400);
    const stars = makeStars(230);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = Math.max(1, Math.floor(window.innerWidth * SCALE));
      h = Math.max(1, Math.floor(window.innerHeight * SCALE));
      off.width = w;
      off.height = h;
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      updateScrollFade();
    };

    const updateScrollFade = () => {
      const vh = window.innerHeight || 1;
      scrollFade = Math.max(0, 1 - window.scrollY / (vh * 0.85));
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", updateScrollFade, { passive: true });

    const onMouse = (e: MouseEvent) => {
      mouse.tx = e.clientX / window.innerWidth;
    };
    window.addEventListener("mousemove", onMouse);

    const cosTilt = Math.cos(TILT);
    const sinTilt = Math.sin(TILT);

    const drawFrame = (t: number) => {
      mouse.x += (mouse.tx - mouse.x) * 0.03;
      const parallax = (mouse.x - 0.5) * 2;

      // Deep-space base.
      octx.globalCompositeOperation = "source-over";
      octx.globalAlpha = 1;
      const base = octx.createLinearGradient(0, 0, 0, h);
      base.addColorStop(0, "#04060d");
      base.addColorStop(0.55, "#030509");
      base.addColorStop(1, "#05070f");
      octx.fillStyle = base;
      octx.fillRect(0, 0, w, h);

      // Starfield.
      octx.globalCompositeOperation = "lighter";
      for (const s of stars) {
        const sx = ((s.x + t * s.drift * 0.02) % 1) * w;
        const sy = (s.y % 1) * h;
        const tw = 0.3 + 0.7 * Math.abs(Math.sin(t * s.twinkleSpeed + s.twinklePhase));
        octx.globalAlpha = 0.55 * tw;
        octx.fillStyle = s.color;
        octx.beginPath();
        octx.arc(sx, sy, s.r, 0, Math.PI * 2);
        octx.fill();
      }

      // Spiral galaxy, centered behind the hero.
      if (scrollFade > 0.01) {
        const R = Math.min(w, h) * 0.38;
        const cx = w * 0.5 + parallax * w * 0.02;
        const cy = h * 0.36;

        for (const p of galaxy) {
          const armPhase = (p.arm / ARMS) * Math.PI * 2;
          // Differential rotation: inner particles orbit faster.
          const rot = t * ROT_SPEED * (1.45 - p.rFrac);
          const ang = armPhase + p.rFrac * SPIRAL_TURNS * Math.PI * 2 + rot;
          const rr = p.rFrac * R;
          const spreadAmt = (0.015 + 0.11 * p.rFrac) * R;
          // Position along arm + perpendicular jitter.
          let px = Math.cos(ang) * rr + Math.cos(ang + Math.PI / 2) * p.spread * spreadAmt;
          let py = Math.sin(ang) * rr * SQUASH + Math.sin(ang + Math.PI / 2) * p.spread * spreadAmt * SQUASH;
          // Tilt the ellipse.
          const rx = px * cosTilt - py * sinTilt;
          const ry = px * sinTilt + py * cosTilt;
          px = cx + rx;
          py = cy + ry;

          const tw = 0.55 + 0.45 * Math.sin(t * p.twinkleSpeed + p.twinklePhase);
          octx.globalAlpha = p.baseAlpha * tw * scrollFade;
          octx.fillStyle = p.color;
          octx.beginPath();
          octx.arc(px, py, p.size, 0, Math.PI * 2);
          octx.fill();
          // Faint halo only for the rare brightest dots.
          if (p.size > 1.0) {
            octx.globalAlpha = p.baseAlpha * tw * scrollFade * 0.18;
            octx.beginPath();
            octx.arc(px, py, p.size * 2.4, 0, Math.PI * 2);
            octx.fill();
          }
        }
      }
      octx.globalAlpha = 1;
      octx.globalCompositeOperation = "source-over";

      // Composite upscaled.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
    };

    if (reduceMotion) {
      drawFrame(8); // one calm static frame
    } else {
      const start = performance.now();
      const loop = (now: number) => {
        if (!running) return;
        drawFrame((now - start) / 1000);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduceMotion && !running) {
        running = true;
        const start = performance.now();
        const resume = (now: number) => {
          if (!running) return;
          drawFrame((now - start) / 1000);
          raf = requestAnimationFrame(resume);
        };
        raf = requestAnimationFrame(resume);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", updateScrollFade);
      window.removeEventListener("mousemove", onMouse);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-bg="galaxy-spiral"
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
