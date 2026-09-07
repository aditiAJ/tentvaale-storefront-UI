"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRequireAccount } from "@/features/auth";
import { useMockStore } from "@/mock-data/store";
import { formatRupees } from "@/mock-data/seed";

// Flow 6: Payment. Full amount collected upfront regardless of staged
// delivery — no partial-pay-now-partial-later option (per PRD). Real
// integration is Razorpay; this simulates the checkout modal + webhook.
export default function CheckoutPage({ params }: { params: Promise<{ quotationId: string }> }) {
  const { quotationId } = use(params);
  const account = useRequireAccount();
  const router = useRouter();
  const { getQuotation, payForQuotation } = useMockStore();
  const quotation = getQuotation(quotationId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  if (!account) return null;
  if (!quotation) return <div className="mx-auto w-full max-w-md px-4 py-10">Quotation not found.</div>;

  const acceptedLines = quotation.lines.filter((l) => l.accepted);
  const payable = acceptedLines.reduce((sum, l) => sum + l.unitPrice * l.confirmedQty, 0);

  function handlePay() {
    setPaying(true);
    // Simulated Razorpay checkout + signed webhook round trip.
    setTimeout(() => {
      const order = payForQuotation(quotationId);
      setPaying(false);
      setDialogOpen(false);
      toast.success("Payment captured — order confirmed.");
      router.push(`/orders/${order.id}`);
    }, 900);
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          <CardDescription>{acceptedLines.length} accepted line(s)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            {acceptedLines.map((l) => (
              <div key={l.planItemId} className="flex justify-between text-sm">
                <span>
                  {l.productName} × {l.confirmedQty}
                </span>
                <span>{formatRupees(l.unitPrice * l.confirmedQty)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t pt-3 text-lg font-semibold">
            <span>Total</span>
            <span>{formatRupees(payable)}</span>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button className="w-full" onClick={() => setDialogOpen(true)} disabled={acceptedLines.length === 0}>
              Pay {formatRupees(payable)}
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Razorpay Checkout (simulated)</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                No real payment gateway is wired up yet — this simulates a successful capture and the backend webhook
                that follows.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={paying}>
                  Cancel
                </Button>
                <Button onClick={handlePay} disabled={paying}>
                  {paying ? "Processing..." : `Pay ${formatRupees(payable)}`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
