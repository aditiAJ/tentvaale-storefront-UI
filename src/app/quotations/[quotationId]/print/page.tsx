"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ArrowLeft, Download, Loader2, Printer } from "lucide-react";
import { useRequireAccount, useSession } from "@/features/auth";
import { useQuotation } from "@/features/quotations";

/**
 * The quotation as a real PDF (A4, selectable text, page numbers), opened from the quotation page's "Download"
 * button. It follows the site theme: dark when the site is dark, light otherwise. `?download=1` saves it as soon as
 * it is ready. It prints what the backend says and calculates nothing; a quotation the vendor has not sent has no
 * prices, so there is nothing to make.
 */
export default function QuotationPrintPage({ params }: { params: Promise<{ quotationId: string }> }) {
  const { quotationId: requestId } = use(params);
  const signedIn = useRequireAccount();
  const { account } = useSession();
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "light" ? "light" : "dark";
  const query = useQuotation(requestId);
  const quotation = query.data;
  const printable = Boolean(quotation && quotation.totalAmount);
  const ready = Boolean(signedIn && account && printable);
  const [pdf, setPdf] = useState<{ key: string; url: string; missing: number } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const key = `${quotation?.requestId}:${quotation?.stage}:${quotation?.totalAmount?.amount}:${theme}`;
  const fileName = `Tentvaale-Quotation-${quotation?.quotationNumber ?? ""}.pdf`;

  useEffect(() => {
    if (!ready || !quotation || !account) return;
    let cancelled = false;
    let made: string | null = null;
    void (async () => {
      try {
        // Loaded here only: the PDF engine is large and runs in the browser.
        const [{ pdf: render }, { QuotationDocument }, { buildQuotationDoc }] = await Promise.all([
          import("@react-pdf/renderer"),
          import("@/features/quotations/components/QuotationDocument"),
          import("@/features/quotations/components/buildQuotationDoc"),
        ]);
        const doc = await buildQuotationDoc(quotation, { name: account.fullName, email: account.email });
        const blob = await render(<QuotationDocument doc={doc} theme={theme} />).toBlob();
        if (cancelled) return;
        made = URL.createObjectURL(blob);
        setPdf({ key, url: made, missing: doc.picturesMissing });
        setFailed(null);
        if (new URLSearchParams(window.location.search).has("download")) {
          const a = document.createElement("a");
          a.href = made;
          a.download = `Tentvaale-Quotation-${quotation.quotationNumber}.pdf`;
          a.click();
        }
      } catch (error) {
        if (!cancelled) setFailed(error instanceof Error ? error.message : "The PDF could not be made.");
      }
    })();
    return () => {
      cancelled = true;
      if (made) URL.revokeObjectURL(made);
    };
  }, [ready, quotation, account, theme, key]);

  if (!signedIn || !account) return null;
  if (query.isPending) return <div className="mx-auto w-full max-w-4xl py-10 page-x">Loading…</div>;
  if (!quotation || !printable) {
    return (
      <div className="mx-auto w-full max-w-4xl py-10 page-x">
        {query.isError ? "Quotation not found." : "This quotation has not been sent yet, so there is nothing to print."}
      </div>
    );
  }

  const current = pdf?.key === key ? pdf.url : null;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 py-8 page-x">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/quotations/${requestId}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> Back to quotation
        </Link>
        <div className="flex gap-2">
          <button
            disabled={!current}
            onClick={() => current && window.open(current, "_blank", "noopener")}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
          >
            <Printer className="size-4" /> Open to print
          </button>
          <button
            disabled={!current}
            onClick={() => {
              if (!current) return;
              const a = document.createElement("a");
              a.href = current;
              a.download = fileName;
              a.click();
            }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Download className="size-4" /> Download PDF
          </button>
        </div>
      </div>

      {failed ? (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          The PDF could not be made: {failed}
        </p>
      ) : null}

      {current && pdf && pdf.missing > 0 ? (
        <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          {pdf.missing} product picture{pdf.missing === 1 ? "" : "s"} could not be loaded and show as plain tiles.
        </p>
      ) : null}

      {current ? (
        <iframe title={fileName} src={current} className="h-[80vh] w-full rounded-lg border border-border bg-card" />
      ) : failed ? null : (
        <div className="flex h-[60vh] items-center justify-center gap-2 rounded-lg border border-border bg-card text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Preparing your quotation…
        </div>
      )}
    </div>
  );
}
