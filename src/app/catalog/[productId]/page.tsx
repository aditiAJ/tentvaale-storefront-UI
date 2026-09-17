"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import { Check, ChevronRight, Heart } from "lucide-react";
import { Reveal, Stagger, StaggerItem, SPRING } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NumberStepper } from "@/components/number-stepper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductThumb } from "@/components/product-thumb";
import { cn } from "@/lib/utils";
import { useMockStore } from "@/mock-data/store";
import type { Product } from "@/mock-data/types";
import { formatRupees, productImages, rateTypeLabel } from "@/mock-data/seed";
import { CATEGORIES, GLOBAL_FACETS, facetValues, upholsteryOptions } from "@/mock-data/taxonomy";
import { FabricPicker } from "@/components/fabric-picker";
import { ColourPicker } from "@/components/colour-picker";
import { RentalTerms } from "@/components/rental-terms";
import { useRecentlyViewed } from "@/lib/recently-viewed";

// Flowstep screens 9 (desktop) / 10 (mobile), fileId 8bd03b8a-4561-4b58-bb2d-ca011d84d53e.
// The "Added to Plan" confirmation (screens 52/54) is a dialog here rather
// than an immediate redirect, so the shopper can keep browsing complementary
// products from the same page.
/** Mirrors the catalog page's slug rule so ?category= / ?subcategory= match. */
const slug = (value: string) => value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * One rail shape for Similar / Complements / Recently Viewed. Renders nothing
 * when empty, so a first-time visitor simply does not see a Recently Viewed
 * heading over a blank row.
 */
function ProductRail({
  title,
  products,
  action,
}: {
  title: string;
  products: Product[];
  action?: { href: string; label: string };
}) {
  if (products.length === 0) return null;

  return (
    <section className="mt-14 flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-serif text-2xl text-foreground">{title}</h2>
        {action && (
          <Link
            href={action.href}
            className="flex items-center gap-1 text-sm text-primary underline-offset-4 transition-colors duration-200 ease-out-quint hover:underline"
          >
            {action.label}
            <ChevronRight className="size-4" />
          </Link>
        )}
      </div>
      <Stagger gap={0.05} className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((p) => (
          <StaggerItem key={p.id} className="flex flex-col">
            <Link
              href={`/catalog/${p.id}`}
              className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-e1 transition-colors duration-200 ease-out-quint hover:border-primary/50"
            >
              <div className="overflow-hidden rounded-xl bg-muted/60">
                <ProductThumb imageUrl={p.imageUrl} alt={p.name} className="h-32 rounded-none bg-transparent md:h-44" />
              </div>
              <h3 className="line-clamp-2 px-1 text-sm leading-snug font-medium text-foreground transition-colors duration-200 ease-out-quint group-hover:text-primary">
                {p.name}
              </h3>
              <p className="mt-auto px-1 pb-1 text-sm text-muted-foreground">From {formatRupees(p.basePrice)} / day</p>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

export default function ProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  const router = useRouter();
  const reduce = useReducedMotion();
  const { products, currentAccount, plans, addPlanItem, wishlist, toggleWishlist } = useMockStore();

  const product = products.find((p) => p.id === productId);
  // Was `products.filter(p => p.id !== productId).slice(0, 4)` - literally the
  // first four rows in the catalogue, unrelated to what you are looking at.
  // Similar = same shelf (subcategory, else category). Complementary = a
  // DIFFERENT category that shares a theme, i.e. things that go together in
  // the same setup rather than things that compete with each other.
  const similar = useMemo(() => {
    if (!product) return [];
    const sameShelf = products.filter(
      (p) => p.id !== product.id && (product.subcategory ? p.subcategory === product.subcategory : p.category === product.category),
    );
    const sameCategory = products.filter((p) => p.id !== product.id && p.category === product.category && !sameShelf.includes(p));
    return [...sameShelf, ...sameCategory].slice(0, 4);
  }, [products, product]);

  const complementary = useMemo(() => {
    if (!product) return [];
    const themes = product.themes ?? [];
    const scored = products
      .filter((p) => p.id !== product.id && p.category !== product.category)
      .map((p) => ({ p, shared: (p.themes ?? []).filter((t) => themes.includes(t)).length }))
      .sort((a, b) => b.shared - a.shared);
    // Keep theme matches first but still fill four tiles for an untagged product.
    return scored.slice(0, 4).map((entry) => entry.p);
  }, [products, product]);

  const recentIds = useRecentlyViewed(product?.id);
  const recentlyViewed = useMemo(
    () => recentIds.map((id) => products.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => Boolean(p)).slice(0, 4),
    [recentIds, products],
  );
  const myPlans = useMemo(() => plans.filter((p) => p.ownerAccountId === currentAccount?.id && p.status === "Draft"), [plans, currentAccount]);

  const [planId, setPlanId] = useState<string>("");
  const [subEventId, setSubEventId] = useState<string>("__general");
  const [quantity, setQuantity] = useState(1);
  const [length, setLength] = useState(10);
  const [fabric, setFabric] = useState<string | undefined>(undefined);
  const [colour, setColour] = useState<string | undefined>(undefined);
  const [addedTo, setAddedTo] = useState<{ planId: string; planName: string; quantity: number } | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  const images = useMemo(() => (product ? productImages(product) : []), [product]);
  const wishlisted = product ? wishlist.includes(product.id) : false;

  if (!product) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 py-24 text-center page-x">
        <h1 className="font-serif text-2xl">Product not found</h1>
        <p className="text-sm text-muted-foreground">It may have been removed, or the link is out of date.</p>
        <Button variant="outline" nativeButton={false} render={<Link href="/catalog">Back to catalog</Link>} />
      </div>
    );
  }

  const selectedPlan = myPlans.find((p) => p.id === planId);
  const needsDimensions = product.rateType !== "Qty";

  function handleAdd() {
    if (!currentAccount) {
      router.push("/signup");
      return;
    }
    if (!planId) {
      toast.error("Choose a plan to add this to.");
      return;
    }
    addPlanItem(planId, {
      productId: product!.id,
      quantity,
      subEventId: subEventId === "__general" ? null : subEventId,
      dimensions: needsDimensions ? { length } : undefined,
      fabric,
      colour,
    });
    const plan = myPlans.find((p) => p.id === planId);
    setAddedTo({ planId, planName: plan?.name ?? "your plan", quantity });
  }

  return (
    <div className="mx-auto w-full max-w-6xl py-6 md:py-8 page-x">
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground md:mb-6" aria-label="Breadcrumb">
        <Link href="/" className="transition-colors hover:text-primary">
          Home
        </Link>
        <ChevronRight className="size-3 opacity-60" />
        <Link href={`/catalog?category=${encodeURIComponent(product.category)}`} className="transition-colors hover:text-primary">
          {product.category}
        </Link>
        <ChevronRight className="size-3 opacity-60" />
        <span className="truncate text-foreground">{product.name}</span>
      </nav>

      <section className="grid gap-6 md:grid-cols-[55%_45%] md:gap-8">
        {/* Image column sticks while the long configuration panel scrolls — the
            thing being bought stays on screen the whole time it's configured. */}
        <Reveal immediate direction="up" distance={16} className="md:sticky md:top-24 md:self-start">
          {/* Was a hardcoded #F5EFE6, which put an ivory slab on the charcoal
              theme. `bg-muted` tracks whichever theme is active. */}
          <ProductThumb
            imageUrl={images[activeImage] ?? product.imageUrl}
            alt={product.name}
            className="h-[320px] rounded-2xl bg-muted p-6 shadow-e2 ring-1 ring-foreground/5 md:h-[560px]"
          />
          {images.length > 1 && (
            <div className="mt-3 flex gap-2.5">
              {images.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setActiveImage(i)}
                  aria-label={`View ${i + 1} of ${images.length}`}
                  aria-current={i === activeImage}
                  className={cn(
                    "overflow-hidden rounded-md ring-1 transition-colors duration-200 ease-out-quint",
                    i === activeImage ? "ring-2 ring-primary" : "ring-border hover:ring-primary/50"
                  )}
                >
                  <ProductThumb imageUrl={src} alt="" className="size-16 rounded-none bg-muted md:size-20" />
                </button>
              ))}
            </div>
          )}
        </Reveal>

        <Reveal immediate direction="up" distance={16} delay={0.08} className="flex flex-col gap-6 rounded-2xl bg-card p-5 shadow-e1 ring-1 ring-foreground/8 md:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              {/* Trimmed a step (was text-3xl/md:text-4xl) so the name stops
                  competing with the price below it. */}
              <h1 className="font-serif text-2xl leading-tight text-foreground md:text-3xl">{product.name}</h1>
              {currentAccount && (
                <button
                  onClick={() => {
                    toggleWishlist(product.id);
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
              {[product.category, product.subcategory ?? "Standard"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-sm bg-primary/10 px-3 py-1 text-xs text-primary ring-1 ring-primary/30 ring-inset"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-end justify-between border-b border-primary/20 pb-5">
              <div>
                <p className="font-serif text-3xl text-foreground">
                  {formatRupees(product.basePrice)}
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}
                    / {product.rateType === "Qty" ? "day" : rateTypeLabel(product.rateType)}
                  </span>
                </p>
                <p className="mt-1.5 text-sm text-primary">{rateTypeLabel(product.rateType).replace(/^\w/, (c) => c.toUpperCase())}</p>
              </div>
            </div>
          </div>

          {(() => {
            // Every facet this product has a value for: size, the category's own facets, then the global ones.
            const facets = [...(CATEGORIES.find((c) => c.name === product.category)?.facets ?? []), ...GLOBAL_FACETS.filter((f) => f.key !== "price")];
            const rows = [...(product.size ? [["Size", product.size]] : []), ...facets.map((f) => [f.label, facetValues(f, product).join(", ")]).filter(([, v]) => v && v !== "—")];
            return rows.length > 0 ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 rounded-xl border border-border bg-muted/30 p-4 text-sm">
                {rows.map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase">{label}</dt>
                    <dd className="mt-0.5 text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : null;
          })()}

          {upholsteryOptions(product).length > 0 && (
            <div className="border-t border-border pt-4">
              <ColourPicker options={product.colours ?? []} value={colour} onChange={setColour} />
              <FabricPicker options={upholsteryOptions(product)} value={fabric} onChange={setFabric} />
            </div>
          )}

          {needsDimensions ? (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-foreground">{product.rateType === "SqFt" ? "Area (sq ft)" : "Length (running ft)"}</span>
              <NumberStepper value={length} onChange={setLength} aria-label="Size" />
            </div>
          ) : (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="font-serif text-xl text-foreground">Quantity</span>
              <NumberStepper value={quantity} onChange={setQuantity} aria-label="Quantity" />
            </div>
          )}

          <div className="flex items-center gap-2.5 rounded-xl bg-[color-mix(in_oklab,var(--success)_10%,transparent)] px-4 py-3 text-sm text-[var(--success)] ring-1 ring-[color-mix(in_oklab,var(--success)_28%,transparent)] ring-inset">
            <Check className="size-4 shrink-0" />
            Available for selected dates
          </div>

          {currentAccount ? (
            <>
              <div className="hidden flex-col gap-2 md:flex">
                <Label className="text-sm text-muted-foreground">Add to</Label>
                <Select value={planId} onValueChange={(v) => v && setPlanId(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {myPlans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedPlan && selectedPlan.subEvents.length > 0 && (
                <div className="flex flex-col gap-2">
                  <Label className="text-sm text-muted-foreground">Tag to sub-event</Label>
                  <Select value={subEventId} onValueChange={(v) => v && setSubEventId(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__general">General (no sub-event)</SelectItem>
                      {selectedPlan.subEvents.map((se) => (
                        <SelectItem key={se.id} value={se.id}>
                          {se.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button size="lg" className="w-full" onClick={handleAdd}>
                Add to Plan
              </Button>
            </>
          ) : (
            <Button size="lg" className="w-full" nativeButton={false} render={<Link href="/signup">Sign up to add to a plan</Link>} />
          )}
          <RentalTerms />
        </Reveal>
      </section>

      {/* Similar first: someone comparing chairs wants the other chairs before
          they want a matching carpet. */}
      <ProductRail
        title="Similar Products"
        products={similar}
        action={
          product.subcategory
            ? { href: `/catalog?category=${slug(product.category)}&subcategory=${slug(product.subcategory)}`, label: `View all ${product.subcategory.toLowerCase()}` }
            : { href: `/catalog?category=${slug(product.category)}`, label: `View all ${product.category.toLowerCase()}` }
        }
      />

      <ProductRail title="Complements This" products={complementary} />

      <ProductRail title="Recently Viewed" products={recentlyViewed} />


      {currentAccount && myPlans.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          You don&apos;t have a Draft plan yet — <Link href="/plans" className="text-primary underline">create one</Link> to add items.
        </p>
      )}

      {/* Mobile sticky add bar — slides up once, above the fixed tab bar. */}
      {currentAccount && (
        <motion.div
          initial={{ y: reduce ? 0 : 64 }}
          animate={{ y: 0 }}
          transition={reduce ? { duration: 0.01 } : SPRING.soft}
          className="fixed inset-x-0 bottom-16 z-30 flex items-center gap-2 border-t border-border bg-background/95 p-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.4)] supports-backdrop-filter:bg-background/85 supports-backdrop-filter:backdrop-blur-xl md:hidden"
        >
          <Select value={planId} onValueChange={(v) => v && setPlanId(v)}>
            <SelectTrigger className="h-11 flex-1 border-primary/40 bg-card">
              <SelectValue placeholder="Add to: Select a Plan" />
            </SelectTrigger>
            <SelectContent>
              {myPlans.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="lg" onClick={handleAdd}>
            Add to Plan
          </Button>
        </motion.div>
      )}

      <Dialog open={!!addedTo} onOpenChange={(open) => !open && setAddedTo(null)}>
        <DialogContent className="text-center sm:max-w-md">
          <DialogHeader className="items-center gap-3">
            {/* The tick springs in a beat after the dialog lands, so the
                confirmation reads as a result rather than page furniture. */}
            <motion.div
              initial={{ scale: reduce ? 1 : 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={reduce ? { duration: 0.01 } : { ...SPRING.snappy, delay: 0.1 }}
              className="flex size-14 items-center justify-center rounded-sm bg-primary/12 text-primary ring-1 ring-primary/40"
            >
              <Check className="size-7" />
            </motion.div>
            <DialogTitle className="font-serif text-3xl text-foreground">Added to Plan</DialogTitle>
            <p className="text-sm text-muted-foreground">{product.name} has been added to your plan.</p>
          </DialogHeader>
          {addedTo && (
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Quantity</span>
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
