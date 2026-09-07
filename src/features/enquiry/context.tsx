"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { EnquiryItem } from "./types";
import { SEED_ITEMS } from "./seed-data";

// Client-side enquiry draft. No backend exists for this flow yet (the
// Plan Board vs. Enquiry domain-model question is still open — see chat) —
// this is a placeholder store so the 4 routed steps share state and survive
// a refresh, matching what a real pre-submission draft cart needs.
const STORAGE_KEY = "tentvaale.enquiry.draft";

interface EnquiryState {
  items: EnquiryItem[];
  pro: boolean;
  accepted: boolean;
}

interface EnquiryContextValue extends EnquiryState {
  setQty: (index: number, delta: number) => void;
  removeItem: (index: number) => void;
  restoreItems: () => void;
  setPro: (pro: boolean) => void;
  accept: () => void;
}

const EnquiryContext = createContext<EnquiryContextValue | null>(null);

function loadState(): EnquiryState {
  if (typeof window === "undefined") return { items: SEED_ITEMS, pro: false, accepted: false };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as EnquiryState;
  } catch {
    // fall through to seed
  }
  return { items: SEED_ITEMS, pro: false, accepted: false };
}

export function EnquiryProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<EnquiryState>({ items: SEED_ITEMS, pro: false, accepted: false });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // One-time hydration from localStorage (a browser-only external store) after
    // mount, to keep server/client initial render identical and avoid a hydration
    // mismatch — not an ongoing subscription, so the cascading-render concern the
    // set-state-in-effect rule warns about doesn't apply here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const setQty = useCallback((index: number, delta: number) => {
    setState((s) => ({
      ...s,
      items: s.items.map((it, i) => (i === index ? { ...it, qty: Math.max(1, it.qty + delta) } : it)),
    }));
  }, []);

  const removeItem = useCallback((index: number) => {
    setState((s) => ({ ...s, items: s.items.filter((_, i) => i !== index) }));
  }, []);

  const restoreItems = useCallback(() => setState((s) => ({ ...s, items: SEED_ITEMS })), []);
  const setPro = useCallback((pro: boolean) => setState((s) => ({ ...s, pro })), []);
  const accept = useCallback(() => setState((s) => ({ ...s, accepted: true })), []);

  return (
    <EnquiryContext.Provider value={{ ...state, setQty, removeItem, restoreItems, setPro, accept }}>
      {children}
    </EnquiryContext.Provider>
  );
}

export function useEnquiry() {
  const ctx = useContext(EnquiryContext);
  if (!ctx) throw new Error("useEnquiry must be used within EnquiryProvider");
  return ctx;
}
