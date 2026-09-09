"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRequireAccount } from "@/features/auth";
import { useMockStore } from "@/mock-data/store";
import { formatRupees } from "@/mock-data/seed";
import type { PlanItem } from "@/mock-data/types";

// Flowstep screen 25 (desktop) — mobile 26 not fetched; stacks naturally.
export default function DirectOrderPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = use(params);
  const account = useRequireAccount();
  const router = useRouter();
  const { getPlan, products, createDirectOrderQuotation } = useMockStore();
  const plan = getPlan(planId);

  const [expanded, setExpanded] = useState<Set<string | null>>(new Set());
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  if (!account) return null;
  if (!plan) return <div className="mx-auto w-full max-w-4xl px-4 py-10">Plan not found.</div>;

  function lineTotal(item: PlanItem) {
    const product = productById.get(item.productId);
    if (!product) return 0;
    return product.basePrice * (item.dimensions?.length ?? item.quantity);
  }

  const groups: { key: string | null; label: string; items: typeof plan.items }[] = [
    ...plan.subEvents.map((se) => ({ key: se.id as string | null, label: se.name, items: plan.items.filter((it) => it.subEventId === se.id) })),
    { key: null, label: "General / Untagged", items: plan.items.filter((it) => it.subEventId === null) },
  ].filter((g) => g.items.length > 0);

  const total = plan.items.reduce((sum, it) => sum + lineTotal(it), 0);

  function toggleExpanded(key: string | null) {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleProceed() {
    const quotation = createDirectOrderQuotation(planId);
    router.push(`/checkout/${quotation.id}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 pb-28 md:px-8 md:py-10">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/">Home</Link>
        <ChevronRight className="size-4" />
        <Link href="/plans">My Plans</Link>
        <ChevronRight className="size-4" />
        <Link href={`/plans/${planId}`}>{plan.name}</Link>
        <ChevronRight className="size-4" />
        <span className="text-foreground">Direct Order</span>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">Review your order</h1>
        <p className="text-sm text-muted-foreground">
          {plan.name} · {plan.subEvents[0]?.eventDate ?? "No date set"}
        </p>
      </div>

      <section className="flex flex-col gap-4">
        {groups.map((g) => (
          <div key={g.key ?? "general"} className="rounded-xl border border-primary/35 bg-card">
            <button className="flex w-full items-center justify-between px-6 py-5 text-left" onClick={() => toggleExpanded(g.key)}>
              <span className="font-serif text-xl text-foreground">{g.label}</span>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span>{g.items.length} items</span>
                <span className="text-primary">{formatRupees(g.items.reduce((sum, it) => sum + lineTotal(it), 0))}</span>
                <ChevronDown className={cn("size-5 text-primary transition-transform", expanded.has(g.key) && "rotate-180")} />
              </div>
            </button>
            {expanded.has(g.key) && (
              <div className="flex flex-col gap-2 border-t border-primary/20 px-6 py-4">
                {g.items.map((it) => {
                  const product = productById.get(it.productId);
                  return (
                    <div key={it.id} className="flex justify-between text-sm text-muted-foreground">
                      <span>{product?.name}</span>
                      <span>{formatRupees(lineTotal(it))}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-primary/50 bg-card p-8">
        <span className="font-serif text-3xl text-primary">Payable Now: {formatRupees(total)}</span>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Full amount collected upfront. No negotiation step — this order proceeds directly to payment.
        </p>
      </section>

      <footer className="fixed inset-x-0 bottom-0 z-30 flex justify-end gap-4 border-t border-border bg-background px-4 py-4 md:px-8">
        <Button variant="outline" className="rounded-lg border-primary text-primary" nativeButton={false} render={<Link href={`/plans/${planId}`}>Back</Link>} />
        <Button className="rounded-lg bg-primary text-primary-foreground" onClick={handleProceed}>
          Proceed to Payment
        </Button>
      </footer>
    </div>
  );
}
