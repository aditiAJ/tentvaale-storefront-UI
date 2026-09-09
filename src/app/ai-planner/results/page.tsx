"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductThumb } from "@/components/product-thumb";
import { useRequireAccount } from "@/features/auth";
import { useMockStore } from "@/mock-data/store";
import { AI_PLAN_SUGGESTIONS, BUNDLES, PRODUCTS, formatRupees } from "@/mock-data/seed";

interface SuggestionCard {
  key: string;
  kind: "product" | "bundle";
  id: string;
  name: string;
  imageUrl?: string;
  price: number;
}

// Flowstep screens 44 (desktop) / 45 (mobile) — same suggestion list, desktop's
// 3-col grid collapses to the mobile single column responsively.
export default function AiPlannerResultsPage() {
  return (
    <Suspense fallback={null}>
      <AiPlannerResults />
    </Suspense>
  );
}

function AiPlannerResults() {
  const account = useRequireAccount();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createPlan, addPlanItem, addBundleToPlan } = useMockStore();

  const eventType = searchParams.get("eventType") ?? "Wedding";
  const guests = searchParams.get("guests") ?? "250";
  const budgetMin = searchParams.get("budgetMin") ?? "50,000";
  const budgetMax = searchParams.get("budgetMax") ?? "2,00,000";
  const keywords = (searchParams.get("keywords") ?? "").split(",").filter(Boolean);
  const eventDate = searchParams.get("eventDate") ?? "";

  const cards: SuggestionCard[] = useMemo(
    () =>
      AI_PLAN_SUGGESTIONS.map((s) => {
        if (s.kind === "bundle") {
          const bundle = BUNDLES.find((b) => b.id === s.id)!;
          const price = bundle.includedProductIds.reduce((sum, pid) => sum + (PRODUCTS.find((p) => p.id === pid)?.basePrice ?? 0), 0);
          return { key: `bundle-${bundle.id}`, kind: "bundle" as const, id: bundle.id, name: "Amber Dunes Lounge Package", imageUrl: bundle.imageUrl, price };
        }
        const product = PRODUCTS.find((p) => p.id === s.id)!;
        return { key: `product-${product.id}`, kind: "product" as const, id: product.id, name: product.name, imageUrl: product.imageUrl, price: product.basePrice };
      }),
    [],
  );

  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [planId, setPlanId] = useState<string | null>(null);
  const createdRef = useRef(false);

  useEffect(() => {
    if (!account || createdRef.current) return;
    createdRef.current = true;
    const label = eventDate ? new Date(eventDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "";
    const plan = createPlan(label ? `${eventType} — ${label}` : `${eventType} Plan`);
    setPlanId(plan.id);
  }, [account, createPlan, eventType, eventDate]);

  if (!account) return null;

  const visible = cards.filter((c) => !dismissed.has(c.key));
  const total = visible.reduce((sum, c) => sum + c.price, 0);

  function addCard(card: SuggestionCard) {
    if (!planId) return;
    if (card.kind === "bundle") addBundleToPlan(planId, card.id);
    else addPlanItem(planId, { productId: card.id, quantity: 1, subEventId: null });
    setAdded((s) => new Set(s).add(card.key));
    toast.success(`Added ${card.name} to plan.`);
  }

  function addAll() {
    if (!planId) return;
    for (const card of visible) {
      if (added.has(card.key)) continue;
      if (card.kind === "bundle") addBundleToPlan(planId, card.id);
      else addPlanItem(planId, { productId: card.id, quantity: 1, subEventId: null });
    }
    toast.success("Added all suggestions to your plan.");
    router.push(`/plans/${planId}`);
  }

  function editPreferences() {
    router.push(`/ai-planner?${searchParams.toString()}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-8 md:py-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-3xl text-foreground md:text-4xl">Your AI-Suggested Plan</h1>
          <p className="text-sm text-foreground/70">
            Based on: {eventType} · {guests} guests · ₹{budgetMin}–₹{budgetMax}
            {keywords.length > 0 && ` · ${keywords.join(", ")}`}
            {eventDate && ` · ${new Date(eventDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}`}
          </p>
        </div>
        <button onClick={editPreferences} className="w-fit rounded border border-primary px-4 py-2 text-sm text-primary">
          Edit Preferences
        </button>
      </header>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((card) => (
          <div key={card.key} className="flex flex-col overflow-hidden rounded-lg border border-primary/20 bg-card">
            <div className="relative h-48">
              <ProductThumb imageUrl={card.imageUrl} alt={card.name} className="size-full" />
              <span className="absolute top-3 left-3 rounded-full border border-primary bg-card/90 px-3 py-1 text-xs text-primary">AI Suggested</span>
              <button
                className="absolute top-3 right-3 rounded-full bg-card/90 p-1 text-foreground/80"
                onClick={() => setDismissed((s) => new Set(s).add(card.key))}
                aria-label={`Dismiss ${card.name}`}
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-4 p-4">
              <div className="flex flex-col gap-1">
                <h2 className="font-serif text-xl text-foreground">{card.name}</h2>
                <p className="text-sm text-foreground/70">From {formatRupees(card.price)}</p>
              </div>
              {added.has(card.key) ? (
                <span className="mt-auto flex items-center justify-center gap-2 rounded border border-primary/40 px-4 py-2 text-sm text-primary">
                  <Check className="size-4" /> Added
                </span>
              ) : (
                <button className="mt-auto rounded border border-primary px-4 py-2 text-sm text-primary" onClick={() => addCard(card)}>
                  Add to Plan
                </button>
              )}
            </div>
          </div>
        ))}
        {visible.length === 0 && <p className="text-sm text-muted-foreground">All suggestions dismissed. Start over to see new ones.</p>}
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-primary/20 bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-base text-foreground">Total if all added: {formatRupees(total)} (indicative)</p>
        <div className="flex items-center gap-4">
          <Button className="bg-primary text-primary-foreground" onClick={addAll} disabled={visible.length === 0}>
            Add All Suggestions to Plan
          </Button>
          <button className="rounded border border-primary px-5 py-3 text-sm text-primary" onClick={() => router.push("/ai-planner")}>
            Start Over
          </button>
        </div>
      </section>
    </div>
  );
}
