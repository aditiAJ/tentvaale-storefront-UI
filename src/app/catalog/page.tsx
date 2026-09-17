"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpDown, ChevronDown, ChevronRight, Heart, Minus, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { DUR, EASE, Reveal } from "@/components/motion";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ProductThumb } from "@/components/product-thumb";
import { NumberStepper } from "@/components/number-stepper";
import { FabricPicker } from "@/components/fabric-picker";
import { cn } from "@/lib/utils";
import { useMockStore } from "@/mock-data/store";
import { formatRupees, rateTypeLabel } from "@/mock-data/seed";
import { CATEGORIES, GLOBAL_FACETS, facetOptions, facetValues, type CategoryDef, type FacetDef, upholsteryOptions } from "@/mock-data/taxonomy";
import type { Product, RateType } from "@/mock-data/types";

type SortKey = "popularity" | "price_low" | "price_high" | "name";
/** facet key -> selected values. OR within a facet, AND across facets. */
type Selection = Record<string, string[]>;

const slug = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const unitShort = (rt: RateType) => (rt === "Qty" ? "unit" : rt === "SqFt" ? "sqft" : "ft");

function matches(p: Product, facets: FacetDef[], selection: Selection) {
  return facets.every((f) => {
    const wanted = selection[f.key];
    return !wanted?.length || facetValues(f, p).some((v) => wanted.includes(v));
  });
}

/* ---------------- Filters ---------------- */

function FacetGroup({ title, count, defaultOpen, children }: { title: string; count?: number; defaultOpen?: boolean; children: React.ReactNode }) {
  // <details> stays the mechanism (keyboard + no-JS behaviour for free);
  // interpolate-size + the ::details-content rule below give it a real
  // height transition instead of the browser's instant snap.
  return (
    <details open={defaultOpen} className="group border-t border-border py-3 first:border-t-0 first:pt-0 [interpolate-size:allow-keywords]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-0.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase transition-colors duration-200 ease-out-quint select-none hover:text-foreground [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          {title}
          {!!count && (
            <span className="rounded-sm bg-primary px-1.5 text-[10px] leading-4 font-semibold text-primary-foreground normal-case tabular-nums">
              {count}
            </span>
          )}
        </span>
        <ChevronDown className="size-3.5 transition-transform duration-300 ease-out-quint group-open:rotate-180" />
      </summary>
      <div className="mt-2.5 flex flex-col gap-2">{children}</div>
    </details>
  );
}

function CheckList({ options, selected, onToggle }: { options: { value: string; count: number }[]; selected: string[]; onToggle: (v: string) => void }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? options : options.slice(0, 6);
  return (
    <>
      {visible.map((o) => (
        <label key={o.value} className="-mx-1.5 flex cursor-pointer items-center justify-between gap-2 rounded-md px-1.5 py-1 text-sm text-foreground/80 transition-colors duration-200 ease-out-quint hover:bg-muted/60 hover:text-foreground">
          <span className="flex min-w-0 items-center gap-2">
            <Checkbox checked={selected.includes(o.value)} onCheckedChange={() => onToggle(o.value)} />
            <span className="truncate">{o.value}</span>
          </span>
          <span className="text-[11px] text-muted-foreground tabular-nums">{o.count}</span>
        </label>
      ))}
      {options.length > 6 && (
        <button className="w-fit text-xs text-primary hover:underline" onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Show less" : `Show ${options.length - 6} more`}
        </button>
      )}
    </>
  );
}

function FilterPanel({
  products,
  scope,
  category,
  onCategory,
  query,
  setQuery,
  subcats,
  setSubcats,
  selection,
  toggle,
  totalCount,
}: {
  products: Product[];
  scope: Product[];
  category?: CategoryDef;
  onCategory: (name: string | null) => void;
  query: string;
  setQuery: (q: string) => void;
  subcats: string[];
  setSubcats: (s: string[]) => void;
  selection: Selection;
  toggle: (key: string, value: string) => void;
  totalCount: (name: string | null) => number;
}) {
  const [expanded, setExpanded] = useState<string[]>([]);
  const facetBlock = (f: FacetDef, open: boolean) => {
    const options = facetOptions(f, scope);
    if (options.length === 0) return null;
    return (
      <FacetGroup key={f.key} title={f.label} count={selection[f.key]?.length} defaultOpen={open || !!selection[f.key]?.length}>
        {f.key === "price" ? (
          <div className="flex flex-wrap gap-1.5">
            {options.map((o) => (
              <button
                key={o.value}
                onClick={() => toggle(f.key, o.value)}
                className={cn(
                  "press rounded-sm border px-3 py-1.5 text-xs transition-all duration-200 ease-out-quint",
                  selection.price?.includes(o.value) ? "glow border-primary bg-primary/15 text-primary" : "border-border text-foreground/80 hover:border-primary/50 hover:bg-primary/5",
                )}
              >
                {o.value}
              </button>
            ))}
          </div>
        ) : (
          <CheckList options={options} selected={selection[f.key] ?? []} onToggle={(v) => toggle(f.key, v)} />
        )}
      </FacetGroup>
    );
  };

  return (
    <div className="flex flex-col">
      <div className="relative mb-4">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search in catalog"
          className="h-10 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-sm outline-none transition-[border-color,box-shadow] duration-200 ease-out-quint hover:border-primary/40 focus:border-primary focus:shadow-[0_0_0_3px_var(--ring)]"
        />
      </div>

      {/* Category tree: category rows expand to their subcategories */}
      <FacetGroup title="Categories" defaultOpen>
        <button
          onClick={() => onCategory(null)}
          className={cn(
            "-mx-1 flex items-center justify-between rounded-md px-2 py-2 text-left text-sm transition-colors duration-200 ease-out-quint",
            !category ? "bg-primary/10 font-medium text-primary" : "text-foreground/80 hover:bg-muted hover:text-foreground",
          )}
        >
          All products
          <span className="text-[11px] text-muted-foreground tabular-nums">{totalCount(null)}</span>
        </button>
        <ul className="-mx-1 flex flex-col">
          {CATEGORIES.map((c) => {
            const active = category?.name === c.name;
            const open = active || expanded.includes(c.name);
            return (
              <li key={c.name}>
                <div className={cn("flex items-center rounded-md transition-colors duration-200 ease-out-quint", active ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted hover:text-foreground")}>
                  <button
                    onClick={() => setExpanded(open && !active ? expanded.filter((n) => n !== c.name) : [...expanded, c.name])}
                    className="flex size-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={open ? `Collapse ${c.name}` : `Expand ${c.name}`}
                    aria-expanded={open}
                  >
                    <ChevronRight className={cn("size-3.5 transition-transform duration-300 ease-out-quint", open && "rotate-90")} />
                  </button>
                  <button onClick={() => onCategory(c.name)} className={cn("flex flex-1 items-center justify-between py-2 pr-2 text-left text-sm", active && "font-medium")}>
                    {c.name}
                    <span className="text-[11px] text-muted-foreground tabular-nums">{totalCount(c.name)}</span>
                  </button>
                </div>
                <AnimatePresence initial={false}>
                  {open && (
                  <motion.ul
                    key="subcats"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{
                      height: { duration: DUR.base, ease: EASE.inOut },
                      opacity: { duration: DUR.fast, ease: EASE.out },
                    }}
                    className="mt-0.5 mb-1 ml-3.5 flex flex-col overflow-hidden border-l border-border pl-2"
                  >
                    {c.subcategories.map((sub) => {
                      const on = active && subcats.includes(sub);
                      const count = products.filter((p) => p.category === c.name && p.subcategory === sub).length;
                      return (
                        <li key={sub}>
                          <button
                            onClick={() => {
                              if (!active) {
                                onCategory(c.name);
                                setSubcats([sub]);
                              } else setSubcats(on ? subcats.filter((s) => s !== sub) : [...subcats, sub]);
                            }}
                            disabled={count === 0}
                            className={cn(
                              "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors duration-200 ease-out-quint disabled:opacity-40",
                              on ? "font-medium text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                            )}
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "size-1.5 rounded-full transition-[background-color,transform] duration-200 ease-out-quint",
                                  on ? "scale-125 bg-primary" : "bg-border",
                                )}
                              />
                              {sub}
                            </span>
                            <span className="text-[11px] tabular-nums">{count}</span>
                          </button>
                        </li>
                      );
                    })}
                  </motion.ul>
                )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </FacetGroup>

      {category && category.facets.map((f) => facetBlock(f, true))}

      {GLOBAL_FACETS.map((f) => facetBlock(f, f.key === "price" || f.key === "colour"))}
    </div>
  );
}

/* ---------------- Quick add (corner button) ---------------- */

function QuickAddDialog({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const router = useRouter();
  const { currentAccount, plans, addPlanItem } = useMockStore();
  const myPlans = plans.filter((p) => p.ownerAccountId === currentAccount?.id && p.status === "Draft");
  const [planId, setPlanId] = useState("");
  const [subEventId, setSubEventId] = useState("__base");
  const [qty, setQty] = useState(1);
  const [fabric, setFabric] = useState<string | undefined>(undefined);

  const plan = myPlans.find((p) => p.id === planId) ?? myPlans[0];

  function handleAdd() {
    if (!product || !plan) return;
    const perArea = product.rateType !== "Qty";
    addPlanItem(plan.id, {
      productId: product.id,
      quantity: perArea ? 1 : qty,
      dimensions: perArea ? { length: qty } : undefined,
      subEventId: subEventId === "__base" ? null : subEventId,
      fabric,
    });
    toast.success(`Added ${product.name} to ${plan.name}`, { action: { label: "View plan", onClick: () => router.push(`/plans/${plan.id}`) } });
    onClose();
  }

  return (
    <Dialog open={product !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {product && (
          <>
            <DialogHeader>
              <DialogTitle>Add to plan</DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
              <ProductThumb imageUrl={product.imageUrl} alt={product.name} className="size-14 shrink-0" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{product.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatRupees(product.basePrice)} {rateTypeLabel(product.rateType)}
                  {product.size ? ` · ${product.size}` : ""}
                </p>
              </div>
            </div>

            {!currentAccount ? (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <p className="text-sm text-muted-foreground">Sign in to save products to your event plan.</p>
                <Button nativeButton={false} render={<Link href="/signup">Sign up / Log in</Link>} />
              </div>
            ) : !plan ? (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <p className="text-sm text-muted-foreground">You don&apos;t have a draft plan yet.</p>
                <Button nativeButton={false} render={<Link href="/plans">Create a plan</Link>} />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Plan</Label>
                    <Select
                      value={plan.id}
                      onValueChange={(v) => {
                        if (!v) return;
                        setPlanId(v);
                        setSubEventId("__base");
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>{plan.name}</SelectValue>
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
                  <div className="flex flex-col gap-1.5">
                    <Label>Function</Label>
                    <Select value={subEventId} onValueChange={(v) => v && setSubEventId(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue>{subEventId === "__base" ? plan.generalLabel?.trim() || "Your event" : plan.subEvents.find((se) => se.id === subEventId)?.name}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__base">{plan.generalLabel?.trim() || "Your event"}</SelectItem>
                        {plan.subEvents.map((se) => (
                          <SelectItem key={se.id} value={se.id}>
                            {se.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Label>{product.rateType === "Qty" ? "Quantity" : product.rateType === "SqFt" ? "Area (sqft)" : "Length (running ft)"}</Label>
                  <NumberStepper value={qty} onChange={setQty} aria-label="Quantity" />
                </div>

                <FabricPicker options={upholsteryOptions(product)} value={fabric} onChange={setFabric} />

                <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Estimated</span>
                  <span className="font-serif text-lg text-primary">{formatRupees(product.basePrice * qty)}</span>
                </div>
              </div>
            )}

            {currentAccount && plan && (
              <DialogFooter>
                <Button variant="outline" nativeButton={false} render={<Link href={`/catalog/${product.id}`}>View details</Link>} />
                <Button className="gap-1.5" onClick={handleAdd}>
                  <Plus className="size-4" /> Add to plan
                </Button>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Product card ---------------- */

/** Where this product already sits in the shopper's draft plans (latest wins). */
function usePlanLine(productId: string) {
  const { currentAccount, plans } = useMockStore();
  if (!currentAccount) return null;
  for (let i = plans.length - 1; i >= 0; i--) {
    const plan = plans[i];
    if (plan.ownerAccountId !== currentAccount.id || plan.status !== "Draft") continue;
    const item = [...plan.items].reverse().find((it) => it.productId === productId);
    if (item) return { planId: plan.id, planName: plan.name, itemId: item.id, qty: item.dimensions?.length ?? item.quantity };
  }
  return null;
}

/**
 * Compact − qty + control shown in place of Add once the product is in a
 * plan. Plain buttons, not NumberStepper: that one captures the mouse wheel,
 * which would hijack page scrolling while the cursor crosses a card.
 */
function CardQty({ product, line }: { product: Product; line: NonNullable<ReturnType<typeof usePlanLine>> }) {
  const { setPlanItemQty, removePlanItem } = useMockStore();
  const unit = product.rateType === "Qty" ? "" : ` ${unitShort(product.rateType)}`;

  function dec() {
    if (line.qty <= 1) {
      removePlanItem(line.planId, line.itemId);
      toast(`Removed ${product.name} from ${line.planName}`);
    } else setPlanItemQty(line.planId, line.itemId, line.qty - 1);
  }

  return (
    <div
      className="flex h-8 shrink-0 items-center overflow-hidden rounded-md border border-primary bg-primary/10 text-primary"
      title={`In ${line.planName}`}
    >
      <button onClick={dec} className="flex h-full w-7 items-center justify-center transition-colors hover:bg-primary hover:text-primary-foreground" aria-label={line.qty <= 1 ? `Remove ${product.name} from plan` : `Decrease ${product.name}`}>
        <Minus className="size-3.5" />
      </button>
      <span className="min-w-7 px-1 text-center text-xs font-semibold tabular-nums" aria-live="polite">
        {line.qty}
        {unit}
      </span>
      <button
        onClick={() => setPlanItemQty(line.planId, line.itemId, line.qty + 1)}
        className="flex h-full w-7 items-center justify-center transition-colors hover:bg-primary hover:text-primary-foreground"
        aria-label={`Increase ${product.name}`}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

function ProductCard({ product, onQuickAdd }: { product: Product; onQuickAdd: (p: Product) => void }) {
  const { currentAccount, wishlist, toggleWishlist } = useMockStore();
  const wishlisted = wishlist.includes(product.id);
  const line = usePlanLine(product.id);
  // The hover swap uses only AUTHORED alternates (`imageUrls`), never the
  // derived views from productImages(): those are re-crops of the same
  // photograph, so cross-fading to one looks like a zoom rather than a second
  // angle. Until real multi-angle photography exists, cards simply do not swap.
  const hoverImage = product.imageUrls?.[1];

  return (
    // h-full keeps cards in a grid row the same height; the info block sits
    // compactly under the image and any spare height falls below it.
    // No `surface-interactive` here: the listing grid deliberately does not lift
    // or elevate on hover. The colour changes below are kept as affordance.
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-e1 transition-[box-shadow,border-color] duration-[260ms] ease-out-quint hover:glow hover:border-primary">
      <div className="relative overflow-hidden bg-muted/60">
        <Link href={`/catalog/${product.id}`} className="block">
          {/* 4:3 keeps the photo to roughly 55–60% of the card height. */}
          <ProductThumb
            imageUrl={product.imageUrl}
            alt={product.name}
            className="aspect-[4/3] w-full rounded-none bg-transparent"
          />
          {hoverImage && (
            <ProductThumb
              imageUrl={hoverImage}
              alt=""
              className="absolute inset-0 aspect-[4/3] w-full rounded-none bg-transparent opacity-0 transition-opacity duration-300 ease-out-quint group-hover:opacity-100"
            />
          )}
          {(product.imageUrls?.length ?? 0) > 1 && (
            <span className="absolute bottom-2 left-2 rounded-sm bg-background/85 px-1.5 py-0.5 text-[10px] font-medium text-foreground/70 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {product.imageUrls!.length} views
            </span>
          )}
        </Link>
        {currentAccount && (
          <button
            // No chip behind the icon (feedback). A drop-shadow on the glyph
            // itself keeps it legible over pale photos without a filled box.
            className="press absolute top-2 right-2 flex size-8 items-center justify-center rounded-md transition-colors duration-200 ease-out-quint"
            onClick={() => toggleWishlist(product.id)}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={wishlisted}
          >
            <Heart
              className={cn(
                "size-4 [filter:drop-shadow(0_1px_2px_rgb(0_0_0/0.45))] transition-[transform,color,fill] duration-300 ease-out-quint",
                wishlisted ? "scale-110 fill-primary text-primary" : "text-white hover:text-primary"
              )}
            />
          </button>
        )}
      </div>

      <div className="flex flex-col px-3 pt-2.5 pb-3">
        {/* Name and size read as one block; price follows right under it
            with a small gap rather than being pushed to the card's foot. */}
        <div className="flex flex-col gap-0.5">
          <Link
            href={`/catalog/${product.id}`}
            className="line-clamp-2 text-sm leading-5 font-medium text-foreground transition-colors duration-200 ease-out-quint group-hover:text-primary"
            title={product.name}
          >
            {product.name}
          </Link>
          {product.size && <span className="truncate text-[11px] leading-4 text-muted-foreground">{product.size}</span>}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <Link href={`/catalog/${product.id}`} className="min-w-0 truncate leading-none">
            <span className="font-serif text-base text-primary">{formatRupees(product.basePrice)}</span>
            <span className="text-[11px] text-muted-foreground"> /{unitShort(product.rateType)}</span>
          </Link>
          {line ? (
            <CardQty product={product} line={line} />
          ) : (
            <button
              onClick={() => onQuickAdd(product)}
              className="press inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-primary px-2.5 text-[11px] font-semibold tracking-wide text-primary uppercase transition-colors duration-200 ease-out-quint hover:bg-primary hover:text-primary-foreground focus-visible:bg-primary focus-visible:text-primary-foreground"
              aria-label={`Add ${product.name} to plan`}
            >
              <Plus className="size-3.5" strokeWidth={2.5} />
              Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}


/* ---------------- Page ---------------- */

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { products } = useMockStore();
  const categoryParam = searchParams.get("category");
  const category = categoryParam ? CATEGORIES.find((c) => slug(c.name) === slug(categoryParam)) : undefined;
  const [sort, setSort] = useState<SortKey>("popularity");
  const [query, setQuery] = useState("");
  // Seeded from the URL so the nav mega-menu can deep-link straight to a
  // subcategory; after mount it is ordinary local state like the other facets.
  const subcategoryParam = searchParams.get("subcategory");
  const [subcats, setSubcats] = useState<string[]>(() => {
    if (!subcategoryParam || !category) return [];
    const match = category.subcategories.find((sub) => slug(sub) === slug(subcategoryParam));
    return match ? [match] : [];
  });
  const [selection, setSelection] = useState<Selection>({});
  const [quickAdd, setQuickAdd] = useState<Product | null>(null);

  const categoryFacets = category?.facets ?? [];
  const allFacets = [...categoryFacets, ...GLOBAL_FACETS];

  function setCategory(name: string | null) {
    // Category-only facets don't carry over to another category.
    setSubcats([]);
    setSelection((s) => Object.fromEntries(Object.entries(s).filter(([k]) => GLOBAL_FACETS.some((f) => f.key === k))));
    router.push(name ? `/catalog?category=${encodeURIComponent(slug(name))}` : "/catalog", { scroll: false });
  }

  function toggle(key: string, value: string) {
    setSelection((s) => {
      const cur = s[key] ?? [];
      return { ...s, [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
    });
  }

  function clearAll() {
    setQuery("");
    setSubcats([]);
    setSelection({});
  }

  const inCategory = category ? products.filter((p) => p.category === category.name) : products;

  // React Compiler memoizes these; no manual useMemo needed.
  const q = query.trim().toLowerCase();
  const filtered = inCategory.filter(
      (p) =>
        (subcats.length === 0 || (p.subcategory && subcats.includes(p.subcategory))) &&
        matches(p, allFacets, selection) &&
        (!q || [p.name, p.category, p.subcategory, ...(p.materials ?? []), ...(p.colours ?? []), ...(p.fabrics ?? [])].join(" ").toLowerCase().includes(q)),
    );
  if (sort === "price_low") filtered.sort((a, b) => a.basePrice - b.basePrice);
  if (sort === "price_high") filtered.sort((a, b) => b.basePrice - a.basePrice);
  if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));

  const pills = [
    ...(query.trim() ? [{ key: "q", label: `“${query.trim()}”`, clear: () => setQuery("") }] : []),
    ...subcats.map((s) => ({ key: `sub-${s}`, label: s, clear: () => setSubcats(subcats.filter((x) => x !== s)) })),
    ...allFacets.flatMap((f) => (selection[f.key] ?? []).map((v) => ({ key: `${f.key}-${v}`, label: `${f.label}: ${v}`, clear: () => toggle(f.key, v) }))),
  ];

  // Filtering while scrolled deep into the grid shrinks the page under the
  // viewport and leaves you staring at the footer. When the result set
  // changes and the grid's top is above the fold, bring the results back
  // into view. Only scrolls up, never down, so filtering at the top is still.
  const gridRef = useRef<HTMLDivElement>(null);
  const resultKey = `${category?.name ?? ""}|${sort}|${pills.map((p) => p.key).join(",")}`;
  const lastKey = useRef(resultKey);
  useEffect(() => {
    if (lastKey.current === resultKey) return;
    lastKey.current = resultKey;
    const el = gridRef.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [resultKey]);

  const panel = (
    <FilterPanel
      products={products}
      scope={inCategory}
      category={category}
      onCategory={setCategory}
      query={query}
      setQuery={setQuery}
      subcats={subcats}
      setSubcats={setSubcats}
      selection={selection}
      toggle={toggle}
      totalCount={(name) => (name ? products.filter((p) => p.category === name).length : products.length)}
    />
  );

  return (
    <div className="w-full py-6 md:py-8 page-x">
      <nav className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="transition-colors hover:text-primary">
          Home
        </Link>
        <ChevronRight className="size-3 opacity-60" />
        <Link href="/catalog" className={category ? "transition-colors hover:text-primary" : "text-foreground"}>
          Catalog
        </Link>
        {category && (
          <>
            <ChevronRight className="size-3 opacity-60" />
            <span className="text-foreground">{category.name}</span>
          </>
        )}
      </nav>

      {/* Heading re-keys on category so switching categories replays the
          entrance — the page visibly answers the click. */}
      <Reveal key={category?.name ?? "all"} immediate direction="up" distance={12} className="mb-7 flex flex-col gap-1.5">
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">{category?.name ?? "Product Catalog"}</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          {category?.blurb ?? "Furniture, décor, lighting and installations to rent for every occasion."}
        </p>
      </Reveal>

      <div className="flex gap-8">
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-e1">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium">
                <SlidersHorizontal className="size-4 text-primary" /> Filters
              </span>
              {pills.length > 0 && (
                <button className="text-xs text-primary hover:underline" onClick={clearAll}>
                  Clear all
                </button>
              )}
            </div>
            {panel}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Sheet>
              <SheetTrigger
                render={
                  <button className="press flex h-10 items-center gap-2 rounded-lg border border-border px-3.5 text-sm transition-colors duration-200 ease-out-quint hover:border-primary/60 md:hidden">
                    <SlidersHorizontal className="size-4" /> Filters
                    {pills.length > 0 && (
                      <span className="rounded-sm bg-primary px-1.5 text-[10px] leading-4 font-semibold text-primary-foreground tabular-nums">{pills.length}</span>
                    )}
                  </button>
                }
              />
              <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="px-5 pb-8">{panel}</div>
              </SheetContent>
            </Sheet>
            {/* Count animates on change so the result of a filter click is
                visible even when it lands below the fold. */}
            <motion.span
              key={filtered.length}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DUR.fast, ease: EASE.out }}
              className="text-sm text-muted-foreground"
            >
              <span className="font-medium text-foreground tabular-nums">{filtered.length}</span> product{filtered.length === 1 ? "" : "s"}
            </motion.span>
            <div className="ml-auto">
              <Select value={sort} onValueChange={(v) => v && setSort(v as SortKey)}>
                <SelectTrigger className="h-9 w-auto gap-2 rounded-lg">
                  <ArrowUpDown className="size-4 text-muted-foreground" />
                  <SelectValue>{{ popularity: "Popular", price_low: "Price: low to high", price_high: "Price: high to low", name: "Name A–Z" }[sort]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Popular</SelectItem>
                  <SelectItem value="price_low">Price: low to high</SelectItem>
                  <SelectItem value="price_high">Price: high to low</SelectItem>
                  <SelectItem value="name">Name A–Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pills pop in and collapse out individually — a filter you removed
              should visibly leave, not vanish between frames. */}
          <AnimatePresence initial={false}>
            {pills.length > 0 && (
              <motion.div
                key="pills"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: DUR.base, ease: EASE.inOut }}
                className="overflow-hidden"
              >
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <AnimatePresence initial={false} mode="popLayout">
                    {pills.map((p) => (
                      <motion.button
                        key={p.key}
                        layout
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ duration: DUR.fast, ease: EASE.out }}
                        onClick={p.clear}
                        className="press flex items-center gap-1.5 rounded-sm border border-primary/40 bg-primary/8 py-1.5 pr-2.5 pl-3.5 text-xs text-primary transition-colors duration-200 ease-out-quint hover:bg-primary/15"
                      >
                        {p.label} <X className="size-3" />
                      </motion.button>
                    ))}
                  </AnimatePresence>
                  <button className="text-xs text-muted-foreground transition-colors hover:text-foreground" onClick={clearAll}>
                    Clear all
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {filtered.length > 0 ? (
            // No re-keying and no parent stagger: each card reveals once, when
            // it scrolls into view, with a small per-column offset. A parent
            // stagger delays card N by N × gap, so cards far down a long grid
            // were still invisible after scrolling or filtering. Cards that
            // survive a filter change keep their mounted, visible state.
            <div ref={gridRef} className="grid scroll-mt-28 grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[1800px]:grid-cols-6">
              {filtered.map((p, i) => (
                <Reveal key={p.id} distance={12} duration={DUR.base} delay={(i % 4) * 0.04} className="flex min-w-0 flex-col">
                  <ProductCard product={p} onQuickAdd={setQuickAdd} />
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal immediate className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-20 text-center">
              <span className="flex size-14 items-center justify-center rounded-sm bg-primary/10">
                <Search className="size-6 text-primary" />
              </span>
              <p className="font-serif text-xl">No products match</p>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">Try removing a filter or picking another category.</p>
              <Button variant="outline" className="mt-1" onClick={clearAll}>
                Clear filters
              </Button>
            </Reveal>
          )}
        </main>
      </div>

      <QuickAddDialog key={quickAdd?.id ?? "none"} product={quickAdd} onClose={() => setQuickAdd(null)} />
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogContent />
    </Suspense>
  );
}

/** Same grid geometry as the real page, so the swap to content doesn't reflow. */
function CatalogSkeleton() {
  return (
    <div className="w-full py-6 md:py-8 page-x">
      <div className="mb-7 flex flex-col gap-2">
        <div className="shimmer h-9 w-64 rounded-lg bg-muted/70" />
        <div className="shimmer h-4 w-96 max-w-full rounded bg-muted/70" />
      </div>
      <div className="flex gap-8">
        <div className="shimmer hidden h-128 w-64 shrink-0 rounded-2xl bg-muted/70 md:block" />
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[1800px]:grid-cols-6">
          {Array.from({ length: 10 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
