import type { CatalogRateType } from "./types";

/** "unit", "sqft", "ft": the short unit that follows a price on a card (₹450 /unit). */
export function rateUnitShort(rateType: CatalogRateType): string {
  return rateType === "QTY" ? "unit" : rateType === "SQFT" ? "sqft" : "ft";
}

/** "per unit", "per sqft", "per running ft". */
export function rateUnitLabel(rateType: CatalogRateType): string {
  return rateType === "QTY" ? "per unit" : rateType === "SQFT" ? "per sqft" : "per running ft";
}

/** What the number a shopper enters means for this rate type. */
export function quantityLabel(rateType: CatalogRateType): string {
  return rateType === "QTY" ? "Quantity" : rateType === "SQFT" ? "Area (sq ft)" : "Length (running ft)";
}
