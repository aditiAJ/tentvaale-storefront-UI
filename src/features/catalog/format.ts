import type { CatalogRateType } from "./types";

/** "unit", "sqft", "ft": the short unit that follows a price on a card (₹450 /unit). */
export function rateUnitShort(rateType: CatalogRateType): string {
  return rateType === "QTY" ? "unit" : rateType === "SQFT" ? "sqft" : "ft";
}

/** "per unit", "per sqft", "per running ft". */
export function rateUnitLabel(rateType: CatalogRateType): string {
  return rateType === "QTY" ? "per unit" : rateType === "SQFT" ? "per sqft" : "per running ft";
}

/**
 * A stock count with what it counts: "40 units", "120 sq ft", "30 running ft". A product sold by area or length is
 * stocked by area or length, so it is never "units" (and the most that can be ordered is that same number).
 */
export function stockLabel(count: number, rateType: CatalogRateType): string {
  if (rateType === "SQFT") return `${count} sq ft`;
  if (rateType === "RFT") return `${count} running ft`;
  return `${count} ${count === 1 ? "unit" : "units"}`;
}

/**
 * A quantity on an order or document with what it counts: "120 sq ft", "30 running ft", or just "5" for pieces (the
 * norm, left unsaid). A line made before this was recorded has no rate type and reads as pieces.
 */
export function measuredQuantity(quantity: number, rateType?: string | null): string {
  if (rateType === "SQFT") return `${quantity} sq ft`;
  if (rateType === "RFT") return `${quantity} running ft`;
  return String(quantity);
}

/** What the number a shopper enters means for this rate type. */
export function quantityLabel(rateType: CatalogRateType): string {
  return rateType === "QTY" ? "Quantity" : rateType === "SQFT" ? "Area (sq ft)" : "Length (running ft)";
}
