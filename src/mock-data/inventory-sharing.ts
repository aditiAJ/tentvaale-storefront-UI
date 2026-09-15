import type { ItemSharingDecision, Plan, Product } from "./types";
import { formatEventDate } from "./seed";

export interface ProductOccurrence {
  itemId: string;
  subEventId: string | null; // null = General / Untagged
  subEventName: string;
  timeWindow?: string; // "9th Dec 2026, 10:00–13:00" when date/time is known
  sortKey: string; // "2026-12-09T10:00" — chronological order; undated sort last
  quantity: number; // dimensions?.length ?? quantity — same convention as line pricing
}

export interface ProductUsage {
  productId: string;
  product: Product;
  occurrences: ProductOccurrence[];
  /** Occurrences tagged to a specific sub-event — General/Untagged excluded, since sharing is about reuse *between functions*, not the untagged bucket. */
  subEventOccurrences: ProductOccurrence[];
}

function subEventTimeWindow(eventDate: string, startTime?: string, endTime?: string): string {
  const date = formatEventDate(eventDate);
  if (!date) return "";
  if (startTime && endTime) return `${date}, ${startTime}–${endTime}`;
  if (startTime) return `${date}, from ${startTime}`;
  return date;
}

// One entry per distinct product used anywhere in the plan, with every
// sub-event (or the general list) that uses it. This is read-only derived
// state — nothing here decides Shared vs Dedicated, it just lays out the
// facts so the customer can.
export function getProductUsage(plan: Plan, products: Product[]): ProductUsage[] {
  const byProduct = new Map<string, ProductOccurrence[]>();
  for (const item of plan.items) {
    const subEvent = item.subEventId ? plan.subEvents.find((se) => se.id === item.subEventId) : undefined;
    const occurrence: ProductOccurrence = {
      itemId: item.id,
      subEventId: item.subEventId,
      subEventName: subEvent?.name ?? (plan.generalLabel?.trim() || "Your event"),
      timeWindow: subEvent ? subEventTimeWindow(subEvent.eventDate, subEvent.startTime, subEvent.endTime) : undefined,
      sortKey: subEvent?.eventDate ? `${subEvent.eventDate}T${subEvent.startTime ?? "00:00"}` : "~",
      quantity: item.dimensions?.length ?? item.quantity,
    };
    byProduct.set(item.productId, [...(byProduct.get(item.productId) ?? []), occurrence]);
  }

  const usage: ProductUsage[] = [];
  for (const [productId, occurrences] of byProduct) {
    const product = products.find((p) => p.id === productId);
    if (!product) continue;
    usage.push({ productId, product, occurrences, subEventOccurrences: occurrences.filter((o) => o.subEventId !== null) });
  }
  return usage;
}

// A product only needs a Shared/Dedicated call when it shows up in 2+
// *different* sub-events — a single sub-event, or the general list alone,
// has nothing to reuse between.
export function needsSharingDecision(usage: ProductUsage): boolean {
  return usage.subEventOccurrences.length >= 2;
}

// The number of physical units the customer has told us they need, given
// their Shared/Dedicated call (or the safe stack-everything default while
// undecided). General/Untagged quantity always adds on top, since it isn't
// part of any specific function's reuse question.
export function requiredQuantity(usage: ProductUsage, decision: ItemSharingDecision | undefined): number {
  const generalQty = usage.occurrences.filter((o) => o.subEventId === null).reduce((sum, o) => sum + o.quantity, 0);
  if (usage.subEventOccurrences.length === 0) return generalQty;
  if (usage.subEventOccurrences.length === 1 || decision !== "Shared") {
    return generalQty + usage.subEventOccurrences.reduce((sum, o) => sum + o.quantity, 0);
  }
  // Shared: the same physical units cover every linked sub-event, so only
  // the largest single requirement is needed — not the sum.
  return generalQty + Math.max(...usage.subEventOccurrences.map((o) => o.quantity));
}

export interface ReuseStep {
  occurrence: ProductOccurrence;
  reused: number; // units carried over from an earlier sub-event
  fresh: number; // extra units this sub-event adds on top
}

// Shared products, walked in date order: each sub-event reuses whatever the
// earlier ones already brought in and only adds the shortfall.
// Haldi 40 then Sangeet 100 -> Haldi 40 new, Sangeet 40 reused + 60 new.
export function reuseBreakdown(usage: ProductUsage): { steps: ReuseStep[]; totalReused: number } {
  const ordered = [...usage.subEventOccurrences].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  let onHand = 0;
  let totalReused = 0;
  const steps = ordered.map((occurrence) => {
    const reused = Math.min(onHand, occurrence.quantity);
    const fresh = occurrence.quantity - reused;
    onHand += fresh;
    totalReused += reused;
    return { occurrence, reused, fresh };
  });
  return { steps, totalReused };
}
