"use client";

import { use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Circle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAccount } from "@/features/auth";
import { DEPOSIT_COPY, STATUS_COPY, useOrder, type Order } from "@/features/orders";
import { formatMoney } from "@/lib/money";
import { ApiError } from "@/services/api-client";

/**
 * One order, as its customer sees it. Everything on it is what the back office has recorded: the
 * status moves when staff dispatch, collect and complete it, and the deposit panel follows the
 * accounts team. Dispatch and return are recorded for the whole order, so the history is order-level.
 */
const day = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const formatDay = (iso?: string) => (iso ? day.format(new Date(iso.length > 10 ? iso : `${iso}T00:00:00`)) : "");

export default function OrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const account = useRequireAccount();
  const query = useOrder(orderId);
  const justPlaced = useSearchParams().get("placed") === "1";

  if (!account) return null;

  if (query.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 py-10 page-x">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (query.isError) {
    const missing = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-3 py-24 text-center page-x">
        <h1 className="font-serif text-2xl">{missing ? "Order not found" : "We couldn't load this order"}</h1>
        <p className="text-sm text-muted-foreground">
          {missing ? "It may belong to another account, or the link is wrong." : "Please try again."}
        </p>
        {missing ? (
          <Button nativeButton={false} render={<Link href="/orders">My orders</Link>} />
        ) : (
          <Button onClick={() => void query.refetch()}>Try again</Button>
        )}
      </div>
    );
  }

  return <OrderView order={query.data} justPlaced={justPlaced} />;
}

function OrderView({ order, justPlaced }: { order: Order; justPlaced: boolean }) {
  const copy = STATUS_COPY[order.status];
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-8 page-x">
      {justPlaced && (
        <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="font-serif text-lg text-foreground">Order placed</p>
            <p className="text-sm text-muted-foreground">
              Thank you. Your order {order.orderNumber} is confirmed. You can follow it here.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Order</span>
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">{order.orderNumber}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant={copy.tone}>{copy.label}</Badge>
          <span>{order.planName}</span>
          {order.eventDate && <span>· Event {formatDay(order.eventDate)}</span>}
        </div>
        <p className="text-sm text-muted-foreground">{copy.text}</p>
        {order.status === "CANCELLED" && order.cancellationReason && (
          <p className="text-sm text-foreground">Reason: {order.cancellationReason}</p>
        )}
      </div>

      <div className="grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-8">
          <Timeline order={order} />
          <Items order={order} />
          {order.movements.length > 0 && <Deliveries order={order} />}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-e2">
            <h2 className="font-serif text-xl text-foreground">Summary</h2>
            <Row label="Order total" value={formatMoney(order.totalAmount)} strong />
            <Row label="Balance owed" value={formatMoney(order.balanceOwed)} />
            <p className="text-xs leading-5 text-muted-foreground">
              Balance is the total less any credit we have given you. Payments are not recorded online yet.
            </p>
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4 text-sm">
              <Link className="text-primary hover:underline" href={`/quotations/${order.requestId}`}>
                View quotation {order.quotationNumber}
              </Link>
              <Link className="text-primary hover:underline" href={`/plans/${order.planId}`}>
                View plan
              </Link>
            </div>
          </div>
          {order.deposit && <DepositPanel deposit={order.deposit} />}
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-serif text-2xl text-primary tabular-nums" : "text-foreground tabular-nums"}>{value}</span>
    </div>
  );
}

/** Placed, dispatched, returned, completed, from the order's own dates. A cancelled order stops where it was. */
function Timeline({ order }: { order: Order }) {
  const cancelled = order.status === "CANCELLED";
  const steps: { label: string; at?: string; note: string }[] = [
    { label: "Order placed", at: order.placedAt, note: "Your quotation was accepted." },
    { label: "Dispatched", at: order.dispatchedAt, note: "Your items were sent for your event." },
    { label: "Returned", at: order.returnedAt, note: "Your items came back to us." },
    { label: "Completed", at: order.completedAt, note: "Everything is settled." },
  ];
  const visible = cancelled ? steps.filter((step) => step.at).concat([{ label: "Cancelled", at: order.cancelledAt, note: order.cancellationReason ?? "" }]) : steps;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-serif text-xl text-foreground">Progress</h2>
      <ol className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        {visible.map((step) => {
          const done = Boolean(step.at);
          const isCancel = step.label === "Cancelled";
          return (
            <li key={step.label} className="flex items-start gap-3">
              {isCancel ? (
                <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-label="Cancelled" />
              ) : done ? (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-label="Done" />
              ) : (
                <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-label="Not yet" />
              )}
              <div>
                <p className={done || isCancel ? "text-sm font-medium text-foreground" : "text-sm text-muted-foreground"}>
                  {step.label}
                  {step.at && <span className="ml-2 font-normal text-muted-foreground">{formatDay(step.at)}</span>}
                </p>
                {(done || isCancel) && step.note && <p className="text-xs text-muted-foreground">{step.note}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Items({ order }: { order: Order }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-serif text-xl text-foreground">Items</h2>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {order.lines.map((line, index) => (
          <div
            key={`${line.productId}-${line.variantId ?? 0}-${index}`}
            className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border px-5 py-4 text-sm last:border-b-0"
          >
            <span className="text-foreground">{line.productName}</span>
            <span className="text-muted-foreground">
              {line.quantity} × {line.rentalDays} day{line.rentalDays === 1 ? "" : "s"}
            </span>
            <span className="text-foreground tabular-nums">{formatMoney(line.lineTotal)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Every dispatch and return, newest first. */
function Deliveries({ order }: { order: Order }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-serif text-xl text-foreground">Deliveries</h2>
      <ul className="flex flex-col gap-2">
        {order.movements.map((movement) => (
          <li key={movement.movementNumber} className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
            <p className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-foreground">
                {movement.direction === "OUTWARD" ? "Sent out" : "Collected back"}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDay(movement.movedOn)} · {movement.movementNumber}
              </span>
            </p>
            <ul className="mt-1 text-xs text-muted-foreground">
              {movement.items.map((item, index) => (
                <li key={index}>
                  {item.productName} × {item.quantity}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DepositPanel({ deposit }: { deposit: NonNullable<Order["deposit"]> }) {
  const copy = DEPOSIT_COPY[deposit.status];
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl text-foreground">Security deposit</h2>
        <Badge variant={deposit.status === "FORFEITED" ? "destructive" : deposit.status === "REFUNDED" ? "success" : "default"}>
          {copy.label}
        </Badge>
      </div>
      <Row label="Held" value={formatMoney(deposit.amountHeld)} />
      {deposit.amountRefunded.amount > 0 && <Row label="Refunded" value={formatMoney(deposit.amountRefunded)} />}
      {deposit.amountForfeited.amount > 0 && <Row label="Retained" value={formatMoney(deposit.amountForfeited)} />}
      <p className="text-xs leading-5 text-muted-foreground">{copy.text}</p>
      {deposit.reason && <p className="text-xs text-foreground">Note: {deposit.reason}</p>}
      {deposit.settledAt && <p className="text-xs text-muted-foreground">Settled {formatDay(deposit.settledAt)}</p>}
    </div>
  );
}
