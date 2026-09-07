"use client";

import { use } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRequireAccount } from "@/features/auth";
import { useMockStore } from "@/mock-data/store";
import { formatRupees } from "@/mock-data/seed";

// Flow 7: order-level delivery status only — resolved 2026-09-02. Admin's
// stock movement can't be attributed below order-level, so the UI must not
// imply per-sub-event precision.
// Flow 8: cancellation — rental charge is flatly non-refundable (stated
// plainly, not in fine print); deposit refund initiates immediately if paid.
export default function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const account = useRequireAccount();
  const { getOrder, getQuotation, previewCancellation, cancelOrder } = useMockStore();
  const order = getOrder(orderId);
  const quotation = order ? getQuotation(order.quotationId) : undefined;

  if (!account) return null;
  if (!order || !quotation) return <div className="mx-auto w-full max-w-4xl px-4 py-10">Order not found.</div>;

  const preview = previewCancellation(orderId);

  function handleCancel() {
    cancelOrder(orderId);
    toast.success("Order cancelled — refund status updated below.");
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant={order.deliveryStatus === "FullyDelivered" ? "default" : "secondary"}>
              {order.deliveryStatus === "FullyDelivered" ? "Fully delivered" : "Delivery in progress"}
            </Badge>
            {order.cancelled && <Badge variant="destructive">Cancelled</Badge>}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Order {order.id}</h1>
        </div>
        {!order.cancelled && (
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive">Cancel order</Button>} />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                <AlertDialogDescription>
                  The rental charge is non-refundable — stated plainly here, not buried in fine print.{" "}
                  {preview.depositRefundable
                    ? "Your security deposit refund will be initiated immediately."
                    : "Your security deposit refund will be held pending admin review after the event."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep order</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancel}>Confirm cancellation</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {order.cancelled && (
        <Alert className="mt-6">
          <AlertTitle>Cancellation processed</AlertTitle>
          <AlertDescription>
            Deposit status: {order.depositStatus === "RefundPending" ? "Refund pending review" : order.depositStatus}. Rental charge
            of {formatRupees(order.paidAmount - order.depositAmount)} is not refundable.
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Delivery</CardTitle>
            <CardDescription>
              {order.deliveryStatus === "FullyDelivered"
                ? "Everything has been delivered."
                : "Dispatch in progress — status updates as admin performs dispatch/return."}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payments</CardTitle>
            <CardDescription>
              Paid {formatRupees(order.paidAmount)} · Deposit {formatRupees(order.depositAmount)} ({order.depositStatus})
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="mt-6 space-y-2">
        <h2 className="text-lg font-medium">Order lines</h2>
        {quotation.lines
          .filter((l) => l.accepted)
          .map((l) => (
            <Card key={l.planItemId}>
              <CardContent className="flex items-center justify-between py-4">
                <span>
                  {l.productName} × {l.confirmedQty}
                </span>
                <span className="font-medium">{formatRupees(l.unitPrice * l.confirmedQty)}</span>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
