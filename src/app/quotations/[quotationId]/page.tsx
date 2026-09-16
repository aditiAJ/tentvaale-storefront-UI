"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { TriangleAlert } from "lucide-react";
import { DUR, EASE, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
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
// Was raw amber-500 / red-500 Tailwind colours, which clashed with the gold
// palette and were unreadable on the ivory theme. These map onto the shared
// Badge variants instead.
const STATUS_VARIANT: Record<string, React.ComponentProps<typeof Badge>["variant"]> = {
  Confirmed: "success",
  Adjusted: "warning",
  Rejected: "destructive",
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
  if (!quotation || !plan) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-3 px-4 py-24 text-center">
        <h1 className="font-serif text-2xl">Quotation not found</h1>
        <p className="text-sm text-muted-foreground">This quotation link may have expired.</p>
      </div>
    );
  }

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
        <Reveal immediate direction="down" distance={10} className="flex items-center gap-3 rounded-xl border border-destructive/35 bg-destructive/[0.06] px-4 py-3.5 text-sm text-foreground">
          <TriangleAlert className="size-5 shrink-0 text-destructive" />
          <span>
            This quotation {daysLeft > 0 ? `expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}` : "has expired"}
            {eventDate ? ` (event is ${eventDate})` : ""} and is unpaid.
          </span>
        </Reveal>
      )}

      <Reveal immediate className="flex flex-col gap-2">
        <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Round {quotation.round}</span>
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">Quotation — Round {quotation.round}</h1>
      </Reveal>

      <div className="grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-e1">
          <div className="hidden grid-cols-[2.1fr_1fr_2.4fr_1fr_72px] gap-4 border-b border-border bg-muted/40 px-5 py-3.5 text-xs tracking-[0.12em] text-muted-foreground uppercase md:grid">
            <span>Item</span>
            <span>Requested Qty</span>
            <span>Status</span>
            <span>Adjusted Price</span>
            <span>Include</span>
          </div>
          <Stagger gap={0.04}>
            {quotation.lines.map((line) => {
              const included = selected.has(line.planItemId);
              const rejected = line.status === "Rejected";
              return (
                <StaggerItem key={line.planItemId} distance={10}>
                  <div
                    className={cn(
                      "flex flex-col gap-3 border-b border-border px-5 py-5 transition-colors duration-200 ease-out-quint last:border-b-0 md:grid md:grid-cols-[2.1fr_1fr_2.4fr_1fr_72px] md:items-center md:gap-4",
                      // Excluded lines dim so the selection reads down the
                      // column without checking every checkbox.
                      !included && !rejected && "opacity-60",
                      rejected && "opacity-45",
                      included && "bg-primary/[0.04]",
                    )}
                  >
                    <span className="text-sm text-foreground">{line.productName}</span>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      <span className="md:hidden">Requested: </span>
                      {line.requestedQty}
                    </span>
                    <div className="flex flex-col items-start gap-1.5">
                      <Badge variant={STATUS_VARIANT[line.status]}>
                        {line.status === "Confirmed" ? "Confirmed at requested qty" : line.status}
                      </Badge>
                      {line.reason && <span className="text-xs leading-5 text-muted-foreground">{line.reason}</span>}
                    </div>
                    <span className={cn("text-sm tabular-nums", rejected && "text-muted-foreground line-through")}>
                      {rejected ? formatRupees(0) : formatRupees(line.unitPrice * line.confirmedQty)}
                    </span>
                    <Checkbox
                      checked={included}
                      disabled={rejected || line.accepted}
                      onCheckedChange={() => toggle(line.planItemId)}
                      aria-label={`Include ${line.productName}`}
                    />
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>

        <aside className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-e2 md:sticky md:top-24">
          <h2 className="font-serif text-2xl text-foreground">Recalculated Total</h2>
          {/* Total re-keys on its value so a selection change is visibly
              reflected in the number, not just silently recomputed. */}
          <motion.div
            key={recalculatedTotal}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.base, ease: EASE.out }}
            className="font-serif text-4xl text-primary tabular-nums"
          >
            {formatRupees(recalculatedTotal)}
          </motion.div>
          <p className="text-sm text-muted-foreground">
            Updates as you change selections above. <span className="text-foreground tabular-nums">{selected.size}</span> line
            {selected.size === 1 ? "" : "s"} included.
          </p>
          <div className="mt-2 flex flex-col gap-2.5">
            <Button size="lg" className="w-full" onClick={handleAccept} disabled={selected.size === 0}>
              Accept Selected &amp; Pay
            </Button>
            <Dialog>
              <DialogTrigger render={<Button variant="destructive" size="lg" className="w-full">Reject Entire Quotation</Button>} />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject this quotation</DialogTitle>
                </DialogHeader>
                <p className="text-sm leading-6 text-muted-foreground">
                  Choose what happens to the plan — this needs an explicit choice, not a silent timeout.
                </p>
                <DialogFooter className="gap-2 sm:justify-start">
                  <Button variant="outline" onClick={() => handleReject("Draft")}>Keep editing (back to Draft)</Button>
                  <Button variant="destructive" onClick={() => handleReject("Cancelled")}>Cancel the plan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">Rejecting reverts this Plan to Draft.</p>
        </aside>
      </div>
    </div>
  );
}
