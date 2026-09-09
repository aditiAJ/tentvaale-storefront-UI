"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRequireAccount } from "@/features/auth";
import { useMockStore } from "@/mock-data/store";
import { formatRupees } from "@/mock-data/seed";
import type { PlanItem } from "@/mock-data/types";

// Flowstep screen 23 (desktop) — mobile 24 not fetched; layout stacks naturally at this size.
export default function SubmitForQuotationPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = use(params);
  const account = useRequireAccount();
  const router = useRouter();
  const { getPlan, products, submitPlanForQuotation } = useMockStore();
  const plan = getPlan(planId);

  const [granularity, setGranularity] = useState<"Plan" | "PerSubEvent">("Plan");
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

  function handleSubmit() {
    try {
      const quotations = submitPlanForQuotation(planId, granularity);
      toast.success(`Submitted — ${quotations.length} quotation${quotations.length === 1 ? "" : "s"} created`);
      router.push(`/quotations/${quotations[0].id}`);
    } catch {
      toast.error("Only the plan owner can submit for quotation.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 pb-28 md:px-8 md:py-10">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/">Home</Link>
        <ChevronRight className="size-4" />
        <Link href="/plans">My Plans</Link>
        <ChevronRight className="size-4" />
        <Link href={`/plans/${planId}`}>{plan.name}</Link>
        <ChevronRight className="size-4" />
        <span className="text-foreground">Submit for Quotation</span>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">Review before you submit</h1>
        <p className="text-sm text-muted-foreground">
          {plan.name} <span className="px-2">•</span> {plan.subEvents[0]?.eventDate ?? "No date set"}
        </p>
      </div>

      <section className="flex items-start gap-4 rounded-lg border-l-4 border-primary bg-card p-6">
        <Info className="size-5 shrink-0 text-primary" />
        <p className="text-sm leading-6 text-foreground">
          Submitting creates a formal quotation request. Our team will review pricing and availability for each item, and you&apos;ll be
          notified when a response is ready. You will not be charged now.
        </p>
      </section>

      <section className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
        <span className="text-sm font-medium text-foreground">Quotation format</span>
        <div className="flex rounded-lg border border-primary p-1">
          <button
            className={cn("rounded-md px-3 py-1.5 text-sm", granularity === "Plan" ? "bg-primary text-primary-foreground" : "text-foreground")}
            onClick={() => setGranularity("Plan")}
          >
            One combined quotation
          </button>
          <button
            className={cn("rounded-md px-3 py-1.5 text-sm", granularity === "PerSubEvent" ? "bg-primary text-primary-foreground" : "text-foreground")}
            onClick={() => setGranularity("PerSubEvent")}
            disabled={plan.subEvents.length === 0}
          >
            Per sub-event quotations
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-foreground">Plan summary</h2>
          <span className="text-sm text-muted-foreground">{plan.items.length} items</span>
        </div>
        {groups.map((g) => (
          <div key={g.key ?? "general"} className="rounded-lg border border-border bg-card p-6">
            <button className="flex w-full items-center justify-between" onClick={() => toggleExpanded(g.key)}>
              <div className="text-left">
                <h3 className="font-serif text-xl text-foreground">{g.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{g.items.length} items</p>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-lg text-primary">{formatRupees(g.items.reduce((sum, it) => sum + lineTotal(it), 0))}</span>
                <ChevronDown className={cn("size-5 text-muted-foreground transition-transform", expanded.has(g.key) && "rotate-180")} />
              </div>
            </button>
            {expanded.has(g.key) && (
              <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
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

      <div className="flex items-end justify-between border-t border-border pt-6">
        <p className="text-sm text-muted-foreground">Final pricing confirmed by our team during review.</p>
        <p className="font-serif text-3xl text-primary">Estimated Total: {formatRupees(total)}</p>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-30 flex justify-end gap-4 border-t border-border bg-background px-4 py-4 md:px-8">
        <Button variant="outline" className="rounded-lg border-primary text-primary" nativeButton={false} render={<Link href={`/plans/${planId}`}>Back</Link>} />
        <Button className="rounded-lg bg-primary text-primary-foreground" onClick={handleSubmit}>
          Confirm &amp; Submit
        </Button>
      </footer>
    </div>
  );
}
