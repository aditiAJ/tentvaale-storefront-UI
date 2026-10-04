"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type {
  Account,
  Address,
  Order,
  Plan,
  PlanAuditAction,
  Quotation,
} from "./types";
import { BUNDLES, COLLECTIONS, PRODUCTS } from "./seed";
import { useAllProducts } from "./product-registry";

const STORAGE_KEY = "tentvaale.mockstore.v1";

interface StoreState {
  accounts: Account[];
  currentAccountId: string | null;
  plans: Plan[];
  quotations: Quotation[];
  orders: Order[];
  wishlists: Record<string, string[]>; // accountId -> product ids
  addressBook: Record<string, Address[]>; // accountId -> addresses
}

function emptyState(): StoreState {
  return { accounts: [], currentAccountId: null, plans: [], quotations: [], orders: [], wishlists: {}, addressBook: {} };
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
    // Plans now live on the backend, so any plans, quotations or orders the old local demo saved here
    // are dropped rather than shown beside real ones.
    if (raw) return { ...emptyState(), ...(JSON.parse(raw) as Partial<StoreState>), currentAccountId: null, plans: [], quotations: [], orders: [] };
  } catch {
    // fall through
  }
  return emptyState();
}

function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

/** Label for a plan's items that aren't tied to a function. */
export function planGroupLabel(plan: Pick<Plan, "generalLabel">): string {
  return plan.generalLabel?.trim() || "Your event";
}

function pushAudit(plan: Plan, action: PlanAuditAction, detail: string, accountId: string): Plan {
  return {
    ...plan,
    auditLog: [...plan.auditLog, { id: newId("audit"), action, detail, accountId, createdAt: nowIso() }],
  };
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

  acceptQuotationLines: (quotationId: string, planItemIds: string[]) => void;
  rejectQuotation: (quotationId: string, resolution: "Draft" | "Cancelled") => void;
  payForQuotation: (quotationId: string) => Order;

  previewCancellation: (orderId: string) => {
    lines: { planItemId: string; productName: string; subEventLabel: string; amount: number; cancellable: boolean; reason?: string }[];
    depositRefundable: boolean;
  };
  cancelOrder: (orderId: string) => void;

  getPlan: (planId: string) => Plan | undefined;
  getQuotation: (quotationId: string) => Quotation | undefined;
  getOrder: (orderId: string) => Order | undefined;
  getQuotationsForPlan: (planId: string) => Quotation[];

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

  const acceptQuotationLines = useCallback((quotationId: string, planItemIds: string[]) => {
    setState((s) => {
      const quotation = s.quotations.find((q) => q.id === quotationId);
      if (!quotation) return s;
      const accepted = new Set(planItemIds);
      const lines = quotation.lines.map((l) => (accepted.has(l.planItemId) ? { ...l, accepted: true } : l));
      const allAccepted = lines.every((l) => l.accepted);
      const status = allAccepted ? "Accepted" : lines.some((l) => l.accepted) ? "PartiallyAccepted" : quotation.status;
      return {
        ...s,
        quotations: s.quotations.map((q) => (q.id === quotationId ? { ...q, lines, status } : q)),
        plans: s.plans.map((p) =>
          p.id === quotation.planId
            ? pushAudit({ ...p, status: "PartiallyAccepted" }, "QuotationAccepted", `${planItemIds.length} line(s)`, s.currentAccountId ?? "system")
            : p,
        ),
      };
    });
  }, []);

  const rejectQuotation = useCallback((quotationId: string, resolution: "Draft" | "Cancelled") => {
    setState((s) => {
      const quotation = s.quotations.find((q) => q.id === quotationId);
      if (!quotation) return s;
      return {
        ...s,
        quotations: s.quotations.map((q) => (q.id === quotationId ? { ...q, status: "Rejected" } : q)),
        plans: s.plans.map((p) =>
          p.id === quotation.planId
            ? pushAudit({ ...p, status: resolution }, "QuotationRejected", resolution, s.currentAccountId ?? "system")
            : p,
        ),
      };
    });
  }, []);

  const payForQuotation = useCallback((quotationId: string) => {
    let created: Order | undefined;
    setState((s) => {
      const quotation = s.quotations.find((q) => q.id === quotationId);
      if (!quotation) return s;
      const plan = s.plans.find((p) => p.id === quotation.planId);
      const acceptedLines = quotation.lines.filter((l) => l.accepted);
      const paidAmount = acceptedLines.reduce((sum, l) => sum + l.unitPrice * l.confirmedQty, 0);
      const depositAmount = Math.round((paidAmount * 0.1) / 100) * 100;

      // Seed plausible dispatch/delivery demo data: first sub-event already
      // delivered, the rest pending — see the deviation note on Order.subEventDeliveryStatus.
      const subEvents = plan?.subEvents ?? [];
      const subEventDeliveryStatus: Record<string, "Delivered" | "Pending"> = {};
      subEvents.forEach((se, i) => {
        subEventDeliveryStatus[se.id] = i === 0 ? "Delivered" : "Pending";
      });
      const dispatchLog: Order["dispatchLog"] = [
        { date: new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10), title: "Dispatched from warehouse", detail: "Vehicle assigned, crew notified" },
        { date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10), title: "Delivered to venue", detail: "Received by venue staff" },
        { date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), title: "Return pickup (scheduled)" },
      ];

      const order: Order = {
        id: newId("order"),
        quotationId,
        planId: quotation.planId,
        deliveryStatus: subEvents.length > 0 && subEvents.every((se) => subEventDeliveryStatus[se.id] === "Delivered") ? "FullyDelivered" : "InProgress",
        cancelled: false,
        depositStatus: "Held",
        paidAmount,
        depositAmount,
        createdAt: nowIso(),
        venue: "The Grand Hyatt, Mumbai",
        subEventDeliveryStatus,
        dispatchLog,
      };
      created = order;
      return {
        ...s,
        orders: [...s.orders, order],
        plans: s.plans.map((p) =>
          p.id === quotation.planId ? pushAudit({ ...p, status: "Ordered" }, "OrderPaid", order.id, s.currentAccountId ?? "system") : p,
        ),
      };
    });
    return created as Order;
  }, []);

  // A line is cancellable if its sub-event hasn't been marked Delivered yet
  // (order-level items with no sub-event follow the order's overall status).
  const previewCancellation = useCallback(
    (orderId: string) => {
      const order = state.orders.find((o) => o.id === orderId);
      const quotation = order ? state.quotations.find((q) => q.id === order.quotationId) : undefined;
      const plan = order ? state.plans.find((p) => p.id === order.planId) : undefined;
      if (!order || !quotation || !plan) return { lines: [], depositRefundable: false };

      const lines = quotation.lines
        .filter((l) => l.accepted)
        .map((l) => {
          const item = plan.items.find((it) => it.id === l.planItemId);
          const subEvent = item?.subEventId ? plan.subEvents.find((se) => se.id === item.subEventId) : undefined;
          const delivered = subEvent ? order.subEventDeliveryStatus[subEvent.id] === "Delivered" : order.deliveryStatus === "FullyDelivered";
          return {
            planItemId: l.planItemId,
            productName: l.productName,
            subEventLabel: subEvent?.name ?? planGroupLabel(plan),
            amount: l.unitPrice * l.confirmedQty,
            cancellable: !order.cancelled && !delivered,
            reason: delivered ? "already dispatched" : undefined,
          };
        });

      return { lines, depositRefundable: !order.cancelled && order.deliveryStatus !== "FullyDelivered" };
    },
    [state.orders, state.quotations, state.plans],
  );

  const cancelOrder = useCallback((orderId: string) => {
    setState((s) => {
      const order = s.orders.find((o) => o.id === orderId);
      if (!order) return s;
      return {
        ...s,
        orders: s.orders.map((o) => (o.id === orderId ? { ...o, cancelled: true, depositStatus: "RefundPending" } : o)),
        plans: s.plans.map((p) =>
          p.id === order.planId ? pushAudit({ ...p, status: "Cancelled" }, "OrderCancelled", orderId, s.currentAccountId ?? "system") : p,
        ),
      };
    });
  }, []);

  const getPlan = useCallback((planId: string) => state.plans.find((p) => p.id === planId), [state.plans]);
  const getQuotation = useCallback((quotationId: string) => state.quotations.find((q) => q.id === quotationId), [state.quotations]);
  const getOrder = useCallback((orderId: string) => state.orders.find((o) => o.id === orderId), [state.orders]);
  const getQuotationsForPlan = useCallback((planId: string) => state.quotations.filter((q) => q.planId === planId), [state.quotations]);

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
        acceptQuotationLines,
        rejectQuotation,
        payForQuotation,
        previewCancellation,
        cancelOrder,
        getPlan,
        getQuotation,
        getOrder,
        getQuotationsForPlan,
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

