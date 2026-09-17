"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search, X, Heart } from "lucide-react";
import { DUR, EASE, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { SkeletonCard } from "@/components/ui/skeleton";
import { ProductThumb } from "@/components/product-thumb";
import { cn } from "@/lib/utils";
import { useMockStore } from "@/mock-data/store";
import { formatRupees } from "@/mock-data/seed";

// Flowstep screens 7 (desktop) / 8 (mobile). Only the Products tab has real
// data to search against — Bundles/Collections/Themes are separate concepts
// not yet modeled, so they render an honest "nothing here yet" state.
const TABS = ["products", "bundles", "collections", "themes"] as const;

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
    <div className="mx-auto w-full max-w-[110rem] py-6 md:py-8 page-x">
      <div className="relative mb-4 w-full md:hidden">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-11 rounded-sm border-border bg-card pr-10 pl-10"
          placeholder="Search"
        />
        {query && (
          <button
            className="press absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setQuery("")}
            aria-label="Clear search"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      <Reveal immediate className="flex flex-col gap-1.5">
        <h1 className="hidden font-serif text-3xl text-foreground md:block">
          {query ? `Search results for "${query}"` : "Search"}
        </h1>
        {/* Result count re-keys so it animates when the query narrows. */}
        <motion.p
          key={results.length}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.fast, ease: EASE.out }}
          className="text-sm text-muted-foreground"
        >
          <span className="font-medium text-foreground tabular-nums">{results.length}</span> result{results.length === 1 ? "" : "s"} found
        </motion.p>
      </Reveal>

      {/* variant="line" drives the sliding gold rule from the shared Tabs
          component. The previous markup styled data-[state=active], a Radix
          attribute this Base UI build never emits, so no tab ever looked
          selected. */}
      <Tabs defaultValue="products" className="mt-6">
        <TabsList variant="line" className="w-full justify-start gap-6 overflow-x-auto">
          {TABS.map((t) => (
            <TabsTrigger key={t} value={t} className="flex-none px-1 capitalize">
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {results.length > 0 ? (
        <Stagger key={query} immediate gap={0.04} className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {results.map((p) => {
            const wishlisted = wishlist.includes(p.id);
            return (
              <StaggerItem key={p.id} distance={14} scale={0.97} className="flex flex-col">
                <Card interactive className="group h-full gap-0 overflow-hidden border-border bg-card p-0">
                  <div className="relative overflow-hidden bg-muted/60">
                    <Link href={`/catalog/${p.id}`}>
                      <ProductThumb
                        imageUrl={p.imageUrl}
                        alt={p.name}
                        className="aspect-square w-full rounded-none bg-transparent transition-transform duration-600 ease-out-quint group-hover:scale-[1.06]"
                      />
                    </Link>
                    {currentAccount && (
                      <button
                        className="press absolute top-3 right-3 flex size-9 items-center justify-center rounded-sm bg-background/85 shadow-e1 backdrop-blur transition-colors hover:bg-background"
                        onClick={() => toggleWishlist(p.id)}
                        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                        aria-pressed={wishlisted}
                      >
                        <Heart
                          className={cn(
                            "size-4 transition-[transform,color,fill] duration-300 ease-out-quint",
                            wishlisted ? "scale-110 fill-primary text-primary" : "text-foreground",
                          )}
                        />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <Badge variant="accent" className="w-fit">
                      Per Day
                    </Badge>
                    <Link
                      href={`/catalog/${p.id}`}
                      className="font-serif text-base leading-snug text-foreground transition-colors duration-200 ease-out-quint hover:text-primary"
                    >
                      {p.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">From {formatRupees(p.basePrice)} / day</p>
                    <Button
                      variant="outline"
                      className="mt-auto w-full rounded-sm"
                      nativeButton={false}
                      render={<Link href={`/catalog/${p.id}`}>Add to Plan</Link>}
                    />
                  </div>
                </Card>
              </StaggerItem>
            );
          })}
        </Stagger>
      ) : (
        <Reveal immediate className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-20 text-center">
          <span className="flex size-14 items-center justify-center rounded-sm bg-primary/10">
            <Search className="size-6 text-primary" />
          </span>
          <p className="font-serif text-xl">No products matched &ldquo;{query}&rdquo;</p>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">Try a shorter phrase, or browse the full catalog.</p>
          <Button variant="outline" className="mt-1" nativeButton={false} render={<Link href="/catalog">Browse catalog</Link>} />
        </Reveal>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto grid w-full max-w-[110rem] grid-cols-2 gap-4 py-14 md:grid-cols-4 md:gap-6 page-x">
          {Array.from({ length: 8 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
