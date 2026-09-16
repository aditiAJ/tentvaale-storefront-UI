"use client";

import { use, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import { DUR, EASE, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { MediaCard } from "@/components/media-card";
import { ProductThumb } from "@/components/product-thumb";
import { cn } from "@/lib/utils";
import { useMockStore } from "@/mock-data/store";
import { formatRupees } from "@/mock-data/seed";

// Flowstep screens 13 (desktop) / 14 (mobile), fileId 8bd03b8a-4561-4b58-bb2d-ca011d84d53e.
export default function CollectionPage({ params }: { params: Promise<{ collectionId: string }> }) {
  const { collectionId } = use(params);
  const { collections, products, currentAccount, wishlist, toggleWishlist } = useMockStore();
  const reduce = useReducedMotion();

  const collection = collections.find((c) => c.id === collectionId);
  const items = useMemo(
    () => (collection ? collection.productIds.map((id) => products.find((p) => p.id === id)).filter(Boolean) : []),
    [collection, products],
  );
  const related = collections.filter((c) => c.id !== collectionId).slice(0, 3);

  if (!collection) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="font-serif text-2xl">Collection not found</h1>
        <Button variant="outline" nativeButton={false} render={<Link href="/collections">All collections</Link>} />
      </div>
    );
  }

  return (
    <div className="w-full pb-8">
      <section className="relative h-96 w-full overflow-hidden md:h-120">
        {/* Slow push-in on the hero: the photo settles from 1.12 to 1 over two
            seconds, which gives the page a sense of arrival without ever
            competing with the copy for attention. */}
        <motion.div
          className="absolute inset-0"
          initial={{ scale: reduce ? 1 : 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: reduce ? 0.01 : 2, ease: EASE.out }}
        >
          <Image src={collection.heroImageUrl} alt={collection.name} fill priority sizes="100vw" className="object-cover" />
        </motion.div>
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-background via-background/45 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl p-6 md:p-12">
          <Reveal immediate direction="up" distance={24} duration={DUR.hero}>
            <span className="text-xs font-medium tracking-[0.14em] text-foreground/80 uppercase">{collection.palette}</span>
            <h1 className="mt-1 font-serif text-3xl leading-tight text-primary md:text-6xl">{collection.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/85 md:text-base">{collection.tagline}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {collection.bestFor.map((o) => (
                <span key={o} className="rounded-full bg-background/70 px-3 py-1 text-xs text-foreground ring-1 ring-primary/40 backdrop-blur">
                  {o}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pt-10 md:px-12">
        <h2 className="font-serif text-xl text-foreground md:text-2xl">Shop by Category</h2>
        <Stagger gap={0.04} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 md:gap-3">
          {collection.categories.map((c) => (
            <StaggerItem key={c} distance={10} className="shrink-0">
              <Link
                href={`/catalog?category=${encodeURIComponent(c)}`}
                className="press block rounded-full border border-primary/60 px-4 py-2 text-sm text-foreground transition-colors duration-200 ease-out-quint hover:border-primary hover:bg-primary hover:text-primary-foreground md:px-5"
              >
                {c}
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-12 md:px-12">
        <h2 className="font-serif text-2xl text-foreground md:text-3xl">Shop the Look</h2>
        <Stagger gap={0.05} className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {items.map((p) => {
            if (!p) return null;
            const wishlisted = wishlist.includes(p.id);
            return (
              <StaggerItem key={p.id} distance={16} scale={0.97} className="flex flex-col">
                <div className="surface-interactive group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-e1 hover:border-primary/50">
                  <div className="relative overflow-hidden rounded-xl bg-muted/60">
                    <Link href={`/catalog/${p.id}`}>
                      <ProductThumb
                        imageUrl={p.imageUrl}
                        alt={p.name}
                        className="aspect-square w-full rounded-none bg-transparent transition-transform duration-600 ease-out-quint group-hover:scale-[1.06]"
                      />
                    </Link>
                    {currentAccount && (
                      <button
                        className="press absolute top-2.5 right-2.5 flex size-9 items-center justify-center rounded-full bg-background/85 shadow-e1 backdrop-blur transition-colors hover:bg-background"
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
                  <div className="flex flex-1 flex-col gap-2 p-2 pt-3">
                    <h3 className="line-clamp-2 text-sm leading-snug font-medium text-foreground transition-colors duration-200 ease-out-quint group-hover:text-primary">
                      {p.name}
                    </h3>
                    <p className="font-serif text-lg text-primary">{formatRupees(p.basePrice)} <span className="font-sans text-xs text-muted-foreground">/ day</span></p>
                    <Button
                      variant="outline"
                      className="mt-auto w-full"
                      nativeButton={false}
                      render={<Link href={`/catalog/${p.id}`}>Add to Plan</Link>}
                    />
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-14 md:px-12">
        <h2 className="font-serif text-2xl text-foreground md:text-3xl">Related Themes</h2>
        <Stagger gap={0.06} className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
          {related.map((c) => (
            <StaggerItem key={c.id} className="flex w-64 shrink-0 flex-col md:w-auto">
              <MediaCard
                href={`/collections/${c.id}`}
                image={c.heroImageUrl}
                title={c.name}
                description={c.tagline}
                imageHeight="h-36 md:h-52"
                sizes="(min-width: 768px) 33vw, 256px"
              />
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </div>
  );
}
