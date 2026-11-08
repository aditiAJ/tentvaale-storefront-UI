import { apiFetch } from "@/services/api-client";
import type { Checkout, Payable, PaymentProgress, RazorpayResult } from "./types";

/**
 * The customer's payment of the advance on a sent quotation. Everything is addressed by the quotation REQUEST id, and the
 * backend works out the amount itself: nothing here ever sends one.
 */
const base = (requestId: string) => `storefront/payments/quotation-requests/${encodeURIComponent(requestId)}`;

export const getPayable = (requestId: string, signal?: AbortSignal) =>
  apiFetch<Payable>(`${base(requestId)}/payable`, { signal });

/** Opens a Razorpay payment for the advance. 422 with the reason when it cannot be paid (expired, already paid ...). */
export const createCheckout = (requestId: string) =>
  apiFetch<Checkout>("storefront/payments/quotation-checkout", { method: "POST", body: { requestId } });

/** The browser's success report. The backend verifies the signature and asks Razorpay; only then does anything count as paid. */
export const confirmPayment = (result: RazorpayResult) =>
  apiFetch<PaymentProgress>("storefront/payments/confirm", { method: "POST", body: result });

export const getProgress = (requestId: string, signal?: AbortSignal) =>
  apiFetch<PaymentProgress>(`${base(requestId)}/status`, { signal });
