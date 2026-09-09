"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Check, ClipboardCheck, Package, Truck, CalendarDays, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useRequireAccount } from "@/features/auth";
import { useMockStore } from "@/mock-data/store";
import { formatRupees } from "@/mock-data/seed";

// Flowstep screen 31 (desktop) — mobile 32 not fetched; stacks naturally.
// One-time post-payment landing — distinct from the ongoing /orders/[orderId] tracking page.
const STEPS = [
  { key: "review", label: "Admin Review", icon: ClipboardCheck },
  { key: "dispatch", label: "Dispatch", icon: Package },
  { key: "delivery", label: "Delivery", icon: Truck },
  { key: "event", label: "Event Day", icon: CalendarDays },
  { key: "return", label: "Return", icon: RotateCcw },
];

export default function OrderConfirmedPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const account = useRequireAccount();
  const { getOrder, getQuotation, getPlan } = useMockStore();
  const order = getOrder(orderId);
  const quotation = order ? getQuotation(order.quotationId) : undefined;
  const plan = order ? getPlan(order.planId) : undefined;

  const [emailNotify, setEmailNotify] = useState(true);
  const [whatsappNotify, setWhatsappNotify] = useState(true);

  if (!account) return null;
  if (!order || !quotation || !plan) return <div className="mx-auto w-full max-w-2xl px-4 py-10">Order not found.</div>;

  const breakdown: { label: string; amount: number }[] = [
    ...plan.subEvents.map((se) => ({
      label: se.name,
      amount: quotation.lines
        .filter((l) => l.accepted && plan.items.find((it) => it.id === l.planItemId)?.subEventId === se.id)
        .reduce((sum, l) => sum + l.unitPrice * l.confirmedQty, 0),
    })),
    {
      label: "General",
      amount: quotation.lines
        .filter((l) => l.accepted && plan.items.find((it) => it.id === l.planItemId)?.subEventId === null)
        .reduce((sum, l) => sum + l.unitPrice * l.confirmedQty, 0),
    },
  ].filter((b) => b.amount > 0);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-4 py-12">
      <section className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-10" strokeWidth={2.5} />
        </div>
        <h1 className="font-serif text-4xl text-foreground md:text-5xl">Order Confirmed</h1>
        <p className="text-base text-primary">
          Order #{order.id} — Event Date: {plan.subEvents[0]?.eventDate ?? "TBD"}
        </p>
      </section>

      <section className="w-full max-w-2xl rounded-xl bg-card p-6">
        <h2 className="font-serif text-2xl text-foreground">Plan: {plan.name}</h2>
        <div className="mt-6 flex flex-col gap-4 text-sm">
          {breakdown.map((b) => (
            <div key={b.label} className="flex items-center justify-between">
              <span className="text-foreground/75">{b.label}</span>
              <span className="text-foreground">{formatRupees(b.amount)}</span>
            </div>
          ))}
          <div className="border-t border-primary/25 pt-4">
            <div className="flex items-center justify-between font-medium">
              <span className="text-foreground">Total Paid</span>
              <span className="text-xl text-primary">{formatRupees(order.paidAmount)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full max-w-4xl">
        <h2 className="mb-8 font-serif text-3xl text-foreground">What happens next</h2>
        <div className="relative grid grid-cols-5 gap-4">
          <div className="absolute top-6 right-[10%] left-[10%] border-t border-primary/30" />
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const active = i === 0;
            return (
              <div key={step.key} className="relative flex flex-col items-center gap-3 text-center">
                <div className={cn("flex size-12 items-center justify-center rounded-full border", active ? "border-primary bg-primary text-primary-foreground" : "border-foreground/30 bg-background text-foreground/50")}>
                  <Icon className="size-5" />
                </div>
                <span className={cn("text-sm", active ? "text-primary" : "text-foreground/55")}>{step.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex items-center gap-4">
        <Button variant="outline" className="rounded-lg border-primary text-primary" nativeButton={false} render={<Link href={`/orders/${orderId}`}>Track Delivery</Link>} />
        <Button variant="ghost" className="text-foreground/75" nativeButton={false} render={<Link href={`/plans/${plan.id}`}>View Plan</Link>} />
      </div>

      <section className="w-full max-w-2xl rounded-xl bg-card p-6">
        <div className="flex flex-col gap-4">
          <h2 className="font-serif text-2xl text-foreground">Stay updated</h2>
          <div className="flex items-center justify-between border-t border-primary/15 pt-4">
            <span className="text-sm text-foreground">Email notifications</span>
            <Switch checked={emailNotify} onCheckedChange={setEmailNotify} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">WhatsApp notifications</span>
            <Switch checked={whatsappNotify} onCheckedChange={setWhatsappNotify} />
          </div>
          <p className="text-sm text-foreground/55">We&apos;ll message you at each stage of your order.</p>
        </div>
      </section>
    </div>
  );
}
