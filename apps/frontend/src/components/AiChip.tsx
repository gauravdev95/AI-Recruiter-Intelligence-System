import { useMemo, useRef, useState } from "react";

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

const S = 560;
const C = S / 2;
const RX = S * 0.38;
const RY = S * 0.31;
const CHIP_R = S * 0.115;

/**
 * Glowing "AI" chip with radiating network nodes — the hero centerpiece.
 * Pure SVG (no canvas): renders identically in every browser, with light
 * pulses traveling outward along each connection line, breathing node
 * halos and mouse parallax. Respects prefers-reduced-motion.
 */
export default function AiChip({ className = "" }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const nodes = useMemo(
    () =>
      NODES.map((n) => {
        const nx = C + Math.cos(n.angle) * RX;
        const ny = C + Math.sin(n.angle) * RY;
        const lx = C + Math.cos(n.angle) * CHIP_R;
        const ly = C + Math.sin(n.angle) * CHIP_R;
        return { ...n, nx, ny, lx, ly };
      }),
    [],
  );

  const pins = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < 5; i++) arr.push(C - CHIP_R * 0.6 + (i * CHIP_R * 1.2) / 4);
    return arr;
  }, []);

  const onMouse = (e: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg || reduced) return;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    svg.style.transform = `translate(${(x * 14).toFixed(1)}px, ${(y * 14).toFixed(1)}px)`;
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${S} ${S}`}
      className={className}
      role="img"
      aria-label="AI verification chip connected to GitHub, LeetCode, Codeforces, certificates, interviews, resumes and match scores"
      data-bg="ai-chip"
      onMouseMove={onMouse}
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id="aichip-ambient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(249,115,22,0.20)" />
          <stop offset="60%" stopColor="rgba(249,115,22,0.06)" />
          <stop offset="100%" stopColor="rgba(249,115,22,0)" />
        </radialGradient>
        <radialGradient id="aichip-pulse" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,220,170,0.95)" />
          <stop offset="40%" stopColor="rgba(251,146,60,0.55)" />
          <stop offset="100%" stopColor="rgba(251,146,60,0)" />
        </radialGradient>
        <linearGradient id="aichip-line" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(251,146,60,0.55)" />
          <stop offset="100%" stopColor="rgba(251,146,60,0.08)" />
        </linearGradient>
        {nodes.map((n, i) => (
          <radialGradient key={i} id={`aichip-halo-${i}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={n.color} />
            <stop offset="35%" stopColor={`${n.color}aa`} />
            <stop offset="100%" stopColor={`${n.color}00`} />
          </radialGradient>
        ))}
      </defs>

      {/* Ambient orange glow */}
      <circle cx={C} cy={C} r={S * 0.42} fill="url(#aichip-ambient)" />

      {/* Faint orbit ellipses */}
      {[1, 1.22].map((k) => (
        <ellipse
          key={k}
          cx={C}
          cy={C}
          rx={RX * k}
          ry={RY * k}
          fill="none"
          stroke="rgba(251,146,60,0.14)"
          strokeWidth="1"
        />
      ))}

      {/* Connection lines */}
      {nodes.map((n, i) => (
        <line
          key={i}
          x1={n.lx}
          y1={n.ly}
          x2={n.nx}
          y2={n.ny}
          stroke="url(#aichip-line)"
          strokeWidth="1.4"
        />
      ))}
      {/* Traveling light pulses */}
      {!reduced &&
        nodes.map((n, i) => (
          <circle key={i} r={S * 0.03} fill="url(#aichip-pulse)">
            <animateMotion
              dur="2.9s"
              begin={`${(-i * 0.42).toFixed(2)}s`}
              repeatCount="indefinite"
              path={`M ${n.lx.toFixed(1)} ${n.ly.toFixed(1)} L ${n.nx.toFixed(1)} ${n.ny.toFixed(1)}`}
            />
          </circle>
        ))}

      {/* Nodes: halo + dot + label */}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle
            cx={n.nx}
            cy={n.ny}
            r={S * 0.035}
            fill={`url(#aichip-halo-${i})`}
            className={reduced ? undefined : "ai-node-halo"}
            style={reduced ? undefined : { animationDelay: `${(i * 0.45).toFixed(2)}s` }}
          />
          <circle cx={n.nx} cy={n.ny} r={S * 0.009} fill={n.color} />
          <text
            x={n.nx}
            y={n.ny + S * 0.055}
            textAnchor="middle"
            fill="rgba(203,213,225,0.85)"
            fontSize={Math.max(10, S * 0.024)}
            fontWeight={500}
            fontFamily="Inter, system-ui, sans-serif"
          >
            {n.label}
          </text>
        </g>
      ))}

      {/* Central chip */}
      <g className={reduced ? undefined : "ai-chip-breathe"}>
        <rect
          x={C - CHIP_R}
          y={C - CHIP_R}
          width={CHIP_R * 2}
          height={CHIP_R * 2}
          rx={CHIP_R * 0.32}
          fill="#0d1220"
          stroke="rgba(251,146,60,0.85)"
          strokeWidth={Math.max(1.5, S * 0.004)}
          style={{ filter: "drop-shadow(0 0 26px rgba(249,115,22,0.65))" }}
        />
      </g>
      {/* Circuit pins */}
      {pins.map((x, i) => (
        <g key={i} stroke="rgba(251,146,60,0.5)" strokeWidth={Math.max(1, S * 0.0025)}>
          <line x1={x} y1={C - CHIP_R - S * 0.018} x2={x} y2={C - CHIP_R} />
          <line x1={x} y1={C + CHIP_R} x2={x} y2={C + CHIP_R + S * 0.018} />
        </g>
      ))}
      <text
        x={C}
        y={C}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#f8fafc"
        fontSize={CHIP_R * 0.62}
        fontWeight={800}
        fontFamily="Inter, system-ui, sans-serif"
        letterSpacing="1"
      >
        AI
      </text>
    </svg>
  );
}
