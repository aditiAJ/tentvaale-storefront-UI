"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpDown, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { DUR, EASE, Reveal } from "@/components/motion";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { FilterPanel } from "@/features/catalog/components/FilterPanel";
import { ProductCard } from "@/features/catalog/components/ProductCard";
import { QuickAddDialog } from "@/features/catalog/components/QuickAddDialog";
import { useCategories, useOccasions, useProductFilters, useProductList } from "@/features/catalog/hooks";
import { bandById } from "@/features/catalog/price-bands";
import type { ProductCard as ProductCardData, ProductQuery, ProductSort } from "@/features/catalog/types";

/**
 * The catalogue. Every choice a shopper makes lives in the URL (so a filtered view can be shared,
 * bookmarked and walked back through) and is read straight from it here:
 *
 *   category=a,b  subcategory=x,y  occasion=slug  q=text  sort=NEWEST
 *   price=under-500,3000-9999     f.<facet code>=Red,Ivory
 *
 * Nothing is filtered in the browser: the backend narrows, counts and sorts, and sends 24 at a time.
 */
const FACET_PARAM = "f.";

const SORT_LABEL: Record<ProductSort, string> = {
  RELEVANCE: "Best match",
  NEWEST: "Newest",
  PRICE_ASC: "Price: low to high",
  PRICE_DESC: "Price: high to low",
  NAME: "Name A–Z",
};

const list = (value: string | null) => (value ? value.split(",").filter(Boolean) : []);

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = searchParams.toString();

  const selectedCategories = list(searchParams.get("category"));
  const selectedSubCategories = list(searchParams.get("subcategory"));
  const occasion = searchParams.get("occasion") ?? undefined;
  const q = searchParams.get("q") ?? "";
  const priceSelection = list(searchParams.get("price")).filter((id) => bandById(id));
  const facetSelection: Record<string, string[]> = {};
  searchParams.forEach((value, key) => {
    if (key.startsWith(FACET_PARAM) && key.length > FACET_PARAM.length) facetSelection[key.slice(FACET_PARAM.length)] = list(value);
  });
  const sort = (searchParams.get("sort") as ProductSort | null) ?? (q.trim() ? "RELEVANCE" : "NEWEST");

  const query: ProductQuery = useMemo(
    () => ({
      categories: selectedCategories,
      subcategories: selectedSubCategories,
      occasion,
      q: q.trim() || undefined,
      facets: facetSelection,
      priceRanges: priceSelection.map((id) => bandById(id)!.range),
      sort,
    }),
    // The URL is the single source of truth; its string form is the stable dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params],
  );

  const categoriesQuery = useCategories();
  const occasionsQuery = useOccasions();
  const filtersQuery = useProductFilters(query);
  const products = useProductList(query);
  const categories = categoriesQuery.data ?? [];
  const cards: ProductCardData[] = products.data?.pages.flatMap((p) => p.items) ?? [];
  const total = products.data?.pages[0]?.total ?? 0;
  const soleCategory = selectedCategories.length === 1 ? categories.find((c) => c.slug === selectedCategories[0]) : undefined;
  const occasionName = occasionsQuery.data?.find((o) => o.slug === occasion)?.name;

  const [quickAdd, setQuickAdd] = useState<ProductCardData | null>(null);

  /** Rewrites the URL: `change` edits a copy of the current params. Filters always restart the list. */
  function update(change: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(params);
    change(next);
    const text = next.toString();
    router.replace(text ? `/catalog?${text}` : "/catalog", { scroll: false });
  }

  function setList(next: URLSearchParams, key: string, values: string[]) {
    if (values.length > 0) next.set(key, values.join(","));
    else next.delete(key);
  }

  const toggled = (values: string[], value: string) => (values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);

  // The search box keeps its own text while typing and writes it to the URL a moment after the last key.
  const [typed, setTyped] = useState(q);
  const [written, setWritten] = useState(q);
  const [seenQ, setSeenQ] = useState(q);
  if (q !== seenQ) {
    // The URL changed. If it was not our own write (back button, Clear all), follow it.
    setSeenQ(q);
    if (q !== written) setTyped(q);
  }
  useEffect(() => {
    if (typed === q) return;
    const timer = setTimeout(() => {
      setWritten(typed);
      update((next) => (typed.trim() ? next.set("q", typed) : next.delete("q")));
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed]);

  const globalCodes = new Set((filtersQuery.data?.facets ?? []).filter((f) => f.scope === "GLOBAL").map((f) => f.code));

  /** A category's own facets mean nothing for another set of categories, so they are dropped with the change. */
  function dropCategoryFacets(next: URLSearchParams) {
    for (const key of [...next.keys()]) {
      if (key.startsWith(FACET_PARAM) && !globalCodes.has(key.slice(FACET_PARAM.length))) next.delete(key);
    }
  }

  function toggleCategory(slug: string) {
    update((next) => {
      const cats = toggled(selectedCategories, slug);
      // Switching a category off takes its ticked sub-categories with it.
      const keep = new Set(categories.filter((c) => cats.includes(c.slug)).flatMap((c) => c.subCategories.map((s) => s.slug)));
      setList(next, "category", cats);
      setList(next, "subcategory", selectedSubCategories.filter((s) => keep.has(s)));
      dropCategoryFacets(next);
    });
  }

  function toggleSubCategory(categorySlug: string, subSlug: string) {
    update((next) => {
      // Ticking a sub-category implies its parent: otherwise the category filter would exclude it.
      if (!selectedCategories.includes(categorySlug)) setList(next, "category", [...selectedCategories, categorySlug]);
      setList(next, "subcategory", toggled(selectedSubCategories, subSlug));
      dropCategoryFacets(next);
    });
  }

  function clearCategories() {
    update((next) => {
      next.delete("category");
      next.delete("subcategory");
      dropCategoryFacets(next);
    });
  }

  function toggleFacet(code: string, value: string) {
    update((next) => setList(next, FACET_PARAM + code, toggled(facetSelection[code] ?? [], value)));
  }

  function togglePrice(id: string) {
    update((next) => setList(next, "price", toggled(priceSelection, id)));
  }

  function clearAll() {
    setTyped("");
    setWritten("");
    router.replace("/catalog", { scroll: false });
  }

  const facetLabel = (code: string) => filtersQuery.data?.facets.find((f) => f.code === code)?.label ?? code;
  const pills = [
    ...(q.trim() ? [{ key: "q", label: `“${q.trim()}”`, clear: () => update((n) => n.delete("q")) }] : []),
    ...(occasion ? [{ key: "occasion", label: occasionName ?? occasion, clear: () => update((n) => n.delete("occasion")) }] : []),
    ...selectedSubCategories.map((s) => ({
      key: `sub-${s}`,
      label: categories.flatMap((c) => c.subCategories).find((x) => x.slug === s)?.name ?? s,
      clear: () => update((n) => setList(n, "subcategory", selectedSubCategories.filter((x) => x !== s))),
    })),
    ...Object.entries(facetSelection).flatMap(([code, values]) =>
      values.map((v) => ({ key: `${code}-${v}`, label: `${facetLabel(code)}: ${v}`, clear: () => toggleFacet(code, v) })),
    ),
    ...priceSelection.map((id) => ({ key: `price-${id}`, label: bandById(id)!.label, clear: () => togglePrice(id) })),
  ];

  // Filtering while scrolled deep into the grid shrinks the page under the viewport and strands you
  // at the footer. When the result set changes and the grid's top is above the fold, bring it back.
  const gridRef = useRef<HTMLDivElement>(null);
  const lastKey = useRef(params);
  useEffect(() => {
    if (lastKey.current === params) return;
    lastKey.current = params;
    const el = gridRef.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [params]);

  const panel = (
    <FilterPanel
      categories={categories}
      selectedCategories={selectedCategories}
      selectedSubCategories={selectedSubCategories}
      onToggleCategory={toggleCategory}
      onToggleSubCategory={toggleSubCategory}
      onClearCategories={clearCategories}
      filters={filtersQuery.data}
      facetSelection={facetSelection}
      onToggleFacet={toggleFacet}
      priceSelection={priceSelection}
      onTogglePrice={togglePrice}
      query={typed}
      onQueryChange={setTyped}
    />
  );

  const sortOptions: ProductSort[] = q.trim() ? ["RELEVANCE", "NEWEST", "PRICE_ASC", "PRICE_DESC", "NAME"] : ["NEWEST", "PRICE_ASC", "PRICE_DESC", "NAME"];
  const loading = products.isPending;

  return (
    <div className="w-full py-6 md:py-8 page-x">
      <nav className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="transition-colors hover:text-primary">
          Home
        </Link>
        <ChevronRight className="size-3 opacity-60" />
        <Link href="/catalog" className={selectedCategories.length ? "transition-colors hover:text-primary" : "text-foreground"}>
          Catalog
        </Link>
        {selectedCategories.length > 0 && (
          <>
            <ChevronRight className="size-3 opacity-60" />
            <span className="text-foreground">{soleCategory ? soleCategory.name : `${selectedCategories.length} categories`}</span>
          </>
        )}
      </nav>

      {/* Heading re-keys on category so switching categories replays the entrance. */}
      <Reveal key={selectedCategories.join(",") || "all"} immediate direction="up" distance={12} className="mb-7 flex flex-col gap-1.5">
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">{soleCategory?.name ?? "Product Catalog"}</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          {selectedCategories.length > 1
            ? categories.filter((c) => selectedCategories.includes(c.slug)).map((c) => c.name).join(" · ")
            : "Furniture, décor, lighting and installations to rent for every occasion."}
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
            {/* The count animates on change so the result of a filter click is visible below the fold too. */}
            {!loading && !products.isError && (
              <motion.span
                key={total}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DUR.fast, ease: EASE.out }}
                className="text-sm text-muted-foreground"
              >
                <span className="font-medium text-foreground tabular-nums">{total}</span> product{total === 1 ? "" : "s"}
              </motion.span>
            )}
            <div className="ml-auto">
              <Select value={sort} onValueChange={(v) => v && update((n) => n.set("sort", v))}>
                <SelectTrigger className="h-9 w-auto gap-2 rounded-lg">
                  <ArrowUpDown className="size-4 text-muted-foreground" />
                  <SelectValue>{SORT_LABEL[sort]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {SORT_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pills pop in and collapse out individually: a filter you removed should visibly leave. */}
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

          {products.isError ? (
            <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-20 text-center">
              <p className="font-serif text-xl">We couldn&apos;t load the catalogue</p>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">Check your connection and try again.</p>
              <Button variant="outline" className="mt-1" onClick={() => products.refetch()}>
                Try again
              </Button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[1800px]:grid-cols-6">
              {Array.from({ length: 10 }, (_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : cards.length > 0 ? (
            <>
              <div
                ref={gridRef}
                aria-busy={products.isFetching && !products.isFetchingNextPage}
                className={`grid scroll-mt-28 grid-cols-2 gap-4 transition-opacity duration-200 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[1800px]:grid-cols-6 ${products.isPlaceholderData ? "opacity-60" : ""}`}
              >
                {cards.map((card, i) => (
                  <Reveal key={card.id} distance={12} duration={DUR.base} delay={(i % 4) * 0.04} className="flex min-w-0 flex-col">
                    <ProductCard card={card} onQuickAdd={setQuickAdd} />
                  </Reveal>
                ))}
              </div>
              {products.hasNextPage && (
                <div className="mt-8 flex flex-col items-center gap-2">
                  <p className="text-xs text-muted-foreground tabular-nums">
                    Showing {cards.length} of {total}
                  </p>
                  <Button variant="outline" disabled={products.isFetchingNextPage} onClick={() => products.fetchNextPage()}>
                    {products.isFetchingNextPage ? "Loading…" : "Show more"}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Reveal immediate className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-20 text-center">
              <span className="flex size-14 items-center justify-center rounded-sm bg-primary/10">
                <Search className="size-6 text-primary" />
              </span>
              <p className="font-serif text-xl">{pills.length > 0 || selectedCategories.length > 0 ? "No products match" : "Nothing in the catalogue yet"}</p>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                {pills.length > 0 || selectedCategories.length > 0 ? "Try removing a filter or picking another category." : "Please check back soon."}
              </p>
              {(pills.length > 0 || selectedCategories.length > 0) && (
                <Button variant="outline" className="mt-1" onClick={clearAll}>
                  Clear filters
                </Button>
              )}
            </Reveal>
          )}
        </main>
      </div>

      <QuickAddDialog key={quickAdd?.id ?? "none"} card={quickAdd} onClose={() => setQuickAdd(null)} />
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

