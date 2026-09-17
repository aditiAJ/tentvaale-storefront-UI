"use client";

import { use } from "react";
import Link from "next/link";
import { CircleCheck, Clock3, Download } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
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
  if (!order || !quotation || !plan) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 py-24 text-center page-x">
        <h1 className="font-serif text-2xl">Order not found</h1>
        <Button variant="outline" nativeButton={false} render={<Link href="/account#order-history">Order history</Link>} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-8 md:py-12 page-x">
      <Reveal immediate className="rounded-2xl border border-border bg-card p-6 shadow-e2 md:p-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row">
          <div className="flex flex-col gap-2">
            <p className="text-xs tracking-[0.18em] text-primary uppercase">Order</p>
            <h1 className="font-serif text-3xl text-foreground md:text-4xl">#{order.id}</h1>
            <p className="text-base text-muted-foreground">Plan: {plan.name}</p>
            <Button
              variant="outline"
              className="mt-3 w-fit gap-2"
              nativeButton={false}
              render={
                <Link href={`/orders/${orderId}/invoice?download=1`} target="_blank">
                  <Download className="size-4" /> Download Invoice
                </Link>
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-8 md:gap-12 md:text-right">
            <div className="flex flex-col gap-1">
              <span className="text-xs tracking-[0.1em] text-muted-foreground uppercase">Event date</span>
              <span className="text-base text-foreground">{plan.subEvents[0]?.eventDate ?? "TBD"}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs tracking-[0.1em] text-muted-foreground uppercase">Venue</span>
              <span className="text-base text-foreground">{order.venue ?? "To be confirmed"}</span>
            </div>
          </div>
        </div>
      </Reveal>

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
          <Stagger gap={0.06} className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {plan.subEvents.map((se) => {
              const status = order.subEventDeliveryStatus[se.id] ?? "Pending";
              const delivered = status === "Delivered";
              return (
                <StaggerItem key={se.id} distance={14}>
                  {/* Was border-amber-500 / text-amber-400 — raw Tailwind colours
                      outside the palette that read wrong on the ivory theme.
                      --success and --warning are the themed equivalents. */}
                  <div
                    className={cn(
                      "flex h-full flex-col gap-6 rounded-2xl border bg-card p-6 shadow-e1",
                      delivered
                        ? "border-[color-mix(in_oklab,var(--success)_35%,transparent)]"
                        : "border-[color-mix(in_oklab,var(--warning)_35%,transparent)]",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-serif text-xl text-foreground">{se.name}</h3>
                      <Badge variant={delivered ? "success" : "warning"}>{delivered ? "Delivered" : "Pending"}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {delivered ? (
                        <CircleCheck className="size-5 shrink-0 text-[var(--success)]" />
                      ) : (
                        // The pending clock breathes so an in-flight delivery
                        // is distinguishable from a settled one at a glance.
                        <Clock3 className="size-5 shrink-0 animate-pulse text-[var(--warning)]" />
                      )}
                      <span>{delivered ? `Delivered ${se.eventDate}` : `Scheduled for ${se.eventDate}`}</span>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </section>
      ) : (
        <Alert>
          <AlertTitle>Delivery in progress</AlertTitle>
          <AlertDescription>{order.deliveryStatus === "FullyDelivered" ? "Everything has been delivered." : "Status updates as admin performs dispatch/return."}</AlertDescription>
        </Alert>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-2xl text-foreground">Dispatch &amp; Return Activity</h2>
        {/* Timeline: a gold node per entry with a connecting rule, so the log
            reads as a sequence rather than a flat table of rows. */}
        <Stagger gap={0.05} className="overflow-hidden rounded-2xl border border-border bg-card shadow-e1">
          {order.dispatchLog.map((entry, i) => (
            <StaggerItem key={i} distance={10}>
              <div className="grid grid-cols-1 gap-1 border-b border-border px-6 py-5 last:border-b-0 md:grid-cols-[200px_1fr] md:items-start md:gap-6">
                <span className="text-sm text-muted-foreground tabular-nums">{entry.date}</span>
                <div className="relative flex flex-col gap-1 pl-6">
                  <span className="absolute top-1.5 left-0 size-2.5 rounded-full bg-primary ring-4 ring-primary/15" aria-hidden />
                  {i < order.dispatchLog.length - 1 && (
                    <span className="absolute top-5 bottom-[-1.75rem] left-[0.3125rem] w-px bg-border" aria-hidden />
                  )}
                  <span className="text-base text-foreground">{entry.title}</span>
                  {entry.detail && <span className="text-sm leading-6 text-muted-foreground">{entry.detail}</span>}
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-2xl text-foreground">Order lines</h2>
        <Stagger gap={0.04} className="flex flex-col gap-2">
          {quotation.lines
            .filter((l) => l.accepted)
            .map((l) => (
              <StaggerItem key={l.planItemId} distance={10}>
                <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3.5 text-sm shadow-e1 transition-colors duration-200 ease-out-quint hover:border-primary/40">
                  <span className="text-foreground">
                    {l.productName} <span className="text-muted-foreground">× {l.confirmedQty}</span>
                  </span>
                  <span className="font-medium text-foreground tabular-nums">{formatRupees(l.unitPrice * l.confirmedQty)}</span>
                </div>
              </StaggerItem>
            ))}
        </Stagger>
      </section>
    </div>
  );
}
