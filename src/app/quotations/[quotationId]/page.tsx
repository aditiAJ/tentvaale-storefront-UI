"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Download, TriangleAlert } from "lucide-react";
import { Reveal } from "@/components/motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useRequireAccount } from "@/features/auth";
import {
  STAGE_COPY,
  useQuotation,
  useQuotationActions,
  type CustomerQuotation,
  type QuotationLine,
  type QuotationVersion,
} from "@/features/quotations";
import { formatMoney, type Money } from "@/lib/money";
import { ApiError } from "@/services/api-client";

/**
 * A quotation, as its customer sees it. The route id is the quotation REQUEST id.
 *
 * Everything on this page is what the backend says: the prices, the delivery charge, the discount,
 * the total, the deposit and the validity. Nothing is worked out here, and nothing is shown until the
 * vendor has sent the quotation. The customer's choices are the whole quotation or nothing: accept it,
 * ask for changes (the vendor revises and re-sends, and every version is kept), or reject it.
 */
const day = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const formatDay = (iso?: string) => (iso ? day.format(new Date(`${iso}T00:00:00`)) : "");
const formatMoment = (iso?: string) => (iso ? day.format(new Date(iso)) : "");

const message = (error: unknown, fallback: string) => (error instanceof ApiError ? error.message : fallback);

export default function QuotationPage({ params }: { params: Promise<{ quotationId: string }> }) {
  const { quotationId: requestId } = use(params);
  const account = useRequireAccount();
  const query = useQuotation(requestId);

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
        <h1 className="font-serif text-2xl">{missing ? "Quotation not found" : "We couldn't load this quotation"}</h1>
        <p className="text-sm text-muted-foreground">
          {missing ? "It may belong to another account, or the link is wrong." : message(query.error, "Please try again.")}
        </p>
        {missing ? (
          <Button nativeButton={false} render={<Link href="/plans">My plans</Link>} />
        ) : (
          <Button onClick={() => void query.refetch()}>Try again</Button>
        )}
      </div>
    );
  }

  return <QuotationView quotation={query.data} requestId={requestId} />;
}

function QuotationView({ quotation, requestId }: { quotation: CustomerQuotation; requestId: string }) {
  const router = useRouter();
  const actions = useQuotationActions(requestId);
  const [dialog, setDialog] = useState<"changes" | "reject" | null>(null);
  const [text, setText] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const copy = STAGE_COPY[quotation.stage];
  const showPrices = quotation.totalAmount !== undefined;
  const canDecide = quotation.stage === "READY";
  const busy = actions.accept.isPending || actions.requestChanges.isPending || actions.reject.isPending;

  function openDialog(which: "changes" | "reject") {
    setText("");
    setProblem(null);
    setDialog(which);
  }

  async function accept() {
    try {
      const request = await actions.accept.mutateAsync();
      toast.success(`Accepted. Your order is ${request.orderNumber ?? "confirmed"}.`);
    } catch (error) {
      toast.error(message(error, "We couldn't accept the quotation just now."));
    }
  }

  async function submitDialog() {
    setProblem(null);
    try {
      if (dialog === "changes") {
        await actions.requestChanges.mutateAsync(text.trim());
        toast.success("Sent. We'll revise the quotation and send it again.");
      } else {
        await actions.reject.mutateAsync(text.trim());
        toast.success("Quotation rejected.");
      }
      setDialog(null);
    } catch (error) {
      setProblem(message(error, "That didn't go through. Please try again."));
    }
  }

  async function startOver() {
    try {
      await actions.reopen.mutateAsync();
      toast.success("Your plan is open again.");
      router.push(`/plans/${quotation.planId}`);
    } catch (error) {
      toast.error(message(error, "We couldn't reopen your plan."));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-8 page-x">
      <Reveal immediate className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Quotation</span>
          <h1 className="font-serif text-3xl text-foreground md:text-4xl">{quotation.quotationNumber}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={copy.tone}>{copy.label}</Badge>
            {quotation.validUntil && quotation.stage === "READY" && (
              <span className="text-xs text-muted-foreground">Valid until {formatDay(quotation.validUntil)}</span>
            )}
          </div>
        </div>
        {showPrices && (
          <Button
            variant="outline"
            className="shrink-0 gap-2"
            nativeButton={false}
            render={
              <Link href={`/quotations/${requestId}/print?download=1`} target="_blank">
                <Download className="size-4" /> Download quotation
              </Link>
            }
          />
        )}
      </Reveal>

      <Alert variant={copy.tone === "destructive" ? "destructive" : "default"}>
        <TriangleAlert className="size-4" />
        <AlertTitle>{copy.label}</AlertTitle>
        <AlertDescription>
          {copy.text}
          {quotation.stage === "REJECTED" && quotation.rejectionReason ? ` Reason: ${quotation.rejectionReason}` : ""}
        </AlertDescription>
      </Alert>

      {quotation.stage === "CHANGES_REQUESTED" && quotation.changeRequestNote && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs tracking-wider text-muted-foreground uppercase">What you asked for</p>
          <p className="mt-2 text-sm leading-6 text-foreground">{quotation.changeRequestNote}</p>
        </section>
      )}

      {showPrices && (
        <div className="grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_320px]">
          <LineTable lines={quotation.lines} />

          <aside className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-e2 md:sticky md:top-24">
            <Totals
              subtotal={quotation.subtotalAmount}
              delivery={quotation.deliveryCharge}
              discount={quotation.discountAmount}
              total={quotation.totalAmount}
              deposit={quotation.securityDeposit}
            />
            {canDecide && (
              <div className="mt-2 flex flex-col gap-2.5">
                <Button size="lg" className="w-full" onClick={accept} disabled={busy}>
                  {actions.accept.isPending ? "Accepting…" : "Accept quotation"}
                </Button>
                <Button variant="outline" size="lg" className="w-full" onClick={() => openDialog("changes")} disabled={busy}>
                  Request changes
                </Button>
                <Button variant="ghost" size="lg" className="w-full text-destructive" onClick={() => openDialog("reject")} disabled={busy}>
                  Reject quotation
                </Button>
              </div>
            )}
          </aside>
        </div>
      )}

      {quotation.stage === "ORDERED" && (
        <section className="flex flex-col items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <p className="flex items-center gap-2 font-serif text-xl text-foreground">
            <CheckCircle2 className="size-5 text-primary" /> Order {quotation.orderNumber ?? "confirmed"}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            Your order is confirmed at the total above. Our team will be in touch about delivery and payment.
          </p>
          <Button variant="outline" nativeButton={false} render={<Link href={`/plans/${quotation.planId}`}>View my plan</Link>} />
        </section>
      )}

      {(quotation.stage === "REJECTED" || quotation.stage === "EXPIRED") && (
        <div className="flex flex-wrap gap-3">
          <Button onClick={startOver} disabled={actions.reopen.isPending}>
            {actions.reopen.isPending ? "Opening…" : "Change my plan and ask again"}
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/plans">My plans</Link>} />
        </div>
      )}

      {quotation.versions.length > 0 && <History versions={quotation.versions} />}

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog === "changes" ? "Request changes" : "Reject this quotation"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-6 text-muted-foreground">
            {dialog === "changes"
              ? "Tell us what to change: quantities, days, delivery, anything. We'll send a revised quotation."
              : "Tell us why. This ends the quotation; you can change your plan and ask again afterwards."}
          </p>
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={dialog === "changes" ? 2000 : 1000}
            placeholder={dialog === "changes" ? "For example: can we drop one day?" : "Your reason"}
            aria-label={dialog === "changes" ? "What to change" : "Reason for rejecting"}
          />
          {problem && <p className="text-sm text-destructive">{problem}</p>}
          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              variant={dialog === "reject" ? "destructive" : "default"}
              onClick={submitDialog}
              disabled={text.trim() === "" || busy}
            >
              {dialog === "changes" ? "Send request" : "Reject quotation"}
            </Button>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={busy}>
              Back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LineTable({ lines }: { lines: QuotationLine[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-e1">
      <div className="hidden grid-cols-[2.4fr_0.8fr_0.8fr_1fr_1fr] gap-4 border-b border-border bg-muted/40 px-5 py-3.5 text-xs tracking-[0.12em] text-muted-foreground uppercase md:grid">
        <span>Item</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Days</span>
        <span className="text-right">Per day</span>
        <span className="text-right">Amount</span>
      </div>
      {lines.map((line, index) => (
        <div
          key={`${line.productId}-${line.variantId ?? 0}-${index}`}
          className="flex flex-col gap-1 border-b border-border px-5 py-4 text-sm last:border-b-0 md:grid md:grid-cols-[2.4fr_0.8fr_0.8fr_1fr_1fr] md:items-center md:gap-4"
        >
          <span className="text-foreground">{line.productName}</span>
          <span className="text-muted-foreground tabular-nums md:text-right">
            <span className="md:hidden">Qty </span>
            {line.quantity}
          </span>
          <span className="text-muted-foreground tabular-nums md:text-right">
            <span className="md:hidden">Days </span>
            {line.rentalDays}
          </span>
          <span className="text-muted-foreground tabular-nums md:text-right">{formatMoney(line.unitRatePerDay)}</span>
          <span className="text-foreground tabular-nums md:text-right">{formatMoney(line.lineTotal)}</span>
        </div>
      ))}
    </div>
  );
}

function Totals({
  subtotal,
  delivery,
  discount,
  total,
  deposit,
}: {
  subtotal?: Money;
  delivery?: Money;
  discount?: Money;
  total?: Money;
  deposit?: Money;
}) {
  const row = (label: string, value?: Money, negative = false) => (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground tabular-nums">
        {negative && value && value.amount > 0 ? "−" : ""}
        {formatMoney(value)}
      </span>
    </div>
  );
  return (
    <>
      <h2 className="font-serif text-2xl text-foreground">Your quotation</h2>
      {row("Items", subtotal)}
      {delivery && delivery.amount > 0 && row("Delivery", delivery)}
      {discount && discount.amount > 0 && row("Discount", discount, true)}
      <div className="flex items-baseline justify-between gap-3 border-t border-border pt-3">
        <span className="text-sm font-medium text-foreground">Total</span>
        <span className="font-serif text-3xl text-primary tabular-nums">{formatMoney(total)}</span>
      </div>
      {deposit && deposit.amount > 0 && (
        <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs leading-5 text-muted-foreground">
          Plus a refundable security deposit of <span className="text-foreground tabular-nums">{formatMoney(deposit)}</span>,
          returned after your items come back in good condition.
        </p>
      )}
    </>
  );
}

function History({ versions }: { versions: QuotationVersion[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-serif text-xl text-foreground">Version history</h2>
      <ul className="flex flex-col gap-2">
        {[...versions].reverse().map((version) => (
          <li key={version.versionNo} className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
            <details>
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                <span className="text-foreground">
                  Version {version.versionNo} <span className="text-muted-foreground">· sent {formatMoment(version.sentAt)}</span>
                </span>
                <span className="text-foreground tabular-nums">{formatMoney(version.totalAmount)}</span>
              </summary>
              <div className="mt-3 flex flex-col gap-3">
                <LineTable lines={version.lines} />
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  <span>Items {formatMoney(version.subtotalAmount)}</span>
                  {version.deliveryCharge.amount > 0 && <span>Delivery {formatMoney(version.deliveryCharge)}</span>}
                  {version.discountAmount.amount > 0 && <span>Discount −{formatMoney(version.discountAmount)}</span>}
                  {version.validUntil && <span>Valid until {formatDay(version.validUntil)}</span>}
                </div>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
