"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, LoaderCircle, LockKeyhole, ShieldCheck, TriangleAlert } from "lucide-react";
import { DUR, EASE, Reveal } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRequireAccount } from "@/features/auth";
import { planGroupLabel, useMockStore } from "@/mock-data/store";
import { formatRupees } from "@/mock-data/seed";

// Flowstep screen 29 (desktop) — mobile 30 not fetched; stacks naturally.
// Screens 55/56 (Direct Order "Review & Pay" variants) are folded into this
// same page rather than duplicated: the "Direct Order" badge and Customer &
// Billing Information form below only differ by quotation.isDirectOrder /
// prefilled account data, same payment flow either way.
// Real Razorpay integration doesn't exist yet — this simulates the checkout
// widget, the signed-webhook round trip, and (per Flow 6) a failure state
// that leaves no ambiguous payment/order record and lets the owner retry.
/** The pay CTA is identical on all three tabs — one component, three uses. */
function PayButton({ total, onPay, disabled }: { total: number; onPay: () => void; disabled: boolean }) {
  return (
    <Button size="lg" className="w-full" onClick={onPay} disabled={disabled}>
      Pay {formatRupees(total)}
    </Button>
  );
}

export default function CheckoutPage({ params }: { params: Promise<{ quotationId: string }> }) {
  const { quotationId } = use(params);
  const account = useRequireAccount();
  const router = useRouter();
  const reduce = useReducedMotion();
  const { getQuotation, getPlan, payForQuotation } = useMockStore();
  const quotation = getQuotation(quotationId);
  const plan = quotation ? getPlan(quotation.planId) : undefined;

  const [status, setStatus] = useState<"idle" | "processing" | "failed">("idle");
  const [billingName, setBillingName] = useState(account?.name ?? "");
  const [billingEmail, setBillingEmail] = useState(account?.email ?? "");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingPostal, setBillingPostal] = useState("");

  const acceptedLines = useMemo(() => quotation?.lines.filter((l) => l.accepted) ?? [], [quotation]);
  const total = acceptedLines.reduce((sum, l) => sum + l.unitPrice * l.confirmedQty, 0);

  const breakdown = useMemo(() => {
    if (!plan) return [];
    const groups: { label: string; amount: number }[] = [
      ...plan.subEvents.map((se) => ({ label: se.name, amount: 0 })),
      { label: planGroupLabel(plan), amount: 0 },
    ];
    for (const line of acceptedLines) {
      const item = plan.items.find((it) => it.id === line.planItemId);
      const idx = item?.subEventId ? plan.subEvents.findIndex((se) => se.id === item.subEventId) : groups.length - 1;
      if (idx >= 0) groups[idx].amount += line.unitPrice * line.confirmedQty;
    }
    return groups.filter((g) => g.amount > 0);
  }, [plan, acceptedLines]);

  if (!account) return null;
  if (!quotation || !plan) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-4 py-24 text-center">
        <h1 className="font-serif text-2xl">Quotation not found</h1>
        <p className="text-sm text-muted-foreground">This checkout link may have expired.</p>
      </div>
    );
  }

  function handlePay() {
    if (!billingName.trim() || !billingEmail.trim()) {
      toast.error("Please fill in your name and email before paying.");
      return;
    }
    setStatus("processing");
    setTimeout(() => {
      // ~15% simulated failure rate so the retry path (Flow 6) is reachable.
      if (Math.random() < 0.15) {
        setStatus("failed");
        return;
      }
      const order = payForQuotation(quotationId);
      toast.success("Payment captured — order confirmed.");
      router.push(`/orders/${order.id}/confirmed`);
    }, 1200);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-8">
      <Reveal immediate className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">{quotation.isDirectOrder ? "Review & Pay" : "Checkout"}</p>
          <h1 className="font-serif text-3xl text-foreground md:text-4xl">Plan payment</h1>
          <p className="text-muted-foreground">{plan.name}</p>
        </div>
        {quotation.isDirectOrder && <Badge variant="accent">Direct Order</Badge>}
      </Reveal>

      <div className="grid items-start gap-8 md:grid-cols-[1.6fr_1fr]">
        {/* mode="wait" so the outgoing state clears before the next one lands —
            the three states differ in height and would otherwise overlap. */}
        <section className="flex flex-col gap-6">
          <AnimatePresence mode="wait" initial={false}>
          {status === "processing" ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: reduce ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -8, transition: { duration: DUR.fast, ease: EASE.in } }}
              transition={{ duration: DUR.base, ease: EASE.out }}
              className="flex min-h-48 flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-8 shadow-e1"
            >
              <LoaderCircle className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Processing your payment — do not close this window</p>
            </motion.div>
          ) : status === "failed" ? (
            <motion.div
              key="failed"
              initial={{ opacity: 0, y: reduce ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -8, transition: { duration: DUR.fast, ease: EASE.in } }}
              transition={{ duration: DUR.base, ease: EASE.out }}
              className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-destructive/30 bg-destructive/[0.04] p-8 text-center shadow-e1"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <TriangleAlert className="size-7" />
              </span>
              <h3 className="font-serif text-2xl text-foreground">Payment Failed</h3>
              <p className="max-w-lg text-sm leading-6 text-muted-foreground">
                No charge was made and no order was created. You can safely retry.
              </p>
              <Button size="lg" className="mt-1" onClick={handlePay}>
                Retry Payment
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: reduce ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -8, transition: { duration: DUR.fast, ease: EASE.in } }}
              transition={{ duration: DUR.base, ease: EASE.out }}
              className="flex flex-col gap-6"
            >
              {/* Folded in from Flowstep screens 55/56 (Direct Order "Review & Pay" variants). */}
              <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-e1">
                <h2 className="font-serif text-2xl text-foreground">Customer &amp; Billing Information</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm text-muted-foreground">Full name</Label>
                    <Input value={billingName} onChange={(e) => setBillingName(e.target.value)} placeholder="Enter your full name" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm text-muted-foreground">Email address</Label>
                    <Input type="email" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label className="text-sm text-muted-foreground">Billing address</Label>
                    <Input value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} placeholder="Enter your billing address" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm text-muted-foreground">City</Label>
                    <Input value={billingCity} onChange={(e) => setBillingCity(e.target.value)} placeholder="City" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm text-muted-foreground">Postal code</Label>
                    <Input value={billingPostal} onChange={(e) => setBillingPostal(e.target.value)} placeholder="Postal code" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-e1">
                <div className="flex flex-col gap-2">
                  <h2 className="font-serif text-2xl text-foreground">Payment Method</h2>
                  <p className="text-sm text-muted-foreground">Complete your payment securely with Razorpay.</p>
                </div>
                <Tabs defaultValue="UPI" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="Card">Card</TabsTrigger>
                    <TabsTrigger value="UPI">UPI</TabsTrigger>
                    <TabsTrigger value="Netbanking">Netbanking</TabsTrigger>
                  </TabsList>
                  <TabsContent value="Card" className="flex flex-col gap-4 pt-6">
                    <Input placeholder="Card number" inputMode="numeric" />
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="MM / YY" inputMode="numeric" />
                      <Input placeholder="CVV" inputMode="numeric" />
                    </div>
                    <PayButton total={total} onPay={handlePay} disabled={acceptedLines.length === 0} />
                  </TabsContent>
                  <TabsContent value="UPI" className="flex flex-col gap-4 pt-6">
                    <Input placeholder="Enter UPI ID" />
                    <PayButton total={total} onPay={handlePay} disabled={acceptedLines.length === 0} />
                  </TabsContent>
                  <TabsContent value="Netbanking" className="flex flex-col gap-4 pt-6">
                    <div className="rounded-xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">Select your bank to continue.</div>
                    <PayButton total={total} onPay={handlePay} disabled={acceptedLines.length === 0} />
                  </TabsContent>
                </Tabs>
                <div className="grid grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-3">
                  {[
                    { icon: LockKeyhole, label: "256-bit SSL Secured" },
                    { icon: ShieldCheck, label: "PCI DSS Compliant" },
                    { icon: BadgeCheck, label: "Powered by Razorpay" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon className="size-4 shrink-0 text-primary" /> {label}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </section>

        {/* Summary follows the form down the page — the total stays in view
            while the billing fields are filled in. */}
        <Card className="gap-6 border-border bg-card p-6 shadow-e2 md:sticky md:top-24">
          <CardHeader className="gap-2 p-0">
            <CardTitle className="font-serif text-2xl">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3.5 p-0">
            {breakdown.map((b) => (
              <div key={b.label} className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">{b.label}</span>
                <span className="tabular-nums">{formatRupees(b.amount)}</span>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4">
              <span className="font-medium">Total</span>
              <span className="font-serif text-3xl text-primary tabular-nums">{formatRupees(total)}</span>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">Full amount collected upfront. No partial payment.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
