"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductThumb } from "@/components/product-thumb";
import { useMockStore } from "@/mock-data/store";
import { formatRupees } from "@/mock-data/seed";

// Flowstep screens 13 (desktop) / 14 (mobile), fileId 8bd03b8a-4561-4b58-bb2d-ca011d84d53e.
export default function CollectionPage({ params }: { params: Promise<{ collectionId: string }> }) {
  const { collectionId } = use(params);
  const { collections, products, currentAccount, wishlist, toggleWishlist } = useMockStore();

  const collection = collections.find((c) => c.id === collectionId);
  const items = useMemo(
    () => (collection ? collection.productIds.map((id) => products.find((p) => p.id === id)).filter(Boolean) : []),
    [collection, products],
  );
  const related = collections.filter((c) => c.id !== collectionId).slice(0, 3);

  if (!collection) return <div className="mx-auto w-full max-w-4xl px-4 py-10">Collection not found.</div>;

  return (
    <div className="w-full pb-8">
      <section className="relative h-[280px] w-full overflow-hidden md:h-[480px]">
        <img src={collection.heroImageUrl} alt={collection.name} className="size-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-12">
          <h1 className="font-serif text-3xl text-primary md:text-6xl">{collection.name}</h1>
          <p className="mt-2 max-w-2xl text-sm text-foreground/80 md:text-base">{collection.tagline}</p>
        </div>
      </section>

      <section className="flex flex-col gap-4 px-4 pt-8 md:px-12">
        <h2 className="font-serif text-xl text-foreground md:text-2xl">Shop by Category</h2>
        <div className="flex gap-2 overflow-x-auto pb-1 md:gap-4">
          {collection.categories.map((c) => (
            <Link key={c} href={`/catalog?category=${encodeURIComponent(c)}`} className="shrink-0 rounded-full border border-primary px-4 py-2 text-sm text-foreground md:px-5">
              {c}
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6 px-4 pt-8 md:px-12">
        <h2 className="font-serif text-2xl text-foreground md:text-3xl">Shop the Look</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {items.map((p) => {
            if (!p) return null;
            const wishlisted = wishlist.includes(p.id);
            return (
              <div key={p.id} className="rounded-xl bg-card p-3">
                <div className="relative">
                  <Link href={`/catalog/${p.id}`}>
                    <ProductThumb imageUrl={p.imageUrl} alt={p.name} className="aspect-square w-full rounded-lg" />
                  </Link>
                  {currentAccount && (
                    <button className="absolute top-3 right-3 rounded-full bg-background/70 p-2" onClick={() => toggleWishlist(p.id)}>
                      <Heart className={wishlisted ? "fill-primary text-primary" : "text-foreground"} size={16} />
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2 p-2">
                  <h3 className="text-sm font-medium text-foreground">{p.name}</h3>
                  <p className="text-sm text-primary md:text-muted-foreground">{formatRupees(p.basePrice)} / day</p>
                  <Button variant="outline" className="rounded-lg border-primary text-primary" nativeButton={false} render={<Link href={`/catalog/${p.id}`}>Add to Plan</Link>} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-6 px-4 pt-8 md:px-12">
        <h2 className="font-serif text-2xl text-foreground md:text-3xl">Related Themes</h2>
        <div className="flex gap-4 overflow-x-auto pb-1 md:grid md:grid-cols-3">
          {related.map((c) => (
            <Link key={c.id} href={`/collections/${c.id}`} className="w-64 shrink-0 overflow-hidden rounded-xl bg-card md:w-auto">
              <div className="h-36 md:h-52">
                <img src={c.heroImageUrl} alt={c.name} className="size-full object-cover" />
              </div>
              <p className="p-4 text-lg font-medium text-foreground">{c.name}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
