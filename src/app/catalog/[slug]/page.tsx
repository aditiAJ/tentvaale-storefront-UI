"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import { Check, ChevronRight, Heart } from "lucide-react";
import { Reveal, SPRING } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NumberStepper } from "@/components/number-stepper";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductThumb } from "@/components/product-thumb";
import { RentalTerms } from "@/components/rental-terms";
import { ApiError } from "@/services/api-client";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import { useRecentlyViewed } from "@/lib/recently-viewed";
import { useMockStore } from "@/mock-data/store";
import { useProduct } from "@/features/catalog/hooks";
import { quantityLabel, rateUnitLabel } from "@/features/catalog/format";
import { ProductRail } from "@/features/catalog/components/ProductRail";
import { planProductId, registerDetail } from "@/features/catalog/plan-bridge";
import { usePlanActions } from "@/features/plans/hooks";
import { PlanTargetFields, usePlanTarget } from "@/features/plans/target";
import type { ProductCard, ProductDetail } from "@/features/catalog/types";

// Flowstep screens 9 (desktop) / 10 (mobile), fileId 8bd03b8a-4561-4b58-bb2d-ca011d84d53e.
// The "Added to Plan" confirmation (screens 52/54) is a dialog here rather than an immediate
// redirect, so the shopper can keep browsing complementary products from the same page.

/** What the "recently viewed" rail remembers of this product. */
function cardOf(p: ProductDetail): ProductCard {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    imageUrl: p.media.find((m) => m.type === "IMAGE")?.url,
    dailyRate: p.dailyRate,
    rateType: p.rateType,
    categorySlug: p.categorySlug,
    subCategorySlug: p.subCategorySlug,
  };
}

function sizeOf(p: ProductDetail): string | undefined {
  const d = p.dimensions;
  if (!d) return undefined;
  const parts = [d.length, d.width, d.height].filter((n): n is number => typeof n === "number");
  return parts.length > 0 ? `${parts.join(" × ")}${d.unit ? ` ${d.unit.toLowerCase()}` : ""}` : undefined;
}

function ProductSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl py-6 md:py-8 page-x">
      <Skeleton className="mb-6 h-4 w-64" />
      <div className="grid gap-6 md:grid-cols-[55%_45%] md:gap-8">
        <Skeleton className="h-[320px] rounded-2xl md:h-[560px]" />
        <div className="flex flex-col gap-4 rounded-2xl bg-card p-6 ring-1 ring-foreground/8">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const reduce = useReducedMotion();
  const { currentAccount, wishlist, toggleWishlist } = useMockStore();
  const query = useProduct(slug);
  const product = query.data;

  const recentlyViewed = useRecentlyViewed(useMemo(() => (product ? cardOf(product) : undefined), [product])).slice(0, 4);
  const target = usePlanTarget();
  const actions = usePlanActions(target.planId);

  const [quantity, setQuantity] = useState(1);
  const [length, setLength] = useState(10);
  const [variantId, setVariantId] = useState<number | undefined>(undefined);
  const [addedTo, setAddedTo] = useState<{ planId: string; planName: string; quantity: number } | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  if (query.isPending) return <ProductSkeleton />;

  if (!product) {
    const missing = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 py-24 text-center page-x">
        <h1 className="font-serif text-2xl">{missing ? "Product not found" : "We couldn't load this product"}</h1>
        <p className="text-sm text-muted-foreground">{missing ? "It may have been removed, or the link is out of date." : "Check your connection and try again."}</p>
        <div className="flex gap-2">
          {!missing && (
            <Button variant="outline" onClick={() => query.refetch()}>
              Try again
            </Button>
          )}
          <Button variant="outline" nativeButton={false} render={<Link href="/catalog">Back to catalog</Link>} />
        </div>
      </div>
    );
  }

  const images = product.media.filter((m) => m.type === "IMAGE");
  // A product with variants is bought as one of them; stock and price belong to the variant.
  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const rate = variant?.dailyRate ?? product.dailyRate;
  const stock = variant?.maxOrderable ?? product.maxOrderable;
  const needsDimensions = product.rateType !== "QTY";
  const wishlisted = wishlist.includes(planProductId(product.id));
  const size = sizeOf(product);
  const rows: [string, string][] = [
    ...(size ? [["Size", size] as [string, string]] : []),
    ...product.facets.map((f): [string, string] => [f.label, f.values.join(", ")]),
    ...(product.occasions.length > 0 ? [["Suits", product.occasions.map((o) => o.name).join(", ")] as [string, string]] : []),
  ];

  async function handleAdd() {
    if (!currentAccount) {
      router.push("/signup");
      return;
    }
    if (!target.planId) {
      toast.error("Create a plan first, then add this to it.");
      return;
    }
    if (!product) return;
    const amount = needsDimensions ? length : quantity;
    const saved = await actions.addItem({
      subEventId: target.subEventId,
      productId: product.id,
      variantId: variant?.id ?? null,
      quantity: amount,
    });
    if (saved) setAddedTo({ planId: target.planId, planName: saved.name, quantity: amount });
  }

  return (
    <div className="mx-auto w-full max-w-6xl py-6 md:py-8 page-x">
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground md:mb-6" aria-label="Breadcrumb">
        <Link href="/" className="transition-colors hover:text-primary">
          Home
        </Link>
        <ChevronRight className="size-3 opacity-60" />
        <Link href={`/catalog?category=${encodeURIComponent(product.categorySlug)}`} className="transition-colors hover:text-primary">
          {product.categoryName}
        </Link>
        <ChevronRight className="size-3 opacity-60" />
        <span className="truncate text-foreground">{product.name}</span>
      </nav>

      <section className="grid gap-6 md:grid-cols-[55%_45%] md:gap-8">
        {/* Image column sticks while the long configuration panel scrolls: the thing being bought stays on screen. */}
        <Reveal immediate direction="up" distance={16} className="md:sticky md:top-24 md:self-start">
          <ProductThumb
            imageUrl={images[activeImage]?.url}
            alt={images[activeImage]?.altText || product.name}
            className="h-[320px] rounded-2xl bg-muted p-6 shadow-e2 ring-1 ring-foreground/5 md:h-[560px]"
          />
          {images.length > 1 && (
            <div className="mt-3 flex gap-2.5">
              {images.map((image, i) => (
                <button
                  key={image.url}
                  onClick={() => setActiveImage(i)}
                  aria-label={`View ${i + 1} of ${images.length}`}
                  aria-current={i === activeImage}
                  className={cn(
                    "overflow-hidden rounded-md ring-1 transition-colors duration-200 ease-out-quint",
                    i === activeImage ? "ring-2 ring-primary" : "ring-border hover:ring-primary/50",
                  )}
                >
                  <ProductThumb imageUrl={image.url} alt="" className="size-16 rounded-none bg-muted md:size-20" />
                </button>
              ))}
            </div>
          )}
        </Reveal>

        <Reveal immediate direction="up" distance={16} delay={0.08} className="flex flex-col gap-6 rounded-2xl bg-card p-5 shadow-e1 ring-1 ring-foreground/8 md:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-serif text-2xl leading-tight text-foreground md:text-3xl">{product.name}</h1>
              {currentAccount && (
                <button
                  onClick={() => {
                    if (!wishlisted) registerDetail(product);
                    toggleWishlist(planProductId(product.id));
                    toast.success(wishlisted ? "Removed from wishlist" : "Saved to wishlist");
                  }}
                  aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  aria-pressed={wishlisted}
                  className="press flex shrink-0 items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground/75 transition-colors duration-200 ease-out-quint hover:border-primary hover:text-primary"
                >
                  <Heart className={cn("size-4", wishlisted && "fill-primary text-primary")} />
                  <span className="hidden sm:inline">{wishlisted ? "Saved" : "Save"}</span>
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {[product.categoryName, product.subCategoryName].map((tag) => (
                <span key={tag} className="rounded-sm bg-primary/10 px-3 py-1 text-xs text-primary ring-1 ring-primary/30 ring-inset">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-end justify-between border-b border-primary/20 pb-5">
              <div>
                <p className="font-serif text-3xl text-foreground">
                  {formatMoney(rate)}
                  <span className="text-base font-normal text-muted-foreground"> / {product.rateType === "QTY" ? "day" : rateUnitLabel(product.rateType)}</span>
                </p>
                <p className="mt-1.5 text-sm text-primary">{rateUnitLabel(product.rateType).replace(/^\w/, (c) => c.toUpperCase())}</p>
              </div>
            </div>
          </div>

          {product.description && <p className="text-sm leading-6 whitespace-pre-line text-muted-foreground">{product.description}</p>}

          {rows.length > 0 && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 rounded-xl border border-border bg-muted/30 p-4 text-sm">
              {rows.map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase">{label}</dt>
                  <dd className="mt-0.5 text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          {product.variants.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <Label className="text-sm text-muted-foreground">Option</Label>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Option">
                {product.variants.map((v) => {
                  const on = v.id === variant?.id;
                  return (
                    <button
                      key={v.id}
                      role="radio"
                      aria-checked={on}
                      disabled={v.maxOrderable === 0}
                      onClick={() => setVariantId(v.id)}
                      className={cn(
                        "press rounded-md border px-3.5 py-2 text-left text-sm transition-colors duration-200 ease-out-quint disabled:cursor-not-allowed disabled:opacity-40",
                        on ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground/80 hover:border-primary/50",
                      )}
                    >
                      <span className="block font-medium">{v.name}</span>
                      <span className="block text-xs text-muted-foreground">{formatMoney(v.dailyRate)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {needsDimensions ? (
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">{quantityLabel(product.rateType)}</span>
                <NumberStepper value={length} onChange={setLength} aria-label="Size" />
              </div>
              {product.maxCoverageSqft && <p className="text-xs text-muted-foreground">One booking can cover up to {product.maxCoverageSqft} sq ft.</p>}
            </div>
          ) : (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="font-serif text-xl text-foreground">Quantity</span>
              <NumberStepper value={quantity} onChange={setQuantity} max={Math.max(stock, 1)} aria-label="Quantity" />
            </div>
          )}

          {stock > 0 ? (
            <div className="flex items-start gap-2.5 rounded-xl bg-[color-mix(in_oklab,var(--success)_10%,transparent)] px-4 py-3 text-sm text-[var(--success)] ring-1 ring-[color-mix(in_oklab,var(--success)_28%,transparent)] ring-inset">
              <Check className="mt-0.5 size-4 shrink-0" />
              <span>
                <strong className="font-medium tabular-nums">{stock}</strong> units in our inventory
                <span className="block text-xs opacity-80">Maximum you can order. Availability for your dates is confirmed on the quote.</span>
              </span>
            </div>
          ) : (
            <div className="rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground ring-1 ring-border ring-inset">
              Not in stock right now. You can still ask for it in a plan and we&apos;ll confirm on the quote.
            </div>
          )}

          {currentAccount ? (
            <>
              <PlanTargetFields target={target} className="grid grid-cols-2 gap-3" />
              <Button size="lg" className="w-full" onClick={handleAdd} disabled={!target.planId || actions.saving}>
                Add to Plan
              </Button>
            </>
          ) : (
            <Button size="lg" className="w-full" nativeButton={false} render={<Link href="/signup">Sign up to add to a plan</Link>} />
          )}
          <RentalTerms />
        </Reveal>
      </section>

      {/* Similar first: someone comparing chairs wants the other chairs before they want a matching carpet. */}
      <ProductRail
        title="Similar Products"
        products={product.similar.slice(0, 4)}
        action={{ href: `/catalog?category=${product.categorySlug}&subcategory=${product.subCategorySlug}`, label: `View all ${product.subCategoryName.toLowerCase()}` }}
      />
      <ProductRail title="Complements This" products={product.complements.slice(0, 4)} />
      <ProductRail title="Recently Viewed" products={recentlyViewed} />

      {/* Mobile sticky add bar: slides up once, above the fixed tab bar. */}
      {currentAccount && (
        <motion.div
          initial={{ y: reduce ? 0 : 64 }}
          animate={{ y: 0 }}
          transition={reduce ? { duration: 0.01 } : SPRING.soft}
          className="fixed inset-x-0 bottom-16 z-30 flex items-center gap-2 border-t border-border bg-background/95 p-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.4)] supports-backdrop-filter:bg-background/85 supports-backdrop-filter:backdrop-blur-xl md:hidden"
        >
          <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
            {target.plan ? <>Adding to <span className="text-foreground">{target.plan.name}</span></> : "Create a plan to add this"}
          </span>
          <Button size="lg" onClick={handleAdd} disabled={!target.planId || actions.saving}>
            Add to Plan
          </Button>
        </motion.div>
      )}

      <Dialog open={!!addedTo} onOpenChange={(open) => !open && setAddedTo(null)}>
        <DialogContent className="text-center sm:max-w-md">
          <DialogHeader className="items-center gap-3">
            {/* The tick springs in a beat after the dialog lands, so the confirmation reads as a result. */}
            <motion.div
              initial={{ scale: reduce ? 1 : 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={reduce ? { duration: 0.01 } : { ...SPRING.snappy, delay: 0.1 }}
              className="flex size-14 items-center justify-center rounded-sm bg-primary/12 text-primary ring-1 ring-primary/40"
            >
              <Check className="size-7" />
            </motion.div>
            <DialogTitle className="font-serif text-3xl text-foreground">Added to Plan</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {product.name}
              {variant ? ` (${variant.name})` : ""} has been added to your plan.
            </p>
          </DialogHeader>
          {addedTo && (
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{quantityLabel(product.rateType)}</span>
                <span className="text-foreground">{addedTo.quantity}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Destination plan</span>
                <span className="text-right text-primary">{addedTo.planName}</span>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2.5">
            <Button size="lg" className="w-full" onClick={() => router.push(`/plans/${addedTo?.planId}`)}>
              View My Plans
            </Button>
            <Button size="lg" variant="outline" className="w-full" onClick={() => setAddedTo(null)}>
              Continue Browsing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
