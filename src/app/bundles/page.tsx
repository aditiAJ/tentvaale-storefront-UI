"use client";

import { useMemo, useState } from "react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { MediaCard } from "@/components/media-card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useMockStore } from "@/mock-data/store";
import { formatRupees } from "@/mock-data/seed";

// Index for the "Bundles" nav entry — the [bundleId] detail page already
// existed, this is the list that leads into it.
export default function BundlesPage() {
  const { bundles, products } = useMockStore();
  const [occasions, setOccasions] = useState<string[]>([]);

  // Occasions come from the data rather than a hardcoded list, so adding a
  // bundle with a new occasion adds its filter automatically. Counts are shown
  // so an occasion with one bundle is obvious before it is clicked.
  const occasionOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of bundles) counts.set(b.occasion, (counts.get(b.occasion) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [bundles]);

  const shown = occasions.length === 0 ? bundles : bundles.filter((b) => occasions.includes(b.occasion));

  function toggle(occasion: string) {
    setOccasions((current) => (current.includes(occasion) ? current.filter((o) => o !== occasion) : [...current, occasion]));
  }

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

      <Reveal immediate delay={0.05} className="mt-8 flex flex-col gap-3 border-b border-border pb-6">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Occasion</span>
          {occasions.length > 0 && (
            <button onClick={() => setOccasions([])} className="text-[11px] font-medium text-primary underline-offset-2 hover:underline">
              Clear all
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2.5">
          {occasionOptions.map(([occasion, count]) => {
            const on = occasions.includes(occasion);
            return (
              <label
                key={occasion}
                className={cn(
                  "flex cursor-pointer items-center gap-2 text-sm transition-colors duration-200 ease-out-quint",
                  on ? "font-medium text-primary" : "text-foreground/80 hover:text-foreground",
                )}
              >
                <Checkbox checked={on} onCheckedChange={() => toggle(occasion)} />
                {occasion}
                <span className="text-[11px] text-muted-foreground tabular-nums">{count}</span>
              </label>
            );
          })}
        </div>
      </Reveal>

      {shown.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">No bundles match this occasion.</p>
      ) : (
        <Stagger immediate gap={0.06} className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((b, i) => (
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
      )}
    </div>
  );
}
