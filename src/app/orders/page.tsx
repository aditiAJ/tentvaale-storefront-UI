"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAccount } from "@/features/auth";
import { statusCopy, useOrders, type OrderStatus } from "@/features/orders";
import { formatMoney } from "@/lib/money";
import { ApiError } from "@/services/api-client";

/** The customer's orders: the ones created when they accepted a quotation. */
type Filter = "all" | "active" | "completed" | "cancelled";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "In progress" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

function bucket(status: OrderStatus): Exclude<Filter, "all"> {
  if (status === "CANCELLED") return "cancelled";
  if (status === "COMPLETED") return "completed";
  return "active";
}

const day = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const formatDay = (iso?: string) => (iso ? day.format(new Date(`${iso.slice(0, 10)}T00:00:00`)) : "No date set");

export default function OrdersPage() {
  const account = useRequireAccount();
  const query = useOrders(Boolean(account));
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(
    () => (query.data ?? []).filter((order) => filter === "all" || bucket(order.status) === filter),
    [query.data, filter],
  );

  if (!account) return null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-8 page-x">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">My Orders</h1>
        <p className="text-sm text-muted-foreground">Orders you have placed from an accepted quotation, and where each one has got to.</p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter orders">
        {FILTERS.map((option) => (
          <Button
            key={option.key}
            size="sm"
            variant={filter === option.key ? "default" : "outline"}
            onClick={() => setFilter(option.key)}
            role="tab"
            aria-selected={filter === option.key}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {query.isPending && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {query.isError && (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-foreground">
            {query.error instanceof ApiError ? query.error.message : "We couldn't load your orders."}
          </p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Try again
          </Button>
        </div>
      )}

      {query.data && visible.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <PackageSearch className="size-8 text-muted-foreground" />
          <p className="font-serif text-xl text-foreground">
            {query.data.length === 0 ? "No orders yet" : "No orders in this view"}
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {query.data.length === 0
              ? "When you accept a quotation, your order appears here."
              : "Try another filter."}
          </p>
          {query.data.length === 0 && <Button nativeButton={false} render={<Link href="/plans">My plans</Link>} />}
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {visible.map((order) => {
          const copy = statusCopy(order);
          return (
            <li key={order.orderId}>
              <Link
                href={`/orders/${order.orderId}`}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
              >
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{order.orderNumber}</span>
                    <Badge variant={copy.tone}>{copy.label}</Badge>
                  </div>
                  <span className="truncate text-sm text-muted-foreground">{order.planName}</span>
                  <span className="text-xs text-muted-foreground">
                    Event {formatDay(order.eventDate)} · {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                  </span>
                </div>
                <span className="font-serif text-xl text-primary tabular-nums">{formatMoney(order.totalAmount)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
