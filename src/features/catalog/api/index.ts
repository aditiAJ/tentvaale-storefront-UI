import { apiFetch } from "@/services/api-client";
import type {
  BundleCard,
  BundleDetail,
  CategoryNode,
  CollectionCard,
  CollectionDetail,
  Occasion,
  Page,
  ProductCard,
  ProductDetail,
  ProductFilters,
  ProductQuery,
} from "../types";

/**
 * Catalogue reads. Open to anyone; a signed-in customer's token only changes which prices come back
 * (a verified event planner's trade rate). Which company is shown is the backend's configured
 * default, so no call names one.
 */
const BASE = "storefront/catalog";

export function listCategories(signal?: AbortSignal): Promise<CategoryNode[]> {
  return apiFetch<CategoryNode[]>(`${BASE}/categories`, { signal });
}

export function listOccasions(signal?: AbortSignal): Promise<Occasion[]> {
  return apiFetch<Occasion[]>(`${BASE}/occasions`, { signal });
}

/** What narrows a listing before any facet or price: shared by the products and their filter counts. */
function scopeParams(query: ProductQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.categories?.length) params.set("category", query.categories.join(","));
  if (query.subcategories?.length) params.set("subcategory", query.subcategories.join(","));
  if (query.occasion) params.set("occasion", query.occasion);
  if (query.q?.trim()) params.set("q", query.q.trim());
  return params;
}

/**
 * One page of products. Facet filters go as `facet.<code>=a,b` (comma-separated values, any one of
 * which may match); every facet named must match. Price bands repeat as `priceRange`.
 */
export function listProducts(
  query: ProductQuery = {},
  signal?: AbortSignal,
): Promise<Page<ProductCard>> {
  const params = scopeParams(query);
  if (query.priceMin !== undefined) params.set("priceMin", String(query.priceMin));
  if (query.priceMax !== undefined) params.set("priceMax", String(query.priceMax));
  for (const band of query.priceRanges ?? []) params.append("priceRange", band);
  if (query.sort) params.set("sort", query.sort);
  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.size !== undefined) params.set("size", String(query.size));
  for (const [code, values] of Object.entries(query.facets ?? {})) {
    if (values.length > 0) params.set(`facet.${code}`, values.join(","));
  }
  const suffix = params.size > 0 ? `?${params}` : "";
  return apiFetch<Page<ProductCard>>(`${BASE}/products${suffix}`, { signal });
}

/**
 * The filter choices for a listing (global facets, plus those of the categories chosen) with a
 * count each. Only category, sub-category, occasion and `q` matter here; the counts deliberately
 * ignore the facets and prices already ticked so they do not jump around as boxes are ticked.
 */
export function getProductFilters(query: ProductQuery = {}, signal?: AbortSignal): Promise<ProductFilters> {
  const params = scopeParams(query);
  const suffix = params.size > 0 ? `?${params}` : "";
  return apiFetch<ProductFilters>(`${BASE}/filters${suffix}`, { signal });
}

export function getProduct(slug: string, signal?: AbortSignal): Promise<ProductDetail> {
  return apiFetch<ProductDetail>(`${BASE}/products/${encodeURIComponent(slug)}`, { signal });
}

export function listBundles(occasion?: string, signal?: AbortSignal): Promise<BundleCard[]> {
  const suffix = occasion ? `?occasion=${encodeURIComponent(occasion)}` : "";
  return apiFetch<BundleCard[]>(`${BASE}/bundles${suffix}`, { signal });
}

export function getBundle(slug: string, signal?: AbortSignal): Promise<BundleDetail> {
  return apiFetch<BundleDetail>(`${BASE}/bundles/${encodeURIComponent(slug)}`, { signal });
}

export function listCollections(occasion?: string, signal?: AbortSignal): Promise<CollectionCard[]> {
  const suffix = occasion ? `?occasion=${encodeURIComponent(occasion)}` : "";
  return apiFetch<CollectionCard[]>(`${BASE}/collections${suffix}`, { signal });
}

export function getCollection(slug: string, signal?: AbortSignal): Promise<CollectionDetail> {
  return apiFetch<CollectionDetail>(`${BASE}/collections/${encodeURIComponent(slug)}`, { signal });
}

/** Cache keys, so a page and anything that refreshes it agree on them. */
export const catalogKeys = {
  categories: ["catalog", "categories"] as const,
  occasions: ["catalog", "occasions"] as const,
  products: (query: ProductQuery) => ["catalog", "products", query] as const,
  filters: (query: ProductQuery) => ["catalog", "filters", query] as const,
  product: (slug: string) => ["catalog", "product", slug] as const,
  bundles: (occasion?: string) => ["catalog", "bundles", occasion ?? ""] as const,
  bundle: (slug: string) => ["catalog", "bundle", slug] as const,
  collections: (occasion?: string) => ["catalog", "collections", occasion ?? ""] as const,
  collection: (slug: string) => ["catalog", "collection", slug] as const,
};
