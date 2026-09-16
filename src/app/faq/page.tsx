"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

// Flowstep screen 50 (desktop) — the design only fully wrote out one answer and
// left the rest as collapsed placeholders; the remaining answers here are
// written to match this app's actual mock behavior (Plan/Quotation/Order flows,
// cancellation policy) rather than invented copy.
interface FaqItem {
  q: string;
  a: string;
}

const SECTIONS: { title: string; items: FaqItem[] }[] = [
  {
    title: "Ordering & Plans",
    items: [
      {
        q: "What is a Plan?",
        a: "A Plan is your event workspace where you organise items by sub-event (like Day 1 Sangeet or Day 2 Wedding) before submitting for quotation or ordering directly.",
      },
      {
        q: "Can I have multiple Plans at once?",
        a: "Yes — create as many Draft Plans as you like from My Plans. Each one holds its own sub-events and items independently.",
      },
      {
        q: "What is the difference between Submit for Quotation and Direct Order?",
        a: "Submit for Quotation sends your Plan to our team for pricing and availability review, in one or more rounds, before you accept and pay. Direct Order skips negotiation and books everything in the Plan immediately at listed prices.",
      },
    ],
  },
  {
    title: "Payments & Refunds",
    items: [
      { q: "Is the rental charge refundable?", a: "No — the rental charge is non-refundable once an order is confirmed." },
      {
        q: "How does the security deposit refund work?",
        a: "It's refunded immediately if you cancel before the event date. If you cancel after the event date, it enters \"Pending Review\" while our team inspects for damage before releasing it.",
      },
      {
        q: "What payment methods are accepted?",
        a: "Cards, UPI and netbanking via Razorpay at checkout, covering the rental charge and refundable security deposit in one payment.",
      },
    ],
  },
  {
    title: "Delivery & Setup",
    items: [
      { q: "Do you handle setup and installation?", a: "Yes — delivery, installation and pack-down are included for every order. Track status from your Order page." },
      {
        q: "Can delivery be split across event days?",
        a: "Yes — items tagged to different sub-events in a multi-day Plan are delivered against their own event dates.",
      },
    ],
  },
  {
    title: "Accounts & Collaboration",
    items: [
      {
        q: "What is a co-owner vs a view-only planner?",
        a: "A co-owner can edit the Plan — add or remove items, submit it for quotation. A view-only planner can see everything but can't make changes.",
      },
      { q: "How do I invite someone to my Plan?", a: "Open the Plan, then add their email as a co-owner or view-only planner from the sharing section." },
    ],
  },
];

export default function FaqPage() {
  const [query, setQuery] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTIONS;
    return SECTIONS.map((s) => ({ ...s, items: s.items.filter((i) => i.q.toLowerCase().includes(q) || i.a.toLowerCase().includes(q)) })).filter(
      (s) => s.items.length > 0,
    );
  }, [query]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 md:px-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="font-serif text-4xl text-foreground">Frequently Asked Questions</h1>
        <div className="relative w-full max-w-xl">
          <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-primary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search FAQs..."
            className="w-full rounded-sm border border-primary bg-card py-3 pr-4 pl-11 text-sm text-foreground outline-none"
          />
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-8">
        {filteredSections.map((section) => (
          <section key={section.title} className="flex flex-col gap-4">
            <h2 className="font-serif text-2xl text-foreground">{section.title}</h2>
            <div className="flex flex-col gap-2">
              {section.items.map((item) => {
                const key = `${section.title}-${item.q}`;
                const open = openKey === key;
                return (
                  <div key={key} className="rounded-lg border border-primary bg-card">
                    <button
                      className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-foreground"
                      onClick={() => setOpenKey(open ? null : key)}
                    >
                      <span>{item.q}</span>
                      <ChevronDown className={`size-4 shrink-0 text-primary transition-transform ${open ? "rotate-180" : ""}`} />
                    </button>
                    {open && <div className="border-t border-primary/40 px-4 pt-3 pb-4 text-sm leading-6 text-foreground/75">{item.a}</div>}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        {filteredSections.length === 0 && <p className="text-center text-sm text-muted-foreground">No FAQs match &quot;{query}&quot;.</p>}
      </div>
    </div>
  );
}
