"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import { DUR, EASE, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { MediaCard } from "@/components/media-card";
import { ProductThumb } from "@/components/product-thumb";
import { HoverImageGallery } from "@/components/hover-image-gallery";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/services/api-client";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import { useMockStore } from "@/mock-data/store";
import { useCategories, useCollection, useCollections } from "@/features/catalog/hooks";
import { planProductId, registerCard } from "@/features/catalog/plan-bridge";
import { QuickAddDialog } from "@/features/catalog/components/QuickAddDialog";
import type { ProductCard } from "@/features/catalog/types";

// Flowstep screens 13 (desktop) / 14 (mobile), fileId 8bd03b8a-4561-4b58-bb2d-ca011d84d53e.
export default function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { currentAccount, wishlist, toggleWishlist } = useMockStore();
  const [quickAddCard, setQuickAddCard] = useState<ProductCard | null>(null);
  const reduce = useReducedMotion();
  const query = useCollection(slug);
  const all = useCollections();
  const categories = useCategories();
  const collection = query.data;

  // "Shop by category": the categories the collection's pieces come from, in the shop's own order.
  const shopCategories = useMemo(() => {
    const slugs = new Set((collection?.products ?? []).map((p) => p.categorySlug));
    return (categories.data ?? []).filter((c) => slugs.has(c.slug));
  }, [collection, categories.data]);
  const related = (all.data ?? []).filter((c) => c.slug !== slug).slice(0, 3);

  if (query.isPending) {
    return (
      <div className="w-full pb-8">
        <Skeleton className="h-96 w-full rounded-none md:h-120" />
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 pt-12 page-x md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (!collection) {
    const missing = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 py-24 text-center page-x">
        <h1 className="font-serif text-2xl">{missing ? "Collection not found" : "We couldn't load this collection"}</h1>
        <div className="flex gap-2">
          {!missing && (
            <Button variant="outline" onClick={() => query.refetch()}>
              Try again
            </Button>
          )}
          <Button variant="outline" nativeButton={false} render={<Link href="/collections">All collections</Link>} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-8">
      <section className="relative h-96 w-full overflow-hidden bg-muted md:h-120">
        {/* Slow push-in on the hero: the photo settles from 1.12 to 1 over two seconds. A plain <img>
            (via ProductThumb): the photo is entered in the admin and can live on any host. */}
        <motion.div
          className="absolute inset-0"
          initial={{ scale: reduce ? 1 : 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: reduce ? 0.01 : 2, ease: EASE.out }}
        >
          <ProductThumb imageUrl={collection.imageUrl} alt={collection.name} className="size-full rounded-none bg-transparent" />
        </motion.div>
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-background via-background/45 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl p-6 md:p-12">
          <Reveal immediate direction="up" distance={24} duration={DUR.hero}>
            {collection.palette && <span className="text-xs font-medium tracking-[0.14em] text-foreground/80 uppercase">{collection.palette}</span>}
            <h1 className="mt-1 font-serif text-3xl leading-tight text-primary md:text-6xl">{collection.name}</h1>
            {collection.description && <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/85 md:text-base">{collection.description}</p>}
            {collection.occasions.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {collection.occasions.map((o) => (
                  <span key={o.id} className="rounded-sm bg-background/70 px-3 py-1 text-xs text-foreground ring-1 ring-primary/40 backdrop-blur">
                    {o.name}
                  </span>
                ))}
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {shopCategories.length > 0 && (
        <section className="mx-auto flex w-full max-w-7xl flex-col gap-4 pt-10 page-x">
          <h2 className="font-serif text-xl text-foreground md:text-2xl">Shop by Category</h2>
          <Stagger gap={0.04} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 md:gap-3">
            {shopCategories.map((c) => (
              <StaggerItem key={c.id} distance={10} className="shrink-0">
                <Link
                  href={`/catalog?category=${encodeURIComponent(c.slug)}`}
                  className="press block rounded-sm border border-primary/60 px-4 py-2 text-sm text-foreground transition-colors duration-200 ease-out-quint hover:border-primary hover:bg-primary hover:text-primary-foreground md:px-5"
                >
                  {c.name}
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 pt-12 page-x">
        <h2 className="font-serif text-2xl text-foreground md:text-3xl">Shop the Look</h2>
        {collection.products.length === 0 ? (
          <p className="text-sm text-muted-foreground">The pieces in this collection aren&apos;t available right now.</p>
        ) : (
          <Stagger gap={0.05} className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {collection.products.map((p) => {
              const wishlisted = wishlist.includes(planProductId(p.id));
              return (
                <StaggerItem key={p.id} distance={16} scale={0.97} className="flex flex-col">
                  <div className="surface-interactive group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-e1 hover:border-primary/50">
                    <div className="relative overflow-hidden rounded-xl bg-muted/60">
                      <Link href={`/catalog/${p.slug}`}>
                        <HoverImageGallery
                          images={p.imageUrls?.length ? p.imageUrls : p.imageUrl ? [p.imageUrl] : []}
                          alt={p.name}
                          imgClassName="aspect-square w-full rounded-none bg-transparent transition-transform duration-600 ease-out-quint group-hover:scale-[1.06]"
                        />
                      </Link>
                      {currentAccount && (
                        <button
                          className="press absolute top-2.5 right-2.5 flex size-9 items-center justify-center rounded-sm bg-background/85 shadow-e1 backdrop-blur transition-colors hover:bg-background"
                          onClick={() => {
                            if (!wishlisted) registerCard(p);
                            toggleWishlist(planProductId(p.id));
                          }}
                          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                          aria-pressed={wishlisted}
                        >
                          <Heart className={cn("size-4 transition-[transform,color,fill] duration-300 ease-out-quint", wishlisted ? "scale-110 fill-primary text-primary" : "text-foreground")} />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-2 pt-3">
                      <h3 className="line-clamp-2 text-sm leading-snug font-medium text-foreground transition-colors duration-200 ease-out-quint group-hover:text-primary">{p.name}</h3>
                      <p className="font-serif text-lg text-primary">
                        {formatMoney(p.dailyRate)} <span className="font-sans text-xs text-muted-foreground">/ day</span>
                      </p>
                      <Button variant="outline" className="mt-auto w-full" onClick={() => setQuickAddCard(p)}>
                        Add to Plan
                      </Button>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </section>

      {related.length > 0 && (
        <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 pt-14 page-x">
          <h2 className="font-serif text-2xl text-foreground md:text-3xl">Related Themes</h2>
          <Stagger gap={0.06} className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
            {related.map((c) => (
              <StaggerItem key={c.id} className="flex w-64 shrink-0 flex-col md:w-auto">
                <MediaCard href={`/collections/${c.slug}`} image={c.imageUrl} title={c.name} description={c.description} imageHeight="h-36 md:h-52" />
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}

      <QuickAddDialog card={quickAddCard} onClose={() => setQuickAddCard(null)} />
    </div>
  );
}
