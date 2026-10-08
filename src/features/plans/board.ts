import type { CatalogRateType } from "@/features/catalog/types";
import type { Product, RateType } from "@/mock-data/types";
import { itemKey } from "./keys";
import type { Plan, PlanBundle, PlanItem, PlanStatus } from "./types";

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
  venueId?: string;
  setupDate?: string;
  teardownDate?: string;
  guestCount?: number;
  /** "HH:mm" */
  startTime?: string;
  endTime?: string;
}

export interface BoardItem {
  id: string;
  /** The first function it serves; null = the item belongs to the plan as a whole. */
  subEventId: string | null;
  /** Every function it serves (one line, however many). Empty = the plan as a whole. */
  subEventIds: string[];
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
  /** Only a draft can be changed, and not by someone who was invited to look. */
  editable: boolean;
  /** What the signed-in account may do on the plan. */
  role: "OWNER" | "EDITOR" | "VIEWER";
  venue?: string;
  venueId?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  guestCount?: number;
  generalLabel?: string;
  /** The customer's picture of the event, when they added one. */
  coverImageUrl?: string;
  subEvents: BoardSubEvent[];
  items: BoardItem[];
  itemSharing: Record<string, BoardDecision>;
  products: BoardProduct[];
  /** Bundles on the plan, each priced from its items as they are now. */
  bundles: PlanBundle[];
}

const RATE: Record<CatalogRateType, BoardRateType> = { QTY: "Qty", SQFT: "SqFt", RFT: "RFt" };

/** "19:00:00" -> "19:00" */
const hhmm = (time?: string) => (time ? time.slice(0, 5) : undefined);

/** Whether a line serves a function (null = the plan as a whole). One line can serve several. */
export const serves = (item: BoardItem, subEventId: string | null) =>
  subEventId === null ? item.subEventIds.length === 0 : item.subEventIds.includes(subEventId);

function boardItem(item: PlanItem): BoardItem {
  const perUnit = !item.product || item.product.rateType === "QTY";
  const subEventIds = item.subEventIds ?? [];
  return {
    id: item.id,
    subEventId: subEventIds[0] ?? null,
    subEventIds,
    productId: itemKey(item.productId, item.variantId),
    quantity: perUnit ? item.quantity : 1,
    dimensions: perUnit ? undefined : { length: item.quantity },
    rentalStart: item.rentalStart,
    rentalEnd: item.rentalEnd,
  };
}

export function toBoard(plan: Plan): BoardPlan {
  // An item on several functions arrives under each of them: it is one line, kept once.
  const unique = new Map<string, PlanItem>();
  for (const it of [...plan.subEvents.flatMap((se) => se.items), ...plan.generalItems]) unique.set(it.id, it);
  const items: BoardItem[] = [...unique.values()].map(boardItem);

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
    editable: plan.status === "DRAFT" && plan.myRole !== "VIEWER",
    role: plan.myRole ?? "OWNER",
    venue: plan.venue,
    venueId: plan.venueDetail?.id,
    eventStartDate: plan.eventDate,
    eventEndDate: plan.eventEndDate,
    guestCount: plan.guestCount,
    generalLabel: plan.generalLabel,
    coverImageUrl: plan.coverImageUrl,
    subEvents: plan.subEvents.map((se) => ({
      id: se.id,
      name: se.name,
      eventDate: se.scheduledOn ?? "",
      venue: se.venue,
      venueId: se.venueDetail?.id,
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
    bundles: plan.bundles ?? [],
  };
}

/** What a line costs at today's rate: a display estimate. The quotation is what prices the plan. */
export function lineQuantity(item: BoardItem): number {
  return item.dimensions?.length ?? item.quantity;
}

export function planGroupLabel(plan: Pick<BoardPlan, "generalLabel">): string {
  return plan.generalLabel?.trim() || "Main function";
}

/** A function is ready for a quotation once it has its date, start time and venue. */
export function functionComplete(se: BoardSubEvent): boolean {
  return Boolean(se.eventDate && se.startTime && (se.venue?.trim() || se.venueId));
}

/**
 * Why the plan cannot be sent for a quotation yet, or null when it can. Every item belongs to a function, and
 * every function has its date, time and venue.
 */
export function quoteBlocker(plan: Pick<BoardPlan, "subEvents" | "items" | "generalLabel">): string | null {
  if (plan.items.length === 0) return "Add items first.";
  if (plan.subEvents.length === 0 || plan.items.some((it) => it.subEventIds.length === 0)) {
    return `Set the date, time and venue of ${planGroupLabel(plan)} first.`;
  }
  const incomplete = plan.subEvents.filter((se) => !functionComplete(se));
  if (incomplete.length > 0) return `Add the date, time and venue of ${incomplete.map((se) => se.name).join(", ")} first.`;
  return null;
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
