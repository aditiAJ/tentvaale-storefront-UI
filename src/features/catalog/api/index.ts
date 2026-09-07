import { apiFetch } from "@/services/api-client";
import type { Bundle, Product } from "../types";

// Catalog browsing is unauthenticated (Flow 1: "browse without an account").
// Routes proxy admin's Master_Product / Master_Bundle (Contexts/Specs/06, 08).
export function listProducts(params?: {
  category?: string;
}): Promise<Product[]> {
  const query = params?.category ? `?category=${params.category}` : "";
  return apiFetch<Product[]>(`api/storefront/catalog/products${query}`);
}

export function getProduct(productId: string): Promise<Product> {
  return apiFetch<Product>(`api/storefront/catalog/products/${productId}`);
}

export function listBundles(): Promise<Bundle[]> {
  return apiFetch<Bundle[]>("api/storefront/catalog/bundles");
}

export function getBundle(bundleId: string): Promise<Bundle> {
  return apiFetch<Bundle>(`api/storefront/catalog/bundles/${bundleId}`);
}
