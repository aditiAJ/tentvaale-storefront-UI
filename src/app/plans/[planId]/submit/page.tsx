"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, ChevronDown, ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/services/api-client";
import { cn } from "@/lib/utils";
import { useRequireAccount } from "@/features/auth";
import { lineQuantity, planGroupLabel, quoteBlocker, type BoardItem } from "@/features/plans/board";
import { useBoard } from "@/features/plans/hooks";
import { planKeys } from "@/features/plans/api";
import { submitPlanForQuotation, type QuotationRequest } from "@/features/plans/quotation-request";
import { formatEventDate, formatRupees } from "@/mock-data/seed";

// Flowstep screen 23 (desktop). One plan becomes one quotation request: the vendor prices the whole
// plan, function by function, and sends the quotation back.
export default function SubmitForQuotationPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = use(params);
  const account = useRequireAccount();
  const queryClient = useQueryClient();
  const { board: plan, query } = useBoard(planId);

  const [expanded, setExpanded] = useState<Set<string | null>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<QuotationRequest | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const productById = useMemo(() => new Map((plan?.products ?? []).map((p) => [p.id, p])), [plan]);

  if (!account) return null;
  if (query.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-10 page-x">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (!plan) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 py-24 text-center page-x">
        <h1 className="font-serif text-2xl text-foreground">Plan not found</h1>
        <Button variant="outline" nativeButton={false} render={<Link href="/plans">All plans</Link>} />
      </div>
    );
  }

  const lineTotal = (item: BoardItem) => (productById.get(item.productId)?.basePrice ?? 0) * lineQuantity(item);
  const groupLabel = planGroupLabel(plan);
  const groups: { key: string | null; label: string; items: BoardItem[] }[] = [
    ...plan.subEvents.map((se) => ({ key: se.id as string | null, label: se.name, items: plan.items.filter((it) => it.subEventId === se.id) })),
    { key: null, label: groupLabel, items: plan.items.filter((it) => it.subEventId === null) },
  ].filter((g) => g.items.length > 0);
  const total = plan.items.reduce((sum, it) => sum + lineTotal(it), 0);
  const unavailable = plan.products.filter((p) => !p.available);
  const blocker = quoteBlocker(plan);
  const firstDate = plan.eventStartDate ?? plan.subEvents.find((se) => se.eventDate)?.eventDate;

  function toggleExpanded(key: string | null) {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setProblem(null);
    try {
      const request = await submitPlanForQuotation(planId);
      setSent(request);
      // The plan is locked now; everything that shows it or the plan list must hear.
      await queryClient.invalidateQueries({ queryKey: planKeys.all });
      toast.success("Quotation requested");
    } catch (error) {
      setProblem(error instanceof ApiError ? error.message : "We couldn't send your plan just now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 py-20 text-center page-x">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="size-9" />
        </span>
        <h1 className="font-serif text-3xl text-foreground">Quotation requested</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Our team will review pricing and availability for every item in <span className="text-foreground">{plan.name}</span> and come back to you with a quotation. You have not been charged.
        </p>
        <p className="rounded-lg border border-border bg-card px-5 py-3 text-sm">
          Your reference: <span className="font-medium text-primary">{sent.quotationNumber}</span>
        </p>
        <div className="flex gap-3">
          <Button variant="outline" nativeButton={false} render={<Link href={`/plans/${planId}`}>View my plan</Link>} />
          <Button nativeButton={false} render={<Link href={`/quotations/${sent.id}`}>View quotation</Link>} />
          <Button nativeButton={false} render={<Link href="/plans">All plans</Link>} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-8 pb-28 md:py-10 page-x">
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
          {plan.name} <span className="px-2">•</span> {firstDate ? formatEventDate(firstDate) : "No date set"}
        </p>
      </div>

      {!plan.editable ? (
        <section role="status" className="flex items-start gap-4 rounded-lg border-l-4 border-primary bg-card p-6 text-sm leading-6 text-foreground">
          <Info className="size-5 shrink-0 text-primary" />
          This plan has already been sent for a quotation.
        </section>
      ) : (
        <section className="flex items-start gap-4 rounded-lg border-l-4 border-primary bg-card p-6">
          <Info className="size-5 shrink-0 text-primary" />
          <p className="text-sm leading-6 text-foreground">
            Submitting creates a formal quotation request. Our team will review pricing and availability for each item, and you&apos;ll be
            contacted when the quotation is ready. You will not be charged now, and the plan can&apos;t be changed once it is sent.
          </p>
        </section>
      )}

      {unavailable.length > 0 && (
        <section role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-foreground">
          {unavailable.map((p) => p.name).join(", ")} {unavailable.length === 1 ? "is" : "are"} no longer available. Remove {unavailable.length === 1 ? "it" : "them"} from the plan before submitting.
        </section>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-foreground">Plan summary</h2>
          <span className="text-sm text-muted-foreground">
            {plan.items.length} item{plan.items.length === 1 ? "" : "s"}
          </span>
        </div>
        {groups.map((g) => (
          <div key={g.key ?? "general"} className="rounded-lg border border-border bg-card p-6">
            <button className="flex w-full items-center justify-between" onClick={() => toggleExpanded(g.key)} aria-expanded={expanded.has(g.key)}>
              <div className="text-left">
                <h3 className="font-serif text-xl text-foreground">{g.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {g.items.length} item{g.items.length === 1 ? "" : "s"}
                </p>
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
                      <span>
                        {product?.name} <span className="text-xs">× {lineQuantity(it)}</span>
                      </span>
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
        <p className="text-sm text-muted-foreground">An estimate at today&apos;s rates; final pricing is confirmed in your quotation.</p>
        <p className="font-serif text-3xl text-primary">Estimated Total: {formatRupees(total)}</p>
      </div>

      {blocker && (
        <p role="alert" className="rounded-lg border border-primary/40 bg-primary/5 p-4 text-sm text-foreground">
          {blocker} <Link href={`/plans/${planId}`} className="text-primary underline">Back to the plan</Link>
        </p>
      )}

      {problem && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {problem}
        </p>
      )}

      <footer className="fixed inset-x-0 bottom-0 z-30 flex justify-end gap-4 border-t border-border bg-background px-4 py-4 md:px-8">
        <Button variant="outline" className="rounded-lg border-primary text-primary" nativeButton={false} render={<Link href={`/plans/${planId}`}>Back</Link>} />
        <Button className="rounded-lg bg-primary text-primary-foreground" onClick={handleSubmit} disabled={submitting || !plan.editable || blocker !== null || unavailable.length > 0}>
          {submitting ? "Sending…" : "Confirm & Submit"}
        </Button>
      </footer>
    </div>
  );
}
