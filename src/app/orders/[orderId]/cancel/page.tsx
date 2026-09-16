"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, CheckCircle2, X } from "lucide-react";
import { DUR, EASE, Reveal, SPRING, Stagger, StaggerItem } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useRequireAccount } from "@/features/auth";
import { useMockStore } from "@/mock-data/store";
import { formatRupees } from "@/mock-data/seed";

// Flowstep screen 36 (desktop) — mobile 37 not fetched; stacks naturally.
// Per-line cancellability is real (tied to subEventDeliveryStatus), but the
// underlying Order model only tracks whole-order cancelled/not — so "Confirm
// Cancellation" cancels the whole order even though the review UI lets you
// select individual lines. Flagged rather than silently simplified; true
// partial cancellation (Flow 8 branch) would need per-line cancelled state.
export default function CancelOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const account = useRequireAccount();
  const router = useRouter();
  const { getOrder, getPlan, previewCancellation, cancelOrder } = useMockStore();
  const order = getOrder(orderId);
  const plan = order ? getPlan(order.planId) : undefined;
  const preview = order ? previewCancellation(orderId) : { lines: [], depositRefundable: false };

  const [selected, setSelected] = useState<Set<string>>(() => new Set(preview.lines.filter((l) => l.cancellable).map((l) => l.planItemId)));
  const [confirmed, setConfirmed] = useState(false);

  if (!account) return null;
  if (!order || !plan) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="font-serif text-2xl">Order not found</h1>
        <Button variant="outline" nativeButton={false} render={<Link href="/account#order-history">Order history</Link>} />
      </div>
    );
  }

  function toggle(planItemId: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(planItemId)) next.delete(planItemId);
      else next.add(planItemId);
      return next;
    });
  }

  const selectedLines = preview.lines.filter((l) => selected.has(l.planItemId));
  const selectedTotal = selectedLines.reduce((sum, l) => sum + l.amount, 0);
  const depositRefund = preview.depositRefundable ? order.depositAmount : 0;

  function handleConfirm() {
    cancelOrder(orderId);
    setConfirmed(true);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-8 md:py-10">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-primary">Order #{order.id}</p>
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">Cancel Order Items</h1>
        <p className="text-sm text-foreground/65">Plan: {plan.name}</p>
      </div>

      <section className="overflow-hidden rounded-lg border border-primary/35 bg-card">
        <div className="hidden grid-cols-[2.2fr_1.4fr_1fr_1.2fr] gap-4 border-b border-primary/25 px-6 py-4 text-xs tracking-widest text-foreground/55 uppercase md:grid">
          <span>Order item</span>
          <span>Event</span>
          <span>Amount</span>
          <span>Cancellable</span>
        </div>
        {preview.lines.map((line) => (
          <div key={line.planItemId} className="grid grid-cols-2 items-center gap-4 border-b border-foreground/10 px-6 py-5 last:border-b-0 md:grid-cols-[2.2fr_1.4fr_1fr_1.2fr]">
            <div className="flex items-center gap-3">
              <Checkbox checked={selected.has(line.planItemId)} disabled={!line.cancellable || confirmed} onCheckedChange={() => toggle(line.planItemId)} />
              <span className={cnText(line.cancellable)}>{line.productName}</span>
            </div>
            <span className={cnText(line.cancellable)}>{line.subEventLabel}</span>
            <span className={cnText(line.cancellable)}>{formatRupees(line.amount)}</span>
            {line.cancellable ? (
              <span className="flex items-center gap-2 text-sm text-primary">
                <Check className="size-4" /> Cancellable
              </span>
            ) : (
              <span className="flex flex-col gap-1 text-sm text-red-400">
                <span className="flex items-center gap-2">
                  <X className="size-4" /> NOT cancellable
                </span>
                <span className="text-xs text-foreground/45">{line.reason}</span>
              </span>
            )}
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-primary bg-card p-6">
        <h2 className="font-serif text-2xl text-foreground">Cancellation Policy</h2>
        <div className="flex flex-col gap-2 text-sm leading-6 text-foreground/75">
          <p>• Rental charge is non-refundable once confirmed.</p>
          <p>• Security deposit: refunded immediately via Razorpay if cancelled before the event date.</p>
          <p>• Security deposit: enters &quot;Pending Review&quot; if cancelled after the event date, pending admin damage inspection.</p>
        </div>
      </section>

      {!confirmed ? (
        <section className="flex flex-col gap-6 rounded-lg border border-primary/45 bg-card p-6">
          <div className="flex flex-col gap-2">
            <h2 className="font-serif text-2xl text-foreground">
              You are about to cancel {selectedLines.length} item{selectedLines.length === 1 ? "" : "s"} totalling {formatRupees(selectedTotal)}.
            </h2>
            <p className="text-sm text-foreground/70">Please review the refund breakdown before confirming.</p>
          </div>
          <div className="flex flex-col gap-3 border-t border-foreground/10 pt-4 text-sm">
            <div className="flex justify-between text-foreground/75">
              <span>Rental charge (non-refundable)</span>
              <span className="text-foreground">{formatRupees(selectedTotal)}</span>
            </div>
            <div className="flex justify-between text-foreground/75">
              <span>Security deposit to be refunded</span>
              <span className="text-primary">{formatRupees(depositRefund)} {preview.depositRefundable ? "(immediate)" : "(pending review)"}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-red-400 text-red-400" onClick={handleConfirm} disabled={selectedLines.length === 0}>
              Confirm Cancellation
            </Button>
            <Button variant="outline" className="border-primary/60 text-foreground" nativeButton={false} render={<Link href={`/orders/${orderId}`}>Go Back</Link>} />
          </div>
        </section>
      ) : (
        <section className="flex flex-col gap-3 rounded-lg border border-primary/60 bg-card p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-6 text-primary" />
            <h2 className="font-serif text-2xl text-foreground">Refund Initiated</h2>
          </div>
          <p className="max-w-4xl text-sm leading-6 text-foreground/75">
            {preview.depositRefundable
              ? `Your security deposit refund of ${formatRupees(depositRefund)} has been initiated and will reflect in 5-7 business days. `
              : "Your security deposit refund is pending admin review. "}
            The rental charge of {formatRupees(selectedTotal)} is non-refundable per policy.
          </p>
          <Button className="mt-2 w-fit bg-primary text-primary-foreground" onClick={() => router.push(`/orders/${orderId}`)}>
            Back to order
          </Button>
        </section>
      )}
    </div>
  );
}

function cnText(cancellable: boolean) {
  return cancellable ? "text-sm text-foreground" : "text-sm text-foreground/55";
}
