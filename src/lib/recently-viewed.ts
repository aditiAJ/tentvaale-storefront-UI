"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { ProductCard } from "@/features/catalog/types";

const KEY = "tentvaale:recently-viewed-v2";
const LIMIT = 12;

/**
 * Per-browser list of recently viewed products, most recent first. Each entry is the product's card
 * as it was when viewed, so the rail needs no request: the catalogue is no longer in the browser to
 * look an id up in. (The price on it is therefore the one seen then; the product page has today's.)
 *
 * localStorage rather than the mock store on purpose: this is a viewing convenience, not plan data,
 * and it should survive a logout and stay out of anything that gets quoted. Every access is wrapped:
 * private windows and browsers with site data blocked throw on read as well as write, and a
 * recently-viewed rail is never worth breaking a product page over.
 *
 * Exposed through useSyncExternalStore rather than an effect that calls setState: localStorage is an
 * external store, and reading it into state from an effect is the cascading-render pattern React
 * Compiler rejects.
 */
const EMPTY: ProductCard[] = [];
const listeners = new Set<() => void>();

/** getSnapshot must be referentially stable, so parses are cached on raw text. */
let cache: { raw: string | null; parsed: ProductCard[] } = { raw: null, parsed: EMPTY };

function rawValue(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function isCard(value: unknown): value is ProductCard {
  const card = value as ProductCard | null;
  return !!card && typeof card.slug === "string" && typeof card.name === "string" && typeof card.dailyRate?.amount === "number";
}

function getSnapshot(): ProductCard[] {
  const raw = rawValue();
  if (raw === cache.raw) return cache.parsed;

  let parsed: ProductCard[] = EMPTY;
  try {
    const value: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(value)) parsed = value.filter(isCard);
  } catch {
    parsed = EMPTY;
  }
  cache = { raw, parsed };
  return parsed;
}

/** The server has no storage; a stable empty array keeps hydration quiet. */
function getServerSnapshot(): ProductCard[] {
  return EMPTY;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function record(card: ProductCard) {
  const next = [card, ...getSnapshot().filter((c) => c.slug !== card.slug)].slice(0, LIMIT);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable or full: the rail just stays as it was.
    return;
  }
  for (const listener of listeners) listener();
}

/**
 * Records `current` as viewed and returns the rest of the history, so the product on screen never
 * shows up in its own rail.
 */
export function useRecentlyViewed(current?: ProductCard): ProductCard[] {
  const history = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const slug = current?.slug;

  // Writing to an external system is what effects are for. Keyed by slug: a price refresh is not a new view.
  useEffect(() => {
    if (current) record(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return useMemo(() => history.filter((c) => c.slug !== slug), [history, slug]);
}
