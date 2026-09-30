import { useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  AuroraBackground — OpenAI-launch-page style animated nebula.        */
/*                                                                     */
/*  A full-screen canvas behind the page: luminous gradient ribbons     */
/*  (sky blue / violet / teal) flowing like an aurora over a dark       */
/*  space, plus drifting star-dust particles. Rendered at reduced      */
/*  resolution and composited additively for a soft nebula glow.       */
/*                                                                     */
/*  Performance:                                                       */
/*   - offscreen render at ~35% scale, upscaled (soft by design)        */
/*   - devicePixelRatio capped, rAF loop, pauses off-screen            */
/*   - honors prefers-reduced-motion (renders one static frame)        */
/* ------------------------------------------------------------------ */

type Ribbon = {
  stops: string[]; // gradient color stops along the ribbon
  baseY: number; // vertical center as fraction of height (0..1)
  amp: number; // wave amplitude as fraction of height
  freq: number; // horizontal frequency multiplier
  speed: number; // time speed multiplier
  phase: number; // phase offset
  width: number; // stroke width as fraction of height
  alpha: number; // peak opacity
};

const RIBBONS: Ribbon[] = [
  {
    stops: ["rgba(56,189,248,0)", "rgba(56,189,248,0.55)", "rgba(139,92,246,0.45)", "rgba(56,189,248,0)"],
    baseY: 0.28,
    amp: 0.09,
    freq: 1.6,
    speed: 0.22,
    phase: 0.0,
    width: 0.34,
    alpha: 0.85,
  },
  {
    stops: ["rgba(139,92,246,0)", "rgba(139,92,246,0.5)", "rgba(59,130,246,0.5)", "rgba(139,92,246,0)"],
    baseY: 0.52,
    amp: 0.12,
    freq: 1.1,
    speed: -0.16,
    phase: 2.1,
    width: 0.42,
    alpha: 0.8,
  },
  {
    stops: ["rgba(34,211,238,0)", "rgba(34,211,238,0.42)", "rgba(56,189,248,0.4)", "rgba(34,211,238,0)"],
    baseY: 0.74,
    amp: 0.08,
    freq: 2.1,
    speed: 0.28,
    phase: 4.4,
    width: 0.3,
    alpha: 0.7,
  },
  {
    stops: ["rgba(99,102,241,0)", "rgba(99,102,241,0.5)", "rgba(34,211,238,0.35)", "rgba(99,102,241,0)"],
    baseY: 0.12,
    amp: 0.06,
    freq: 2.6,
    speed: -0.3,
    phase: 1.2,
    width: 0.26,
    alpha: 0.6,
  },
];

type Particle = {
  x: number; // 0..1
  y: number; // 0..1
  r: number; // radius px (offscreen scale)
  speed: number; // drift speed
  twinkle: number; // twinkle speed
  phase: number;
};

function makeParticles(count: number): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: Math.random(),
      y: Math.random(),
      r: 0.6 + Math.random() * 1.6,
      speed: 0.004 + Math.random() * 0.012,
      twinkle: 0.6 + Math.random() * 2.2,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return out;
}

export default function AuroraBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Render small, upscale — the blur is part of the aesthetic.
    const SCALE = 0.35;
    const off = document.createElement("canvas");
    const octx = off.getContext("2d");
    if (!octx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = true;
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const particles = makeParticles(90);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = Math.floor(window.innerWidth * SCALE);
      h = Math.floor(window.innerHeight * SCALE);
      off.width = Math.max(1, w);
      off.height = Math.max(1, h);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      octx.setTransform(1, 0, 0, 1, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouse = (e: MouseEvent) => {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMouse);

    const drawFrame = (t: number) => {
      // Ease mouse toward target for buttery parallax.
      mouse.x += (mouse.tx - mouse.x) * 0.03;
      mouse.y += (mouse.ty - mouse.y) * 0.03;
      const px = (mouse.x - 0.5) * 2; // -1..1
      const py = (mouse.y - 0.5) * 2;

      octx.clearRect(0, 0, w, h);
      octx.globalCompositeOperation = "lighter";
      octx.lineCap = "round";

      for (const r of RIBBONS) {
        const grad = octx.createLinearGradient(0, 0, w, 0);
        const n = r.stops.length - 1;
        r.stops.forEach((c, i) => grad.addColorStop(i / n, c));

        octx.beginPath();
        const steps = 90;
        const centerY = r.baseY * h + py * h * 0.05;
        for (let i = 0; i <= steps; i++) {
          const fx = i / steps;
          const x = fx * w + px * w * 0.03;
          const y =
            centerY +
            Math.sin(fx * Math.PI * 2 * r.freq + t * r.speed + r.phase) * r.amp * h +
            Math.sin(fx * Math.PI * 2 * r.freq * 2.7 - t * r.speed * 1.6 + r.phase * 2) *
              r.amp *
              h *
              0.45;
          if (i === 0) octx.moveTo(x, y);
          else octx.lineTo(x, y);
        }
        octx.strokeStyle = grad;
        octx.lineWidth = r.width * h;
        octx.globalAlpha = r.alpha;
        octx.shadowColor = "rgba(96,165,250,0.8)";
        octx.shadowBlur = h * 0.12;
        octx.stroke();
        octx.shadowBlur = 0;

        // Bright core streak — the signature light-stream look.
        octx.strokeStyle = "rgba(186,230,253,0.55)";
        octx.lineWidth = Math.max(1.2, h * 0.016);
        octx.globalAlpha = Math.min(1, r.alpha + 0.1);
        octx.shadowColor = "rgba(125,211,252,0.9)";
        octx.shadowBlur = h * 0.05;
        octx.stroke();
        octx.shadowBlur = 0;
        octx.globalAlpha = 1;
      }

      // Star dust.
      for (const p of particles) {
        const driftX = ((p.x + t * p.speed * 0.02) % 1) * w;
        const driftY = (p.y % 1) * h;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * p.twinkle + p.phase));
        octx.globalAlpha = 0.75 * tw;
        octx.fillStyle = "#e0f2fe";
        octx.beginPath();
        octx.arc(driftX, driftY, p.r * 1.4, 0, Math.PI * 2);
        octx.fill();
      }
      octx.globalAlpha = 1;
      octx.globalCompositeOperation = "source-over";

      // Composite: deep-space base + aurora, upscaled.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#05070f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
    };

    let start = performance.now();
    if (reduceMotion) {
      drawFrame(12); // one calm static frame
    } else {
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
      } else if (!reduceMotion) {
        running = true;
        start = performance.now();
        raf = requestAnimationFrame(function resume(now: number) {
          if (!running) return;
          drawFrame((now - start) / 1000);
          raf = requestAnimationFrame(resume);
        });
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
