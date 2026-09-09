import type { Bundle, Collection, Product } from "./types";

// Named/photographed products drawn from the Flowstep screens (catalog, home,
// product detail) where available; category set matches the site nav exactly.
export const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Regal Gold Bar Chair",
    category: "Furniture",
    rateType: "Qty",
    basePrice: 450,
    imageUrl: "https://images.unsplash.com/photo-1645108537414-b113b89c049d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  },
  {
    id: "p2",
    name: "Velvet Lounge Sofa",
    category: "Furniture",
    rateType: "Qty",
    basePrice: 450,
    imageUrl: "https://images.unsplash.com/photo-1670244208732-fcc8cbd17045?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  },
  { id: "p3", name: "Chiavari Chair", category: "Furniture", rateType: "Qty", basePrice: 45, imageUrl: "/brand/products/chiavari-chair.png" },
  { id: "p4", name: "Round Banquet Table (60in)", category: "Furniture", rateType: "Qty", basePrice: 350 },
  { id: "p5", name: "Cocktail Table", category: "Furniture", rateType: "Qty", basePrice: 250 },
  {
    id: "p6",
    name: "Round Mirror Backdrop",
    category: "Mirrors",
    rateType: "SqFt",
    basePrice: 450,
    imageUrl: "https://images.unsplash.com/photo-1775135595214-f945982d9cc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  },
  {
    id: "p7",
    name: "Antique Brass Planter",
    category: "Planters",
    rateType: "Qty",
    basePrice: 450,
    imageUrl: "https://images.unsplash.com/photo-1692616513667-5230c36f3afe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  },
  { id: "p8", name: "Red Carpet Runner", category: "Carpets", rateType: "RFt", basePrice: 40 },
  { id: "p9", name: "Persian Area Rug", category: "Carpets", rateType: "SqFt", basePrice: 25 },
  { id: "p10", name: "String Light Canopy", category: "Lighting", rateType: "RFt", basePrice: 60 },
  { id: "p11", name: "Chandelier Centerpiece", category: "Lighting", rateType: "Qty", basePrice: 3200 },
  { id: "p12", name: "Photo Booth Backdrop", category: "Styling Props", rateType: "Qty", basePrice: 2500 },
  { id: "p13", name: "Floral Arch", category: "Styling Props", rateType: "Qty", basePrice: 5500 },
  { id: "p14", name: "Stage Platform 12x16", category: "Installation Setup", rateType: "SqFt", basePrice: 22 },
  { id: "p15", name: "Peak Pole Tent 40x60", category: "Installation Setup", rateType: "SqFt", basePrice: 18 },
  { id: "p16", name: "Majlis Lounge Package", category: "Lounge Packages", rateType: "Qty", basePrice: 12000 },
  {
    id: "p17",
    name: "Floral Mandap Structure",
    category: "Styling Props",
    rateType: "Qty",
    basePrice: 8500,
    imageUrl: "https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  },
  {
    id: "p18",
    name: "Gold Throne Chairs (Pair)",
    category: "Furniture",
    rateType: "Qty",
    basePrice: 3600,
    imageUrl: "https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  },
  {
    id: "p19",
    name: "Ambient Fairy Lighting",
    category: "Lighting",
    rateType: "RFt",
    basePrice: 55,
    imageUrl: "https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  },
  {
    id: "p20",
    name: "Stage Draping",
    category: "Installation Setup",
    rateType: "RFt",
    basePrice: 35,
    imageUrl: "https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  },
  {
    id: "p21",
    name: "Royal Mandap Setup",
    category: "Installation Setup",
    rateType: "Qty",
    basePrice: 18000,
    imageUrl: "https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  },
];

export const COLLECTIONS: Collection[] = [
  {
    id: "royal-heritage",
    name: "Royal Heritage",
    tagline: "Carved teak, deep crimson upholstery and hand-blocked cushions for a mandap that reads as heirloom.",
    heroImageUrl: "https://images.unsplash.com/photo-1772127822552-ce9ef537bdcf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600",
    categories: ["Furniture", "Lighting", "Carpets"],
    productIds: ["p18", "p1", "p6", "p9", "p11"],
  },
  {
    id: "monochrome-reception",
    name: "Monochrome Reception",
    tagline: "Clean black-and-white styling with mirror walls and minimal florals.",
    heroImageUrl: "https://images.unsplash.com/photo-1716538878686-38567b89b5a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600",
    categories: ["Mirrors", "Furniture"],
    productIds: ["p6", "p2", "p5", "p9"],
  },
  {
    id: "amber-dunes",
    name: "Amber Dunes",
    tagline: "Warm terracotta tones, brass accents and flowing drapes for a golden-hour celebration.",
    heroImageUrl: "https://images.unsplash.com/photo-1747115276395-607f2e5dc269?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600",
    categories: ["Furniture", "Lighting", "Carpets", "Planters"],
    productIds: ["p1", "p11", "p9", "p7", "p19", "p3"],
  },
  {
    id: "garden-evening",
    name: "Garden Evening",
    tagline: "String lights, natural cane and soft neutrals for an outdoor reception.",
    heroImageUrl: "https://images.unsplash.com/photo-1651472652024-6ca9278d53a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600",
    categories: ["Lighting", "Furniture"],
    productIds: ["p10", "p2", "p8"],
  },
];

export const BUNDLES: Bundle[] = [
  {
    id: "b1",
    name: "Royal Heritage Stage Package",
    description: "A complete styled stage setup with floral mandap, gold seating and ambient lighting for your main ceremony.",
    imageUrl: "https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
    includedProductIds: ["p17", "p18", "p6", "p19", "p7", "p20"],
  },
  {
    id: "b2",
    name: "Monochrome Reception",
    description: "Clean black-and-white styling — mirror walls, upholstered lounge seating and minimal florals.",
    imageUrl: "https://images.unsplash.com/photo-1716538878686-38567b89b5a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
    includedProductIds: ["p6", "p2", "p9"],
  },
  {
    id: "b3",
    name: "Amber Dunes",
    description: "Warm marigold-and-brass styling for a Haldi or daytime celebration.",
    imageUrl: "https://images.unsplash.com/photo-1632296521966-b19f0d728635?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
    includedProductIds: ["p7", "p13", "p10"],
  },
];

// Flow 2: "Starter suggestions surface for new plans (entry gate, passage,
// seating, stage, photo booth) — customer can accept or dismiss each."
export const STARTER_SUGGESTIONS: { key: string; label: string; productId: string }[] = [
  { key: "entry-gate", label: "Entry Gate", productId: "p14" },
  { key: "passage", label: "Passage", productId: "p8" },
  { key: "seating", label: "Seating", productId: "p3" },
  { key: "stage", label: "Stage", productId: "p14" },
  { key: "photo-booth", label: "Photo Booth", productId: "p12" },
];

// Flow: AI Planner results (screens 44-45) — a fixed curated set stands in for
// a real recommendation engine; "Amber Dunes Lounge Package" maps to the b3
// bundle (expands to its included products on add, same as the Bundle page),
// the rest are single catalog products.
export const AI_PLAN_SUGGESTIONS: { kind: "product" | "bundle"; id: string }[] = [
  { kind: "product", id: "p21" }, // Royal Mandap Setup
  { kind: "product", id: "p18" }, // Gold Throne Chairs (Pair)
  { kind: "product", id: "p13" }, // Floral Arch
  { kind: "product", id: "p6" }, // Round Mirror Backdrop
  { kind: "bundle", id: "b3" }, // Amber Dunes (Lounge Package)
  { kind: "product", id: "p19" }, // Ambient Fairy Lighting
];

export const AI_PLANNER_EVENT_TYPES = ["Wedding", "Haldi", "Corporate", "Fashion Shoot", "Luxury Lounge", "Other"];

export function formatRupees(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function rateTypeLabel(rateType: Product["rateType"]): string {
  return rateType === "Qty" ? "per unit" : rateType === "SqFt" ? "per sqft" : "per running ft";
}
