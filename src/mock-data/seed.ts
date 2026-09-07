import type { Product } from "./types";

export const PRODUCTS: Product[] = [
  { id: "p1", name: "Peak Pole Tent 40x60", category: "Tents", rateType: "SqFt", basePrice: 18 },
  { id: "p2", name: "Chiavari Chair", category: "Seating", rateType: "Qty", basePrice: 45, imageUrl: "/brand/products/chiavari-chair.png" },
  { id: "p3", name: "Round Banquet Table (60in)", category: "Tables", rateType: "Qty", basePrice: 350 },
  { id: "p4", name: "String Light Canopy", category: "Lighting", rateType: "RFt", basePrice: 60 },
  { id: "p5", name: "Red Carpet Runner", category: "Decor", rateType: "RFt", basePrice: 40 },
  { id: "p6", name: "Stage Platform 12x16", category: "Staging", rateType: "SqFt", basePrice: 22 },
  { id: "p7", name: "Photo Booth Backdrop", category: "Decor", rateType: "Qty", basePrice: 2500 },
  { id: "p8", name: "Cocktail Table", category: "Tables", rateType: "Qty", basePrice: 250 },
];

// Flow 2: "Starter suggestions surface for new plans (entry gate, passage,
// seating, stage, photo booth) — customer can accept or dismiss each."
export const STARTER_SUGGESTIONS: { key: string; label: string; productId: string }[] = [
  { key: "entry-gate", label: "Entry Gate", productId: "p6" },
  { key: "passage", label: "Passage", productId: "p5" },
  { key: "seating", label: "Seating", productId: "p2" },
  { key: "stage", label: "Stage", productId: "p6" },
  { key: "photo-booth", label: "Photo Booth", productId: "p7" },
];

export function formatRupees(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}
