"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { TopNav, Icon } from "@/components/brand";
import { EnquiryProvider, useEnquiry } from "@/features/enquiry/context";
import { StepRail } from "@/features/enquiry/components/StepRail";
import { EnquiryFooter } from "@/features/enquiry/components/EnquiryFooter";

const STEP_BY_PATH: Record<string, number> = {
  "/enquiry": 0,
  "/enquiry/details": 1,
  "/enquiry/received": 2,
};

// The prototype's day/night pill is a review affordance, not a product
// feature (per the handoff README) — kept here only until the site's real
// theme mechanism exists to drive `data-theme` instead.
function ThemeToggle({ theme, onToggle }: { theme: "day" | "night"; onToggle: () => void }) {
  const night = theme === "night";
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        minHeight: 44,
        padding: "0 16px",
        borderRadius: 6,
        background: "transparent",
        border: "1px solid var(--border-subtle)",
        cursor: "pointer",
        fontFamily: "var(--font-ui)",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--text-muted)",
      }}
    >
      <Icon name={night ? "moon" : "sun"} size="sm" color="currentColor" />
      {night ? "Nighttime" : "Daytime"}
    </button>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { items } = useEnquiry();
  const [theme, setTheme] = useState<"day" | "night">("day");
  const step = pathname.startsWith("/quote") ? 3 : (STEP_BY_PATH[pathname] ?? 0);

  return (
    <div data-theme={theme} style={{ background: "var(--surface-page)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <TopNav
        items={["Collections", "Products", "Inspiration", "The Studio", "For Professionals"]}
        active="Collections"
        cartCount={items.length}
        showMark
        markSrc="/brand/logo/tentvaale-logo-mark.png"
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
          padding: "20px var(--page-pad) 0",
          maxWidth: 1440,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <StepRail current={step} />
        <ThemeToggle theme={theme} onToggle={() => setTheme(theme === "day" ? "night" : "day")} />
      </div>
      {children}
      <EnquiryFooter />
    </div>
  );
}

export default function EnquiryFlowLayout({ children }: { children: React.ReactNode }) {
  return (
    <EnquiryProvider>
      <Shell>{children}</Shell>
    </EnquiryProvider>
  );
}
