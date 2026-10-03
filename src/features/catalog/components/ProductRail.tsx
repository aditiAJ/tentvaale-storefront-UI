"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion";
import { ProductThumb } from "@/components/product-thumb";
import { formatMoney } from "@/lib/money";
import type { ProductCard } from "../types";

/**
 * One rail shape for Similar / Complements / Recently Viewed. Renders nothing when empty, so a
 * first-time visitor simply does not see a Recently Viewed heading over a blank row.
 */
export function ProductRail({
  title,
  products,
  action,
}: {
  title: string;
  products: ProductCard[];
  action?: { href: string; label: string };
}) {
  if (products.length === 0) return null;

  return (
    <section className="mt-14 flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-serif text-2xl text-foreground">{title}</h2>
        {action && (
          <Link
            href={action.href}
            className="flex items-center gap-1 text-sm text-primary underline-offset-4 transition-colors duration-200 ease-out-quint hover:underline"
          >
            {action.label}
            <ChevronRight className="size-4" />
          </Link>
        )}
      </div>
      <Stagger gap={0.05} className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((p) => (
          <StaggerItem key={p.slug} className="flex flex-col">
            <Link
              href={`/catalog/${p.slug}`}
              className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-e1 transition-colors duration-200 ease-out-quint hover:border-primary/50"
            >
              <div className="overflow-hidden rounded-xl bg-muted/60">
                <ProductThumb imageUrl={p.imageUrl} alt={p.name} className="h-32 rounded-none bg-transparent md:h-44" />
              </div>
              <h3 className="line-clamp-2 px-1 text-sm leading-snug font-medium text-foreground transition-colors duration-200 ease-out-quint group-hover:text-primary">
                {p.name}
              </h3>
              <p className="mt-auto px-1 pb-1 text-sm text-muted-foreground">From {formatMoney(p.dailyRate)} / day</p>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
