import type { Money } from "@/lib/money";

/**
 * A quotation as its customer may see it (CustomerQuotationView on the backend).
 *
 * Amounts and lines are present only once the vendor has sent the quotation; while it is being
 * priced or revised they are absent and only the stage and the history show. The backend, not the
 * browser, works out every total: nothing here is calculated on.
 */
export type QuotationStage =
  | "IN_REVIEW"
  | "READY"
  | "CHANGES_REQUESTED"
  | "ACCEPTED"
  | "ORDERED"
  | "REJECTED"
  | "EXPIRED"
  | "CLOSED";

export interface QuotationLine {
  productId: number;
  variantId?: number | null;
  productName: string;
  quantity: number;
  rentalDays: number;
  unitRatePerDay: Money;
  lineTotal: Money;
}

export interface QuotationVersion {
  versionNo: number;
  sentAt: string;
  validUntil?: string;
  subtotalAmount: Money;
  deliveryCharge: Money;
  discountAmount: Money;
  totalAmount: Money;
  securityDeposit: Money;
  lines: QuotationLine[];
}

export interface CustomerQuotation {
  requestId: string;
  planId: string;
  quotationNumber: string;
  stage: QuotationStage;
  validUntil?: string;
  sentAt?: string;
  subtotalAmount?: Money;
  deliveryCharge?: Money;
  discountAmount?: Money;
  totalAmount?: Money;
  securityDeposit?: Money;
  lines: QuotationLine[];
  changeRequestNote?: string;
  rejectionReason?: string;
  orderId?: string;
  orderNumber?: string;
  versions: QuotationVersion[];
}

/** What the customer reads for each stage, and how loudly. */
export const STAGE_COPY: Record<
  QuotationStage,
  { label: string; tone: "default" | "success" | "warning" | "destructive"; text: string }
> = {
  IN_REVIEW: {
    label: "Being prepared",
    tone: "warning",
    text: "Our team is pricing your plan and checking availability. You will see the quotation here as soon as it is sent. You have not been charged.",
  },
  READY: {
    label: "Ready for your decision",
    tone: "default",
    text: "Review the quotation below. You can accept it, ask for changes, or reject it.",
  },
  CHANGES_REQUESTED: {
    label: "Revision requested",
    tone: "warning",
    text: "We have your request and are revising the quotation. The earlier version is kept below.",
  },
  ACCEPTED: {
    label: "Accepted",
    tone: "success",
    text: "This quotation has been accepted and is being turned into an order.",
  },
  ORDERED: { label: "Order confirmed", tone: "success", text: "This quotation became an order." },
  REJECTED: { label: "Rejected", tone: "destructive", text: "This quotation was rejected." },
  EXPIRED: {
    label: "Expired",
    tone: "destructive",
    text: "This quotation passed its validity date. You can start over from your plan to ask for a new one.",
  },
  CLOSED: { label: "Closed", tone: "destructive", text: "This request was closed. Your plan is open again." },
};
