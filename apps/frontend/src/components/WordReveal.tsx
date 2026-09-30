import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type WordRevealProps = {
  /** Words separated by spaces. Wrap words in * to render them highlighted. */
  text: string;
  className?: string;
  /** ms between each word */
  stagger?: number;
  /** render highlighted words with this node wrapper */
  highlight?: (word: string, key: number) => ReactNode;
};

/**
 * Gcore-style headline: words fade/blur/rise in one after another
 * when the headline scrolls into view.
 */
export default function WordReveal({ text, className = "", stagger = 90, highlight }: WordRevealProps) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const words = text.split(" ");
  return (
    <span ref={ref} className={`word-reveal ${className}`}>
      {words.map((raw, i) => {
        const hot = raw.startsWith("*") && raw.endsWith("*") && raw.length > 2;
        const word = hot ? raw.slice(1, -1) : raw;
        const inner: ReactNode = hot && highlight ? highlight(word, i) : word;
        return (
          <span key={i} className="w" style={{ "--word-delay": `${i * stagger}ms` } as CSSProperties}>
            {inner}
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </span>
  );
}
