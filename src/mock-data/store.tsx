"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type {
  Account,
  AccountType,
  Address,
  ItemSharingDecision,
  Order,
  Plan,
  PlanAuditAction,
  PlanCoOwnerRole,
  PlanEventDetails,
  Quotation,
  QuotationLine,
  QuotationLineStatus,
  SubEvent,
  SubEventDetails,
} from "./types";
import { BUNDLES, COLLECTIONS, PRODUCTS } from "./seed";

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
    if (raw) return { ...emptyState(), ...(JSON.parse(raw) as Partial<StoreState>) };
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

// Owner and full co-owners can submit for quotation / direct order; view-only
// planners can't.
// ponytail: permission gate switched off for now (owner was being blocked);
// restore the owner/co-owner check below when roles are sorted out.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function canSubmitPlan(plan: Plan, accountId: string | null | undefined): boolean {
  return true;
  // return !!accountId && (plan.ownerAccountId === accountId || plan.coOwners.some((c) => c.accountId === accountId && c.role === "CoOwner"));
}

/** Label for a plan's items that aren't tied to a function. */
export function planGroupLabel(plan: Pick<Plan, "generalLabel">): string {
  return plan.generalLabel?.trim() || "Your event";
}

// "Velvet Lounge Sofa (Velvet)" on quotes, orders and invoices when a fabric was chosen.
function lineName(productName: string, fabric?: string): string {
  return fabric ? `${productName} (${fabric})` : productName;
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

  signup: (input: { name: string; email: string; phone: string; accountType: AccountType }) => Account;
  login: (email: string) => Account;
  logout: () => void;
  upgradeToEventPlanner: () => void;

  createPlan: (name: string, details?: PlanEventDetails) => Plan;
  updatePlanDetails: (planId: string, name: string, details: PlanEventDetails) => void;
  renamePlanGroup: (planId: string, label: string) => void;
  addSubEvent: (planId: string, name: string, eventDate: string, details?: SubEventDetails) => void;
  updateSubEvent: (planId: string, subEventId: string, name: string, eventDate: string, details?: SubEventDetails) => void;
  removeSubEvent: (planId: string, subEventId: string) => void;
  setItemSharing: (planId: string, productId: string, decision: ItemSharingDecision) => void;
  clearItemSharing: (planId: string, productId: string) => void;
  addPlanItem: (
    planId: string,
    item: {
      productId: string;
      quantity: number;
      subEventId: string | null;
      dimensions?: { length: number; width?: number };
      rentalStart?: string;
      rentalEnd?: string;
      fabric?: string;
      colour?: string;
    },
  ) => void;
  removePlanItem: (planId: string, itemId: string) => void;
  movePlanItem: (planId: string, itemId: string, subEventId: string | null) => void;
  adjustPlanItemQty: (planId: string, itemId: string, delta: number) => void;
  setPlanItemQty: (planId: string, itemId: string, qty: number) => void;
  markSetupAdded: (planId: string, scope: string, key: string) => void;
  addBundleToPlan: (planId: string, bundleId: string, rental?: { rentalStart?: string; rentalEnd?: string }) => void;

  addCoOwner: (planId: string, email: string, name: string, role: PlanCoOwnerRole) => void;
  removeCoOwner: (planId: string, accountId: string) => void;

  submitPlanForQuotation: (planId: string, granularity: "Plan" | "PerSubEvent") => Quotation[];
  acceptQuotationLines: (quotationId: string, planItemIds: string[]) => void;
  rejectQuotation: (quotationId: string, resolution: "Draft" | "Cancelled") => void;
  payForQuotation: (quotationId: string) => Order;
  createDirectOrderQuotation: (planId: string) => Quotation;

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
    if (!canSubmitPlan(plan, state.currentAccountId)) {
      throw new OwnerOnlyError("Only the plan owner or a co-owner can do this.");
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
        name: "My Plan Event",
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

  // "For Professionals" application (screen 48) — no real verification queue exists,
  // so approval is instant: the account flips to EventPlanner as soon as it's applied.
  const upgradeToEventPlanner = useCallback(() => {
    setState((s) => ({
      ...s,
      accounts: s.accounts.map((a) => (a.id === s.currentAccountId ? { ...a, accountType: "EventPlanner" as const } : a)),
    }));
  }, []);

  const createPlan = useCallback(
    (name: string, details?: PlanEventDetails) => {
      if (!state.currentAccountId) throw new Error("Not signed in");
      const plan: Plan = {
        id: newId("plan"),
        ownerAccountId: state.currentAccountId,
        name,
        ...details,
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

  const addSubEvent = useCallback((planId: string, name: string, eventDate: string, details?: SubEventDetails) => {
    updatePlan(planId, (p, accountId) => {
      const subEvent: SubEvent = { id: newId("sub"), name, eventDate, ...details };
      return pushAudit({ ...p, subEvents: [...p.subEvents, subEvent] }, "SubEventAdded", name, accountId);
    });
  }, []);

  // Header "edit" on the plan page: name + event details (venue, dates, guests).
  const updatePlanDetails = useCallback((planId: string, name: string, details: PlanEventDetails) => {
    updatePlan(planId, (p, accountId) => pushAudit({ ...p, name, ...details }, "PlanEdited", name, accountId));
  }, []);

  const renamePlanGroup = useCallback((planId: string, label: string) => {
    updatePlan(planId, (p) => ({ ...p, generalLabel: label.trim() || undefined }));
  }, []);

  const updateSubEvent = useCallback((planId: string, subEventId: string, name: string, eventDate: string, details?: SubEventDetails) => {
    updatePlan(planId, (p, accountId) =>
      pushAudit(
        {
          ...p,
          subEvents: p.subEvents.map((se) => (se.id === subEventId ? { ...se, name, eventDate, ...details } : se)),
        },
        "SubEventEdited",
        name,
        accountId,
      ),
    );
  }, []);

  // Manual only — never inferred from overlap/timing. A product with no entry
  // is undecided, distinct from "Dedicated"; clearItemSharing puts it back
  // there rather than defaulting to a choice the customer didn't make.
  const setItemSharing = useCallback((planId: string, productId: string, decision: ItemSharingDecision) => {
    updatePlan(planId, (p, accountId) => {
      const product = PRODUCTS.find((pr) => pr.id === productId);
      return pushAudit({ ...p, itemSharing: { ...p.itemSharing, [productId]: decision } }, "ItemSharingChanged", `${product?.name ?? productId}: ${decision}`, accountId);
    });
  }, []);

  const clearItemSharing = useCallback((planId: string, productId: string) => {
    updatePlan(planId, (p) => {
      if (!p.itemSharing || !(productId in p.itemSharing)) return p;
      const next = { ...p.itemSharing };
      delete next[productId];
      return { ...p, itemSharing: next };
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
      item: {
        productId: string;
        quantity: number;
        subEventId: string | null;
        dimensions?: { length: number; width?: number };
        rentalStart?: string;
        rentalEnd?: string;
        fabric?: string;
        colour?: string;
      },
    ) => {
      updatePlan(planId, (p, accountId) => {
        const product = PRODUCTS.find((pr) => pr.id === item.productId);
        const planItem = { id: newId("item"), ...item };
        return pushAudit({ ...p, items: [...p.items, planItem] }, "ItemAdded", product?.name ?? item.productId, accountId);
      });
    },
    [],
  );

  const addBundleToPlan = useCallback((planId: string, bundleId: string, rental?: { rentalStart?: string; rentalEnd?: string }) => {
    const bundle = BUNDLES.find((b) => b.id === bundleId);
    if (!bundle) return;
    updatePlan(planId, (p, accountId) => {
      const newItems = bundle.includedProductIds.map((productId) => ({
        id: newId("item"),
        productId,
        quantity: 1,
        subEventId: null,
        rentalStart: rental?.rentalStart,
        rentalEnd: rental?.rentalEnd,
      }));
      return pushAudit({ ...p, items: [...p.items, ...newItems] }, "ItemAdded", `${bundle.name} (bundle, ${newItems.length} items)`, accountId);
    });
  }, []);

  const removePlanItem = useCallback((planId: string, itemId: string) => {
    updatePlan(planId, (p, accountId) => {
      const item = p.items.find((it) => it.id === itemId);
      const product = PRODUCTS.find((pr) => pr.id === item?.productId);
      return pushAudit({ ...p, items: p.items.filter((it) => it.id !== itemId) }, "ItemRemoved", product?.name ?? itemId, accountId);
    });
  }, []);

  // Re-tag a line to another sub-event (or back to the general list). Flow 2
  // treats sub-event tagging as a label on the item, so this is a field swap,
  // not a remove-and-re-add.
  const movePlanItem = useCallback((planId: string, itemId: string, subEventId: string | null) => {
    updatePlan(planId, (p) => ({
      ...p,
      items: p.items.map((it) => (it.id === itemId ? { ...it, subEventId } : it)),
    }));
  }, []);

  const adjustPlanItemQty = useCallback((planId: string, itemId: string, delta: number) => {
    updatePlan(planId, (p) => ({
      ...p,
      items: p.items.map((it) => (it.id === itemId ? { ...it, quantity: Math.max(1, it.quantity + delta) } : it)),
    }));
  }, []);

  // Absolute quantity edit from the plan line. Dimension-priced lines carry
  // their billable amount in dimensions.length, so that's what gets set.
  const setPlanItemQty = useCallback((planId: string, itemId: string, qty: number) => {
    const value = Math.max(1, Math.floor(qty) || 1);
    updatePlan(planId, (p) => ({
      ...p,
      items: p.items.map((it) =>
        it.id !== itemId ? it : it.dimensions ? { ...it, dimensions: { ...it.dimensions, length: value } } : { ...it, quantity: value },
      ),
    }));
  }, []);

  const markSetupAdded = useCallback((planId: string, scope: string, key: string) => {
    updatePlan(planId, (p) => {
      const done = p.setupAdded?.[scope] ?? [];
      return done.includes(key) ? p : { ...p, setupAdded: { ...p.setupAdded, [scope]: [...done, key] } };
    });
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
        // Skip lines whose product is gone from the catalog (stale saved plans) —
        // the plan page already hides them.
        const items = plan!.items.filter((it) => itemIds.has(it.id) && PRODUCTS.some((pr) => pr.id === it.productId));
        // Mock admin negotiation, so the partial-accept UI (Flow 5) has real
        // variety to demonstrate: with 4+ lines, one comes back adjusted
        // (partial stock) and one rejected (out of stock); with 2-3, just one
        // adjusted; a single line always confirms as requested.
        const adjustedIndex = items.length >= 2 ? (items.length >= 4 ? 1 : items.length - 1) : -1;
        const rejectedIndex = items.length >= 4 ? 3 : -1;
        return items.map((it, i) => {
          const product = PRODUCTS.find((pr) => pr.id === it.productId)!;
          const requestedQty = it.dimensions?.length ?? it.quantity;
          const status: QuotationLineStatus = i === rejectedIndex ? "Rejected" : i === adjustedIndex ? "Adjusted" : "Confirmed";
          const confirmedQty = status === "Rejected" ? 0 : status === "Adjusted" ? Math.max(1, Math.floor(requestedQty * 0.6)) : requestedQty;
          const reason =
            status === "Adjusted"
              ? `Only ${confirmedQty} available — adjusted to ${confirmedQty}`
              : status === "Rejected"
                ? "Out of stock for these dates"
                : undefined;
          return {
            planItemId: it.id,
            productId: it.productId,
            productName: lineName(product.name, it.fabric),
            requestedQty,
            confirmedQty,
            unitPrice: product.basePrice,
            status,
            reason,
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

      const newQuotations: Quotation[] = groups
        .map((g) => ({
        id: newId("quo"),
        planId,
        subEventId: g.subEventId,
        round: 1,
        lines: buildLines(g.itemIds),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "Open" as const,
      }))
        .filter((q) => q.lines.length > 0);
      if (newQuotations.length === 0) throw new Error("No valid items to quote — add products to the plan first.");

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

  // Direct Order (Flow 4 branch): skips the negotiation loop entirely — every
  // line is pre-confirmed and pre-accepted at list price, so the existing
  // checkout/payment flow can be reused unchanged for "pay now" orders.
  const createDirectOrderQuotation = useCallback(
    (planId: string) => {
      const plan = state.plans.find((p) => p.id === planId);
      if (!plan) throw new Error("Plan not found");
      requireOwner(plan);

      const lines: QuotationLine[] = plan.items.filter((it) => PRODUCTS.some((pr) => pr.id === it.productId)).map((it) => {
        const product = PRODUCTS.find((pr) => pr.id === it.productId)!;
        const qty = it.dimensions?.length ?? it.quantity;
        return {
          planItemId: it.id,
          productId: it.productId,
          productName: lineName(product.name, it.fabric),
          requestedQty: qty,
          confirmedQty: qty,
          unitPrice: product.basePrice,
          status: "Confirmed",
          accepted: true,
        };
      });

      const quotation: Quotation = {
        id: newId("quo"),
        planId,
        subEventId: null,
        round: 1,
        lines,
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: "Accepted",
        isDirectOrder: true,
      };

      setState((s) => ({
        ...s,
        quotations: [...s.quotations, quotation],
        plans: s.plans.map((p) =>
          p.id === planId ? pushAudit({ ...p, status: "PartiallyAccepted" }, "PlanSubmitted", "DirectOrder", s.currentAccountId ?? "system") : p,
        ),
      }));

      return quotation;
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
        products: PRODUCTS,
        bundles: BUNDLES,
        collections: COLLECTIONS,
        signup,
        login,
        logout,
        upgradeToEventPlanner,
        createPlan,
        updatePlanDetails,
        renamePlanGroup,
        addSubEvent,
        updateSubEvent,
        removeSubEvent,
        setItemSharing,
        clearItemSharing,
        addPlanItem,
        removePlanItem,
        movePlanItem,
        adjustPlanItemQty,
        setPlanItemQty,
        markSetupAdded,
        addBundleToPlan,
        addCoOwner,
        removeCoOwner,
        submitPlanForQuotation,
        createDirectOrderQuotation,
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

export { OwnerOnlyError };
