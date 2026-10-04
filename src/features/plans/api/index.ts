import { apiFetch } from "@/services/api-client";
import type {
  AddBundleInput,
  AddItemInput,
  Plan,
  PlanDetailsInput,
  PlanSummary,
  SharingDecision,
  SubEventInput,
  UpdateItemInput,
} from "../types";

/**
 * The plan board. Every change answers with the whole plan as it now stands, so callers replace
 * what they hold rather than patch it. Only the owner can read or change a plan (anyone else gets a
 * 404), and only while it is a DRAFT (after that, a 422 says so).
 */
const BASE = "storefront/plans";
const json = (body: unknown) => ({ body });

export const listPlans = (signal?: AbortSignal) => apiFetch<PlanSummary[]>(BASE, { signal });

export const getPlan = (planId: string, signal?: AbortSignal) => apiFetch<Plan>(`${BASE}/${planId}`, { signal });

/** A new empty draft; the company is the backend's configured default. */
export const createPlan = (input: PlanDetailsInput) =>
  apiFetch<Plan>(BASE, { method: "POST", ...json({ name: input.name, eventDate: input.eventDate }) }).then((plan) =>
    // The create call only takes a name and first date; the rest of the details go in as an update.
    input.venue || input.eventEndDate || input.guestCount ? updatePlan(plan.id, input) : plan,
  );

export const updatePlan = (planId: string, input: PlanDetailsInput) =>
  apiFetch<Plan>(`${BASE}/${planId}`, { method: "PUT", ...json(input) });

export const deletePlan = (planId: string) => apiFetch<void>(`${BASE}/${planId}`, { method: "DELETE" });

export const addSubEvent = (planId: string, input: SubEventInput) =>
  apiFetch<Plan>(`${BASE}/${planId}/sub-events`, { method: "POST", ...json(input) });

export const updateSubEvent = (planId: string, subEventId: string, input: SubEventInput) =>
  apiFetch<Plan>(`${BASE}/${planId}/sub-events/${subEventId}`, { method: "PUT", ...json(input) });

/** The function's items stay, now belonging to the plan as a whole. */
export const removeSubEvent = (planId: string, subEventId: string) =>
  apiFetch<Plan>(`${BASE}/${planId}/sub-events/${subEventId}`, { method: "DELETE" });

export const addItem = (planId: string, input: AddItemInput) =>
  apiFetch<Plan>(`${BASE}/${planId}/items`, { method: "POST", ...json(input) });

export const updateItem = (planId: string, itemId: string, input: UpdateItemInput) =>
  apiFetch<Plan>(`${BASE}/${planId}/items/${itemId}`, { method: "PUT", ...json(input) });

export const removeItem = (planId: string, itemId: string) =>
  apiFetch<Plan>(`${BASE}/${planId}/items/${itemId}`, { method: "DELETE" });

/** The backend expands the bundle into its items, by the bundle's own rule, with the swaps allowed. */
export const addBundle = (planId: string, input: AddBundleInput) =>
  apiFetch<Plan>(`${BASE}/${planId}/bundles`, { method: "POST", ...json(input) });

/** `decision` null clears the customer's call for that product. */
export const decideSharing = (planId: string, productId: number, variantId: number | null, decision: SharingDecision | null) =>
  apiFetch<Plan>(`${BASE}/${planId}/sharing`, { method: "PUT", ...json({ productId, variantId, decision }) });

/** Cache keys, so a page and anything that refreshes it agree on them. */
export const planKeys = {
  all: ["plans"] as const,
  list: ["plans", "list"] as const,
  detail: (planId: string) => ["plans", "detail", planId] as const,
};
