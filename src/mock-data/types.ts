// Local-first mock domain model for the Plan-Board flows (Contexts/Tentvaale_Storefront_UserFlows.md.txt
// Flow 1-8). Shaped for convenient in-memory/localStorage mutation, not as a REST
// contract — the typed fetch layer in src/features/*/api still holds that contract
// for when a real backend exists. Swap the store's actions for real API calls then;
// pages consume the store through useMockStore(), not these types directly.

export type AccountType = "Customer" | "EventPlanner";

export interface Account {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountType: AccountType;
}

export type RateType = "Qty" | "SqFt" | "RFt";

export interface Product {
  id: string;
  name: string;
  category: string;
  rateType: RateType;
  basePrice: number;
  /** Only set where a real product photo was supplied — see ProductThumb for the fallback. */
  imageUrl?: string;
}

export interface SubEvent {
  id: string;
  name: string;
  eventDate: string;
}

export interface PlanItem {
  id: string;
  subEventId: string | null; // null = tagged to the plan generally
  productId: string;
  quantity: number;
  dimensions?: { length: number; width?: number };
}

export type PlanCoOwnerRole = "CoOwner" | "ViewOnlyPlanner";

export interface PlanCoOwner {
  accountId: string;
  email: string;
  name: string;
  role: PlanCoOwnerRole;
}

export type PlanAuditAction =
  | "ItemAdded"
  | "ItemRemoved"
  | "SubEventAdded"
  | "SubEventRemoved"
  | "CoOwnerAdded"
  | "CoOwnerRemoved"
  | "PlanSubmitted"
  | "QuotationAccepted"
  | "QuotationRejected"
  | "OrderPaid"
  | "OrderCancelled";

export interface PlanAuditEntry {
  id: string;
  action: PlanAuditAction;
  detail: string;
  accountId: string;
  createdAt: string;
}

export type PlanStatus = "Draft" | "Submitted" | "Quoted" | "PartiallyAccepted" | "Ordered" | "Cancelled";

export interface Plan {
  id: string;
  ownerAccountId: string;
  name: string;
  status: PlanStatus;
  subEvents: SubEvent[];
  items: PlanItem[];
  coOwners: PlanCoOwner[];
  auditLog: PlanAuditEntry[];
  createdAt: string;
}

export type QuotationLineStatus = "Confirmed" | "Adjusted" | "Rejected";

export interface QuotationLine {
  planItemId: string;
  productId: string;
  productName: string;
  requestedQty: number;
  confirmedQty: number;
  unitPrice: number;
  status: QuotationLineStatus;
  accepted: boolean;
}

export type QuotationStatus = "Open" | "PartiallyAccepted" | "Accepted" | "Rejected" | "Expired";

export interface Quotation {
  id: string;
  planId: string;
  subEventId: string | null; // null = plan-level (rolls up all sub-events)
  round: number;
  lines: QuotationLine[];
  validUntil: string;
  status: QuotationStatus;
}

export type DeliveryStatus = "InProgress" | "FullyDelivered";
export type DepositStatus = "Held" | "RefundPending" | "Refunded" | "Forfeited";

export interface Order {
  id: string;
  quotationId: string;
  planId: string;
  deliveryStatus: DeliveryStatus;
  cancelled: boolean;
  depositStatus: DepositStatus;
  paidAmount: number;
  depositAmount: number;
  createdAt: string;
}
