import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Flow 6: Razorpay checkout for the accepted amount. Full order amount
// collected upfront regardless of staged delivery — no partial-pay option.
// Confirmation happens via signed webhook (Diagrams.md §4); this page just
// opens Razorpay checkout and reports the client-side outcome.
export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ quotationId: string }>;
}) {
  const { quotationId } = await params;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Checkout for {quotationId}</CardTitle>
          <CardDescription>
            Wire up to features/payments createRazorpayOrder(), then open the
            Razorpay Checkout.js widget client-side with the returned params.
            On success/failure call reportCheckoutResult(); actual order
            creation is server-side, idempotent on the webhook.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
