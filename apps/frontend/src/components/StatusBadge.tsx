interface StatusBadgeProps {
  tone: "green" | "red" | "blue" | "slate";
  children: React.ReactNode;
}

const toneClasses: Record<StatusBadgeProps["tone"], string> = {
  green: "border border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  red: "border border-red-400/25 bg-red-400/10 text-red-300",
  blue: "border border-sky-400/25 bg-sky-400/10 text-sky-300",
  slate: "border border-white/15 bg-white/5 text-slate-300",
};

/** Small pill badge — dark theme. */
export default function StatusBadge({ tone, children }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
