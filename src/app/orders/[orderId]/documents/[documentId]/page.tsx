"use client";

import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAccount } from "@/features/auth";
import { DOCUMENT_LABEL, useOrderDocument } from "@/features/orders";

const inr = (value: number | undefined | null) =>
  value == null
    ? "—"
    : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(value);

/** An invoice or receipt we issued for the customer's own order, ready to print or save as PDF. */
export default function DocumentPage({ params }: { params: Promise<{ orderId: string; documentId: string }> }) {
  const { orderId, documentId } = use(params);
  const account = useRequireAccount();
  const query = useOrderDocument(orderId, documentId);
  if (!account) return null;
  if (query.isPending) {
    return (
      <div className="mx-auto w-full max-w-3xl py-10 page-x">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-3 py-24 text-center page-x">
        <h1 className="font-serif text-2xl">Document not found</h1>
        <Button nativeButton={false} render={<Link href={`/orders/${orderId}`}>Back to the order</Link>} />
      </div>
    );
  }
  const d = query.data;
  const b = d.body;
  const s = b.seller ?? {};
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 py-8 page-x">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link className="text-sm text-primary hover:underline" href={`/orders/${orderId}`}>
          Back to order {d.orderNumber}
        </Link>
        <Button onClick={() => window.print()}>Print</Button>
      </div>
      <article className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-8 text-sm print:border-0 print:p-0">
        <header className="flex items-start justify-between gap-4">
          <div>
            {s.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.logoUrl} alt={s.name ?? "Logo"} className="mb-2 h-14 w-auto" />
            ) : null}
            <h1 className="font-serif text-xl text-foreground">{s.name}</h1>
            <p className="text-muted-foreground">{[s.address, s.city, s.state, s.postalCode].filter(Boolean).join(", ")}</p>
            <p className="text-muted-foreground">
              {s.gstin ? `GSTIN ${s.gstin}` : ""}
              {s.pan ? ` · PAN ${s.pan}` : ""}
            </p>
          </div>
          <div className="text-right">
            <h2 className="font-serif text-2xl uppercase">{DOCUMENT_LABEL[d.kind]}</h2>
            <p className="tabular-nums">{d.number}</p>
            <p className="text-muted-foreground">Dated {d.issuedOn}</p>
            <p className="text-muted-foreground">Order {d.orderNumber}</p>
          </div>
        </header>
        <section>
          <p className="text-xs uppercase text-muted-foreground">Billed to</p>
          <p className="font-medium text-foreground">{b.buyer?.name}</p>
          <p className="text-muted-foreground">
            {[b.buyer?.email, b.buyer?.state].filter(Boolean).join(" · ")}
            {b.buyer?.gstin ? ` · GSTIN ${b.buyer.gstin}` : ""}
          </p>
        </section>
        {b.lines && (
          <div className="flex flex-col">
            {b.lines.map((l, i) => (
              <div key={i} className="flex justify-between gap-3 border-b border-border py-2">
                <span>
                  {l.description} <span className="text-muted-foreground">× {l.quantity}, {l.days} day{l.days === 1 ? "" : "s"}</span>
                </span>
                <span className="tabular-nums">{inr(l.amount)}</span>
              </div>
            ))}
          </div>
        )}
        {b.payment && (
          <p>
            Received with thanks {inr(b.payment.amount)} on {b.payment.paidOn}
            {b.payment.reference ? `, reference ${b.payment.reference}` : ""}. Order total {inr(b.orderTotal)}, received to date{" "}
            {inr(b.receivedToDate)}, balance {inr(b.balanceAfter)}.
          </p>
        )}
        {b.total != null && (
          <dl className="ml-auto flex w-72 flex-col gap-1">
            {b.discounts ? <Line label="Discounts" value={`− ${inr(b.discounts)}`} /> : null}
            {b.tax && <Line label="Taxable amount" value={inr(b.tax.taxableAmount)} />}
            {b.tax && b.tax.intraState && <Line label={`CGST (${b.tax.rate / 2}%)`} value={inr(b.tax.cgst)} />}
            {b.tax && b.tax.intraState && <Line label={`SGST (${b.tax.rate / 2}%)`} value={inr(b.tax.sgst)} />}
            {b.tax && !b.tax.intraState && <Line label={`IGST (${b.tax.rate}%)`} value={inr(b.tax.igst)} />}
            {b.delivery ? <Line label="Delivery" value={inr(b.delivery)} /> : null}
            <Line label="Total" value={inr(b.total)} strong />
            {b.creditNotesApplied ? <Line label="Credit applied" value={`− ${inr(b.creditNotesApplied)}`} /> : null}
            {b.rentalReceived != null && <Line label="Received" value={`− ${inr(b.rentalReceived)}`} />}
            {b.balanceDue != null && <Line label="Balance due" value={inr(b.balanceDue)} strong />}
            {b.securityDeposit ? <Line label="Refundable deposit (not taxed)" value={inr(b.securityDeposit)} /> : null}
          </dl>
        )}
        <footer className="flex items-end justify-between gap-4 border-t border-border pt-4 text-muted-foreground">
          <div>
            {s.bankName && (
              <p>
                {s.bankName} · A/c {s.bankAccount} · IFSC {s.bankIfsc}
              </p>
            )}
            {s.upiId && <p>UPI {s.upiId}</p>}
          </div>
          <div className="text-right">
            {s.signatureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.signatureUrl} alt="Signature" className="mb-1 ml-auto h-12 w-auto" />
            ) : null}
            <p>Authorised signatory</p>
          </div>
        </footer>
      </article>
    </div>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "flex justify-between border-t border-border pt-1 font-semibold" : "flex justify-between"}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
