import { apiFetch } from "@/services/api-client";
import type { RazorpayOrderParams } from "../types";

export function createRazorpayOrder(
  quotationLinkId: string,
): Promise<RazorpayOrderParams> {
  return apiFetch<RazorpayOrderParams>("api/storefront/payments/razorpay-order", {
    method: "POST",
    body: { quotationLinkId },
  });
}

// Confirmation happens via the backend's signed Razorpay webhook (Diagrams.md §4), not this
// call — this just lets the UI poll/report the client-side checkout outcome.
export function reportCheckoutResult(
  razorpayPaymentId: string,
  status: "success" | "failure",
): Promise<void> {
  return apiFetch<void>("api/storefront/payments/checkout-result", {
    method: "POST",
    body: { razorpayPaymentId, status },
  });
}
