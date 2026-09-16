"use client";

import { useRouter } from "next/navigation";
import { Button, Input, Select } from "@/components/brand";
import { useEnquiry } from "@/features/enquiry/context";

const OCCASIONS = ["Reception", "Haldi", "Mehendi", "Wedding", "Cocktail", "Corporate", "Social"];
const GUESTS = ["400", "100", "200", "600", "1000+"];
const WINDOWS = ["Previous evening, 6–11 pm", "Same day, 6–11 am", "Two days prior"];
const VOLUMES = ["12–24", "1–5", "6–12", "25+"];

// Segmented "Enquiring As" option button — the design system doesn't have a
// packaged component for this, it's inlined in the prototype markup too.
function segmentStyle(active: boolean): React.CSSProperties {
  return {
    flex: "1 1 240px",
    minHeight: 56,
    textAlign: "left",
    padding: "0 20px",
    borderRadius: 6,
    cursor: "pointer",
    background: active ? "var(--ivory-200)" : "var(--surface-card)",
    border: `1px solid ${active ? "var(--border-accent)" : "var(--border-strong)"}`,
    color: active ? "var(--text-primary)" : "var(--text-secondary)",
    fontFamily: "var(--font-ui)",
    fontSize: 14,
    fontWeight: 600,
  };
}

export default function EnquiryDetailsPage() {
  const router = useRouter();
  const { pro, setPro } = useEnquiry();

  return (
    <main style={{ padding: "28px var(--page-pad) 64px", maxWidth: 1120, width: "100%", margin: "0 auto", flex: 1 }}>
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
          Event details
        </h1>
        <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: 16, lineHeight: 1.6, color: "var(--text-secondary)" }}>
          Enough for our crew to plan the install. Nothing more.
        </p>
      </div>

      <div style={{ display: "grid", gap: 28 }}>
        <div style={{ display: "grid", gap: 12 }}>
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
            Enquiring As
          </span>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="button" onClick={() => setPro(false)} style={segmentStyle(!pro)}>
              Planning my own event
            </button>
            <button type="button" onClick={() => setPro(true)} style={segmentStyle(pro)}>
              Planner or event agency
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 18 }}>
          <Input label="Event Name" placeholder="Sharma Reception" />
          <Select label="Occasion" icon="crown" options={OCCASIONS} />
          <Select label="Guest Count" icon="users" options={GUESTS} />
          <Input label="Venue" icon="map-pin" placeholder="Laxmi Vilas Palace, Vadodara" />
          <Input label="Event Date" icon="calendar-days" defaultValue="14 / 02 / 2027" />
          <Select label="Install Window" icon="clock" options={WINDOWS} />
        </div>

        {pro && (
          <div style={{ display: "grid", gap: 18, padding: 24, background: "var(--surface-sunken)", borderRadius: "var(--radius-panel)" }}>
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
              Trade Account
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 18 }}>
              <Input label="Company" placeholder="Studio name" />
              <Input label="GSTIN" placeholder="24AAAAA0000A1Z5" />
              <Select label="Events Per Year" options={VOLUMES} />
            </div>
            <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)" }}>
              Trade enquiries are quoted with your standing rates and a dedicated stylist.
            </p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 18 }}>
          <Input label="Contact Name" icon="user" placeholder="Full name" />
          <Input label="Phone" icon="phone" placeholder="+91" />
          <Input label="Email" icon="mail" placeholder="name@studio.com" />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label
            htmlFor="notes"
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}
          >
            Anything We Should Know
          </label>
          <textarea
            id="notes"
            rows={4}
            placeholder="Access, lift dimensions, stage height, timings."
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 6,
              background: "var(--surface-card)",
              border: "1px solid var(--border-strong)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
              fontSize: 15,
              lineHeight: 1.6,
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", paddingTop: 8, borderTop: "1px solid var(--border-subtle)" }}>
          <Button variant="primary" iconAfter="arrow-right" onClick={() => router.push("/enquiry/received")}>
            Submit Enquiry
          </Button>
          <Button variant="ghost" icon="arrow-left" onClick={() => router.push("/enquiry")}>
            Back to Enquiry
          </Button>
        </div>
      </div>
    </main>
  );
}
