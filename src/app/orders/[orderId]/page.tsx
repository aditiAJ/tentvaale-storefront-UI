"use client";

import { use } from "react";
import Link from "next/link";
import { CircleCheck, Clock3, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRequireAccount } from "@/features/auth";
import { useMockStore } from "@/mock-data/store";
import { formatRupees } from "@/mock-data/seed";

// Flowstep screen 33 (desktop) — screens 34 (degraded state) and 35 (mobile)
// not fetched; the "no data yet" case below covers a reasonable degraded state.
// See mock-data/types.ts Order.subEventDeliveryStatus for a flagged deviation
// from the resolved order-level-only delivery status decision.
export default function OrderTrackingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const account = useRequireAccount();
  const { getOrder, getQuotation, getPlan } = useMockStore();
  const order = getOrder(orderId);
  const quotation = order ? getQuotation(order.quotationId) : undefined;
  const plan = order ? getPlan(order.planId) : undefined;

  if (!account) return null;
  if (!order || !quotation || !plan) return <div className="mx-auto w-full max-w-4xl px-4 py-10">Order not found.</div>;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
      <div className="rounded-xl bg-card p-6 md:p-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row">
          <div className="flex flex-col gap-2">
            <p className="text-sm tracking-[0.18em] text-primary uppercase">Order</p>
            <h1 className="font-serif text-3xl text-foreground md:text-4xl">#{order.id}</h1>
            <p className="text-base text-foreground/75">Plan: {plan.name}</p>
            <Button
              variant="outline"
              className="mt-2 w-fit gap-2 border-primary text-primary"
              nativeButton={false}
              render={
                <Link href={`/orders/${orderId}/invoice?download=1`} target="_blank">
                  <Download className="size-4" /> Download Invoice
                </Link>
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-8 text-right md:gap-12">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-foreground/55">Event date</span>
              <span className="text-base text-foreground">{plan.subEvents[0]?.eventDate ?? "TBD"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-foreground/55">Venue</span>
              <span className="text-base text-foreground">{order.venue ?? "To be confirmed"}</span>
            </div>
          </div>
        </div>
      </div>

      {!order.cancelled ? (
        <div className="flex justify-end">
          <Button variant="destructive" nativeButton={false} render={<Link href={`/orders/${orderId}/cancel`}>Cancel Order Items</Link>} />
        </div>
      ) : (
        <Alert>
          <AlertTitle>Cancellation processed</AlertTitle>
          <AlertDescription>
            Deposit status: {order.depositStatus === "RefundPending" ? "Refund pending review" : order.depositStatus}. Rental charge of{" "}
            {formatRupees(order.paidAmount - order.depositAmount)} is not refundable.
          </AlertDescription>
        </Alert>
      )}

      {plan.subEvents.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-2xl text-foreground">Delivery Status by Sub-Event</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {plan.subEvents.map((se) => {
              const status = order.subEventDeliveryStatus[se.id] ?? "Pending";
              const delivered = status === "Delivered";
              return (
                <div key={se.id} className={cn("flex flex-col gap-6 rounded-xl bg-card p-6", delivered ? "border border-primary/35" : "border border-amber-500/40")}>
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-serif text-xl text-foreground">{se.name}</h3>
                    <Badge variant="outline" className={delivered ? "border-primary text-primary" : "border-amber-500 text-amber-400"}>
                      {delivered ? "Delivered" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground/70">
                    {delivered ? <CircleCheck className="size-5 text-primary" /> : <Clock3 className="size-5 text-amber-400" />}
                    <span>{delivered ? `Delivered ${se.eventDate}` : `Scheduled for ${se.eventDate}`}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <Alert>
          <AlertTitle>Delivery in progress</AlertTitle>
          <AlertDescription>{order.deliveryStatus === "FullyDelivered" ? "Everything has been delivered." : "Status updates as admin performs dispatch/return."}</AlertDescription>
        </Alert>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-2xl text-foreground">Dispatch &amp; Return Activity</h2>
        <div className="overflow-hidden rounded-xl bg-card">
          <div className="hidden grid-cols-[220px_1fr] gap-6 border-b border-foreground/10 px-6 py-4 text-xs tracking-[0.16em] text-foreground/50 uppercase md:grid">
            <span>Date</span>
            <span>Activity</span>
          </div>
          {order.dispatchLog.map((entry, i) => (
            <div key={i} className="grid grid-cols-1 gap-1 border-b border-foreground/10 px-6 py-5 last:border-b-0 md:grid-cols-[220px_1fr] md:items-center md:gap-6">
              <span className="text-sm text-foreground/75">{entry.date}</span>
              <div className="flex flex-col gap-1">
                <span className="text-base text-foreground">{entry.title}</span>
                {entry.detail && <span className="text-sm text-foreground/60">{entry.detail}</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium text-foreground">Order lines</h2>
        {quotation.lines
          .filter((l) => l.accepted)
          .map((l) => (
            <div key={l.planItemId} className="flex items-center justify-between rounded-lg bg-card px-4 py-3 text-sm">
              <span className="text-foreground">
                {l.productName} × {l.confirmedQty}
              </span>
              <span className="font-medium text-foreground">{formatRupees(l.unitPrice * l.confirmedQty)}</span>
            </div>
          ))}
      </section>
    </div>
  );
}
