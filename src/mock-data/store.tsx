"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Account, Address } from "./types";
import { BUNDLES, COLLECTIONS, PRODUCTS } from "./seed";
import { useAllProducts } from "./product-registry";

const STORAGE_KEY = "tentvaale.mockstore.v1";

interface StoreState {
  accounts: Account[];
  currentAccountId: string | null;
  wishlists: Record<string, string[]>; // accountId -> product ids
  addressBook: Record<string, Address[]>; // accountId -> addresses
}

function emptyState(): StoreState {
  return { accounts: [], currentAccountId: null, wishlists: {}, addressBook: {} };
}

function loadState(): StoreState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    // Merge over emptyState() defaults rather than trusting the parsed blob
    // outright — a stale localStorage entry from before a schema change
    // (e.g. wishlists/addressBook being added) would otherwise come back
    // missing those keys and crash every reader downstream.
    // The signed-in account is never taken from storage: only the real session (see
    // features/auth/session.tsx) may set it, so a stale local login cannot outlive the real one.
    // Plans, quotations and orders live on the backend now; this store keeps only the wishlist and
    // address book, so anything else an older demo saved here is ignored.
    if (raw) return { ...emptyState(), ...(JSON.parse(raw) as Partial<StoreState>), currentAccountId: null };
  } catch {
    // fall through
  }
  return emptyState();
}

function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

interface StoreContextValue extends StoreState {
  currentAccount: Account | null;
  /** False until localStorage has been read — the session isn't known before that. */
  hydrated: boolean;
  products: typeof PRODUCTS;
  bundles: typeof BUNDLES;
  collections: typeof COLLECTIONS;

  /**
   * TEMPORARY BRIDGE: makes the local account mirror the real signed-in one (same id, name, email),
   * creating it on first sight. Removed with the rest of this store when wishlist and addresses move to the backend.
   */
  syncAccount: (real: { id: string; fullName: string; email: string; phone?: string; accountType: "CUSTOMER" | "EVENT_PLANNER" }) => void;
  logout: () => void;
  upgradeToEventPlanner: () => void;

  wishlist: string[];
  toggleWishlist: (productId: string) => void;

  addresses: Address[];
  addAddress: (label: string, detail: string) => void;
  removeAddress: (addressId: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function MockStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreState>(emptyState());
  const [hydrated, setHydrated] = useState(false);
  const allProducts = useAllProducts();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time localStorage hydration, see features/enquiry/context.tsx for the same pattern
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const currentAccount = state.accounts.find((a) => a.id === state.currentAccountId) ?? null;

  const syncAccount = useCallback(
    (real: { id: string; fullName: string; email: string; phone?: string; accountType: "CUSTOMER" | "EVENT_PLANNER" }) => {
      const mirrored: Account = {
        id: real.id,
        name: real.fullName,
        email: real.email,
        phone: real.phone ?? "",
        accountType: real.accountType === "EVENT_PLANNER" ? "EventPlanner" : "Customer",
      };
      setState((s) => {
        const existing = s.accounts.find((a) => a.id === mirrored.id);
        const unchanged =
          existing &&
          existing.name === mirrored.name &&
          existing.email === mirrored.email &&
          existing.phone === mirrored.phone &&
          existing.accountType === mirrored.accountType &&
          s.currentAccountId === mirrored.id;
        if (unchanged) return s;
        const accounts = existing ? s.accounts.map((a) => (a.id === mirrored.id ? mirrored : a)) : [...s.accounts, mirrored];
        return { ...s, accounts, currentAccountId: mirrored.id };
      });
    },
    [],
  );

  const logout = useCallback(() => setState((s) => ({ ...s, currentAccountId: null })), []);

  // "For Professionals" application (screen 48) — no real verification queue exists,
  // so approval is instant: the account flips to EventPlanner as soon as it's applied.
  const upgradeToEventPlanner = useCallback(() => {
    setState((s) => ({
      ...s,
      accounts: s.accounts.map((a) => (a.id === s.currentAccountId ? { ...a, accountType: "EventPlanner" as const } : a)),
    }));
  }, []);

  const wishlist = (state.currentAccountId && state.wishlists[state.currentAccountId]) || [];

  const toggleWishlist = useCallback((productId: string) => {
    setState((s) => {
      if (!s.currentAccountId) return s;
      const current = s.wishlists[s.currentAccountId] || [];
      const next = current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId];
      return { ...s, wishlists: { ...s.wishlists, [s.currentAccountId]: next } };
    });
  }, []);

  const addresses = (state.currentAccountId && state.addressBook[state.currentAccountId]) || [];

  const addAddress = useCallback((label: string, detail: string) => {
    setState((s) => {
      if (!s.currentAccountId) return s;
      const current = s.addressBook[s.currentAccountId] || [];
      const next = [...current, { id: newId("addr"), label, detail }];
      return { ...s, addressBook: { ...s.addressBook, [s.currentAccountId]: next } };
    });
  }, []);

  const removeAddress = useCallback((addressId: string) => {
    setState((s) => {
      if (!s.currentAccountId) return s;
      const current = s.addressBook[s.currentAccountId] || [];
      return { ...s, addressBook: { ...s.addressBook, [s.currentAccountId]: current.filter((a) => a.id !== addressId) } };
    });
  }, []);

  return (
    <StoreContext.Provider
      value={{
        ...state,
        currentAccount,
        hydrated,
        products: allProducts,
        bundles: BUNDLES,
        collections: COLLECTIONS,
        syncAccount,
        logout,
        upgradeToEventPlanner,
        wishlist,
        toggleWishlist,
        addresses,
        addAddress,
        removeAddress,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useMockStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useMockStore must be used within MockStoreProvider");
  return ctx;
}

