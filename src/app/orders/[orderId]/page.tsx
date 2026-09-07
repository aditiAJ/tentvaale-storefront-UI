import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Flow 7: order-level delivery status only ("Delivery in progress" /
// "Fully delivered") — no per-sub-event breakdown, resolved 2026-09-02.
// Flow 8: cancellation — rental charge is flatly non-refundable (state this
// plainly, not in fine print); deposit refund flow depends on timing.
export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Order {orderId}
        </h1>
        <Button variant="destructive">Cancel</Button>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Delivery status &amp; payments go here</CardTitle>
            <CardDescription>
              Wire up to features/orders getDeliveryStatus(). Cancel button
              opens previewCancellation() first to show what&apos;s
              cancellable before calling cancelOrder().
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
