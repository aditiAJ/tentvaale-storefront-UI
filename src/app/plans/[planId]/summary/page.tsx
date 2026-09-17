"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductThumb } from "@/components/product-thumb";
import { useRequireAccount } from "@/features/auth";
import { canSubmitPlan, useMockStore } from "@/mock-data/store";
import { getProductUsage, needsSharingDecision, requiredQuantity } from "@/mock-data/inventory-sharing";
import { formatEventDateRange } from "@/mock-data/seed";

// Plan Board redesign, screen 5 (Plan Summary) — the final checklist a
// customer signs off on before Submit for Quotation / Direct Order. Every
// quantity here is exactly what the customer declared on the Inventory view
// (stacked by default until they say otherwise) — never framed as system-
// calculated, and never touches availability/stock language.
//
// Scope note: this Required Quantity is a planning-only figure. Submit for
// Quotation / Direct Order still price and request every PlanItem line
// individually, unaffected by a Shared decision — collapsing billed quantity
// based on a self-declared reuse would be a real pricing/fulfillment change
// the brief didn't ask for ("planning tool only"; no availability checking
// exists to verify reuse is actually deliverable). Flagged, not silently
// wired in.
export default function PlanSummaryPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = use(params);
  const account = useRequireAccount();
  const { getPlan, products } = useMockStore();
  const plan = getPlan(planId);

  if (!account) return null;
  if (!plan) return <div className="mx-auto w-full max-w-4xl py-10 page-x">Plan not found.</div>;

  const canSubmit = canSubmitPlan(plan, account.id);
  const usage = getProductUsage(plan, products);
  const decisions = plan.itemSharing ?? {};
  const startDate = plan.eventStartDate ?? plan.subEvents[0]?.eventDate;

  return (
    <div className="mx-auto w-full max-w-4xl pt-6 pb-28 page-x">
      <Link href={`/plans/${planId}`} className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" /> Back to {plan.name}
      </Link>

      <div className="mt-4 flex flex-col gap-2 border-b border-border pb-6">
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">Plan Summary</h1>
        <p className="text-sm text-muted-foreground">
          {plan.name} · {formatEventDateRange(startDate, plan.eventEndDate)}
          {plan.venue ? ` · ${plan.venue}` : ""}
        </p>
      </div>

      {usage.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No items added yet. Add inventory from a sub-event to see your checklist here.
        </p>
      ) : (
        <section className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
          <div className="hidden grid-cols-[2fr_1fr_1fr] gap-4 border-b border-border px-5 py-3 text-xs tracking-wider text-muted-foreground uppercase md:grid">
            <span>Item</span>
            <span>Used across</span>
            <span className="text-right">Required Quantity</span>
          </div>
          {usage.map((u) => {
            const decision = decisions[u.productId];
            const undecided = needsSharingDecision(u) && !decision;
            const qty = requiredQuantity(u, decision);
            const subEventNames = [...new Set(u.occurrences.map((o) => o.subEventName))];
            return (
              <div key={u.productId} className="flex flex-col gap-2 border-b border-border p-4 last:border-b-0 md:grid md:grid-cols-[2fr_1fr_1fr] md:items-center md:gap-4 md:px-5 md:py-4">
                <span className="flex items-center gap-3">
                  <ProductThumb imageUrl={u.product.imageUrl} alt={u.product.name} className="size-10 shrink-0" />
                  <span className="text-sm text-foreground">{u.product.name}</span>
                </span>
                <span className="text-sm text-muted-foreground">{subEventNames.join(", ")}</span>
                <span className="flex flex-col md:items-end">
                  <span className="font-serif text-lg text-primary">{qty}</span>
                  {undecided && <span className="text-xs text-muted-foreground">Not yet confirmed as Shared or Dedicated</span>}
                </span>
              </div>
            );
          })}
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 flex justify-end gap-4 border-t border-border bg-background px-4 py-4 md:px-8">
        {canSubmit ? (
          <>
            <Button
              variant="outline"
              className="rounded-lg border-primary text-primary"
              disabled={plan.items.length === 0}
              nativeButton={false}
              render={<Link href={`/plans/${planId}/submit`}>Submit for Quotation</Link>}
            />
            <Button
              className="rounded-lg bg-primary text-primary-foreground"
              disabled={plan.items.length === 0}
              nativeButton={false}
              render={<Link href={`/plans/${planId}/direct-order`}>Direct Order (Pay Now)</Link>}
            />
          </>
        ) : (
          <span className="text-sm text-muted-foreground">View-only access — ask the plan owner to submit or order.</span>
        )}
      </div>
    </div>
  );
}
