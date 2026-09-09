"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ProductThumb } from "@/components/product-thumb";
import { useMockStore } from "@/mock-data/store";
import { BUNDLES, COLLECTIONS, PRODUCTS, formatRupees, rateTypeLabel } from "@/mock-data/seed";

type Kind = "collection" | "bundle" | "product";
type Tab = "All" | "Themes" | "Collections" | "Products";

interface AvailabilityCard {
  key: string;
  kind: Kind;
  href: string;
  name: string;
  imageUrl?: string;
  price: number;
  priceSuffix: string;
}

// Screen 46 lists 8 fixed items curated across collections/bundles/products —
// no real inventory-availability backend exists, so (like the product page's
// "Available for selected dates" badge) everything shown here is marked
// Available; this is a UI mock, not a real availability check.
const AVAILABLE_ITEMS: { kind: Kind; id: string }[] = [
  { kind: "collection", id: "amber-dunes" },
  { kind: "bundle", id: "b1" },
  { kind: "bundle", id: "b2" },
  { kind: "product", id: "p18" },
  { kind: "product", id: "p17" },
  { kind: "product", id: "p6" },
  { kind: "product", id: "p19" },
  { kind: "product", id: "p16" },
];

export default function CheckAvailabilityPage() {
  return (
    <Suspense fallback={null}>
      <CheckAvailability />
    </Suspense>
  );
}

function CheckAvailability() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentAccount, createPlan, addSubEvent } = useMockStore();

  const date = searchParams.get("date") || "";
  const city = searchParams.get("city") || "Mumbai";
  const dateLabel = date ? new Date(date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "your date";

  const [tab, setTab] = useState<Tab>("All");

  const cards: AvailabilityCard[] = useMemo(
    () =>
      AVAILABLE_ITEMS.map((it) => {
        if (it.kind === "collection") {
          const c = COLLECTIONS.find((x) => x.id === it.id)!;
          const price = Math.min(...c.productIds.map((pid) => PRODUCTS.find((p) => p.id === pid)?.basePrice ?? Infinity));
          return { key: `c-${c.id}`, kind: "collection" as const, href: `/collections/${c.id}`, name: c.name, imageUrl: c.heroImageUrl, price, priceSuffix: "" };
        }
        if (it.kind === "bundle") {
          const b = BUNDLES.find((x) => x.id === it.id)!;
          const price = b.includedProductIds.reduce((sum, pid) => sum + (PRODUCTS.find((p) => p.id === pid)?.basePrice ?? 0), 0);
          return { key: `b-${b.id}`, kind: "bundle" as const, href: `/bundles/${b.id}`, name: b.name, imageUrl: b.imageUrl, price, priceSuffix: "" };
        }
        const p = PRODUCTS.find((x) => x.id === it.id)!;
        return {
          key: `p-${p.id}`,
          kind: "product" as const,
          href: `/catalog/${p.id}`,
          name: p.name,
          imageUrl: p.imageUrl,
          price: p.basePrice,
          priceSuffix: p.rateType === "Qty" ? "/day" : `/${rateTypeLabel(p.rateType).replace("per ", "")}`,
        };
      }),
    [],
  );

  const filtered = cards.filter((c) => {
    if (tab === "All") return true;
    if (tab === "Themes") return c.kind === "bundle";
    if (tab === "Collections") return c.kind === "collection";
    return c.kind === "product";
  });

  function startPlan() {
    if (!currentAccount) {
      router.push("/login");
      return;
    }
    const plan = createPlan(`${city} Event — ${dateLabel}`);
    if (date) addSubEvent(plan.id, "Main Event", date);
    toast.success("Plan created for this date.");
    router.push(`/plans/${plan.id}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-8 md:py-10">
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-primary/20 bg-card px-6 py-4">
        <span className="text-sm text-foreground/70">Checking availability for</span>
        <strong className="text-sm text-foreground">{dateLabel}</strong>
        <strong className="text-sm text-foreground">{city}</strong>
        <button className="ml-2 rounded border border-primary px-3 py-1 text-xs text-primary" onClick={() => router.push("/")}>
          Change
        </button>
      </div>

      <section className="flex flex-col gap-6">
        <h1 className="font-serif text-4xl text-foreground">Available for Your Date &amp; City</h1>
        <div className="flex flex-wrap items-center gap-2">
          {(["All", "Themes", "Collections", "Products"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={t === tab ? "rounded-full border border-primary bg-primary px-4 py-2 text-sm text-primary-foreground" : "rounded-full border border-primary/40 px-4 py-2 text-sm text-foreground/80"}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((card) => (
            <div key={card.key} className="flex flex-col gap-4 rounded-lg border border-primary/15 bg-card p-4">
              <div className="relative h-40 overflow-hidden rounded-lg">
                <ProductThumb imageUrl={card.imageUrl} alt={card.name} className="size-full" />
                <span className="absolute top-3 left-3 rounded-full border border-primary bg-card/90 px-2 py-1 text-xs text-primary">Available</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-foreground">
                  {card.name} — From {formatRupees(card.price)}
                  {card.priceSuffix}
                </span>
                <Link href={card.href} className="shrink-0 rounded border border-primary px-3 py-1 text-xs text-primary">
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-center gap-4 rounded-lg border border-primary/15 bg-card p-8 text-center">
        <h2 className="font-serif text-2xl text-foreground">Ready to start planning?</h2>
        <p className="text-sm text-foreground/70">
          Create a Plan for {dateLabel} in {city} and start adding these items.
        </p>
        <button className="rounded bg-primary px-5 py-3 text-sm font-medium text-primary-foreground" onClick={startPlan}>
          Start a Plan for This Date
        </button>
      </section>
    </div>
  );
}
