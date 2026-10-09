"use client";

import { BundlePrice } from "@/components/bundle-price";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { DUR, EASE, Reveal, SPRING, Stagger, StaggerItem } from "@/components/motion";
import { MediaCard } from "@/components/media-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SkeletonCard } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useBundles, useOccasions } from "@/features/catalog/hooks";
import type { BundleCard } from "@/features/catalog/types";

const ALL = "__all";

/** "80–120 guests", "up to 60 guests", "100+ guests"; nothing when the bundle sets no range. */
function guestsLabel(b: Pick<BundleCard, "guestMin" | "guestMax">): string | undefined {
  if (b.guestMin && b.guestMax) return `${b.guestMin}–${b.guestMax} guests`;
  if (b.guestMax) return `Up to ${b.guestMax} guests`;
  if (b.guestMin) return `${b.guestMin}+ guests`;
  return undefined;
}

// A bundle's guest range is banded by its lower bound so "sized for my party" is answerable without
// parsing ranges in the UI.
function guestBand(b: Pick<BundleCard, "guestMin" | "guestMax">): string {
  const lower = b.guestMin ?? b.guestMax;
  if (lower === undefined || lower === null) return "Any size";
  if (lower < 75) return "Up to 75 guests";
  if (lower < 150) return "75 – 150 guests";
  return "150+ guests";
}

// Index for the "Bundles" nav entry. Occasion is how people actually shop bundles ("what do I need
// for the mehendi?"), so it is a tab rail rather than a checkbox buried in a panel; guest count is
// the secondary question and stays a compact dropdown. There are few bundles, so the narrowing
// happens here rather than as a request per click.
export default function BundlesPage() {
  const bundlesQuery = useBundles();
  const bundles = useMemo(() => bundlesQuery.data ?? [], [bundlesQuery.data]);
  const [occasion, setOccasion] = useState<string>(ALL);
  const [guests, setGuests] = useState<string>(ALL);

  // The occasions the shop offers as filters, already in the order and visibility the back office set.
  const offered = useOccasions().data;

  // Tabs and bands come from the data, so a new bundle brings its own options with it. Occasions
  // follow the back office's own sequence and leave out the ones it has hidden; an occasion no
  // bundle uses gets no tab. Until that list loads (or if it fails) the rail falls back to the
  // most-stocked first, so it is never empty.
  const { occasions, guestBands } = useMemo(() => {
    const byOccasion = new Map<string, { name: string; count: number }>();
    const byBand = new Set<string>();
    for (const b of bundles) {
      for (const o of b.occasions) byOccasion.set(o.slug, { name: o.name, count: (byOccasion.get(o.slug)?.count ?? 0) + 1 });
      byBand.add(guestBand(b));
    }
    const entries = [...byOccasion.entries()];
    const sequence = offered ? new Map(offered.map((o, index) => [o.slug, index])) : null;
    return {
      occasions: sequence
        ? entries.filter(([slug]) => sequence.has(slug)).sort((a, b) => sequence.get(a[0])! - sequence.get(b[0])!)
        : entries.sort((a, b) => b[1].count - a[1].count || a[1].name.localeCompare(b[1].name)),
      guestBands: [...byBand].sort(),
    };
  }, [bundles, offered]);

  const shown = bundles.filter((b) => (occasion === ALL || b.occasions.some((o) => o.slug === occasion)) && (guests === ALL || guestBand(b) === guests));

  const tabs: { value: string; label: string; count: number }[] = [
    { value: ALL, label: "All", count: bundles.length },
    ...occasions.map(([slug, o]) => ({ value: slug, label: o.name, count: o.count })),
  ];

  return (
    <div className="mx-auto w-full max-w-7xl py-10 md:py-14 page-x">
      <Reveal immediate className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">Bundles</h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
          Ready-made packages priced as one set-up. Add a bundle to a plan and edit any item inside it afterwards.
        </p>
      </Reveal>

      {bundlesQuery.isError ? (
        <div role="alert" className="mt-10 flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-8">
          <p className="text-sm text-muted-foreground">We couldn&apos;t load the bundles just now.</p>
          <Button variant="outline" onClick={() => bundlesQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : bundlesQuery.isPending ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : bundles.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">No bundles are available yet. Please check back soon.</div>
      ) : (
        <>
          <Reveal immediate delay={0.05} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border pb-3">
            {/* Scrolls rather than wraps, so the rail stays one line on narrow screens. */}
            <div
              role="group"
              aria-label="Filter by occasion"
              className="-mb-3 flex min-w-0 flex-1 gap-1 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {tabs.map((tab) => {
                const active = occasion === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setOccasion(tab.value)}
                    aria-pressed={active}
                    className={cn(
                      "relative shrink-0 px-3 py-2 text-sm whitespace-nowrap transition-colors duration-200 ease-out-quint",
                      active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tab.label}
                    <span className="ml-1.5 text-[11px] text-muted-foreground tabular-nums">{tab.count}</span>
                    {/* One underline slides between tabs rather than each fading. */}
                    {active && <motion.span layoutId="bundle-occasion-underline" transition={SPRING.snappy} className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
                  </button>
                );
              })}
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <motion.span
                key={shown.length}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DUR.fast, ease: EASE.out }}
                className="text-sm text-muted-foreground"
              >
                <span className="font-medium text-foreground tabular-nums">{shown.length}</span> bundle{shown.length === 1 ? "" : "s"}
              </motion.span>
              {guestBands.length > 1 && (
                <Select value={guests} onValueChange={(v) => v && setGuests(v)}>
                  <SelectTrigger className="h-9 w-auto gap-2 rounded-lg">
                    <SelectValue>{guests === ALL ? "Any guest count" : guests}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Any guest count</SelectItem>
                    {guestBands.map((band) => (
                      <SelectItem key={band} value={band}>
                        {band}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </Reveal>

          {shown.length === 0 ? (
            <div className="mt-10 flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-8">
              <p className="text-sm text-muted-foreground">No bundles match this combination.</p>
              <button
                onClick={() => {
                  setOccasion(ALL);
                  setGuests(ALL);
                }}
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <Stagger key={`${occasion}|${guests}`} immediate gap={0.06} className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {shown.map((b) => (
                <StaggerItem key={b.id} className="flex flex-col">
                  <MediaCard
                    href={`/bundles/${b.slug}`}
                    image={b.imageUrl}
                    eyebrow={b.occasions[0]?.name}
                    title={b.name}
                    description={b.tagline}
                    tags={guestsLabel(b) ? [guestsLabel(b)!] : undefined}
                    meta={<BundlePrice bundle={b} />}
                    metaEnd="per event"
                  />
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </>
      )}
    </div>
  );
}
