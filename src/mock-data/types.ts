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

export type IndoorOutdoor = "Indoor" | "Outdoor" | "Indoor & outdoor";

// Catalog taxonomy lives in mock-data/taxonomy.ts: every product carries the
// global facets (colour, material, mood, theme fit, indoor/outdoor; price band
// is derived from basePrice) plus its category's own facets in `attributes`.
export interface Product {
  id: string;
  name: string;
  /** One of CATEGORIES[].name in taxonomy.ts. */
  category: string;
  /** One of that category's subcategories. */
  subcategory?: string;
  rateType: RateType;
  basePrice: number;
  /** Only set where a real product photo was supplied — see ProductThumb for the fallback. */
  imageUrl?: string;
  /**
   * Extra views for the gallery and the card's hover swap. Optional: when it is
   * absent, `productImages()` in seed.ts derives alternates from `imageUrl`, so
   * a product only needs this once real multi-angle photography exists.
   */
  imageUrls?: string[];
  /** Display size for cards, e.g. "200 × 90 × 85 cm". */
  size?: string;
  /**
   * Max units the warehouse holds — an admin-entered figure, NOT a live
   * availability count. It tells a customer the ceiling on what they can order;
   * it does not know what is already booked for their dates. Admin sources it
   * from `Master_Product_WarehouseStock.TotalStock`.
   */
  availableQuantity?: number;
  colours?: string[];
  materials?: string[];
  moods?: string[];
  themes?: string[];
  setting?: IndoorOutdoor;
  /** From the shared fabric vocabulary: upholstery options (Furniture) or the fabric itself (Fabric). */
  fabrics?: string[];
  /** Category-only facets, keyed by the facet label in taxonomy.ts (e.g. "Seating capacity"). */
  attributes?: Record<string, string>;
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
  /** Occasions this look suits, shown as chips on the card. */
  bestFor: string[];
  /** Short palette line, e.g. "Crimson · Antique gold · Ivory". */
  palette: string;
}

export interface Bundle {
  id: string;
  name: string;
  /** One-line hook shown under the name on cards. */
  tagline: string;
  description: string;
  imageUrl: string;
  includedProductIds: string[];
  occasion: string;
  /** Guest range the set is sized for, e.g. "80–120". */
  guests: string;
  setupTime: string;
  /** 3–4 selling points listed on the bundle page. */
  highlights: string[];
}

// Only name + eventDate are asked for when a sub-event is created; the rest
// are optional logistics the customer can fill in at creation or leave blank.
export interface SubEventDetails {
  venue?: string;
  setupDate?: string;
  teardownDate?: string;
  guestCount?: number;
  /** HH:mm, 24h. Time-of-day for the Timeline view — date alone doesn't show overlap within a day. */
  startTime?: string;
  endTime?: string;
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
  /** Chosen upholstery fabric (shared fabric vocabulary) for Furniture. */
  fabric?: string;
  /**
   * Chosen colour, from the product's `colours`. Admin models colour as one
   * value per product row (Master_Product.IDColor), so when a real backend
   * lands this resolves to a sibling product rather than a modifier — keeping
   * it on the line means that migration is a lookup, not a data loss.
   */
  colour?: string;
}

export type PlanCoOwnerRole = "CoOwner" | "ViewOnlyPlanner";

export interface PlanCoOwner {
  accountId: string;
  email: string;
  name: string;
  role: PlanCoOwnerRole;
}

export type PlanAuditAction =
  | "PlanEdited"
  | "ItemAdded"
  | "ItemRemoved"
  | "SubEventAdded"
  | "SubEventEdited"
  | "SubEventRemoved"
  | "ItemSharingChanged"
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

export type ItemSharingDecision = "Shared" | "Dedicated";

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
  // Manual customer declaration, never system-inferred (Plan Board redesign,
  // 2026-09-14): for a product used across 2+ sub-events, "Shared" means the
  // same physical units are reused between them (required qty = the largest
  // single sub-event's need); "Dedicated" means separate stock per sub-event
  // (required qty = sum). A product with no entry here is undecided — that's
  // what drives the Plan Health nudges, not a default of either state.
  itemSharing?: Record<string, ItemSharingDecision>; // productId -> decision
  // "Complete your setup" areas (entry-gate, passage...) already filled, keyed
  // by sub-event id ("general" for the untagged list).
  setupAdded?: Record<string, string[]>;
  /** Customer's name for items not tied to a function (subEventId null). Shown as "Your event" until renamed. */
  generalLabel?: string;
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
