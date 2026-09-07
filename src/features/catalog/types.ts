// Catalog (read-only projection of admin's Master_Product / Master_Bundle,
// see Contexts/Specs/06-Product-Master.md and 08-Product-Bundles.md).

// Matches admin's pricing basis (Contexts/Specs/06-Product-Master.md).
export type RateType = "Qty" | "SqFt" | "RFt";

export interface Product {
  id: string;
  name: string;
  category: string;
  rateType: RateType;
  basePrice: number;
  imageUrls: string[];
}

export interface Bundle {
  id: string;
  name: string;
  productIds: string[];
  basePrice: number;
  imageUrls: string[];
}
