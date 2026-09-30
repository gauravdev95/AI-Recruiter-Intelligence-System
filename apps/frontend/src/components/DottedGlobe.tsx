import { useEffect, useRef } from "react";

/**
 * Rotating dotted globe with an orange atmosphere and an orbit ring —
 * the "one score, both sides" section visual.
 */
export default function DottedGlobe({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    // Fibonacci sphere points.
    const COUNT = 750;
    const pts: Array<[number, number, number]> = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < COUNT; i++) {
      const y = 1 - (i / (COUNT - 1)) * 2;
      const rad = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      pts.push([Math.cos(theta) * rad, y, Math.sin(theta) * rad]);
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (t: number) => {
      const S = Math.min(w, h);
      if (S <= 0) return;
      const cx = w / 2;
      const cy = h / 2;
      const R = S * 0.34;
      const rot = reduced ? 0.6 : t * 0.00012;

      ctx.clearRect(0, 0, w, h);

      // Orange atmosphere behind the globe.
      const atmo = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 1.7);
      atmo.addColorStop(0, "rgba(249,115,22,0.16)");
      atmo.addColorStop(0.55, "rgba(249,115,22,0.07)");
      atmo.addColorStop(1, "rgba(249,115,22,0)");
      ctx.fillStyle = atmo;
      ctx.fillRect(0, 0, w, h);

      // Orbit ring (tilted ellipse) + satellite.
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.35);
      ctx.strokeStyle = "rgba(251,146,60,0.35)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 1.45, R * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      if (!reduced) {
        const sa = t * 0.00045;
        const sx = Math.cos(sa) * R * 1.45;
        const sy = Math.sin(sa) * R * 0.5;
        const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 10);
        sg.addColorStop(0, "rgba(255,220,170,1)");
        sg.addColorStop(0.4, "rgba(251,146,60,0.7)");
        sg.addColorStop(1, "rgba(251,146,60,0)");
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(sx, sy, 10, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Dots.
      const cosR = Math.cos(rot);
      const sinR = Math.sin(rot);
      for (const [x, y, z] of pts) {
        const xr = x * cosR - z * sinR;
        const zr = x * sinR + z * cosR;
        const px = cx + xr * R;
        const py = cy + y * R;
        const front = zr > 0;
        // Warm rim near the edge, cool slate toward the disc center.
        const edge = Math.min(1, Math.sqrt(xr * xr + y * y) * 1.15);
        const alpha = front ? 0.25 + edge * 0.65 : 0.06;
        ctx.fillStyle =
          edge > 0.72
            ? `rgba(251,146,60,${alpha.toFixed(3)})`
            : `rgba(148,163,184,${(alpha * 0.8).toFixed(3)})`;
        const s = front ? 1.6 : 1.1;
        ctx.fillRect(px - s / 2, py - s / 2, s, s);
      }
    };

    if (reduced) {
      draw(0);
    } else {
      const loop = (t: number) => {
        draw(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label="Rotating dotted globe with orange atmosphere"
      data-bg="dotted-globe"
    />
  );
}
