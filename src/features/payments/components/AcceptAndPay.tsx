"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InlineError } from "@/components/inline-error";
import { formatMoney } from "@/lib/money";
import { usePayQuotation } from "../hooks";
import type { Payable } from "../types";

/**
 * "Accept and pay": the customer pays the advance (a quarter of the quotation, worked out by the backend) through Razorpay, and
 * that payment accepts the quotation and makes the order. Everything after the advance is arranged with the vendor, so there is
 * no amount to choose and nothing else to pay online.
 */
export function AcceptAndPay({ requestId, payable, disabled }: { requestId: string; payable: Payable; disabled?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { phase, error, orderId, pay, reset } = usePayQuotation(requestId);
  const working = phase === "starting" || phase === "checkout" || phase === "confirming" || phase === "waiting";
  const finished = phase === "done" || phase === "review";

  function close() {
    // The window cannot be closed on top of a payment being checked: leaving then could hide that it went through.
    if (working) return;
    setOpen(false);
    reset();
    if (phase === "done" && orderId) router.push(`/orders/${orderId}?placed=1`);
  }

  return (
    <>
      <Button size="lg" className="w-full" onClick={() => setOpen(true)} disabled={disabled}>
        Accept and pay {formatMoney(payable.dueNow)}
      </Button>
      <p className="text-xs leading-5 text-muted-foreground">
        You pay {formatMoney(payable.dueNow)} now, a quarter of the total, to confirm your booking. The rest is arranged with us
        after your order is confirmed.
      </p>

      <Dialog open={open} onOpenChange={(next) => !next && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{finished ? (phase === "done" ? "Payment received" : "Payment received, we are checking it") : "Accept and pay"}</DialogTitle>
          </DialogHeader>

          {finished ? (
            <div className="flex flex-col gap-3">
              <p className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="size-5 text-primary" />
                {phase === "done" ? "Thank you. Your order is confirmed." : "We have your payment."}
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                {phase === "done"
                  ? "You can follow it, and see your receipt, on your orders page."
                  : "Something about this booking needs a quick look from our team before it is confirmed. We will contact you shortly."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Quotation total</dt>
                <dd className="text-right tabular-nums">{formatMoney(payable.total)}</dd>
                {payable.paid.amount > 0 && (
                  <>
                    <dt className="text-muted-foreground">Already paid</dt>
                    <dd className="text-right tabular-nums">{formatMoney(payable.paid)}</dd>
                  </>
                )}
                <dt className="font-medium text-foreground">You pay now</dt>
                <dd className="text-right text-lg font-semibold tabular-nums text-foreground">{formatMoney(payable.dueNow)}</dd>
              </dl>
              <p className="text-sm leading-6 text-muted-foreground">
                Paying this accepts your quotation and confirms your order. Any balance is arranged with
                us afterwards.
              </p>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4" /> Secure payment by Razorpay: UPI, cards, netbanking and wallets.
              </p>
              {phase === "confirming" || phase === "waiting" ? (
                <p className="flex items-center gap-2 text-sm text-foreground" role="status">
                  <Loader2 className="size-4 animate-spin" />
                  {phase === "confirming" ? "Confirming your payment. Please do not close this page." : "Payment received. Confirming your order…"}
                </p>
              ) : null}
              {phase === "cancelled" && <p className="text-sm text-muted-foreground">The payment window was closed. Nothing was charged.</p>}
              {error && <InlineError>{error}</InlineError>}
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-start">
            {finished ? (
              <Button onClick={close}>{phase === "done" ? "View my order" : "Close"}</Button>
            ) : (
              <>
                <Button onClick={pay} disabled={working}>
                  {phase === "starting" || phase === "checkout" ? "Opening payment…" : `Pay ${formatMoney(payable.dueNow)}`}
                </Button>
                <Button variant="outline" onClick={close} disabled={working}>
                  Back
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
