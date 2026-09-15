import type { Product } from "./types";

// Tentvaale catalog taxonomy: global facets on every product, one shared
// fabric vocabulary, nine categories with their own subcategories and
// category-only facets. Filters in /catalog are generated from this file, so
// adding a facet here (and its value on products) is all it takes.

export const FABRIC_TYPES = ["Suede", "Linen", "Satin", "Velvet", "Boucle", "Silk", "Organza", "Chiffon", "Net", "Tissue", "Cotton", "Jute", "Sequin", "Leatherette"];

export interface FacetDef {
  key: string;
  label: string;
  get: (p: Product) => string | string[] | undefined;
  /** Fixed display order for values; otherwise alphabetical. */
  order?: string[];
}

export const PRICE_BANDS = [
  { label: "Under ₹500", max: 499 },
  { label: "₹500 – ₹2,999", max: 2999 },
  { label: "₹3,000 – ₹9,999", max: 9999 },
  { label: "₹10,000 and above", max: Infinity },
];
export const priceBand = (price: number) => PRICE_BANDS.find((b) => price <= b.max)!.label;

export const GLOBAL_FACETS: FacetDef[] = [
  { key: "colour", label: "Colour", get: (p) => p.colours },
  { key: "material", label: "Material", get: (p) => p.materials },
  { key: "mood", label: "Mood", get: (p) => p.moods },
  { key: "theme", label: "Theme fit", get: (p) => p.themes },
  { key: "setting", label: "Indoor / outdoor", get: (p) => p.setting, order: ["Indoor", "Outdoor", "Indoor & outdoor"] },
  { key: "price", label: "Price band", get: (p) => priceBand(p.basePrice), order: PRICE_BANDS.map((b) => b.label) },
];

const attr = (label: string, order?: string[]): FacetDef => ({ key: `attr:${label}`, label, get: (p) => p.attributes?.[label], order });
const fabricFacet = (label: string): FacetDef => ({ key: "fabric", label, get: (p) => p.fabrics, order: FABRIC_TYPES });

export interface CategoryDef {
  name: string;
  subcategories: string[];
  facets: FacetDef[];
  image: string;
  blurb: string;
}

const IMG = (id: string, w = 200) => `https://images.unsplash.com/${id}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=${w}`;

export const CATEGORIES: CategoryDef[] = [
  {
    name: "Furniture",
    subcategories: ["Thrones", "Banquet seating", "Couches", "Chairs", "Tables and consoles", "Ottomans and poufs"],
    facets: [fabricFacet("Upholstery fabric"), attr("Seating capacity"), attr("Frame material")],
    image: IMG("photo-1645108537414-b113b89c049d"),
    blurb: "Thrones, couches, banquet seating and tables",
  },
  {
    name: "Brass elements",
    subcategories: ["Urns and vases", "Candle stands", "Trays and bowls", "Jaali screens", "Sculptural pieces"],
    facets: [attr("Finish"), attr("Height")],
    image: IMG("photo-1692616513667-5230c36f3afe"),
    blurb: "Urlis, candle stands, jaali screens and sculptures",
  },
  {
    name: "Flower props",
    subcategories: ["Vases and stands", "Planters", "Garlands and strings", "Faux florals", "Floral backdrops"],
    facets: [attr("Real or faux", ["Real", "Faux"]), attr("Flower type"), attr("Planter height")],
    image: IMG("photo-1587271407850-8d438ca9fdf2"),
    blurb: "Garlands, planters, faux florals and floral backdrops",
  },
  {
    name: "Carpets and rugs",
    subcategories: ["Persian and traditional", "Printed", "Plain and solid", "Aisle runners", "Outdoor and turf"],
    facets: [attr("Shape"), attr("Pile and finish"), attr("Coverage available")],
    image: IMG("photo-1757618978085-850cad5b020a"),
    blurb: "Persian rugs, runners, printed carpets and turf",
  },
  {
    name: "Small props",
    subcategories: ["Mirrors", "Candles and holders", "Tableware and centrepieces", "Books and curios", "Signage and frames", "Cushions and throws"],
    facets: [attr("Height"), attr("Sold as set or single", ["Single", "Set"]), attr("Frame finish")],
    image: IMG("photo-1775135595214-f945982d9cc4"),
    blurb: "Mirrors, candles, centrepieces, signage and cushions",
  },
  {
    name: "Floor styling",
    subcategories: ["Dance floors", "Raised platforms and stages", "Floor decals", "Pathways", "Steps and risers"],
    facets: [attr("Coverage sq ft"), attr("Load rating"), attr("Panel size")],
    image: IMG("photo-1750107309391-37c2ff4c2d4f"),
    blurb: "Dance floors, stages, decals and pathways",
  },
  {
    name: "Monumental installations",
    subcategories: ["Entry gates and arches", "Backdrops and stage sets", "Mandaps and canopies", "Pillars and columns", "Ceiling installations"],
    facets: [attr("Height x width"), attr("Freestanding or suspended", ["Freestanding", "Suspended"]), attr("Install time")],
    image: IMG("photo-1757810358892-680d8b58d799"),
    blurb: "Entry gates, mandaps, backdrops and ceiling installations",
  },
  {
    name: "Lighting",
    subcategories: ["Chandeliers", "Pendants and suspended", "Uplighters and spots", "String and fairy lights", "Lamps and floor lighting"],
    facets: [attr("Mounting type"), attr("Power source"), attr("Colour temperature"), attr("Dimmable", ["Yes", "No"])],
    image: IMG("photo-1556494403-f90163a73c21"),
    blurb: "Chandeliers, pendants, uplighters and fairy lights",
  },
  {
    name: "Fabric",
    subcategories: ["Drapes and curtains", "Ceiling drapes", "Table linen", "Chair covers and sashes", "Backdrop cloth"],
    facets: [fabricFacet("Fabric"), attr("Sheer or opaque", ["Sheer", "Opaque"]), attr("Width"), attr("Drop length")],
    image: IMG("photo-1670244208732-fcc8cbd17045"),
    blurb: "Drapes, ceiling swags, table linen and chair covers",
  },
];

export const getCategory = (name?: string | null) => CATEGORIES.find((c) => c.name === name);

/** Values a product has for a facet, always as an array. */
export function facetValues(facet: FacetDef, p: Product): string[] {
  const v = facet.get(p);
  return v === undefined ? [] : Array.isArray(v) ? v : [v];
}

/** Distinct values (with counts) for a facet across a product list, in display order. */
export function facetOptions(facet: FacetDef, products: Product[]): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of products) for (const v of facetValues(facet, p)) counts.set(v, (counts.get(v) ?? 0) + 1);
  const rank = (v: string) => (facet.order?.includes(v) ? facet.order.indexOf(v) : Number.MAX_SAFE_INTEGER);
  return [...counts].map(([value, count]) => ({ value, count })).sort((a, b) => rank(a.value) - rank(b.value) || a.value.localeCompare(b.value));
}

/** Furniture pieces can be ordered in any of their listed upholstery fabrics. */
export const upholsteryOptions = (p: Product) => (p.category === "Furniture" ? (p.fabrics ?? []) : []);
