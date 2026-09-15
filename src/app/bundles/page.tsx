"use client";

import Image from "next/image";
import Link from "next/link";
import { useMockStore } from "@/mock-data/store";
import { formatRupees } from "@/mock-data/seed";

// Index for the "Bundles" nav entry — the [bundleId] detail page already
// existed, this is the list that leads into it.
export default function BundlesPage() {
  const { bundles, products } = useMockStore();

  function bundleFrom(includedProductIds: string[]) {
    return includedProductIds.reduce((sum, id) => sum + (products.find((p) => p.id === id)?.basePrice ?? 0), 0);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10 md:px-12 md:py-14">
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">Bundles</h1>
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
          Ready-made packages priced as one set-up. Add a bundle to a plan and edit any item inside it afterwards.
        </p>
      </header>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {bundles.map((b) => (
          <Link
            key={b.id}
            href={`/bundles/${b.id}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary"
          >
            <div className="relative h-48 overflow-hidden md:h-56">
              <Image
                src={b.imageUrl}
                alt={b.name}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-1 flex-col gap-3 p-5">
              <h2 className="font-serif text-xl text-foreground">{b.name}</h2>
              <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">{b.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">From {formatRupees(bundleFrom(b.includedProductIds))} / day</span>
                <span className="text-xs text-muted-foreground">{b.includedProductIds.length} items</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
