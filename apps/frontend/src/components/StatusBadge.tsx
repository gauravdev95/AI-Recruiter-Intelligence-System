interface StatusBadgeProps {
  tone: "green" | "red" | "blue" | "slate";
  children: React.ReactNode;
}

const toneClasses: Record<StatusBadgeProps["tone"], string> = {
  green: "bg-green-100 text-green-800",
  red: "bg-red-100 text-red-800",
  blue: "bg-blue-100 text-blue-800",
  slate: "bg-slate-100 text-slate-800",
};

/** Small pill badge used for role/status labels. */
export default function StatusBadge({ tone, children }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
