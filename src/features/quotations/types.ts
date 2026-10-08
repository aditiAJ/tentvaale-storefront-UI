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
  /** Set when the line came from a bundle. */
  bundleName?: string;
  /** What the quotation document groups and pictures the line by; absent on a quotation written before they were kept. */
  categoryName?: string | null;
  imageUrl?: string | null;
  functionName?: string | null;
  /** yyyy-MM-dd */
  functionDate?: string | null;
  /** HH:mm */
  functionStartTime?: string | null;
  functionVenue?: string | null;
}

/** One discount line per bundle: its percentage off what its items add up to. */
/** GST on the items after discounts: CGST + SGST in the vendor's state, IGST elsewhere. Delivery and the deposit are not taxed. */
export interface QuotationTax {
  rate: number | null;
  taxableAmount: Money;
  cgst: Money;
  sgst: Money;
  igst: Money;
  placeOfSupply?: string | null;
  intraState: boolean;
}

export interface DepositWaiver {
  waived: boolean;
  amount: Money;
}

export interface PolicyRef {
  kind: string;
  version: number;
}

export interface BundleDiscount {
  name: string;
  percent: number;
  itemsTotal: Money;
  amount: Money;
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
  bundleDiscounts?: BundleDiscount[];
  tax?: QuotationTax;
  depositWaiver?: DepositWaiver;
}

/** The business as the quotation document prints it. */
export interface QuotationCompany {
  name: string;
  gstin: string | null;
  pan: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  primaryPhone: string | null;
  publicEmail: string | null;
  websiteUrl: string | null;
  bankName: string | null;
  bankAccount: string | null;
  bankIfsc: string | null;
  upiId: string | null;
  logoUrl: string | null;
  signatureUrl: string | null;
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
  bundleDiscounts?: BundleDiscount[];
  tax?: QuotationTax;
  depositWaiver?: DepositWaiver;
  /** The policy versions this quotation was sent with. */
  policies?: PolicyRef[];
  eventDate?: string | null;
  venue?: string | null;
  company?: QuotationCompany | null;
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
    label: "Approved by our team",
    tone: "success",
    text: "Our team has approved this quotation. Place your order below to confirm it.",
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
