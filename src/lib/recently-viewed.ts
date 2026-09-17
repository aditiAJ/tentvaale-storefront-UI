"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

const KEY = "tentvaale:recently-viewed";
const LIMIT = 12;

/**
 * Per-browser list of recently viewed product ids, most recent first.
 *
 * localStorage rather than the mock store on purpose: this is a viewing
 * convenience, not plan data, and it should survive a logout and stay out of
 * anything that gets quoted. Every access is wrapped — private windows and
 * browsers with site data blocked throw on read as well as write, and a
 * recently-viewed rail is never worth breaking a product page over.
 *
 * Exposed through useSyncExternalStore rather than an effect that calls
 * setState: localStorage is an external store, and reading it into state from
 * an effect is the cascading-render pattern React Compiler rejects.
 */
const EMPTY: string[] = [];
const listeners = new Set<() => void>();

/** getSnapshot must be referentially stable, so parses are cached on raw text. */
let cache: { raw: string | null; parsed: string[] } = { raw: null, parsed: EMPTY };

function rawValue(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): string[] {
  const raw = rawValue();
  if (raw === cache.raw) return cache.parsed;

  let parsed: string[] = EMPTY;
  try {
    const value: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(value)) parsed = value.filter((id): id is string => typeof id === "string");
  } catch {
    parsed = EMPTY;
  }
  cache = { raw, parsed };
  return parsed;
}

/** The server has no storage; a stable empty array keeps hydration quiet. */
function getServerSnapshot(): string[] {
  return EMPTY;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function record(productId: string) {
  const next = [productId, ...getSnapshot().filter((id) => id !== productId)].slice(0, LIMIT);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable or full — the rail just stays as it was.
    return;
  }
  for (const listener of listeners) listener();
}

/**
 * Records `productId` as viewed and returns the rest of the history, so the
 * product currently on screen never shows up in its own rail.
 */
export function useRecentlyViewed(productId?: string): string[] {
  const history = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Writing to an external system is what effects are for.
  useEffect(() => {
    if (productId) record(productId);
  }, [productId]);

  return useMemo(() => history.filter((id) => id !== productId), [history, productId]);
}
