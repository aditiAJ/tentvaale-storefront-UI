"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { useRequireAccount } from "@/features/auth";
import { useMockStore } from "@/mock-data/store";
import { COMPANY } from "@/lib/company";
import { formatEventDateRange, formatRupees } from "@/mock-data/seed";
import { planGroupLabel } from "@/mock-data/store";

/**
 * Printable quotation, opened from the quotation page's "Download" button.
 *
 * Same mechanism as the order invoice (`?download=1` fires window.print once
 * the page has settled, document.title names the PDF) but a much lighter
 * document: a quotation is a priced line list, not a tax invoice, so it has no
 * GST block, no per-warehouse challan and no payment ledger.
 *
 * Deliberately NOT themed. A document that gets printed and emailed is black
 * on white regardless of the viewer's theme — printing the charcoal palette
 * wastes ink and reads badly on paper.
 */
export default function QuotationPrintPage({ params }: { params: Promise<{ quotationId: string }> }) {
  const { quotationId } = use(params);
  const account = useRequireAccount();
  const { getQuotation, getPlan } = useMockStore();

  const quotation = getQuotation(quotationId);
  const plan = quotation ? getPlan(quotation.planId) : undefined;
  const quoteNo = quotation ? `TV-QT-${new Date().getFullYear()}-${quotation.id.slice(-6).toUpperCase()}` : "";
  const ready = Boolean(account && quotation && plan);

  useEffect(() => {
    if (!ready) return;
    const previousTitle = document.title;
    document.title = `Tentvaale-Quotation-${quoteNo}`;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (new URLSearchParams(window.location.search).has("download")) {
      timer = setTimeout(() => window.print(), 250);
    }
    return () => {
      clearTimeout(timer);
      document.title = previousTitle;
    };
  }, [ready, quoteNo]);

  if (!account) return null;
  if (!quotation || !plan) return <div className="mx-auto w-full max-w-4xl py-10 page-x">Quotation not found.</div>;

  // Rejected lines are listed but not charged, so the customer can see what was
  // declined and why rather than silently finding items missing.
  const priced = quotation.lines.filter((l) => l.status !== "Rejected");
  const rejected = quotation.lines.filter((l) => l.status === "Rejected");
  const total = priced.reduce((sum, l) => sum + l.unitPrice * l.confirmedQty, 0);
  const scope = quotation.subEventId ? plan.subEvents.find((se) => se.id === quotation.subEventId)?.name : planGroupLabel(plan);

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
        <Link href={`/quotations/${quotationId}`} className="flex items-center gap-2 text-sm text-[#f7f1e6] hover:text-[#d4a64a]">
          <ArrowLeft className="size-4" /> Back to quotation
        </Link>
        <span className="hidden text-sm text-[#f7f1e6]/70 sm:inline">Quotation {quoteNo}</span>
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
              <p className="mt-1 text-xs text-[#555]">{quoteNo}</p>
              <p className="text-xs text-[#555]">Round {quotation.round}</p>
              <p className="text-xs text-[#555]">Valid until {quotation.validUntil}</p>
            </div>
          </header>

          <section className="mt-6 grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-[11px] tracking-wider text-[#888] uppercase">Prepared for</p>
              <p className="mt-1 font-medium">{account.name}</p>
              <p className="text-xs text-[#555]">{account.email}</p>
              {account.phone && <p className="text-xs text-[#555]">{account.phone}</p>}
            </div>
            <div>
              <p className="text-[11px] tracking-wider text-[#888] uppercase">Event</p>
              <p className="mt-1 font-medium">{plan.name}</p>
              <p className="text-xs text-[#555]">{scope}</p>
              <p className="text-xs text-[#555]">{formatEventDateRange(plan.eventStartDate ?? plan.subEvents[0]?.eventDate, plan.eventEndDate)}</p>
              {plan.venue && <p className="text-xs text-[#555]">{plan.venue}</p>}
            </div>
          </section>

          <table className="mt-8 w-full border-collapse text-sm">
            <thead>
              <tr className="border-y border-[#ddd] text-left text-[11px] tracking-wider text-[#888] uppercase">
                <th className="py-2.5 font-medium">Item</th>
                <th className="py-2.5 text-right font-medium">Qty</th>
                <th className="py-2.5 text-right font-medium">Unit</th>
                <th className="py-2.5 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {priced.map((line) => (
                <tr key={line.planItemId} className="border-b border-[#eee] align-top">
                  <td className="py-3 pr-4">
                    {line.productName}
                    {line.reason && <span className="mt-0.5 block text-xs text-[#8a6d1f]">{line.reason}</span>}
                  </td>
                  <td className="py-3 text-right tabular-nums">{line.confirmedQty}</td>
                  <td className="py-3 text-right tabular-nums">{formatRupees(line.unitPrice)}</td>
                  <td className="py-3 text-right tabular-nums">{formatRupees(line.unitPrice * line.confirmedQty)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#b8862f]">
                <td className="py-3 text-sm font-semibold" colSpan={3}>
                  Total
                </td>
                <td className="py-3 text-right text-base font-semibold tabular-nums">{formatRupees(total)}</td>
              </tr>
            </tfoot>
          </table>

          {rejected.length > 0 && (
            <section className="mt-6 border-t border-[#eee] pt-4">
              <p className="text-[11px] tracking-wider text-[#888] uppercase">Not available</p>
              <ul className="mt-2 flex flex-col gap-1 text-xs text-[#555]">
                {rejected.map((line) => (
                  <li key={line.planItemId}>
                    {line.productName}
                    {line.reason ? ` — ${line.reason}` : ""}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <footer className="mt-10 border-t border-[#eee] pt-4 text-[11px] leading-5 text-[#777]">
            <p>Prices are per day unless stated otherwise and exclude a refundable security deposit, collected with the order.</p>
            <p>This quotation is valid until {quotation.validUntil}. Rental charges are non-refundable once an order is confirmed.</p>
            <p className="mt-2">Indicative terms — full rental terms and policies are provided with the order confirmation.</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
