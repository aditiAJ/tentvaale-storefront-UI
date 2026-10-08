import type { Money } from "@/lib/money";
import type { CatalogRateType } from "@/features/catalog/types";

/**
 * Plans as the backend serves them (com.tentvaale.planboard.api.PlanView). A plan belongs to one
 * account; it is freely editable while a DRAFT and the vendor's to work from after that.
 *
 * Nothing here is priced: a plan is a wish list. `product.dailyRate` is today's rate as this
 * customer would be quoted it, there so a screen can show an estimate; the quotation is what prices.
 *
 * The backend leaves out fields that are null, so every optional field here may simply be absent.
 */
export type PlanStatus = "DRAFT" | "SUBMITTED_FOR_QUOTATION" | "QUOTED" | "ORDERED";

/** SHARED: the same physical units are reused between functions. DEDICATED: separate stock for each. */
export type SharingDecision = "SHARED" | "DEDICATED";

/** A plan in the "my plans" list. */
export interface PlanSummary {
  id: string;
  name: string;
  status: PlanStatus;
  eventDate?: string;
  eventEndDate?: string;
  venue?: string;
  guestCount?: number;
  subEventCount: number;
  itemCount: number;
  /** The customer's picture of the event; absent when there is none. */
  coverImageUrl?: string;
  createdAt: string;
  /** What this account may do on the plan; absent from older responses (treat as the owner). */
  myRole?: PlanRole;
}

export interface PlanProductInfo {
  slug: string;
  imageUrl?: string;
  categoryName: string;
  subCategoryName: string;
  rateType: CatalogRateType;
  /** Absent when the product or variant has been taken off sale since it was added. */
  dailyRate?: Money;
  available: boolean;
}

export interface PlanItem {
  id: string;
  /** Absent: the item belongs to the plan as a whole, not to one function. */
  subEventId?: string;
  /** Every function this one line serves (a tent on Haldi and Sangeet is one line). Empty: the whole plan. */
  subEventIds?: string[];
  productId: number;
  variantId?: number;
  /** Includes the variant, "Banquet Chair (Velvet)". */
  productName: string;
  /** Units for a per-unit product; square or running feet for an area or length product. */
  quantity: number;
  rentalDays: number;
  rentalStart?: string;
  rentalEnd?: string;
  /** Absent only if the product no longer exists. */
  product?: PlanProductInfo;
  /** Set for items added from a bundle. */
  bundleGroupId?: string;
  bundleName?: string;
  bundleDiscountPercent?: number;
}

/** A bundle on the plan, priced from its items as they are now. */
export interface PlanBundle {
  groupId: string;
  slug?: string;
  name: string;
  discountPercent: number;
  itemsTotal: Money;
  discountAmount: Money;
  effectivePrice: Money;
}

export interface PlanSubEvent {
  id: string;
  name: string;
  scheduledOn?: string;
  venue?: string;
  setupOn?: string;
  teardownOn?: string;
  guestCount?: number;
  /** "HH:mm:ss" */
  startTime?: string;
  endTime?: string;
  items: PlanItem[];
  /** The saved venue this function chose; absent means the plan's venue. */
  venueDetail?: Venue;
}

export interface PlanSharing {
  productId: number;
  variantId?: number;
  decision: SharingDecision;
}

export interface Plan {
  id: string;
  ownerAccountId: string;
  companyId: number;
  name: string;
  eventDate?: string;
  eventEndDate?: string;
  venue?: string;
  guestCount?: number;
  /** What the customer calls the items on no function; absent shows as "Your event". */
  generalLabel?: string;
  /** The customer's picture of the event; absent when there is none. */
  coverImageUrl?: string;
  status: PlanStatus;
  createdAt: string;
  updatedAt?: string;
  subEvents: PlanSubEvent[];
  generalItems: PlanItem[];
  sharing: PlanSharing[];
  bundles?: PlanBundle[];
  venueDetail?: Venue;
  /** What the signed-in account may do: the owner everything, an editor changes it, a viewer only looks. */
  myRole?: PlanRole;
  /** Who is on the plan. Invitations still waiting are listed to the owner only. */
  members?: PlanMember[];
}

export type PlanRole = "OWNER" | "EDITOR" | "VIEWER";

export interface PlanMember {
  id: string;
  email: string;
  role: PlanRole;
  /** False until the invited person has signed in with that address and accepted. */
  accepted: boolean;
}

/** What an invitation is for, as the person it was sent to sees it. */
export interface PlanInvite {
  planId: string;
  planName: string;
  invitedBy?: string;
  role: PlanRole;
  email: string;
  accepted: boolean;
}

/** A saved venue: where an event is, with its map location when picked on a map. */
export interface Venue {
  id: string;
  label: string;
  addressText: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  accessNotes?: string;
}

// ---- requests --------------------------------------------------------------------------------------

export interface PlanDetailsInput {
  name: string;
  venue?: string;
  eventDate?: string;
  eventEndDate?: string;
  guestCount?: number;
  generalLabel?: string;
  /** A saved venue; null/absent clears it. */
  venueId?: string | null;
}

export interface SubEventInput {
  name: string;
  scheduledOn?: string;
  venue?: string;
  setupOn?: string;
  teardownOn?: string;
  guestCount?: number;
  startTime?: string;
  endTime?: string;
  venueId?: string | null;
}

export interface AddItemInput {
  /** Omit for the plan as a whole. */
  subEventId?: string | null;
  /** One item on several functions; wins over subEventId. */
  subEventIds?: string[];
  productId: number;
  variantId?: number | null;
  quantity: number;
  rentalStart?: string;
  rentalEnd?: string;
  /** The customer's own number of days; without dates or this, days come from the functions' dates. */
  rentalDays?: number;
}

export interface UpdateItemInput {
  subEventId?: string | null;
  subEventIds?: string[];
  quantity: number;
  rentalStart?: string;
  rentalEnd?: string;
  rentalDays?: number;
}

export interface BundleSwapInput {
  productId: number;
  variantId?: number | null;
  toProductId: number;
  toVariantId?: number | null;
}

export interface AddBundleInput {
  bundleSlug: string;
  subEventId?: string | null;
  rentalStart?: string;
  rentalEnd?: string;
  swaps?: BundleSwapInput[];
}
