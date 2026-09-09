"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useRequireAccount } from "@/features/auth";
import { useMockStore } from "@/mock-data/store";
import { formatRupees } from "@/mock-data/seed";

// Flowstep screen 27 (desktop) — mobile 28 not fetched; stacks naturally.
// Round history (tabs across prior rounds) isn't modeled — this mock only
// ever produces a single round per quotation, so a fake multi-round history
// isn't shown; the real "Round N" label and expiry banner are.
const STATUS_STYLE: Record<string, string> = {
  Confirmed: "border border-primary bg-primary/15 text-primary",
  Adjusted: "border border-amber-500/70 bg-amber-500/15 text-amber-300",
  Rejected: "border border-red-500/70 bg-red-500/15 text-red-300",
};

export default function QuotationDetailPage({ params }: { params: Promise<{ quotationId: string }> }) {
  const { quotationId } = use(params);
  const account = useRequireAccount();
  const router = useRouter();
  const { getQuotation, getPlan, acceptQuotationLines, rejectQuotation } = useMockStore();
  const quotation = getQuotation(quotationId);
  const plan = quotation ? getPlan(quotation.planId) : undefined;

  const acceptableLines = useMemo(() => quotation?.lines.filter((l) => l.status !== "Rejected" && !l.accepted) ?? [], [quotation]);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(acceptableLines.map((l) => l.planItemId)));

  // Date.now() is impure, so this is computed post-render in an effect rather
  // than during render (or in useMemo, which still runs during render).
  const [daysLeft, setDaysLeft] = useState(0);
  useEffect(() => {
    if (!quotation) return;
    // One-time read of the external wall clock on mount/quotation change —
    // not an ongoing subscription, so the cascading-render concern doesn't apply.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDaysLeft(Math.ceil((new Date(quotation.validUntil).getTime() - Date.now()) / 86400000));
  }, [quotation]);

  if (!account) return null;
  if (!quotation || !plan) return <div className="mx-auto w-full max-w-4xl px-4 py-10">Quotation not found.</div>;

  const eventDate = plan.subEvents[0]?.eventDate;
  const recalculatedTotal = quotation.lines.filter((l) => selected.has(l.planItemId)).reduce((sum, l) => sum + l.unitPrice * l.confirmedQty, 0);

  function toggle(planItemId: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(planItemId)) next.delete(planItemId);
      else next.add(planItemId);
      return next;
    });
  }

  function handleAccept() {
    if (selected.size === 0) return;
    acceptQuotationLines(quotationId, Array.from(selected));
    toast.success("Lines accepted — continue to payment.");
    router.push(`/checkout/${quotationId}`);
  }

  function handleReject(resolution: "Draft" | "Cancelled") {
    rejectQuotation(quotationId, resolution);
    toast.success(resolution === "Draft" ? "Quotation rejected — plan is back in Draft." : "Quotation rejected — plan cancelled.");
    router.push(`/plans/${plan!.id}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-8">
      {quotation.status !== "Accepted" && (
        <div className="flex items-center gap-3 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-foreground">
          <TriangleAlert className="size-5 shrink-0 text-red-300" />
          <span>
            This quotation {daysLeft > 0 ? `expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}` : "has expired"}
            {eventDate ? ` (event is ${eventDate})` : ""} and is unpaid.
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted-foreground">Round {quotation.round}</span>
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">Quotation — Round {quotation.round}</h1>
      </div>

      <div className="grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-hidden rounded-xl bg-card">
          <div className="hidden grid-cols-[2.1fr_1fr_2.4fr_1fr_72px] gap-4 border-b border-primary/20 px-5 py-4 text-xs tracking-wider text-muted-foreground uppercase md:grid">
            <span>Item</span>
            <span>Requested Qty</span>
            <span>Status</span>
            <span>Adjusted Price</span>
            <span>Include</span>
          </div>
          {quotation.lines.map((line) => (
            <div
              key={line.planItemId}
              className="flex flex-col gap-3 border-b border-primary/15 px-5 py-5 last:border-b-0 md:grid md:grid-cols-[2.1fr_1fr_2.4fr_1fr_72px] md:items-center md:gap-4"
            >
              <span className="text-sm text-foreground">{line.productName}</span>
              <span className="text-sm text-muted-foreground">{line.requestedQty}</span>
              <div className="flex flex-col items-start gap-2">
                <span className={cn("rounded-full px-3 py-1 text-xs", STATUS_STYLE[line.status])}>
                  {line.status === "Confirmed" ? "Confirmed at requested qty" : line.status}
                </span>
                {line.reason && <span className="text-xs text-muted-foreground">{line.reason}</span>}
              </div>
              <span className={cn("text-sm", line.status === "Rejected" && "text-muted-foreground line-through")}>
                {line.status === "Rejected" ? formatRupees(0) : formatRupees(line.unitPrice * line.confirmedQty)}
              </span>
              <Checkbox
                checked={selected.has(line.planItemId)}
                disabled={line.status === "Rejected" || line.accepted}
                onCheckedChange={() => toggle(line.planItemId)}
              />
            </div>
          ))}
        </div>

        <aside className="flex flex-col gap-4 rounded-xl bg-card p-6">
          <h2 className="font-serif text-2xl text-foreground">Recalculated Total</h2>
          <div className="font-medium text-3xl text-primary">{formatRupees(recalculatedTotal)}</div>
          <p className="text-sm text-muted-foreground">Updates as you change selections above.</p>
          <div className="mt-4 flex flex-col gap-3">
            <Button className="w-full rounded bg-primary text-primary-foreground" onClick={handleAccept} disabled={selected.size === 0}>
              Accept Selected &amp; Pay
            </Button>
            <Dialog>
              <DialogTrigger render={<Button variant="outline" className="w-full rounded border-red-500/70 text-red-300">Reject Entire Quotation</Button>} />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject this quotation</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">Choose what happens to the plan — this needs an explicit choice, not a silent timeout.</p>
                <DialogFooter className="gap-2 sm:justify-start">
                  <Button variant="outline" onClick={() => handleReject("Draft")}>Keep editing (back to Draft)</Button>
                  <Button variant="destructive" onClick={() => handleReject("Cancelled")}>Cancel the plan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-xs text-muted-foreground">Rejecting reverts this Plan to Draft.</p>
        </aside>
      </div>
    </div>
  );
}
