"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { DUR, EASE, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaCard } from "@/components/media-card";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMoney } from "@/lib/money";
import { ProductCard } from "@/features/catalog/components/ProductCard";
import { QuickAddDialog } from "@/features/catalog/components/QuickAddDialog";
import { useBundles, useCollections, useProductList } from "@/features/catalog/hooks";
import type { ProductCard as ProductCardData } from "@/features/catalog/types";

// Flowstep screens 7 (desktop) / 8 (mobile). Products are searched by the backend (name,
// description, category, facets, occasions). Bundles and collections are few, so their lists are
// fetched once and matched here by every word in the query.
type Tab = "products" | "bundles" | "collections";

/** Every word of the query must appear in the text, any case. */
function matches(query: string, ...texts: (string | undefined)[]): boolean {
  const haystack = texts.filter(Boolean).join(" ").toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = (searchParams.get("q") ?? "").trim();
  const [typed, setTyped] = useState(searchParams.get("q") ?? "");
  const [seenQ, setSeenQ] = useState(q);
  const [tab, setTab] = useState<Tab>("products");
  const [quickAdd, setQuickAdd] = useState<ProductCardData | null>(null);

  // The URL is the query; follow it when it changes from outside (the header's search box, back button).
  if (q !== seenQ) {
    setSeenQ(q);
    if (q !== typed.trim()) setTyped(q);
  }
  useEffect(() => {
    if (typed.trim() === q) return;
    const timer = setTimeout(() => router.replace(typed.trim() ? `/search?q=${encodeURIComponent(typed.trim())}` : "/search", { scroll: false }), 350);
    return () => clearTimeout(timer);
  }, [typed, q, router]);

  const products = useProductList({ q: q || undefined, sort: q ? "RELEVANCE" : "NEWEST" });
  const bundlesQuery = useBundles();
  const collectionsQuery = useCollections();
  const cards = products.data?.pages.flatMap((p) => p.items) ?? [];
  const productTotal = products.data?.pages[0]?.total ?? 0;
  const bundles = (bundlesQuery.data ?? []).filter((b) => !q || matches(q, b.name, b.tagline, ...b.occasions.map((o) => o.name)));
  const collections = (collectionsQuery.data ?? []).filter((c) => !q || matches(q, c.name, c.description, c.palette, ...c.occasions.map((o) => o.name)));
  const total = productTotal + bundles.length + collections.length;
  const settled = !products.isPending && !bundlesQuery.isPending && !collectionsQuery.isPending;

  const tabs: { value: Tab; label: string; count: number }[] = [
    { value: "products", label: "Products", count: productTotal },
    { value: "bundles", label: "Bundles", count: bundles.length },
    { value: "collections", label: "Collections", count: collections.length },
  ];

  return (
    <div className="mx-auto w-full max-w-[110rem] py-6 md:py-8 page-x">
      <div className="relative mb-4 w-full md:hidden">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={typed} onChange={(e) => setTyped(e.target.value)} className="h-11 rounded-sm border-border bg-card pr-10 pl-10" placeholder="Search" aria-label="Search" />
        {typed && (
          <button
            className="press absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setTyped("")}
            aria-label="Clear search"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      <Reveal immediate className="flex flex-col gap-1.5">
        <h1 className="hidden font-serif text-3xl text-foreground md:block">{q ? `Search results for "${q}"` : "Search"}</h1>
        {/* The count re-keys so it animates when the query narrows. */}
        {settled && (
          <motion.p key={total} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DUR.fast, ease: EASE.out }} className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground tabular-nums">{total}</span> result{total === 1 ? "" : "s"} found
          </motion.p>
        )}
      </Reveal>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mt-6">
        <TabsList variant="line" className="w-full justify-start gap-6 overflow-x-auto">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="flex-none px-1">
              {t.label}
              {settled && <span className="ml-1.5 text-[11px] text-muted-foreground tabular-nums">{t.count}</span>}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === "products" &&
        (products.isError ? (
          <div role="alert" className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
            <p className="font-serif text-xl">We couldn&apos;t run that search</p>
            <Button variant="outline" onClick={() => products.refetch()}>
              Try again
            </Button>
          </div>
        ) : products.isPending ? (
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {Array.from({ length: 8 }, (_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : cards.length > 0 ? (
          <>
            <Stagger key={q} immediate gap={0.04} className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6 xl:grid-cols-5">
              {cards.map((card) => (
                <StaggerItem key={card.id} distance={14} scale={0.97} className="flex flex-col">
                  <ProductCard card={card} onQuickAdd={setQuickAdd} />
                </StaggerItem>
              ))}
            </Stagger>
            {products.hasNextPage && (
              <div className="mt-8 flex justify-center">
                <Button variant="outline" disabled={products.isFetchingNextPage} onClick={() => products.fetchNextPage()}>
                  {products.isFetchingNextPage ? "Loading…" : "Show more"}
                </Button>
              </div>
            )}
          </>
        ) : (
          <NoResults what="products" q={q} />
        ))}

      {tab === "bundles" &&
        (bundlesQuery.isPending ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : bundles.length > 0 ? (
          <Stagger immediate gap={0.05} className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {bundles.map((b) => (
              <StaggerItem key={b.id} className="flex flex-col">
                <MediaCard
                  href={`/bundles/${b.slug}`}
                  image={b.imageUrl}
                  eyebrow={b.occasions[0]?.name}
                  title={b.name}
                  description={b.tagline}
                  meta={<span className="font-serif text-lg text-primary">From {formatMoney(b.fromPricePerEvent)}</span>}
                  metaEnd="per event"
                />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <NoResults what="bundles" q={q} />
        ))}

      {tab === "collections" &&
        (collectionsQuery.isPending ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : collections.length > 0 ? (
          <Stagger immediate gap={0.05} className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {collections.map((c) => (
              <StaggerItem key={c.id} className="flex flex-col">
                <MediaCard
                  href={`/collections/${c.slug}`}
                  image={c.imageUrl}
                  eyebrow={c.palette}
                  title={c.name}
                  description={c.description}
                  tags={c.occasions.map((o) => o.name)}
                  metaEnd={`${c.productCount} piece${c.productCount === 1 ? "" : "s"}`}
                />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <NoResults what="collections" q={q} />
        ))}

      <QuickAddDialog key={quickAdd?.id ?? "none"} card={quickAdd} onClose={() => setQuickAdd(null)} />
    </div>
  );
}

function NoResults({ what, q }: { what: string; q: string }) {
  return (
    <Reveal immediate className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-20 text-center">
      <span className="flex size-14 items-center justify-center rounded-sm bg-primary/10">
        <Search className="size-6 text-primary" />
      </span>
      <p className="font-serif text-xl">{q ? `No ${what} matched “${q}”` : `No ${what} yet`}</p>
      <p className="max-w-sm text-sm leading-6 text-muted-foreground">Try a shorter phrase, or browse the full catalog.</p>
      <Button variant="outline" className="mt-1" nativeButton={false} render={<Link href="/catalog">Browse catalog</Link>} />
    </Reveal>
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
