"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type {
  Account,
  AccountType,
  Order,
  Plan,
  PlanAuditAction,
  PlanCoOwnerRole,
  Quotation,
  QuotationLine,
} from "./types";
import { PRODUCTS } from "./seed";

const STORAGE_KEY = "tentvaale.mockstore.v1";

interface StoreState {
  accounts: Account[];
  currentAccountId: string | null;
  plans: Plan[];
  quotations: Quotation[];
  orders: Order[];
}

function emptyState(): StoreState {
  return { accounts: [], currentAccountId: null, plans: [], quotations: [], orders: [] };
}

function loadState(): StoreState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoreState;
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

class OwnerOnlyError extends Error {}

function pushAudit(plan: Plan, action: PlanAuditAction, detail: string, accountId: string): Plan {
  return {
    ...plan,
    auditLog: [...plan.auditLog, { id: newId("audit"), action, detail, accountId, createdAt: nowIso() }],
  };
}

interface StoreContextValue extends StoreState {
  currentAccount: Account | null;
  products: typeof PRODUCTS;

  signup: (input: { name: string; email: string; phone: string; accountType: AccountType }) => Account;
  login: (email: string) => Account;
  logout: () => void;

  createPlan: (name: string) => Plan;
  addSubEvent: (planId: string, name: string, eventDate: string) => void;
  removeSubEvent: (planId: string, subEventId: string) => void;
  addPlanItem: (
    planId: string,
    item: { productId: string; quantity: number; subEventId: string | null; dimensions?: { length: number; width?: number } },
  ) => void;
  removePlanItem: (planId: string, itemId: string) => void;
  adjustPlanItemQty: (planId: string, itemId: string, delta: number) => void;

  addCoOwner: (planId: string, email: string, name: string, role: PlanCoOwnerRole) => void;
  removeCoOwner: (planId: string, accountId: string) => void;

  submitPlanForQuotation: (planId: string, granularity: "Plan" | "PerSubEvent") => Quotation[];
  acceptQuotationLines: (quotationId: string, planItemIds: string[]) => void;
  rejectQuotation: (quotationId: string, resolution: "Draft" | "Cancelled") => void;
  payForQuotation: (quotationId: string) => Order;

  previewCancellation: (orderId: string) => { cancellableLineIds: string[]; rentalChargeRefundable: false; depositRefundable: boolean };
  cancelOrder: (orderId: string) => void;

  getPlan: (planId: string) => Plan | undefined;
  getQuotation: (quotationId: string) => Quotation | undefined;
  getOrder: (orderId: string) => Order | undefined;
  getQuotationsForPlan: (planId: string) => Quotation[];
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function MockStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreState>(emptyState());
  const [hydrated, setHydrated] = useState(false);

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

  function requireOwner(plan: Plan) {
    if (plan.ownerAccountId !== state.currentAccountId) {
      throw new OwnerOnlyError("Only the plan owner can do this.");
    }
  }

  function updatePlan(planId: string, fn: (p: Plan, accountId: string) => Plan) {
    setState((s) => ({ ...s, plans: s.plans.map((p) => (p.id === planId ? fn(p, s.currentAccountId ?? "system") : p)) }));
  }

  const signup = useCallback(
    ({ name, email, phone, accountType }: { name: string; email: string; phone: string; accountType: AccountType }) => {
      const account: Account = { id: newId("acct"), name, email, phone, accountType };
      const defaultPlan: Plan = {
        id: newId("plan"),
        ownerAccountId: account.id,
        name: "My Plan Board",
        status: "Draft",
        subEvents: [],
        items: [],
        coOwners: [],
        auditLog: [],
        createdAt: nowIso(),
      };
      setState((s) => ({
        ...s,
        accounts: [...s.accounts, account],
        currentAccountId: account.id,
        plans: [...s.plans, defaultPlan],
      }));
      return account;
    },
    [],
  );

  const login = useCallback((email: string) => {
    let account: Account | undefined;
    setState((s) => {
      account = s.accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
      if (account) {
        return { ...s, currentAccountId: account.id };
      }
      // No sign-up flow gate in the mock — logging in with an unseen email
      // creates the account, matching the co-owner "existing or new" rule (Flow 3).
      const created: Account = { id: newId("acct"), name: email.split("@")[0], email, phone: "", accountType: "Customer" };
      account = created;
      return { ...s, accounts: [...s.accounts, created], currentAccountId: created.id };
    });
    return account as Account;
  }, []);

  const logout = useCallback(() => setState((s) => ({ ...s, currentAccountId: null })), []);

  const createPlan = useCallback(
    (name: string) => {
      if (!state.currentAccountId) throw new Error("Not signed in");
      const plan: Plan = {
        id: newId("plan"),
        ownerAccountId: state.currentAccountId,
        name,
        status: "Draft",
        subEvents: [],
        items: [],
        coOwners: [],
        auditLog: [],
        createdAt: nowIso(),
      };
      setState((s) => ({ ...s, plans: [...s.plans, plan] }));
      return plan;
    },
    [state.currentAccountId],
  );

  const addSubEvent = useCallback((planId: string, name: string, eventDate: string) => {
    updatePlan(planId, (p, accountId) => {
      const subEvent = { id: newId("sub"), name, eventDate };
      return pushAudit({ ...p, subEvents: [...p.subEvents, subEvent] }, "SubEventAdded", name, accountId);
    });
  }, []);

  const removeSubEvent = useCallback((planId: string, subEventId: string) => {
    updatePlan(planId, (p, accountId) => {
      const subEvent = p.subEvents.find((se) => se.id === subEventId);
      // Fall back to the general plan list rather than cascade-delete tagged items.
      const items = p.items.map((it) => (it.subEventId === subEventId ? { ...it, subEventId: null } : it));
      return pushAudit(
        { ...p, subEvents: p.subEvents.filter((se) => se.id !== subEventId), items },
        "SubEventRemoved",
        subEvent?.name ?? subEventId,
        accountId,
      );
    });
  }, []);

  const addPlanItem = useCallback(
    (
      planId: string,
      item: { productId: string; quantity: number; subEventId: string | null; dimensions?: { length: number; width?: number } },
    ) => {
      updatePlan(planId, (p, accountId) => {
        const product = PRODUCTS.find((pr) => pr.id === item.productId);
        const planItem = { id: newId("item"), ...item };
        return pushAudit({ ...p, items: [...p.items, planItem] }, "ItemAdded", product?.name ?? item.productId, accountId);
      });
    },
    [],
  );

  const removePlanItem = useCallback((planId: string, itemId: string) => {
    updatePlan(planId, (p, accountId) => {
      const item = p.items.find((it) => it.id === itemId);
      const product = PRODUCTS.find((pr) => pr.id === item?.productId);
      return pushAudit({ ...p, items: p.items.filter((it) => it.id !== itemId) }, "ItemRemoved", product?.name ?? itemId, accountId);
    });
  }, []);

  const adjustPlanItemQty = useCallback((planId: string, itemId: string, delta: number) => {
    updatePlan(planId, (p) => ({
      ...p,
      items: p.items.map((it) => (it.id === itemId ? { ...it, quantity: Math.max(1, it.quantity + delta) } : it)),
    }));
  }, []);

  const addCoOwner = useCallback((planId: string, email: string, name: string, role: PlanCoOwnerRole) => {
    setState((s) => {
      let account = s.accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
      const accounts = account ? s.accounts : [...s.accounts, (account = { id: newId("acct"), name, email, phone: "", accountType: "Customer" })];
      const accountId = s.currentAccountId ?? "system";
      const plans = s.plans.map((p) => {
        if (p.id !== planId) return p;
        if (p.coOwners.some((c) => c.accountId === account!.id)) return p;
        return pushAudit({ ...p, coOwners: [...p.coOwners, { accountId: account!.id, email, name, role }] }, "CoOwnerAdded", email, accountId);
      });
      return { ...s, accounts, plans };
    });
  }, []);

  const removeCoOwner = useCallback((planId: string, accountId: string) => {
    updatePlan(planId, (p, actingAccountId) => {
      const co = p.coOwners.find((c) => c.accountId === accountId);
      return pushAudit(
        { ...p, coOwners: p.coOwners.filter((c) => c.accountId !== accountId) },
        "CoOwnerRemoved",
        co?.email ?? accountId,
        actingAccountId,
      );
    });
  }, []);

  const submitPlanForQuotation = useCallback(
    (planId: string, granularity: "Plan" | "PerSubEvent") => {
      const plan = state.plans.find((p) => p.id === planId);
      if (!plan) throw new Error("Plan not found");
      requireOwner(plan);

      function buildLines(itemIds: Set<string>): QuotationLine[] {
        const items = plan!.items.filter((it) => itemIds.has(it.id));
        return items.map((it, i) => {
          const product = PRODUCTS.find((pr) => pr.id === it.productId)!;
          // Mock admin negotiation: the last line of a multi-line quotation comes
          // back stock-adjusted, so the partial-accept UI (Flow 5) has something
          // real to demonstrate.
          const adjusted = items.length > 1 && i === items.length - 1;
          const confirmedQty = adjusted ? Math.max(1, Math.floor(it.quantity * 0.6)) : it.quantity;
          return {
            planItemId: it.id,
            productId: it.productId,
            productName: product.name,
            requestedQty: it.quantity,
            confirmedQty,
            unitPrice: product.basePrice,
            status: adjusted ? "Adjusted" : "Confirmed",
            accepted: false,
          } satisfies QuotationLine;
        });
      }

      const groups: { subEventId: string | null; itemIds: Set<string> }[] =
        granularity === "Plan"
          ? [{ subEventId: null, itemIds: new Set(plan.items.map((it) => it.id)) }]
          : [
              ...plan.subEvents.map((se) => ({
                subEventId: se.id,
                itemIds: new Set(plan.items.filter((it) => it.subEventId === se.id).map((it) => it.id)),
              })),
              { subEventId: null, itemIds: new Set(plan.items.filter((it) => it.subEventId === null).map((it) => it.id)) },
            ].filter((g) => g.itemIds.size > 0);

      const newQuotations: Quotation[] = groups.map((g) => ({
        id: newId("quo"),
        planId,
        subEventId: g.subEventId,
        round: 1,
        lines: buildLines(g.itemIds),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "Open",
      }));

      setState((s) => ({
        ...s,
        quotations: [...s.quotations, ...newQuotations],
        plans: s.plans.map((p) =>
          p.id === planId ? pushAudit({ ...p, status: "Quoted" }, "PlanSubmitted", granularity, s.currentAccountId ?? "system") : p,
        ),
      }));

      return newQuotations;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.plans, state.currentAccountId],
  );

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
      const acceptedLines = quotation.lines.filter((l) => l.accepted);
      const paidAmount = acceptedLines.reduce((sum, l) => sum + l.unitPrice * l.confirmedQty, 0);
      const depositAmount = Math.round((paidAmount * 0.1) / 100) * 100;
      const order: Order = {
        id: newId("order"),
        quotationId,
        planId: quotation.planId,
        deliveryStatus: "InProgress",
        cancelled: false,
        depositStatus: "Held",
        paidAmount,
        depositAmount,
        createdAt: nowIso(),
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

  const previewCancellation = useCallback(
    (orderId: string) => {
      const order = state.orders.find((o) => o.id === orderId);
      return {
        cancellableLineIds: order && !order.cancelled && order.deliveryStatus === "InProgress" ? [order.id] : [],
        rentalChargeRefundable: false as const,
        depositRefundable: !!order && !order.cancelled && order.deliveryStatus === "InProgress",
      };
    },
    [state.orders],
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

  return (
    <StoreContext.Provider
      value={{
        ...state,
        currentAccount,
        products: PRODUCTS,
        signup,
        login,
        logout,
        createPlan,
        addSubEvent,
        removeSubEvent,
        addPlanItem,
        removePlanItem,
        adjustPlanItemQty,
        addCoOwner,
        removeCoOwner,
        submitPlanForQuotation,
        acceptQuotationLines,
        rejectQuotation,
        payForQuotation,
        previewCancellation,
        cancelOrder,
        getPlan,
        getQuotation,
        getOrder,
        getQuotationsForPlan,
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

export { OwnerOnlyError };
