// Always night theme regardless of page theme, per the design system's UI kit rule.
export function EnquiryFooter() {
  return (
    <footer
      data-theme="night"
      style={{ background: "var(--surface-page)", padding: "40px var(--page-pad) 32px", color: "var(--text-primary)" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 32, flexWrap: "wrap", maxWidth: 1440, margin: "0 auto" }}>
        <div style={{ display: "grid", gap: 10, maxWidth: 320 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, letterSpacing: "0.14em", color: "var(--luxury-gold)" }}>
            TENTVAALE
          </span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)" }}>
            Owned inventory, delivered and installed by our own crew across 30+ cities.
          </span>
        </div>
        <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--luxury-gold)",
            }}
          >
            Enquiries
          </span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-secondary)" }}>
            Quote-based. No online checkout.
          </span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-secondary)" }}>
            studio@tentvaale.com · +91 265 000 0000
          </span>
        </div>
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            alignSelf: "end",
          }}
        >
          Experiences Elevated. Spaces Styled.
        </span>
      </div>
    </footer>
  );
}
