"use client";

import { useRouter } from "next/navigation";
import { Badge, Button } from "@/components/brand";
import { useEnquiry } from "@/features/enquiry/context";
import { Tracker } from "@/features/enquiry/components/Tracker";
import { computeTotals } from "@/features/enquiry/money";

export default function EnquiryReceivedPage() {
  const router = useRouter();
  const { items } = useEnquiry();
  const { pieceCount } = computeTotals(items);

  const facts: [string, string, boolean?][] = [
    ["Reference", "TV-ENQ-2618"],
    ["Event Date", "14 Feb 2027"],
    ["Pieces Held", String(pieceCount)],
    ["Hold Expires", "In 72 hours", true],
  ];

  return (
    <main style={{ padding: 48, maxWidth: 1000, width: "100%", margin: "0 auto", flex: 1, display: "grid", gap: 36, alignContent: "start" }}>
      <div style={{ display: "grid", gap: 14, justifyItems: "start" }}>
        <Badge tone="gold">Enquiry Received</Badge>
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
          We have your scene. Now we price it.
        </h1>
        <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: 16, lineHeight: 1.6, color: "var(--text-secondary)", maxWidth: "56ch" }}>
          Kavita Rao is your stylist for this event. She checks the pieces against the Vadodara floor and sends a full
          quote within one working day.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: 32,
          flexWrap: "wrap",
          padding: 24,
          background: "var(--surface-card)",
          border: "var(--card-border)",
          borderRadius: "var(--radius-panel)",
          boxShadow: "var(--card-shadow)",
        }}
      >
        {facts.map(([label, value, accent]) => (
          <div key={label} style={{ display: "grid", gap: 6 }}>
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
              {label}
            </span>
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: 20,
                fontWeight: 600,
                color: accent ? "var(--text-accent)" : "var(--text-primary)",
              }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      <Tracker completedCount={2} />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Button variant="primary" iconAfter="arrow-right" onClick={() => router.push("/quote/TV-QTE-2618-A")}>
          View Quote
        </Button>
        <Button variant="secondary" iconAfter="message-circle">
          Talk to an Expert
        </Button>
      </div>
    </main>
  );
}
