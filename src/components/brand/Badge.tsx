export type BadgeTone = "gold" | "solid" | "neutral" | "inverse" | "available" | "hold" | "out";

const TONES: Record<BadgeTone, React.CSSProperties> = {
  gold: { background: "transparent", color: "var(--text-accent)", border: "1px solid var(--border-accent)" },
  solid: { background: "var(--luxury-gold)", color: "var(--graphite-black)", border: "1px solid transparent" },
  neutral: { background: "var(--surface-sunken)", color: "var(--text-secondary)", border: "1px solid transparent" },
  inverse: { background: "var(--graphite-black)", color: "var(--warm-ivory)", border: "1px solid transparent" },
  available: {
    background: "transparent",
    color: "var(--status-available)",
    border: "1px solid color-mix(in oklab, var(--status-available) 45%, transparent)",
  },
  hold: {
    background: "transparent",
    color: "var(--status-on-hold)",
    border: "1px solid color-mix(in oklab, var(--status-on-hold) 55%, transparent)",
  },
  out: {
    background: "transparent",
    color: "var(--status-out)",
    border: "1px solid color-mix(in oklab, var(--status-out) 45%, transparent)",
  },
};

export interface BadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
  shape?: "pill" | "square";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({ children, tone = "gold", shape = "pill", size = "md", className }: BadgeProps) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: size === "sm" ? "3px 8px" : "5px 12px",
        borderRadius: shape === "pill" ? "var(--radius-pill)" : "var(--radius-xs)",
        fontFamily: "var(--font-ui)",
        fontSize: size === "sm" ? 10 : 11,
        fontWeight: 700,
        letterSpacing: "var(--tracking-label)",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        ...TONES[tone],
      }}
    >
      {children}
    </span>
  );
}
