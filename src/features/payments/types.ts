import type { Money } from "@/lib/money";

/** What the "Accept and pay" panel shows, all worked out by the backend (com.tentvaale.payment PaymentController.Payable). */
export interface Payable {
  /** False on a deployment without online payment: the plain Accept button stays. */
  online: boolean;
  quotationNumber: string;
  total: Money;
  /** Already verified as paid towards the rental (for example by the vendor). */
  paid: Money;
  /** The advance in full, a percentage of the total. */
  advance: Money;
  /** What is still short of the advance: the amount the customer pays now. */
  dueNow: Money;
  payable: boolean;
  /** Why it cannot be paid now (expired, already covered ...), written for the customer. */
  reason?: string | null;
}

/** What Razorpay's checkout needs to open. The amount is in paise; the key id is public. */
export interface Checkout {
  gatewayOrderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
  businessName: string;
  quotationNumber: string;
}

export type PaymentState = "NOT_STARTED" | "PAYMENT_PENDING" | "PAID_CONFIRMING_ORDER" | "ORDERED" | "NEEDS_REVIEW" | "FAILED";

/** Where a quotation request stands on payment (polled after the checkout closes). */
export interface PaymentProgress {
  state: PaymentState;
  orderId?: string | null;
  orderNumber?: string | null;
  reason?: string | null;
}

/** The three values Razorpay's checkout hands back on success; all three go to the backend, which verifies them. */
export interface RazorpayResult {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}
