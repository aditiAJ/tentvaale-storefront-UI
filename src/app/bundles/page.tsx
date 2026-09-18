"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { DUR, EASE, Reveal, SPRING, Stagger, StaggerItem } from "@/components/motion";
import { MediaCard } from "@/components/media-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useMockStore } from "@/mock-data/store";
import { formatRupees } from "@/mock-data/seed";

const ALL = "__all";

// Index for the "Bundles" nav entry — the [bundleId] detail page already
// existed, this is the list that leads into it.
//
// Occasion is how people actually shop bundles ("what do I need for the
// mehendi?"), so it is a tab rail rather than a checkbox buried in a panel:
// one click, nothing to open, and the current occasion is always visible.
// Guest count is the secondary question and stays a compact dropdown.
// The catalogue's sidebar idiom would be over-built here — that one carries
// ten-plus facets over ninety-odd products; this page has twelve bundles.
export default function BundlesPage() {
  const { bundles, products } = useMockStore();
  const [occasion, setOccasion] = useState<string>(ALL);
  const [guests, setGuests] = useState<string>(ALL);

  function bundleFrom(includedProductIds: string[]) {
    return includedProductIds.reduce((sum, id) => sum + (products.find((p) => p.id === id)?.basePrice ?? 0), 0);
  }

  // A bundle's `guests` is a range like "80–120"; band it by the lower bound so
  // "sized for my party" is answerable without parsing ranges in the UI.
  function guestBand(value: string): string {
    const lower = Number.parseInt(value, 10);
    if (Number.isNaN(lower)) return "Any size";
    if (lower < 75) return "Up to 75 guests";
    if (lower < 150) return "75 – 150 guests";
    return "150+ guests";
  }

  // Tabs and bands come from the data, so a new bundle brings its own options
  // with it. Occasions lead with the most-stocked so the rail opens on the
  // ones worth scanning.
  const { occasions, guestBands } = useMemo(() => {
    const byOccasion = new Map<string, number>();
    const byBand = new Map<string, number>();
    for (const b of bundles) {
      byOccasion.set(b.occasion, (byOccasion.get(b.occasion) ?? 0) + 1);
      const band = guestBand(b.guests);
      byBand.set(band, (byBand.get(band) ?? 0) + 1);
    }
    return {
      occasions: [...byOccasion.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
      guestBands: [...byBand.keys()].sort(),
    };
  }, [bundles]);

  const shown = bundles.filter(
    (b) => (occasion === ALL || b.occasion === occasion) && (guests === ALL || guestBand(b.guests) === guests),
  );

  const tabs: { value: string; label: string; count: number }[] = [
    { value: ALL, label: "All", count: bundles.length },
    ...occasions.map(([name, count]) => ({ value: name, label: name, count })),
  ];

  return (
    <div className="mx-auto w-full max-w-7xl py-10 md:py-14 page-x">
      <Reveal immediate className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">Bundles</h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
          Ready-made packages priced as one set-up. Add a bundle to a plan and edit any item inside it afterwards.
        </p>
      </Reveal>

      <Reveal immediate delay={0.05} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border pb-3">
        {/* Scrolls rather than wraps, so the rail stays one line on narrow
            screens and the grid below never shifts down a row. */}
        <div className="-mb-3 flex min-w-0 flex-1 gap-1 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                {active && (
                  <motion.span layoutId="bundle-occasion-underline" transition={SPRING.snappy} className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
                )}
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
                priority={i < 4}
              />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
