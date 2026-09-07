"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Icon } from "@/components/brand";
import { useEnquiry } from "@/features/enquiry/context";
import { computeTotals, CHARGES } from "@/features/enquiry/money";
import { formatRupees } from "@/features/enquiry/seed-data";

export default function QuotePage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = use(params);
  const router = useRouter();
  const { items, accepted, accept } = useEnquiry();
  const totals = computeTotals(items);

  const chargeRows = [
    { label: "Delivery & return", note: "Vadodara metro · two trucks", amount: CHARGES.delivery },
    { label: "Installation & styling", note: "6-person crew, previous evening", amount: CHARGES.install },
    { label: "Dismantle & load-out", note: "Post-event, same night", amount: CHARGES.dismantle },
  ];

  return (
    <main style={{ padding: "28px var(--page-pad) 64px", maxWidth: 1280, width: "100%", margin: "0 auto", flex: 1 }}>
      {accepted && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            padding: "18px 24px",
            marginBottom: 28,
            background: "var(--surface-card)",
            border: "1px solid var(--border-accent)",
            borderRadius: "var(--radius-panel)",
          }}
        >
          <Icon name="check" size="lg" color="var(--accent)" />
          <div style={{ display: "grid", gap: 4 }}>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
              Quote accepted. Booking TV-BKG-1104 is open.
            </span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-secondary)" }}>
              Pieces are reserved on the Vadodara floor. Kavita will confirm the install slot by phone.
            </span>
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 28 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--text-accent)",
            }}
          >
            Quote {ref}
          </span>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: 44,
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
              color: "var(--text-primary)",
            }}
          >
            Sharma Reception
          </h1>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-secondary)" }}>
            Laxmi Vilas Palace, Vadodara · 14 Feb 2027 · 3 days · 400 guests
          </span>
        </div>
        <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
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
            Valid Until
          </span>
          <span style={{ fontFamily: "var(--font-ui)", fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>21 Nov 2026</span>
        </div>
      </div>

      <div className="quote-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.8fr) minmax(260px,1fr)", gap: 28, alignItems: "start" }}>
        <div style={{ background: "var(--surface-card)", border: "var(--card-border)", borderRadius: "var(--radius-panel)", boxShadow: "var(--card-shadow)", overflow: "hidden" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) 52px 96px max-content",
              gap: 16,
              padding: "16px 24px",
              borderBottom: "1px solid var(--border-subtle)",
              fontFamily: "var(--font-ui)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}
          >
            <span>Piece</span>
            <span>Qty</span>
            <span>Status</span>
            <span style={{ textAlign: "right" }}>Amount</span>
          </div>
          {items.map((it, i) => (
            <div
              key={`${it.sku}-${i}`}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) 52px 96px max-content",
                gap: 16,
                padding: "18px 24px",
                borderBottom: "1px solid var(--border-subtle)",
                alignItems: "center",
              }}
            >
              <div style={{ display: "grid", gap: 5 }}>
                <span style={{ fontFamily: "var(--font-ui)", fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{it.name}</span>
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
                  {it.sku} · {it.loc}
                </span>
              </div>
              <span style={{ fontFamily: "var(--font-ui)", fontSize: 15, color: "var(--text-primary)" }}>{it.qty}</span>
              <Badge tone={it.tone} size="sm">
                {it.quoteStatus}
              </Badge>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 18, textAlign: "right", color: "var(--text-primary)" }}>
                {formatRupees(it.rate * it.qty)}
              </span>
            </div>
          ))}
          {chargeRows.map((c) => (
            <div key={c.label} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "16px 24px", borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "grid", gap: 4 }}>
                <span style={{ fontFamily: "var(--font-ui)", fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{c.label}</span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-muted)" }}>{c.note}</span>
              </div>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--text-primary)" }}>{formatRupees(c.amount)}</span>
            </div>
          ))}
        </div>

        <aside
          style={{
            display: "grid",
            gap: 18,
            padding: 24,
            background: "var(--surface-card)",
            border: "var(--card-border)",
            borderRadius: "var(--radius-panel)",
            boxShadow: "var(--card-shadow)",
            position: "sticky",
            top: 24,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--text-accent)",
            }}
          >
            Payable
          </span>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-secondary)" }}>
              <span>Styling &amp; inventory</span>
              <span style={{ color: "var(--text-primary)" }}>{formatRupees(totals.subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-secondary)" }}>
              <span>Logistics &amp; crew</span>
              <span style={{ color: "var(--text-primary)" }}>{formatRupees(totals.logistics)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-secondary)" }}>
              <span>GST 18%</span>
              <span style={{ color: "var(--text-primary)" }}>{formatRupees(totals.gst)}</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
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
              Total
            </span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 34, color: "var(--text-primary)" }}>{formatRupees(totals.total)}</span>
          </div>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 13, lineHeight: 1.6, color: "var(--text-muted)" }}>
            40% on confirmation, balance seven days before install. Refundable damage deposit of {formatRupees(totals.deposit)} billed
            separately.
          </span>
          <Button variant="primary" fullWidth onClick={accept} disabled={accepted}>
            {accepted ? "Accepted" : "Accept Quote"}
          </Button>
          <Button variant="secondary" fullWidth onClick={() => router.push("/enquiry")}>
            Request Changes
          </Button>
        </aside>
      </div>
    </main>
  );
}
