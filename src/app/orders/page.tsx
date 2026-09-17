"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CircleCheck, Clock3, PackageSearch, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useRequireAccount } from "@/features/auth";
import { useMockStore } from "@/mock-data/store";
import { formatEventDateRange, formatRupees } from "@/mock-data/seed";
import type { Order, Plan } from "@/mock-data/types";

// No Flowstep screen covers an orders index — the 56-screen set only has the
// per-order tracking page (33) plus the Account page's short Order History
// list. This page is that list promoted to a real route so an order stays
// reachable without remembering its id.
type OrderFilter = "all" | "active" | "delivered" | "cancelled";

function orderBucket(order: Order): Exclude<OrderFilter, "all"> {
  if (order.cancelled) return "cancelled";
  return order.deliveryStatus === "FullyDelivered" ? "delivered" : "active";
}

// Same date the plan cards read — plan-level range first, first sub-event as
// the fallback for plans created as a side effect of another flow.
function planStartDate(plan: Plan | undefined) {
  return plan?.eventStartDate ?? plan?.subEvents[0]?.eventDate;
}

function planDateLabel(plan: Plan | undefined) {
  if (!plan) return "No date set";
  return formatEventDateRange(planStartDate(plan), plan.eventEndDate);
}

function StatusBadge({ order }: { order: Order }) {
  const bucket = orderBucket(order);
  if (bucket === "cancelled") {
    return (
      <Badge variant="outline" className="gap-1.5 border-destructive/60 text-destructive">
        <XCircle className="size-3.5" /> Cancelled
      </Badge>
    );
  }
  if (bucket === "delivered") {
    return (
      <Badge variant="outline" className="gap-1.5 border-primary text-primary">
        <CircleCheck className="size-3.5" /> Fully delivered
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1.5 border-amber-500 text-amber-400">
      <Clock3 className="size-3.5" /> Delivery in progress
    </Badge>
  );
}

export default function OrdersPage() {
  const account = useRequireAccount();
  const { orders, plans } = useMockStore();
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [sort, setSort] = useState<"recent" | "event-date" | "amount">("recent");

  // An order belongs to whoever can see its plan — owners and co-owners both,
  // matching /plans rather than the narrower Account page list.
  const visibleOrders = useMemo(() => {
    if (!account) return [];
    const visiblePlanIds = new Set(
      plans.filter((p) => p.ownerAccountId === account.id || p.coOwners.some((c) => c.accountId === account.id)).map((p) => p.id),
    );
    return orders.filter((o) => visiblePlanIds.has(o.planId));
  }, [orders, plans, account]);

  const shownOrders = useMemo(() => {
    const list = filter === "all" ? visibleOrders : visibleOrders.filter((o) => orderBucket(o) === filter);
    const planFor = (o: Order) => plans.find((p) => p.id === o.planId);
    const sorted = [...list];
    if (sort === "recent") sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === "amount") sorted.sort((a, b) => b.paidAmount - a.paidAmount);
    if (sort === "event-date") {
      sorted.sort((a, b) => (planStartDate(planFor(a)) ?? "9999").localeCompare(planStartDate(planFor(b)) ?? "9999"));
    }
    return sorted;
  }, [visibleOrders, plans, filter, sort]);

  if (!account) return null;

  if (visibleOrders.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 py-16 text-center page-x">
        <div className="flex size-20 items-center justify-center rounded-2xl border border-primary bg-card text-primary">
          <PackageSearch className="size-10" />
        </div>
        <h1 className="font-serif text-2xl text-foreground">No orders yet</h1>
        <p className="max-w-[330px] text-sm leading-6 text-foreground/70">
          Orders appear here once a quotation is paid for. Start by building a Plan and submitting it for a quote.
        </p>
        <Button className="mt-2 rounded-lg bg-primary text-primary-foreground" nativeButton={false} render={<Link href="/plans">Go to my Plans</Link>} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl py-8 page-x">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">My Orders</h1>
        <Button variant="outline" className="shrink-0 border-primary/60 text-foreground" nativeButton={false} render={<Link href="/plans">My Plans</Link>} />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4 border-b border-border pb-6">
        <Select value={filter} onValueChange={(v) => v && setFilter(v as OrderFilter)}>
          <SelectTrigger className="w-52 rounded border-border bg-card">
            <SelectValue placeholder="All Orders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="active">Delivery in progress</SelectItem>
            <SelectItem value="delivered">Fully delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => v && setSort(v as "recent" | "event-date" | "amount")}>
          <SelectTrigger className="w-48 rounded border-border bg-card">
            <SelectValue placeholder="Sort: Most Recent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Sort: Most Recent</SelectItem>
            <SelectItem value="event-date">Sort: Event Date</SelectItem>
            <SelectItem value="amount">Sort: Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {shownOrders.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">No orders match this filter.</p>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {shownOrders.map((order) => {
            const plan = plans.find((p) => p.id === order.planId);
            return (
              <div
                key={order.id}
                className={cn(
                  "flex flex-col gap-5 rounded-xl border bg-card p-6 transition-colors md:flex-row md:items-center md:justify-between",
                  order.cancelled ? "border-destructive/30" : "border-border hover:border-primary",
                )}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link href={`/orders/${order.id}`} className="font-serif text-xl text-foreground transition-colors hover:text-primary">
                      Order #{order.id}
                    </Link>
                    <StatusBadge order={order} />
                  </div>
                  <p className="text-sm text-foreground/75">{plan?.name ?? "Plan unavailable"}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>{planDateLabel(plan)}</span>
                    <span>{plan?.venue || order.venue || "Venue not set"}</span>
                    <span>Deposit: {order.depositStatus === "RefundPending" ? "Refund pending" : order.depositStatus}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 md:items-end">
                  <span className="font-medium text-foreground">{formatRupees(order.paidAmount)}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" className="border-primary/60 text-foreground" nativeButton={false} render={<Link href={`/orders/${order.id}`}>Track</Link>} />
                    <Button
                      variant="outline"
                      className="border-primary/60 text-foreground"
                      nativeButton={false}
                      render={
                        <Link href={`/orders/${order.id}/invoice`} target="_blank">
                          Invoice
                        </Link>
                      }
                    />
                    {!order.cancelled && (
                      <Button
                        variant="outline"
                        className="border-destructive/60 text-destructive"
                        nativeButton={false}
                        render={<Link href={`/orders/${order.id}/cancel`}>Cancel</Link>}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
