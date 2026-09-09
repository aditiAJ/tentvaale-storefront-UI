"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, ChevronDown, Filter, ArrowUpDown, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ProductThumb } from "@/components/product-thumb";
import { useMockStore } from "@/mock-data/store";
import { formatRupees, rateTypeLabel } from "@/mock-data/seed";
import type { Product } from "@/mock-data/types";

// Flowstep screens 5 (desktop) / 6 (mobile), fileId 8bd03b8a-4561-4b58-bb2d-ca011d84d53e.
// Sub-category/Material/Size/Color filters are shown for visual fidelity but
// aren't wired to real product attributes yet — only Category and Rate Type
// (which the mock catalog actually has) and Sort are functional.
type SortKey = "popularity" | "price_low" | "price_high" | "newest";

const COSMETIC_FILTERS: { title: string; options: string[] }[] = [
  { title: "Sub-category", options: ["Chairs", "Sofas", "Tables", "Bar Counters", "Stages"] },
  { title: "Material", options: ["Wood", "Metal", "Upholstered", "Acrylic"] },
  { title: "Size", options: ["Small", "Medium", "Large"] },
];

function FilterSidebar({ rateFilter, setRateFilter }: { rateFilter: Set<string>; setRateFilter: (s: Set<string>) => void }) {
  function toggleRate(v: string) {
    const next = new Set(rateFilter);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    setRateFilter(next);
  }

  return (
    <div className="flex flex-col gap-6">
      {COSMETIC_FILTERS.map((group) => (
        <div key={group.title} className="flex flex-col gap-3 border-t border-border pt-6 first:border-t-0 first:pt-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">{group.title}</h3>
            <ChevronDown className="size-4 text-muted-foreground" />
          </div>
          {group.options.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox />
              {o}
            </label>
          ))}
        </div>
      ))}
      <div className="flex flex-col gap-3 border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Rate Type</h3>
          <ChevronDown className="size-4 text-muted-foreground" />
        </div>
        {(["Qty", "SqFt", "RFt"] as const).map((rt) => (
          <label key={rt} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={rateFilter.has(rt)} onCheckedChange={() => toggleRate(rt)} />
            {rateTypeLabel(rt).replace(/^\w/, (c) => c.toUpperCase())}
          </label>
        ))}
      </div>
      <div className="flex flex-col gap-3 border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Availability Date</h3>
          <ChevronDown className="size-4 text-muted-foreground" />
        </div>
        <input type="date" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground" />
      </div>
      <div className="flex flex-col gap-3 border-t border-border pt-6">
        <Button className="w-full rounded-lg">Apply Filters</Button>
        <button className="text-center text-xs text-muted-foreground" onClick={() => setRateFilter(new Set())}>
          Clear all
        </button>
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { currentAccount, wishlist, toggleWishlist } = useMockStore();
  const wishlisted = wishlist.includes(product.id);

  return (
    <Card className="gap-3 border-border bg-card p-4">
      <div className="relative">
        <Link href={`/catalog/${product.id}`}>
          <ProductThumb imageUrl={product.imageUrl} alt={product.name} className="aspect-square w-full rounded-lg" />
        </Link>
        {currentAccount && (
          <button
            className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-background/60"
            onClick={() => toggleWishlist(product.id)}
            aria-label="Toggle wishlist"
          >
            <Heart className={wishlisted ? "fill-primary text-primary" : "text-foreground"} size={18} />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <Link href={`/catalog/${product.id}`} className="text-sm font-medium text-foreground hover:text-primary">
          {product.name}
        </Link>
        <p className="text-xs text-muted-foreground">From {formatRupees(product.basePrice)} / day</p>
        <span className="w-fit rounded-full border border-primary/40 px-2 py-0.5 text-[10px] text-primary">{rateTypeLabel(product.rateType)}</span>
      </div>
      <Button variant="outline" className="w-full rounded-lg border-primary text-primary" nativeButton={false} render={<Link href={`/catalog/${product.id}`}>Add to Plan</Link>} />
    </Card>
  );
}

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { products } = useMockStore();
  const category = searchParams.get("category");
  const [sort, setSort] = useState<SortKey>("popularity");
  const [rateFilter, setRateFilter] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let list = category ? products.filter((p) => p.category === category) : products;
    if (rateFilter.size > 0) list = list.filter((p) => rateFilter.has(p.rateType));
    const sorted = [...list];
    if (sort === "price_low") sorted.sort((a, b) => a.basePrice - b.basePrice);
    if (sort === "price_high") sorted.sort((a, b) => b.basePrice - a.basePrice);
    if (sort === "newest") sorted.reverse();
    return sorted;
  }, [products, category, rateFilter, sort]);

  return (
    <div className="px-6 py-6 md:px-8">
      <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/">Home</Link>
        <ChevronRight className="size-3" />
        <span className="text-foreground">{category ?? "All Products"}</span>
      </div>

      <div className="mb-8">
        <h1 className="mb-2 font-serif text-2xl tracking-wide text-primary md:text-4xl">{category ?? "All Products"}</h1>
        <p className="max-w-xl text-sm text-muted-foreground">Rent premium pieces for any occasion</p>
        <p className="mt-2 text-xs text-primary">{filtered.length} items</p>
      </div>

      <div className="flex gap-8">
        <aside className="hidden w-[240px] shrink-0 md:block">
          <FilterSidebar rateFilter={rateFilter} setRateFilter={setRateFilter} />
        </aside>

        <main className="flex-1">
          <div className="mb-6 flex items-center justify-between md:hidden">
            <Sheet>
              <SheetTrigger
                render={
                  <button className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-foreground">
                    <Filter className="size-4" /> Filter
                  </button>
                }
              />
              <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-6">
                  <FilterSidebar rateFilter={rateFilter} setRateFilter={setRateFilter} />
                </div>
              </SheetContent>
            </Sheet>
            <Select value={sort} onValueChange={(v) => v && setSort(v as SortKey)}>
              <SelectTrigger className="w-auto gap-2 rounded-full border-border">
                <ArrowUpDown className="size-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Sort</SelectItem>
                <SelectItem value="price_low">Price Low to High</SelectItem>
                <SelectItem value="price_high">Price High to Low</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mb-6 hidden items-center justify-between md:flex">
            <span className="text-sm text-muted-foreground">{filtered.length} results</span>
            <Select value={sort} onValueChange={(v) => v && setSort(v as SortKey)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Sort: Popularity</SelectItem>
                <SelectItem value="price_low">Sort: Price Low to High</SelectItem>
                <SelectItem value="price_high">Sort: Price High to Low</SelectItem>
                <SelectItem value="newest">Sort: Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {filtered.length === 0 && <p className="mt-8 text-center text-muted-foreground">No products match these filters.</p>}

          {category && (
            <button className="mt-6 text-sm text-primary hover:underline" onClick={() => router.push("/catalog")}>
              Clear category filter
            </button>
          )}
        </main>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense>
      <CatalogContent />
    </Suspense>
  );
}
