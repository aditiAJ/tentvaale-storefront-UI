import { registerProducts } from "@/mock-data/product-registry";
import type { Product, RateType } from "@/mock-data/types";
import type { ProductCard, ProductDetail, Variant } from "./types";
import type { Money } from "@/lib/money";

/**
 * TEMPORARY BRIDGE (until storefront Phase 3 moves plans to the backend).
 *
 * Adds, saves and bundles still go through the local mock store, which knows products in its own
 * shape. These helpers turn what the catalogue API returned into that shape, remember it in the
 * product registry, and hand back the id the mock store should use. Nothing here is a model of the
 * backend: Phase 3 deletes this file and the plan items carry the real product and variant ids.
 */
const RATE: Record<ProductCard["rateType"], RateType> = { QTY: "Qty", SQFT: "SqFt", RFT: "RFt" };

/**
 * A listing card does not carry stock, so a product registered from a card alone gets this ceiling
 * until the product page (which does) is opened and replaces it.
 */
const UNKNOWN_STOCK = 999;

/** The id the mock store uses for a variant of a product ("42-v7"); the bare id when there is none. */
export function planProductId(productId: number, variantId?: number | null): string {
  return variantId ? `${productId}-v${variantId}` : String(productId);
}

function sizeOf(detail: ProductDetail): string | undefined {
  const d = detail.dimensions;
  if (!d) return undefined;
  const parts = [d.length, d.width, d.height].filter((n): n is number => typeof n === "number");
  return parts.length > 0 ? `${parts.join(" × ")}${d.unit ? ` ${d.unit}` : ""}` : undefined;
}

/** Remembers a card's product (for wishlist and quick add) and returns its mock-store id. */
export function registerCard(card: ProductCard): string {
  const product: Product = {
    id: planProductId(card.id),
    slug: card.slug,
    name: card.name,
    category: card.categorySlug,
    subcategory: card.subCategorySlug,
    rateType: RATE[card.rateType],
    basePrice: card.dailyRate.amount,
    imageUrl: card.imageUrl,
    availableQuantity: UNKNOWN_STOCK,
  };
  registerProducts([product], { detailed: false });
  return product.id;
}

/**
 * Remembers a product as the product page knows it, with real stock, and optionally one chosen
 * variant (which becomes its own entry priced at the variant's rate). Returns the id to add to a plan.
 */
export function registerDetail(detail: ProductDetail, variant?: Variant | null): string {
  const image = detail.media.find((m) => m.type === "IMAGE")?.url;
  const base: Product = {
    id: planProductId(detail.id),
    slug: detail.slug,
    name: detail.name,
    category: detail.categoryName,
    subcategory: detail.subCategoryName,
    rateType: RATE[detail.rateType],
    basePrice: detail.dailyRate.amount,
    imageUrl: image,
    size: sizeOf(detail),
    availableQuantity: detail.maxOrderable,
  };
  const products = [base];
  if (variant) {
    products.push({
      ...base,
      id: planProductId(detail.id, variant.id),
      name: `${detail.name} (${variant.name})`,
      basePrice: variant.dailyRate.amount,
      availableQuantity: variant.maxOrderable,
    });
  }
  registerProducts(products, { detailed: true });
  return products[products.length - 1].id;
}

/** One line of a bundle as the shopper has set it up (after any swaps). */
export interface BundleLine {
  productId: number;
  variantId?: number | null;
  name: string;
  slug?: string;
  imageUrl?: string;
  dailyRate: Money;
  quantity: number;
}

/**
 * Remembers the products of a bundle and returns what to add to a plan: one line per item, with the
 * quantity the bundle sets. The bundle response does not say how an item is rated, so each is
 * treated as per unit; a product already registered from its own page keeps its real rate type.
 */
export function registerBundleLines(lines: BundleLine[]): { productId: string; quantity: number }[] {
  const products: Product[] = lines.map((line) => ({
    id: planProductId(line.productId, line.variantId),
    slug: line.slug,
    name: line.name,
    category: "Bundle",
    rateType: "Qty",
    basePrice: line.dailyRate.amount,
    imageUrl: line.imageUrl,
    availableQuantity: UNKNOWN_STOCK,
  }));
  registerProducts(products, { detailed: false });
  return lines.map((line, i) => ({ productId: products[i].id, quantity: line.quantity }));
}
