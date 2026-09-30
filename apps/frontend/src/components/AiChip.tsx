import { useEffect, useRef } from "react";

type Node = { label: string; angle: number; color: string };

const NODES: Node[] = [
  { label: "GitHub", angle: 0.0, color: "#fb923c" },
  { label: "LeetCode", angle: 0.9, color: "#fbbf24" },
  { label: "Codeforces", angle: 1.8, color: "#fb923c" },
  { label: "Certificate", angle: 2.7, color: "#e2e8f0" },
  { label: "Interview", angle: 3.6, color: "#fbbf24" },
  { label: "Resume", angle: 4.5, color: "#fb923c" },
  { label: "Match score", angle: 5.4, color: "#e2e8f0" },
];

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Glowing "AI" chip with radiating network nodes — the hero centerpiece.
 * Nodes drift on a slow orbit while light pulses travel outward along
 * each connection line. Mouse parallax + reduced-motion support.
 */
export default function AiChip({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

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

    const onMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width - 0.5,
        y: (e.clientY - rect.top) / rect.height - 0.5,
      };
    };
    window.addEventListener("mousemove", onMouse);

    const draw = (t: number) => {
      const S = Math.min(w, h);
      if (S <= 0) return;
      const cx = w / 2 + mouseRef.current.x * 14;
      const cy = h / 2 + mouseRef.current.y * 14;
      const rx = S * 0.38;
      const ry = S * 0.31;

      ctx.clearRect(0, 0, w, h);

      // Ambient orange glow behind the chip.
      const ambient = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * 0.42);
      ambient.addColorStop(0, "rgba(249,115,22,0.20)");
      ambient.addColorStop(0.6, "rgba(249,115,22,0.06)");
      ambient.addColorStop(1, "rgba(249,115,22,0)");
      ctx.fillStyle = ambient;
      ctx.fillRect(0, 0, w, h);

      // Faint orbit ellipses.
      ctx.strokeStyle = "rgba(251,146,60,0.14)";
      ctx.lineWidth = 1;
      for (const k of [1, 1.22]) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx * k, ry * k, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      const orbit = reduced ? 0 : t * 0.00006;
      const chipR = S * 0.115;

      // Connection lines + traveling pulses.
      NODES.forEach((node, i) => {
        const a = node.angle + orbit;
        const wobble = reduced ? 0 : Math.sin(t * 0.0009 + i * 1.7) * S * 0.012;
        const nx = cx + Math.cos(a) * (rx + wobble);
        const ny = cy + Math.sin(a) * (ry + wobble);

        const grad = ctx.createLinearGradient(cx, cy, nx, ny);
        grad.addColorStop(0, "rgba(251,146,60,0.55)");
        grad.addColorStop(1, "rgba(251,146,60,0.08)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * chipR, cy + Math.sin(a) * chipR);
        ctx.lineTo(nx, ny);
        ctx.stroke();

        // Pulse traveling outward.
        if (!reduced) {
          const p = (t * 0.00035 + i * 0.23) % 1;
          const eased = p * p * (3 - 2 * p);
          const px = cx + (nx - cx) * eased;
          const py = cy + (ny - cy) * eased;
          const pg = ctx.createRadialGradient(px, py, 0, px, py, S * 0.03);
          pg.addColorStop(0, "rgba(255,220,170,0.95)");
          pg.addColorStop(0.4, "rgba(251,146,60,0.55)");
          pg.addColorStop(1, "rgba(251,146,60,0)");
          ctx.fillStyle = pg;
          ctx.beginPath();
          ctx.arc(px, py, S * 0.03, 0, Math.PI * 2);
          ctx.fill();
        }

        // Node dot with halo.
        const halo = ctx.createRadialGradient(nx, ny, 0, nx, ny, S * 0.035);
        halo.addColorStop(0, node.color);
        halo.addColorStop(0.35, node.color + "aa");
        halo.addColorStop(1, node.color + "00");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(nx, ny, S * 0.035, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(nx, ny, S * 0.009, 0, Math.PI * 2);
        ctx.fill();

        // Label.
        ctx.fillStyle = "rgba(203,213,225,0.85)";
        ctx.font = `500 ${Math.max(10, S * 0.024)}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(node.label, nx, ny + S * 0.055);
      });

      // Central chip.
      const chipSize = chipR * 2;
      ctx.save();
      ctx.shadowColor = "rgba(249,115,22,0.65)";
      ctx.shadowBlur = S * 0.09;
      ctx.fillStyle = "#0d1220";
      roundRect(ctx, cx - chipR, cy - chipR, chipSize, chipSize, chipR * 0.32);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = "rgba(251,146,60,0.85)";
      ctx.lineWidth = Math.max(1.5, S * 0.004);
      roundRect(ctx, cx - chipR, cy - chipR, chipSize, chipSize, chipR * 0.32);
      ctx.stroke();

      // Inner pins along the chip edge (circuit feel).
      ctx.strokeStyle = "rgba(251,146,60,0.5)";
      ctx.lineWidth = Math.max(1, S * 0.0025);
      const pins = 5;
      for (let i = 0; i < pins; i++) {
        const off = -chipR * 0.6 + (i * chipR * 1.2) / (pins - 1);
        ctx.beginPath();
        ctx.moveTo(cx + off, cy - chipR - S * 0.018);
        ctx.lineTo(cx + off, cy - chipR);
        ctx.moveTo(cx + off, cy + chipR);
        ctx.lineTo(cx + off, cy + chipR + S * 0.018);
        ctx.stroke();
      }

      ctx.fillStyle = "#ffffff";
      ctx.font = `800 ${chipR * 0.72}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("AI", cx, cy + chipR * 0.04);
      ctx.textBaseline = "alphabetic";
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
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label="Glowing AI chip connected to verification sources"
      data-bg="ai-chip"
    />
  );
}
