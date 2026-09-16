"use client";

import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { MediaCard } from "@/components/media-card";
import { useMockStore } from "@/mock-data/store";

// Index for the "Featured Collections" nav entry — the [collectionId] detail
// page already existed, this is the list that leads into it.
export default function CollectionsPage() {
  const { collections } = useMockStore();

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10 md:px-12 md:py-14">
      <Reveal immediate className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">Featured Collections</h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
          Fully styled looks — every piece already chosen to work together. Open one to shop the pieces and add each to a plan.
        </p>
      </Reveal>

      <Stagger immediate gap={0.06} className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c, i) => (
          <StaggerItem key={c.id} className="flex flex-col">
            <MediaCard
              href={`/collections/${c.id}`}
              image={c.heroImageUrl}
              eyebrow={c.palette}
              title={c.name}
              description={c.tagline}
              tags={c.bestFor}
              metaEnd={`${c.productIds.length} pieces`}
              priority={i < 3}
            />
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
