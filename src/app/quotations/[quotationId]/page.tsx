import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Flow 5: review a (possibly revised, multi-round) quotation line-by-line.
// Owner can accept only the confirmed/acceptable subset, not all-or-nothing —
// recalculated payable amount is for the accepted subset only.
export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ quotationId: string }>;
}) {
  const { quotationId } = await params;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">
        Quotation {quotationId}
      </h1>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Line items &amp; negotiation history go here</CardTitle>
            <CardDescription>
              Wire up to features/quotations getQuotation() /
              getQuotationHistory(). Per-line checkboxes feed
              acceptQuotationLines(); a reject action needs an explicit UI
              choice (revert to Draft vs Cancelled) — no implicit timeout, per
              Flow 5. Accepting routes to /checkout/[quotationId].
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
