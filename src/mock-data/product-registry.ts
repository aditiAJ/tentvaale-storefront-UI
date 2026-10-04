"use client";

import { useSyncExternalStore } from "react";
import { PRODUCTS } from "./seed";
import type { Product } from "./types";

/**
 * TEMPORARY BRIDGE for the wishlist (until it moves to the backend, a later phase): the wishlist is
 * still a per-browser list in the local mock store, which looks products up by id in the old seed
 * list. The catalogue reads real products from the backend, so a real product the shopper saves
 * has to be findable there too. This remembers, in this browser, the real products they saved, in
 * the mock's own shape, and `findProduct` looks in it before the seed.
 *
 * Ids are the backend's product id as text ("42"); a variant is "42-v7". They cannot clash with the
 * seed's ids ("p18"). When the wishlist moves to the backend this file, `catalog/plan-bridge.ts`
 * and the seed products go away together.
 *
 * Prices here are a snapshot from the moment of adding. That is fine for the mock plan screens and
 * is exactly what the backend will stop needing to trust.
 */
const KEY = "tentvaale:plan-product-registry";

interface Entry {
  product: Product;
  /** Came from the product page (real stock and variants), not just from a listing card. */
  detailed: boolean;
}

let entries: Map<string, Entry> | null = null;
const listeners = new Set<() => void>();

function load(): Map<string, Entry> {
  if (entries) return entries;
  entries = new Map();
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      for (const item of parsed as Entry[]) {
        if (item?.product?.id) entries.set(item.product.id, item);
      }
    }
  } catch {
    // Storage blocked or damaged: start empty. Plans keep working for the seed products.
  }
  return entries;
}

function save(map: Map<string, Entry>) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...map.values()]));
  } catch {
    // Full or unavailable: the registry stays in memory for this visit.
  }
}

let snapshot: Product[] = PRODUCTS;
let snapshotDirty = true;

function getSnapshot(): Product[] {
  if (snapshotDirty) {
    snapshot = [...PRODUCTS, ...[...load().values()].map((e) => e.product)];
    snapshotDirty = false;
  }
  return snapshot;
}

function getServerSnapshot(): Product[] {
  return PRODUCTS;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The product with this id: a registered real one, else a seed one. */
export function findProduct(id: string | undefined | null): Product | undefined {
  if (!id) return undefined;
  if (typeof window === "undefined") return PRODUCTS.find((p) => p.id === id);
  return load().get(id)?.product ?? PRODUCTS.find((p) => p.id === id);
}

/**
 * Remembers products. A listing card knows less than the product page (no stock, no variants), so
 * a card never overwrites what the page already registered.
 */
export function registerProducts(products: Product[], { detailed }: { detailed: boolean }) {
  if (typeof window === "undefined" || products.length === 0) return;
  const map = load();
  let changed = false;
  for (const product of products) {
    const existing = map.get(product.id);
    if (existing?.detailed && !detailed) continue;
    map.set(product.id, { product, detailed });
    changed = true;
  }
  if (!changed) return;
  save(map);
  snapshotDirty = true;
  for (const listener of listeners) listener();
}

/** Seed products plus every real one registered, re-rendering the caller when one is added. */
export function useAllProducts(): Product[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
