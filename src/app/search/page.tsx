"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ProductThumb } from "@/components/product-thumb";
import { useMockStore } from "@/mock-data/store";
import { formatRupees } from "@/mock-data/seed";

// Flowstep screens 7 (desktop) / 8 (mobile). Only the Products tab has real
// data to search against — Bundles/Collections/Themes are separate concepts
// not yet modeled, so they render an honest "nothing here yet" state.
function SearchContent() {
  const searchParams = useSearchParams();
  const { products, currentAccount, wishlist, toggleWishlist } = useMockStore();
  const [query, setQuery] = useState(searchParams.get("q") ?? searchParams.get("occasion") ?? "");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [products, query]);

  return (
    <div className="px-6 py-6 md:px-8">
      <div className="mb-1 relative w-full max-w-md md:hidden">
        <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} className="rounded-full bg-card border-border pl-10 pr-10" placeholder="Search" />
        {query && (
          <button className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" onClick={() => setQuery("")}>
            <X className="size-5" />
          </button>
        )}
      </div>

      <h1 className="hidden md:block font-serif text-3xl text-foreground">
        {query ? `Search results for "${query}"` : "Search"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{results.length} results found</p>

      <Tabs defaultValue="products" className="mt-6">
        <TabsList className="w-full justify-start gap-6 overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
          {["products", "bundles", "collections", "themes"].map((t) => (
            <TabsTrigger key={t} value={t} className="rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 capitalize text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none">
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {results.map((p) => {
          const wishlisted = wishlist.includes(p.id);
          return (
            <Card key={p.id} className="gap-0 overflow-hidden border-border bg-card p-0">
              <div className="relative">
                <Link href={`/catalog/${p.id}`}>
                  <ProductThumb imageUrl={p.imageUrl} alt={p.name} className="aspect-square w-full" />
                </Link>
                {currentAccount && (
                  <button className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-background/60" onClick={() => toggleWishlist(p.id)}>
                    <Heart className={wishlisted ? "fill-primary text-primary" : "text-foreground"} size={16} />
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2 p-4">
                <span className="w-fit rounded-full border border-primary/40 px-2 py-0.5 text-[11px] text-primary">Per Day</span>
                <Link href={`/catalog/${p.id}`} className="font-serif text-base text-foreground hover:text-primary">
                  {p.name}
                </Link>
                <p className="text-sm text-muted-foreground">From {formatRupees(p.basePrice)} / day</p>
                <Button variant="outline" className="mt-1 w-full rounded-full border-primary text-primary" nativeButton={false} render={<Link href={`/catalog/${p.id}`}>Add to Plan</Link>} />
              </div>
            </Card>
          );
        })}
      </div>
      {results.length === 0 && <p className="mt-8 text-center text-muted-foreground">No products matched &quot;{query}&quot;.</p>}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
