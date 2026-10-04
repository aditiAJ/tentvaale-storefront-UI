"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { useRequireAccount, useSession } from "@/features/auth";
import { useQuotation } from "@/features/quotations";
import { COMPANY } from "@/lib/company";
import { formatMoney } from "@/lib/money";

/**
 * Printable quotation, opened from the quotation page's "Download" button.
 *
 * `?download=1` fires window.print once the page has settled, and document.title names the PDF. It
 * prints what the backend says (lines, delivery, discount, total, deposit, validity) and calculates
 * nothing. A quotation the vendor has not sent has no prices, so there is nothing to print.
 *
 * Deliberately NOT themed: a document that gets printed and emailed is black on white regardless of
 * the viewer's theme.
 */
const day = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const formatDay = (iso?: string) => (iso ? day.format(new Date(`${iso}T00:00:00`)) : "");

export default function QuotationPrintPage({ params }: { params: Promise<{ quotationId: string }> }) {
  const { quotationId: requestId } = use(params);
  const signedIn = useRequireAccount();
  const { account } = useSession();
  const query = useQuotation(requestId);
  const quotation = query.data;
  const printable = Boolean(quotation && quotation.totalAmount);
  const ready = Boolean(signedIn && account && printable);

  useEffect(() => {
    if (!ready || !quotation) return;
    const previousTitle = document.title;
    document.title = `Tentvaale-Quotation-${quotation.quotationNumber}`;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (new URLSearchParams(window.location.search).has("download")) {
      timer = setTimeout(() => window.print(), 250);
    }
    return () => {
      clearTimeout(timer);
      document.title = previousTitle;
    };
  }, [ready, quotation]);

  if (!signedIn || !account) return null;
  if (query.isPending) return <div className="mx-auto w-full max-w-4xl py-10 page-x">Loading…</div>;
  if (!quotation || !printable) {
    return (
      <div className="mx-auto w-full max-w-4xl py-10 page-x">
        {query.isError ? "Quotation not found." : "This quotation has not been sent yet, so there is nothing to print."}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f2f2] text-[#1a1a1a]">
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          .quote-toolbar { display: none !important; }
          .quote-sheet { box-shadow: none; margin: 0 !important; width: auto !important; min-height: 0 !important; }
          body { background: #fff !important; }
        }
      `}</style>

      <div className="quote-toolbar sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[#b8862f]/30 bg-[#0d0d0d]/95 px-4 py-3 backdrop-blur md:px-8">
        <Link href={`/quotations/${requestId}`} className="flex items-center gap-2 text-sm text-[#f7f1e6] hover:text-[#d4a64a]">
          <ArrowLeft className="size-4" /> Back to quotation
        </Link>
        <span className="hidden text-sm text-[#f7f1e6]/70 sm:inline">Quotation {quotation.quotationNumber}</span>
        <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg bg-[#b8862f] px-4 py-2 text-sm font-medium text-[#0d0d0d] hover:bg-[#d4a64a]">
          <Download className="size-4" /> Download PDF
        </button>
      </div>

      <div className="mx-auto my-8 w-[210mm] max-w-full">
        <div className="quote-sheet min-h-[297mm] bg-white p-10 shadow-2xl">
          <header className="flex items-start justify-between gap-6 border-b-2 border-[#b8862f] pb-6">
            <div>
              <h1 className="font-serif text-3xl tracking-wide text-[#b8862f]">Tentvaale</h1>
              <p className="mt-1 text-xs leading-5 text-[#555]">
                {COMPANY.address.inline}
                <br />
                {COMPANY.phones.map((p) => p.display).join(" · ")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">QUOTATION</p>
              <p className="mt-1 text-xs text-[#555]">{quotation.quotationNumber}</p>
              {quotation.versions.length > 0 && <p className="text-xs text-[#555]">Version {quotation.versions.length}</p>}
              {quotation.validUntil && <p className="text-xs text-[#555]">Valid until {formatDay(quotation.validUntil)}</p>}
            </div>
          </header>

          <section className="mt-6 text-sm">
            <p className="text-[11px] tracking-wider text-[#888] uppercase">Prepared for</p>
            <p className="mt-1 font-medium">{account.fullName}</p>
            <p className="text-xs text-[#555]">{account.email}</p>
            {account.phone && <p className="text-xs text-[#555]">{account.phone}</p>}
          </section>

          <table className="mt-8 w-full border-collapse text-sm">
            <thead>
              <tr className="border-y border-[#ddd] text-left text-[11px] tracking-wider text-[#888] uppercase">
                <th className="py-2.5 font-medium">Item</th>
                <th className="py-2.5 text-right font-medium">Qty</th>
                <th className="py-2.5 text-right font-medium">Days</th>
                <th className="py-2.5 text-right font-medium">Per day</th>
                <th className="py-2.5 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {quotation.lines.map((line, index) => (
                <tr key={index} className="border-b border-[#eee] align-top">
                  <td className="py-3 pr-4">{line.productName}</td>
                  <td className="py-3 text-right tabular-nums">{line.quantity}</td>
                  <td className="py-3 text-right tabular-nums">{line.rentalDays}</td>
                  <td className="py-3 text-right tabular-nums">{formatMoney(line.unitRatePerDay)}</td>
                  <td className="py-3 text-right tabular-nums">{formatMoney(line.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="pt-3 text-xs text-[#555]" colSpan={4}>Items</td>
                <td className="pt-3 text-right tabular-nums">{formatMoney(quotation.subtotalAmount)}</td>
              </tr>
              {quotation.deliveryCharge && quotation.deliveryCharge.amount > 0 && (
                <tr>
                  <td className="pt-1 text-xs text-[#555]" colSpan={4}>Delivery</td>
                  <td className="pt-1 text-right tabular-nums">{formatMoney(quotation.deliveryCharge)}</td>
                </tr>
              )}
              {quotation.discountAmount && quotation.discountAmount.amount > 0 && (
                <tr>
                  <td className="pt-1 text-xs text-[#555]" colSpan={4}>Discount</td>
                  <td className="pt-1 text-right tabular-nums">−{formatMoney(quotation.discountAmount)}</td>
                </tr>
              )}
              <tr className="border-t-2 border-[#b8862f]">
                <td className="py-3 text-sm font-semibold" colSpan={4}>Total</td>
                <td className="py-3 text-right text-base font-semibold tabular-nums">{formatMoney(quotation.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>

          {quotation.securityDeposit && quotation.securityDeposit.amount > 0 && (
            <p className="mt-4 text-xs text-[#555]">
              Refundable security deposit: <span className="font-medium text-[#1a1a1a]">{formatMoney(quotation.securityDeposit)}</span>,
              collected with the order and returned after your items come back in good condition.
            </p>
          )}

          <footer className="mt-10 border-t border-[#eee] pt-4 text-[11px] leading-5 text-[#777]">
            <p>Prices are per day. Taxes are not included in this quotation.</p>
            {quotation.validUntil && <p>This quotation is valid until {formatDay(quotation.validUntil)}.</p>}
            <p className="mt-2">Full rental terms and policies are provided with the order confirmation.</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
