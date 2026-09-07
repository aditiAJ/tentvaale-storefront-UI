import Image from "next/image";

// Minimal port of ds/_ds_bundle.js Logo.jsx — only the "wordmark" and "lockup"
// variants are used by the Enquiry-to-Quote flow (TopNav, footer).
type LogoTone = "gold" | "graphite" | "ivory" | "auto";

const TONE: Record<LogoTone, string> = {
  gold: "var(--luxury-gold)",
  graphite: "var(--graphite-black)",
  ivory: "var(--warm-ivory)",
  auto: "var(--text-primary)",
};

export interface LogoProps {
  variant?: "wordmark" | "lockup";
  tone?: LogoTone;
  size?: number;
  descender?: string;
  city?: string;
  /** Tent-and-armchair mark asset. Omit to render the wordmark only. */
  markSrc?: string;
  className?: string;
}

export function Logo({
  variant = "wordmark",
  tone = "auto",
  size = 20,
  descender,
  city,
  markSrc,
  className,
}: LogoProps) {
  const color = TONE[tone];

  const word = (
    <span
      style={{
        fontFamily: "var(--font-display)",
        fontWeight: 400,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "0.14em",
        color,
        whiteSpace: "nowrap",
      }}
    >
      TENTVAALE
    </span>
  );

  const sub = (descender || city) && (
    <span style={{ display: "grid", justifyItems: "center", gap: size * 0.14 }}>
      {descender && (
        <span style={{ display: "flex", alignItems: "center", gap: size * 0.22, color }}>
          <span style={{ width: size * 0.5, height: 1, background: "currentColor", opacity: 0.6 }} />
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: size * 0.34,
              letterSpacing: "var(--tracking-label)",
              textTransform: "uppercase",
            }}
          >
            {descender}
          </span>
          <span style={{ width: size * 0.5, height: 1, background: "currentColor", opacity: 0.6 }} />
        </span>
      )}
      {city && (
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: size * 0.28,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color,
            opacity: 0.75,
          }}
        >
          {city}
        </span>
      )}
    </span>
  );

  const mark = markSrc && (
    <Image
      src={markSrc}
      alt=""
      width={Math.round(size * 1.15)}
      height={Math.round(size * 1.15)}
      style={{
        objectFit: "contain",
        display: "block",
        filter: tone === "ivory" || tone === "gold" ? "brightness(0) invert(1) opacity(0.92)" : "none",
      }}
    />
  );

  if (variant === "lockup") {
    return (
      <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: size * 0.5 }}>
        {mark}
        <span style={{ display: "grid", justifyItems: "start", gap: size * 0.16 }}>
          {word}
          {sub}
        </span>
      </span>
    );
  }

  return (
    <span className={className} style={{ display: "grid", justifyItems: "center", gap: size * 0.2 }}>
      {word}
      {sub}
    </span>
  );
}
