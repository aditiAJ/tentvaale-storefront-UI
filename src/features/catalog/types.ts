import type { Money } from "@/lib/money";

/**
 * The customer-facing catalogue, as the backend serves it (com.tentvaale.masterdata.api.CatalogViews).
 *
 * Vendor-blind by construction on the server: there is no supplier field here, and stock is one
 * aggregate "max you can order" number (owned plus supplier stock), not a live availability count.
 * Prices are already resolved for the caller: a verified event planner signed in gets their trade
 * rate; everyone else gets the standard rate.
 *
 * Ids are numbers on the wire, but pages route by `slug`; ids are used only when something has to
 * refer back to a product (a plan item, say).
 */

/** The backend's rate types. QTY is per unit, SQFT per square foot, RFT per running foot. */
export type CatalogRateType = "QTY" | "SQFT" | "RFT";

/**
 * @deprecated The storefront mock's spelling ("Qty" | "SqFt" | "RFt"). Still imported by the
 * not-yet-rewritten plans types; removed with them. New code uses {@link CatalogRateType}.
 */
export type RateType = "Qty" | "SqFt" | "RFt";

export interface SubCategoryNode {
  id: number;
  name: string;
  slug: string;
  /** Products a shopper can see in it. */
  productCount: number;
}

export interface CategoryNode {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string;
  /** Products a shopper can see in it, all its sub-categories together. */
  productCount: number;
  subCategories: SubCategoryNode[];
}

export interface Occasion {
  id: number;
  name: string;
  slug: string;
}

/** A product card: what listings and the "similar" and "complements" rails show. */
export interface ProductCard {
  id: number;
  slug: string;
  name: string;
  imageUrl?: string;
  dailyRate: Money;
  rateType: CatalogRateType;
  categorySlug: string;
  subCategorySlug: string;
}

export interface Dimensions {
  length?: number;
  width?: number;
  height?: number;
  unit?: string;
}

export interface Media {
  /** "IMAGE" or "VIDEO". */
  type: string;
  url: string;
  altText?: string;
}

export interface Facet {
  code: string;
  label: string;
  /** "GLOBAL" or "CATEGORY". */
  scope: string;
  values: string[];
}

export interface Variant {
  id: number;
  name: string;
  dailyRate: Money;
  /** Most of this variant a customer can ask for. A ceiling, not a date-based availability. */
  maxOrderable: number;
}

export interface ProductDetail {
  id: number;
  slug: string;
  name: string;
  description?: string;
  categoryName: string;
  categorySlug: string;
  subCategoryName: string;
  subCategorySlug: string;
  rateType: CatalogRateType;
  dailyRate: Money;
  dimensions?: Dimensions;
  /** Set for area-priced items: the most square feet one booking can cover. */
  maxCoverageSqft?: number;
  media: Media[];
  facets: Facet[];
  variants: Variant[];
  maxOrderable: number;
  occasions: Occasion[];
  complements: ProductCard[];
  similar: ProductCard[];
}

export interface CollectionCard {
  id: number;
  slug: string;
  name: string;
  description?: string;
  palette?: string;
  imageUrl?: string;
  occasions: Occasion[];
  productCount: number;
}

export interface CollectionDetail {
  id: number;
  slug: string;
  name: string;
  description?: string;
  palette?: string;
  imageUrl?: string;
  occasions: Occasion[];
  /** In the order the admin set. */
  products: ProductCard[];
}

export interface BundleCard {
  id: number;
  slug: string;
  name: string;
  tagline?: string;
  imageUrl?: string;
  guestMin?: number;
  guestMax?: number;
  /** The sum of the items' daily rates for one day. Whether it scales with days is quotation's call. */
  fromPricePerEvent: Money;
  occasions: Occasion[];
}

export interface BundleItemOption {
  productId: number;
  variantId?: number;
  name: string;
  slug: string;
  dailyRate: Money;
}

export interface BundleItem {
  productId: number;
  variantId?: number;
  name: string;
  slug: string;
  imageUrl?: string;
  quantity: number;
  dailyRate: Money;
  /** The only alternatives the customer may swap this item for. */
  swapOptions: BundleItemOption[];
}

export interface BundleDetail {
  id: number;
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  imageUrl?: string;
  guestMin?: number;
  guestMax?: number;
  setupHours?: number;
  highlights: string[];
  occasions: Occasion[];
  items: BundleItem[];
  fromPricePerEvent: Money;
}

export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
}

/** RELEVANCE puts name matches first and is only meaningful with a search term. */
export type ProductSort = "NAME" | "PRICE_ASC" | "PRICE_DESC" | "NEWEST" | "RELEVANCE";

/** A band of the price filter, as the backend reads it: "0-499.99", "10000-" (an end may be open). */
export type PriceRange = string;

/**
 * Every field is optional. `categories` and `subcategories` are slugs, any one of which may match.
 * `facets` maps a facet code to the values accepted, e.g. colour: ["Red"]. `q` is free text: every
 * word must appear in the product's name, description, category, facets or occasions.
 */
export interface ProductQuery {
  categories?: string[];
  subcategories?: string[];
  occasion?: string;
  q?: string;
  facets?: Record<string, string[]>;
  priceMin?: number;
  priceMax?: number;
  priceRanges?: PriceRange[];
  sort?: ProductSort;
  page?: number;
  size?: number;
}

/** One value of a filter and how many products in scope carry it. */
export interface FacetFilterValue {
  value: string;
  count: number;
}

/** A facet a shopper can filter by, holding only the values that occur in the products in scope. */
export interface FacetFilter {
  code: string;
  label: string;
  /** "GLOBAL" or "CATEGORY". */
  scope: string;
  values: FacetFilterValue[];
}

export interface ProductFilters {
  facets: FacetFilter[];
  /** Products in scope (before any facet or price is applied). */
  productCount: number;
}
