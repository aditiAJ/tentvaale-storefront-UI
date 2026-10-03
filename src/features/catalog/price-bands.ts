import type { PriceRange } from "./types";

/**
 * The price bands shoppers can tick. The labels are the storefront's, the `range` is what the
 * backend reads (inclusive ends, either may be open). The upper ends stop a paisa short of the next
 * band so a rate with paise (499.50) lands in exactly one band.
 */
export const PRICE_BANDS: { id: string; label: string; range: PriceRange }[] = [
  { id: "under-500", label: "Under ₹500", range: "0-499.99" },
  { id: "500-2999", label: "₹500 – ₹2,999", range: "500-2999.99" },
  { id: "3000-9999", label: "₹3,000 – ₹9,999", range: "3000-9999.99" },
  { id: "10000-up", label: "₹10,000 and above", range: "10000-" },
];

export const bandById = (id: string) => PRICE_BANDS.find((b) => b.id === id);
