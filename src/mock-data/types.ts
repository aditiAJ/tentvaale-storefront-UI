// Local-first mock domain model for the Plan-Board flows (Contexts/Tentvaale_Storefront_UserFlows.md.txt
// Flow 1-8). Shaped for convenient in-memory/localStorage mutation, not as a REST
// contract — the typed fetch layer in src/features/*/api still holds that contract
// for when a real backend exists. Swap the store's actions for real API calls then;
// pages consume the store through useMockStore(), not these types directly.

export type AccountType = "Customer" | "EventPlanner";

export interface Address {
  id: string;
  label: string;
  detail: string;
}

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

// A Bundle isn't its own line item — "Add Full Bundle to Plan" expands it into
// its included products as individual PlanItems, matching admin's real
// bundle -> individual-item expansion rule (Contexts/Specs/08-Product-Bundles.md).
// A Collection is a themed curation of ordinary catalog products ("Shop the
// Look") — unlike a Bundle it doesn't expand into a single add-to-plan action,
// each item is added individually.
export interface Collection {
  id: string;
  name: string;
  tagline: string;
  heroImageUrl: string;
  categories: string[];
  productIds: string[];
}

export interface Bundle {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  includedProductIds: string[];
}

// Only name + eventDate are asked for when a sub-event is created; the rest
// are optional logistics the customer can fill in at creation or leave blank.
export interface SubEventDetails {
  venue?: string;
  setupDate?: string;
  teardownDate?: string;
  guestCount?: number;
}

export interface SubEvent extends SubEventDetails {
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
  rentalStart?: string;
  rentalEnd?: string;
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

// The New Plan form requires all four of these. They stay optional on the
// type because plans created as a side effect of another flow (wishlist
// "create plan and add", AI planner, check-availability) have no form to
// collect them — those plans show "Not set" until the customer edits them.
export interface PlanEventDetails {
  venue?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  guestCount?: number;
}

export interface Plan extends PlanEventDetails {
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
  /** Shown for Adjusted/Rejected lines, e.g. "Only 1 pair available — adjusted to 1". */
  reason?: string;
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
  /** True only for Direct Order (Flow 4 branch) — skips negotiation, all lines pre-accepted at list price. */
  isDirectOrder?: boolean;
}

export type DeliveryStatus = "InProgress" | "FullyDelivered";
export type DepositStatus = "Held" | "RefundPending" | "Refunded" | "Forfeited";

export interface DispatchActivity {
  date: string;
  title: string;
  detail?: string;
}

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
  venue?: string;
  // NOTE: per-sub-event status/activity below is a deviation from the resolved
  // Flow 7 decision in Contexts/Tentvaale_Storefront_UserFlows.md.txt ("order-level
  // status only... don't ship a UI that implies precision the backend doesn't
  // have") — the Flowstep design (screen 33) explicitly calls for it. Flagged,
  // not silently overridden; worth revisiting once a real admin integration exists.
  subEventDeliveryStatus: Record<string, "Delivered" | "Pending">;
  dispatchLog: DispatchActivity[];
}
