"use client";

import { Badge } from "@/components/brand";
import { formatRupees } from "../seed-data";
import type { EnquiryItem } from "../types";

export function EnquiryItemCard({
  item,
  showOpsCodes,
  onInc,
  onDec,
  onRemove,
}: {
  item: EnquiryItem;
  showOpsCodes: boolean;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
}) {
  return (
    <article
      style={{
        display: "grid",
        gridTemplateColumns: "132px minmax(0,1fr)",
        gap: 24,
        padding: 18,
        background: "var(--surface-card)",
        border: "var(--card-border)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <div
        role="img"
        aria-label={item.name}
        style={{
          backgroundColor: "var(--pure-white)",
          backgroundImage: `url(${item.img})`,
          backgroundSize: "78% auto",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          borderRadius: 6,
          aspectRatio: "1",
        }}
      />
      <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start", flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: 22, fontWeight: 600, color: "var(--text-primary)" }}>
              {item.name}
            </span>
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
              }}
            >
              {item.tier}
            </span>
          </div>
          <Badge tone={item.tone}>{item.availText}</Badge>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
            paddingTop: 12,
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              onClick={onDec}
              style={{
                width: 44,
                height: 44,
                display: "grid",
                placeItems: "center",
                borderRadius: 6,
                background: "transparent",
                border: "1px solid var(--border-strong)",
                color: "var(--text-primary)",
                cursor: "pointer",
                fontSize: 18,
              }}
            >
              −
            </button>
            <span style={{ minWidth: 56, textAlign: "center", fontFamily: "var(--font-ui)", fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>
              {item.qty}
            </span>
            <button
              type="button"
              onClick={onInc}
              style={{
                width: 44,
                height: 44,
                display: "grid",
                placeItems: "center",
                borderRadius: 6,
                background: "transparent",
                border: "1px solid var(--border-strong)",
                color: "var(--text-primary)",
                cursor: "pointer",
                fontSize: 18,
              }}
            >
              +
            </button>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
              {item.unit}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--text-primary)" }}>
              {formatRupees(item.rate * item.qty)}
            </span>
            <button
              type="button"
              onClick={onRemove}
              style={{
                minHeight: 44,
                padding: "0 4px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-ui)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
              }}
            >
              Remove
            </button>
          </div>
        </div>
        {showOpsCodes && (
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: 11,
              letterSpacing: "0.06em",
              color: "var(--text-muted)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.sku} · {item.loc}
          </span>
        )}
      </div>
    </article>
  );
}
