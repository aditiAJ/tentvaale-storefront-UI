"use client";

import { use, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Check, ClipboardCheck, Package, Truck, CalendarDays, RotateCcw } from "lucide-react";
import { DUR, EASE, Reveal, SPRING, Stagger, StaggerItem } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useRequireAccount } from "@/features/auth";
import { planGroupLabel, useMockStore } from "@/mock-data/store";
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
  const reduce = useReducedMotion();

  if (!account) return null;
  if (!order || !quotation || !plan) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="font-serif text-2xl">Order not found</h1>
        <Button variant="outline" nativeButton={false} render={<Link href="/account#order-history">Order history</Link>} />
      </div>
    );
  }

  const breakdown: { label: string; amount: number }[] = [
    ...plan.subEvents.map((se) => ({
      label: se.name,
      amount: quotation.lines
        .filter((l) => l.accepted && plan.items.find((it) => it.id === l.planItemId)?.subEventId === se.id)
        .reduce((sum, l) => sum + l.unitPrice * l.confirmedQty, 0),
    })),
    {
      label: planGroupLabel(plan),
      amount: quotation.lines
        .filter((l) => l.accepted && plan.items.find((it) => it.id === l.planItemId)?.subEventId === null)
        .reduce((sum, l) => sum + l.unitPrice * l.confirmedQty, 0),
    },
  ].filter((b) => b.amount > 0);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-4 py-12">
      <section className="flex flex-col items-center gap-4 text-center">
        {/* The tick springs in on its own, then a gold ring expands past it
            once — the single celebratory beat on the whole flow, and the only
            place a one-shot flourish is warranted. */}
        <div className="relative flex size-20 items-center justify-center">
          {!reduce && (
            <motion.span
              className="absolute inset-0 rounded-sm ring-2 ring-primary"
              initial={{ scale: 0.8, opacity: 0.8 }}
              animate={{ scale: 1.7, opacity: 0 }}
              transition={{ duration: 1, ease: EASE.out, delay: 0.25 }}
            />
          )}
          <motion.div
            initial={{ scale: reduce ? 1 : 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={reduce ? { duration: 0.01 } : { ...SPRING.snappy, delay: 0.1 }}
            className="flex size-20 items-center justify-center rounded-sm bg-primary text-primary-foreground shadow-[0_8px_28px_-8px_color-mix(in_oklab,var(--primary)_70%,transparent)]"
          >
            <Check className="size-10" strokeWidth={2.5} />
          </motion.div>
        </div>
        <Reveal immediate delay={0.2} className="flex flex-col items-center gap-3">
          <h1 className="font-serif text-4xl text-foreground md:text-5xl">Order Confirmed</h1>
          <p className="text-base text-primary">
            Order #{order.id} — Event Date: {plan.subEvents[0]?.eventDate ?? "TBD"}
          </p>
        </Reveal>
      </section>

      <Reveal immediate delay={0.3} className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-e2">
        <h2 className="font-serif text-2xl text-foreground">Plan: {plan.name}</h2>
        <div className="mt-6 flex flex-col gap-3.5 text-sm">
          {breakdown.map((b) => (
            <div key={b.label} className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">{b.label}</span>
              <span className="text-foreground tabular-nums">{formatRupees(b.amount)}</span>
            </div>
          ))}
          <div className="border-t border-border pt-4">
            <div className="flex items-baseline justify-between gap-4 font-medium">
              <span className="text-foreground">Total Paid</span>
              <span className="font-serif text-3xl text-primary tabular-nums">{formatRupees(order.paidAmount)}</span>
            </div>
          </div>
        </div>
      </Reveal>

      <section className="w-full max-w-4xl">
        <h2 className="mb-8 font-serif text-3xl text-foreground">What happens next</h2>
        <Stagger gap={0.08} className="relative grid grid-cols-5 gap-2 md:gap-4">
          <div className="absolute top-6 right-[10%] left-[10%] border-t border-border" aria-hidden />
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const active = i === 0;
            return (
              <StaggerItem key={step.key} distance={12} className="relative flex flex-col items-center gap-3 text-center">
                <div
                  className={cn(
                    "flex size-12 items-center justify-center rounded-sm border transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-[0_4px_16px_-6px_color-mix(in_oklab,var(--primary)_70%,transparent)]"
                      : "border-border bg-background text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <span className={cn("text-xs leading-4 md:text-sm", active ? "font-medium text-primary" : "text-muted-foreground")}>
                  {step.label}
                </span>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      <Reveal className="flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" variant="outline" nativeButton={false} render={<Link href={`/orders/${orderId}`}>Track Delivery</Link>} />
        <Button size="lg" variant="ghost" nativeButton={false} render={<Link href={`/plans/${plan.id}`}>View Plan</Link>} />
      </Reveal>

      <Reveal className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-e1">
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-2xl text-foreground">Stay updated</h2>
          <div className="mt-4 flex items-center justify-between border-t border-border py-4">
            <span className="text-sm text-foreground">Email notifications</span>
            <Switch checked={emailNotify} onCheckedChange={setEmailNotify} />
          </div>
          <div className="flex items-center justify-between border-t border-border py-4">
            <span className="text-sm text-foreground">WhatsApp notifications</span>
            <Switch checked={whatsappNotify} onCheckedChange={setWhatsappNotify} />
          </div>
          <p className="text-sm text-muted-foreground">We&apos;ll message you at each stage of your order.</p>
        </div>
      </Reveal>
    </div>
  );
}
