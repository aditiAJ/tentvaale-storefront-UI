"use client";

import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRequireAccount } from "@/features/auth";
import { useMockStore } from "@/mock-data/store";

export default function AccountPage() {
  const account = useRequireAccount();
  const { plans, orders } = useMockStore();

  if (!account) return null;

  const myPlans = plans.filter((p) => p.ownerAccountId === account.id);
  const myOrders = orders.filter((o) => myPlans.some((p) => p.id === o.planId));

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Account</h1>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">{account.name}</CardTitle>
          <CardDescription>
            {account.email} · <Badge variant="secondary">{account.accountType}</Badge>
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="mt-8 space-y-2">
        <h2 className="text-lg font-medium">Your plans</h2>
        {myPlans.map((p) => (
          <Link key={p.id} href={`/plans/${p.id}`} className="block rounded-md border p-3 hover:border-primary">
            <div className="flex items-center justify-between">
              <span className="font-medium">{p.name}</span>
              <Badge variant="secondary">{p.status}</Badge>
            </div>
          </Link>
        ))}
        {myPlans.length === 0 && <p className="text-sm text-muted-foreground">No plans yet.</p>}
      </div>

      <div className="mt-8 space-y-2">
        <h2 className="text-lg font-medium">Your orders</h2>
        {myOrders.map((o) => (
          <Link key={o.id} href={`/orders/${o.id}`} className="block rounded-md border p-3 hover:border-primary">
            <div className="flex items-center justify-between">
              <span className="font-medium">{o.id}</span>
              <Badge variant={o.cancelled ? "destructive" : "secondary"}>{o.cancelled ? "Cancelled" : o.deliveryStatus}</Badge>
            </div>
          </Link>
        ))}
        {myOrders.length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
      </div>
    </div>
  );
}
