"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMockStore } from "@/mock-data/store";

// Flowstep screen 48 (desktop) — static marketing sections + a real application
// form. No verification queue exists, so submitting instantly flips the signed-in
// account to EventPlanner (see upgradeToEventPlanner in the mock store).
const PERKS = [
  { title: "Multi-Client Workspace", body: "Keep every client's Plan organised in one place." },
  { title: "Trade Pricing", body: "Preferred rates on bundles and long-run bookings." },
  { title: "Priority Support", body: "A dedicated line for quotation turnaround." },
];

const STEPS = [
  { title: "1. Apply", body: "Tell us about your business" },
  { title: "2. Get Verified", body: "We confirm your planner status within 2 business days" },
  { title: "3. Start Planning", body: "Create and share Plans with clients as a co-owner or view-only collaborator." },
];

export default function ForProfessionalsPage() {
  const { currentAccount, upgradeToEventPlanner } = useMockStore();

  const [fullName, setFullName] = useState(currentAccount?.name ?? "");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState(currentAccount?.email ?? "");
  const [phone, setPhone] = useState(currentAccount?.phone ?? "");
  const [years, setYears] = useState("");
  const [about, setAbout] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function scrollToForm() {
    document.getElementById("apply-form")?.scrollIntoView({ behavior: "smooth" });
  }

  function handleSubmit() {
    if (!fullName.trim() || !email.trim()) {
      toast.error("Full name and email are required.");
      return;
    }
    if (currentAccount) upgradeToEventPlanner();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-4 py-24 text-center">
        <CheckCircle2 className="size-12 text-primary" />
        <h1 className="font-serif text-3xl text-foreground">Application Submitted</h1>
        <p className="text-sm leading-6 text-foreground/70">
          {currentAccount
            ? "Your account has been switched to Event Planner. You can now create multi-client Plans and share view-only access with your clients."
            : "Thanks — we'll review your application and follow up by email within 2 business days."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-12 md:px-8">
      <section className="flex flex-col items-center gap-4 border-b border-primary/15 pb-12 text-center">
        <h1 className="font-serif text-5xl text-foreground">For Event Planners &amp; Professionals</h1>
        <p className="max-w-2xl text-base text-foreground/70">Manage multiple clients, get view-only shares, and plan faster with trade pricing.</p>
        <Button className="bg-primary text-primary-foreground" onClick={scrollToForm}>
          Apply for a Planner Account
        </Button>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {PERKS.map((p) => (
          <div key={p.title} className="flex flex-col gap-2 rounded-lg bg-card p-6">
            <h2 className="font-serif text-2xl text-foreground">{p.title}</h2>
            <p className="text-sm leading-6 text-foreground/70">{p.body}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="font-serif text-3xl text-foreground">How It Works</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.title} className="flex flex-col gap-2 border-t border-primary pt-4">
              <h3 className="font-serif text-xl text-primary">{s.title}</h3>
              <p className="text-sm text-foreground/70">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="apply-form" className="rounded-lg bg-card p-8">
        <h2 className="mb-6 font-serif text-3xl text-foreground">Apply for a Planner Account</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-foreground">
            Full Name
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="rounded border border-border bg-background px-4 py-3 text-foreground outline-none" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-foreground">
            Business Name
            <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="rounded border border-border bg-background px-4 py-3 text-foreground outline-none" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-foreground">
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded border border-border bg-background px-4 py-3 text-foreground outline-none" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-foreground">
            Phone
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded border border-border bg-background px-4 py-3 text-foreground outline-none" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-foreground">
            Years in Business
            <select value={years} onChange={(e) => setYears(e.target.value)} className="rounded border border-border bg-background px-4 py-3 text-foreground outline-none">
              <option value="">Select years</option>
              <option value="1-2">1–2 years</option>
              <option value="3-5">3–5 years</option>
              <option value="6-10">6–10 years</option>
              <option value="10+">10+ years</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-foreground md:col-span-2">
            Tell us about your work
            <textarea value={about} onChange={(e) => setAbout(e.target.value)} className="min-h-32 rounded border border-border bg-background px-4 py-3 text-foreground outline-none" />
          </label>
        </div>
        <Button className="mt-6 bg-primary text-primary-foreground" onClick={handleSubmit}>
          Submit Application
        </Button>
      </section>
    </div>
  );
}
