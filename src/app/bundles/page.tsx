"use client";

import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { MediaCard } from "@/components/media-card";
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
    <div className="mx-auto w-full max-w-7xl py-10 md:py-14 page-x">
      <Reveal immediate className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">Bundles</h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
          Ready-made packages priced as one set-up. Add a bundle to a plan and edit any item inside it afterwards.
        </p>
      </Reveal>

      <Stagger immediate gap={0.06} className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {bundles.map((b, i) => (
          <StaggerItem key={b.id} className="flex flex-col">
            <MediaCard
              href={`/bundles/${b.id}`}
              image={b.imageUrl}
              eyebrow={b.occasion}
              title={b.name}
              description={b.tagline}
              tags={[`${b.guests} guests`, `${b.setupTime} setup`]}
              meta={<span className="font-serif text-lg text-primary">From {formatRupees(bundleFrom(b.includedProductIds))}</span>}
              metaEnd={`${b.includedProductIds.length} items`}
              priority={i < 3}
            />
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
