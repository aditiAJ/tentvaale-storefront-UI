"use client";

import Link from "next/link";
import { useMockStore } from "@/mock-data/store";

// Index for the "Featured Collections" nav entry — the [collectionId] detail
// page already existed, this is the list that leads into it.
export default function CollectionsPage() {
  const { collections } = useMockStore();

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10 md:px-12 md:py-14">
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">Featured Collections</h1>
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
          Fully styled looks — every piece already chosen to work together. Open one to shop the pieces and add each to a plan.
        </p>
      </header>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => (
          <Link
            key={c.id}
            href={`/collections/${c.id}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary"
          >
            <div className="h-48 overflow-hidden md:h-56">
              <img
                src={c.heroImageUrl}
                alt={c.name}
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-1 flex-col gap-3 p-5">
              <h2 className="font-serif text-xl text-foreground">{c.name}</h2>
              <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">{c.tagline}</p>
              <div className="flex flex-wrap gap-2">
                {c.categories.map((cat) => (
                  <span key={cat} className="rounded-full border border-primary/40 px-3 py-0.5 text-xs text-primary">
                    {cat}
                  </span>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{c.productIds.length} pieces</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
