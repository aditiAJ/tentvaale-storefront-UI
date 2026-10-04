import type { CatalogRateType } from "@/features/catalog/types";
import type { Product, RateType } from "@/mock-data/types";
import { itemKey } from "./keys";
import type { Plan, PlanItem, PlanStatus } from "./types";

/**
 * The plan in the shape the plan board screens work with: one flat list of lines, each tagged with
 * the function it belongs to (or null for the whole plan), products keyed by "42" / "42-v7", and the
 * customer's sharing calls by that key.
 *
 * It is a reading of the backend's plan, rebuilt on every change; nothing is stored in it. For an
 * area or length product the quantity is the number of square or running feet, which the screens call
 * its `dimensions.length`.
 */
export type BoardRateType = RateType;

export interface BoardProduct extends Product {
  /** False when the product was taken off sale after it was added. */
  available: boolean;
  /** The product this line is an option of, for links and for calls back to the backend. */
  productId: number;
  variantId: number | null;
}

export interface BoardSubEvent {
  id: string;
  name: string;
  /** "" when no date has been given yet. */
  eventDate: string;
  venue?: string;
  setupDate?: string;
  teardownDate?: string;
  guestCount?: number;
  /** "HH:mm" */
  startTime?: string;
  endTime?: string;
}

export interface BoardItem {
  id: string;
  /** null = the item belongs to the plan as a whole. */
  subEventId: string | null;
  /** "42" or "42-v7"; see itemKey. */
  productId: string;
  quantity: number;
  dimensions?: { length: number };
  rentalStart?: string;
  rentalEnd?: string;
}

export type BoardDecision = "Shared" | "Dedicated";

export interface BoardPlan {
  id: string;
  name: string;
  status: PlanStatus;
  /** Only a draft can be changed. */
  editable: boolean;
  venue?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  guestCount?: number;
  generalLabel?: string;
  subEvents: BoardSubEvent[];
  items: BoardItem[];
  itemSharing: Record<string, BoardDecision>;
  products: BoardProduct[];
}

const RATE: Record<CatalogRateType, BoardRateType> = { QTY: "Qty", SQFT: "SqFt", RFT: "RFt" };

/** "19:00:00" -> "19:00" */
const hhmm = (time?: string) => (time ? time.slice(0, 5) : undefined);

function boardItem(item: PlanItem, subEventId: string | null): BoardItem {
  const perUnit = !item.product || item.product.rateType === "QTY";
  return {
    id: item.id,
    subEventId,
    productId: itemKey(item.productId, item.variantId),
    quantity: perUnit ? item.quantity : 1,
    dimensions: perUnit ? undefined : { length: item.quantity },
    rentalStart: item.rentalStart,
    rentalEnd: item.rentalEnd,
  };
}

export function toBoard(plan: Plan): BoardPlan {
  const items: BoardItem[] = [
    ...plan.subEvents.flatMap((se) => se.items.map((it) => boardItem(it, se.id))),
    ...plan.generalItems.map((it) => boardItem(it, null)),
  ];

  const products = new Map<string, BoardProduct>();
  for (const item of [...plan.subEvents.flatMap((se) => se.items), ...plan.generalItems]) {
    const key = itemKey(item.productId, item.variantId);
    if (products.has(key)) continue;
    const info = item.product;
    products.set(key, {
      id: key,
      slug: info?.slug,
      name: item.productName,
      category: info?.categoryName ?? "",
      subcategory: info?.subCategoryName,
      rateType: info ? RATE[info.rateType] : "Qty",
      basePrice: info?.dailyRate?.amount ?? 0,
      imageUrl: info?.imageUrl,
      available: info?.available ?? false,
      productId: item.productId,
      variantId: item.variantId ?? null,
    });
  }

  return {
    id: plan.id,
    name: plan.name,
    status: plan.status,
    editable: plan.status === "DRAFT",
    venue: plan.venue,
    eventStartDate: plan.eventDate,
    eventEndDate: plan.eventEndDate,
    guestCount: plan.guestCount,
    generalLabel: plan.generalLabel,
    subEvents: plan.subEvents.map((se) => ({
      id: se.id,
      name: se.name,
      eventDate: se.scheduledOn ?? "",
      venue: se.venue,
      setupDate: se.setupOn,
      teardownDate: se.teardownOn,
      guestCount: se.guestCount,
      startTime: hhmm(se.startTime),
      endTime: hhmm(se.endTime),
    })),
    items,
    itemSharing: Object.fromEntries(
      plan.sharing.map((s): [string, BoardDecision] => [itemKey(s.productId, s.variantId), s.decision === "SHARED" ? "Shared" : "Dedicated"]),
    ),
    products: [...products.values()],
  };
}

/** What a line costs at today's rate: a display estimate. The quotation is what prices the plan. */
export function lineQuantity(item: BoardItem): number {
  return item.dimensions?.length ?? item.quantity;
}

export function planGroupLabel(plan: Pick<BoardPlan, "generalLabel">): string {
  return plan.generalLabel?.trim() || "Your event";
}

/**
 * What a customer is told about a plan. The backend marks a plan QUOTED as soon as it raises a draft
 * quotation for the vendor to review, which is before the vendor has priced or sent anything, so both
 * of those read "Quotation requested" until the quotation journey (a later phase) shows more.
 */
export const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED_FOR_QUOTATION: "Quotation requested",
  QUOTED: "Quotation requested",
  ORDERED: "Ordered",
};
