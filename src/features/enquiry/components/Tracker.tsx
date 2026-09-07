const STEPS: [string, string][] = [
  ["Enquiry received", "Logged against reference TV-ENQ-2618 and routed to the Vadodara studio."],
  ["Availability checked", "Every piece verified against the floor, its rack and its outbound schedule."],
  ["Quote sent", "Itemised, with logistics and crew priced on your venue and access."],
  ["Confirmed and installed", "Our own crew delivers, styles and dismantles. Nothing subcontracted."],
];

export function Tracker({ completedCount = 2 }: { completedCount?: number }) {
  return (
    <div style={{ display: "grid", gap: 0 }}>
      {STEPS.map(([title, body], i) => {
        const done = i < completedCount;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={title} style={{ display: "grid", gridTemplateColumns: "32px minmax(0,1fr)", gap: 20 }}>
            <div style={{ display: "grid", justifyItems: "center", gap: 4 }}>
              <span
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  background: done ? "var(--accent)" : "transparent",
                  border: `1px solid ${done ? "var(--accent)" : "var(--border-strong)"}`,
                  fontFamily: "var(--font-ui)",
                  fontSize: 11,
                  fontWeight: 700,
                  color: done ? "var(--text-on-accent)" : "var(--text-muted)",
                }}
              >
                {i + 1}
              </span>
              <span style={{ width: 1, flex: 1, minHeight: isLast ? 0 : 34, background: "var(--border-subtle)" }} />
            </div>
            <div style={{ display: "grid", gap: 6, paddingBottom: 26 }}>
              <span
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: 16,
                  fontWeight: 600,
                  color: done ? "var(--text-primary)" : "var(--text-secondary)",
                }}
              >
                {title}
              </span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.6, color: "var(--text-secondary)" }}>
                {body}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
