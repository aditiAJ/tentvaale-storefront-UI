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
  createdAt: string;
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
  status: PlanStatus;
  createdAt: string;
  updatedAt?: string;
  subEvents: PlanSubEvent[];
  generalItems: PlanItem[];
  sharing: PlanSharing[];
}

// ---- requests --------------------------------------------------------------------------------------

export interface PlanDetailsInput {
  name: string;
  venue?: string;
  eventDate?: string;
  eventEndDate?: string;
  guestCount?: number;
  generalLabel?: string;
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
}

export interface AddItemInput {
  /** Omit for the plan as a whole. */
  subEventId?: string | null;
  productId: number;
  variantId?: number | null;
  quantity: number;
  rentalStart?: string;
  rentalEnd?: string;
}

export interface UpdateItemInput {
  subEventId: string | null;
  quantity: number;
  rentalStart?: string;
  rentalEnd?: string;
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
