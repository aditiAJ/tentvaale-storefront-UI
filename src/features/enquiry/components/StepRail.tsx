import Link from "next/link";

const STEPS: { label: string; href: string }[] = [
  { label: "Enquiry", href: "/enquiry" },
  { label: "Details", href: "/enquiry/details" },
  { label: "Submitted", href: "/enquiry/received" },
  { label: "Quote", href: "/quote/TV-QTE-2618-A" },
];

// Non-clickable ahead of the current step in production, per the handoff README
// (the prototype leaves every step reachable for review purposes only).
export function StepRail({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap" }}>
      {STEPS.map((step, i) => {
        const done = i < current;
        const on = i === current;
        const clickable = i <= current;

        const content = (
          <span style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 18px 8px 0", minHeight: 44 }}>
            <span
              style={{
                display: "grid",
                placeItems: "center",
                width: 26,
                height: 26,
                borderRadius: 6,
                fontFamily: "var(--font-ui)",
                fontSize: 11,
                fontWeight: 700,
                background: on ? "var(--accent)" : "transparent",
                color: on ? "var(--text-on-accent)" : done ? "var(--text-accent)" : "var(--text-muted)",
                border: `1px solid ${on ? "var(--accent)" : done ? "var(--border-accent)" : "var(--border-strong)"}`,
              }}
            >
              {i + 1}
            </span>
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: on ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              {step.label}
            </span>
          </span>
        );

        return clickable ? (
          <Link key={step.label} href={step.href} style={{ background: "transparent", cursor: "pointer" }}>
            {content}
          </Link>
        ) : (
          <span key={step.label} style={{ cursor: "default" }}>
            {content}
          </span>
        );
      })}
    </div>
  );
}
