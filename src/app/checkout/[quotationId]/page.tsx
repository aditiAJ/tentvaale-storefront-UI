"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BadgeCheck, LoaderCircle, LockKeyhole, ShieldCheck, TriangleAlert } from "lucide-react";
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
export default function CheckoutPage({ params }: { params: Promise<{ quotationId: string }> }) {
  const { quotationId } = use(params);
  const account = useRequireAccount();
  const router = useRouter();
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
  if (!quotation || !plan) return <div className="mx-auto w-full max-w-md px-4 py-10">Quotation not found.</div>;

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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">{quotation.isDirectOrder ? "Review & Pay" : "Checkout"}</p>
          <h1 className="font-serif text-3xl text-foreground md:text-4xl">Plan payment</h1>
          <p className="text-muted-foreground">{plan.name}</p>
        </div>
        {quotation.isDirectOrder && <span className="rounded-full border border-primary px-3 py-1 text-xs text-primary">Direct Order</span>}
      </div>

      <div className="grid items-start gap-8 md:grid-cols-[1.6fr_1fr]">
        <section className="flex flex-col gap-6">
          {status === "processing" ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-4 rounded-lg bg-card p-8">
              <LoaderCircle className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Processing your payment — do not close this window</p>
            </div>
          ) : status === "failed" ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-lg bg-card p-8 text-center">
              <TriangleAlert className="size-9 text-destructive" />
              <h3 className="font-serif text-2xl text-foreground">Payment Failed</h3>
              <p className="text-base text-foreground">Payment could not be completed</p>
              <p className="max-w-lg text-sm text-muted-foreground">No charge was made and no order was created. You can safely retry.</p>
              <Button className="bg-primary text-primary-foreground" onClick={handlePay}>
                Retry Payment
              </Button>
            </div>
          ) : (
            <>
              {/* Folded in from Flowstep screens 55/56 (Direct Order "Review & Pay" variants). */}
              <div className="flex flex-col gap-4 rounded-lg bg-card p-6">
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

              <div className="flex flex-col gap-6 rounded-lg bg-card p-6">
                <div className="flex flex-col gap-2">
                  <h2 className="font-serif text-2xl text-foreground">Payment Method</h2>
                  <p className="text-sm text-muted-foreground">Complete your payment securely with Razorpay.</p>
                </div>
                <Tabs defaultValue="UPI" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-muted">
                    <TabsTrigger value="Card">Card</TabsTrigger>
                    <TabsTrigger value="UPI">UPI</TabsTrigger>
                    <TabsTrigger value="Netbanking">Netbanking</TabsTrigger>
                  </TabsList>
                  <TabsContent value="Card" className="flex flex-col gap-4 pt-6">
                    <Input placeholder="Card number" />
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="MM / YY" />
                      <Input placeholder="CVV" />
                    </div>
                    <Button className="w-full bg-primary text-primary-foreground" onClick={handlePay} disabled={acceptedLines.length === 0}>
                      Pay {formatRupees(total)}
                    </Button>
                  </TabsContent>
                  <TabsContent value="UPI" className="flex flex-col gap-4 pt-6">
                    <Input placeholder="Enter UPI ID" />
                    <Button className="w-full bg-primary text-primary-foreground" onClick={handlePay} disabled={acceptedLines.length === 0}>
                      Pay {formatRupees(total)}
                    </Button>
                  </TabsContent>
                  <TabsContent value="Netbanking" className="flex flex-col gap-4 pt-6">
                    <div className="rounded bg-background p-6 text-sm text-muted-foreground">Select your bank to continue.</div>
                    <Button className="w-full bg-primary text-primary-foreground" onClick={handlePay} disabled={acceptedLines.length === 0}>
                      Pay {formatRupees(total)}
                    </Button>
                  </TabsContent>
                </Tabs>
                <div className="grid grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <LockKeyhole className="size-4 text-primary" /> 256-bit SSL Secured
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="size-4 text-primary" /> PCI DSS Compliant
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <BadgeCheck className="size-4 text-primary" /> Powered by Razorpay
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        <Card className="gap-6 border-border bg-card p-6">
          <CardHeader className="gap-2 p-0">
            <CardTitle className="font-serif text-2xl">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 p-0">
            {breakdown.map((b) => (
              <div key={b.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{b.label}</span>
                <span>{formatRupees(b.amount)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="font-medium">Total</span>
              <span className="font-serif text-3xl text-primary">{formatRupees(total)}</span>
            </div>
            <p className="text-sm text-muted-foreground">Full amount collected upfront. No partial payment.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
