"use client";

import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { MediaCard } from "@/components/media-card";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/skeleton";
import { useCollections } from "@/features/catalog/hooks";

// Index for the "Featured Collections" nav entry; the detail page opens a collection's pieces.
export default function CollectionsPage() {
  const query = useCollections();
  const collections = query.data ?? [];

  return (
    <div className="mx-auto w-full max-w-7xl py-10 md:py-14 page-x">
      <Reveal immediate className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">Featured Collections</h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
          Fully styled looks — every piece already chosen to work together. Open one to shop the pieces and add each to a plan.
        </p>
      </Reveal>

      {query.isError ? (
        <div role="alert" className="mt-10 flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-8">
          <p className="text-sm text-muted-foreground">We couldn&apos;t load the collections just now.</p>
          <Button variant="outline" onClick={() => query.refetch()}>
            Try again
          </Button>
        </div>
      ) : query.isPending ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">No collections yet. Please check back soon.</div>
      ) : (
        <Stagger immediate gap={0.06} className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
      )}
    </div>
  );
}
