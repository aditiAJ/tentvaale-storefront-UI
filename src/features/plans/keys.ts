/**
 * How the storefront names "this product, in this option" in one string: "42" for a product, "42-v7"
 * for variant 7 of it. Plan lines, the sharing decisions and the wishlist all use it, so a screen can
 * tell two options of the same product apart without a pair of ids.
 */
export function itemKey(productId: number, variantId?: number | null): string {
  return variantId ? `${productId}-v${variantId}` : String(productId);
}

export function parseItemKey(key: string): { productId: number; variantId: number | null } | null {
  const match = /^(\d+)(?:-v(\d+))?$/.exec(key);
  if (!match) return null;
  return { productId: Number(match[1]), variantId: match[2] ? Number(match[2]) : null };
}
