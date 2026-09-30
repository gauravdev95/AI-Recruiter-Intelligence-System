import { useRef, type CSSProperties, type ReactNode } from "react";

type Chip = { content: ReactNode; className: string; depth: number; floatClass: string };

/**
 * Floating glass chips that drift (CSS float animation) and shift with
 * the mouse (parallax). Outer wrapper handles parallax, inner handles float.
 */
export default function FloatingChips({ chips }: { chips: Chip[] }) {
  const ref = useRef<HTMLDivElement | null>(null);

  const onMouseMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--px", px.toFixed(3));
    el.style.setProperty("--py", py.toFixed(3));
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden md:block"
    >
      {chips.map((c, i) => (
        <div
          key={i}
          className={`parallax-layer absolute ${c.className}`}
          style={{ "--depth": c.depth } as CSSProperties}
        >
          <div className={`${c.floatClass}`}>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-2.5 text-xs font-medium text-slate-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] backdrop-blur-xl">
              {c.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
