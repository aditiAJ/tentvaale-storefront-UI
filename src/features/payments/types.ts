export type PaymentType = "RentalCharge" | "SecurityDeposit";
export type PaymentStatus = "Created" | "Captured" | "Failed" | "Refunded";

export interface PaymentRecord {
  id: string;
  orderLinkId: string;
  razorpayPaymentId: string;
  type: PaymentType;
  status: PaymentStatus;
  amount: number;
}

export type DepositStatus = "Held" | "RefundPending" | "Refunded" | "Forfeited";

export interface DepositLedger {
  id: string;
  orderLinkId: string;
  amount: number;
  status: DepositStatus;
}

// Full amount collected upfront regardless of staged delivery — no partial-pay option (Flow 6).
export interface RazorpayOrderParams {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}
