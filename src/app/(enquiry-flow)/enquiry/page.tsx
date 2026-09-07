"use client";

import { useRouter } from "next/navigation";
import { Button, Input, Select } from "@/components/brand";
import { useEnquiry } from "@/features/enquiry/context";
import { EnquiryItemCard } from "@/features/enquiry/components/EnquiryItemCard";
import { computeTotals } from "@/features/enquiry/money";
import { formatRupees } from "@/features/enquiry/seed-data";

const CITIES = ["Vadodara", "Ahmedabad", "Surat", "Udaipur", "Mumbai"];
const DURATIONS = ["3 days (standard)", "1 day", "5 days", "7 days"];

export default function EnquiryBasketPage() {
  const router = useRouter();
  const { items, setQty, removeItem, restoreItems } = useEnquiry();
  const totals = computeTotals(items);
  const isEmpty = items.length === 0;

  return (
    <main style={{ padding: "28px var(--page-pad) 64px", maxWidth: 1440, width: "100%", margin: "0 auto", flex: 1 }}>
      <div style={{ display: "grid", gap: 8, marginBottom: 32 }}>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: 48,
            lineHeight: 1.1,
            letterSpacing: "-0.01em",
            color: "var(--text-primary)",
          }}
        >
          Your enquiry
        </h1>
        <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: 16, lineHeight: 1.6, color: "var(--text-secondary)" }}>
          Four pieces held for review. We confirm availability, then quote. No payment now.
        </p>
      </div>

      <div className="enquiry-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.7fr) minmax(260px,1fr)", gap: 28, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 14 }}>
          {items.map((it, i) => (
            <EnquiryItemCard
              key={`${it.sku}-${i}`}
              item={it}
              showOpsCodes
              onInc={() => setQty(i, 1)}
              onDec={() => setQty(i, -1)}
              onRemove={() => removeItem(i)}
            />
          ))}
          {isEmpty && (
            <div
              style={{
                display: "grid",
                gap: 16,
                justifyItems: "start",
                padding: 48,
                background: "var(--surface-card)",
                border: "var(--card-border)",
                borderRadius: "var(--radius-card)",
              }}
            >
              <span style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--text-primary)" }}>
                Nothing held yet.
              </span>
              <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.6, color: "var(--text-secondary)", maxWidth: "44ch" }}>
                Browse the curated setups and add the pieces you want us to price.
              </p>
              <Button variant="secondary" onClick={restoreItems}>
                Explore Collections
              </Button>
            </div>
          )}
        </div>

        <aside
          style={{
            display: "grid",
            gap: 20,
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
            Enquiry Summary
          </span>
          <div style={{ display: "grid", gap: 14 }}>
            <Input label="Event Date" icon="calendar-days" placeholder="DD / MM / YYYY" defaultValue="14 / 02 / 2027" />
            <Select label="City" icon="map-pin" options={CITIES} />
            <Select label="Styling Duration" icon="clock" options={DURATIONS} />
          </div>
          <div style={{ display: "grid", gap: 10, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-secondary)" }}>
              <span>Pieces</span>
              <span style={{ color: "var(--text-primary)" }}>{totals.pieceCount}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-secondary)" }}>
              <span>Line items</span>
              <span style={{ color: "var(--text-primary)" }}>{totals.count}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", paddingTop: 10 }}>
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
                Indicative Total
              </span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "var(--text-primary)" }}>
                {formatRupees(totals.subtotal)}
              </span>
            </div>
          </div>
          <Button variant="primary" fullWidth iconAfter="arrow-right" onClick={() => router.push("/enquiry/details")}>
            Continue to Details
          </Button>
          <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: 13, lineHeight: 1.6, color: "var(--text-muted)" }}>
            Indicative only. Delivery, installation and dismantle are priced on the venue, and confirmed in your quote.
          </p>
        </aside>
      </div>
    </main>
  );
}
