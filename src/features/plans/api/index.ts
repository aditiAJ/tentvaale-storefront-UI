import { apiFetch } from "@/services/api-client";
import type { SaveResult } from "@/services/api-client";
import type { QuotationLink } from "@/features/quotations";
import type { Plan, PlanAuditLogEntry, PlanCoOwner, PlanItem, SubEvent } from "../types";

// Plan Board CRUD (Flow 2).
export function listPlans(): Promise<Plan[]> {
  return apiFetch<Plan[]>("api/storefront/plans");
}

export function getPlan(planId: string): Promise<Plan> {
  return apiFetch<Plan>(`api/storefront/plans/${planId}`);
}

export function createPlan(name: string): Promise<SaveResult> {
  return apiFetch<SaveResult>("api/storefront/plans", {
    method: "POST",
    body: { name },
  });
}

export function addSubEvent(
  planId: string,
  subEvent: Pick<SubEvent, "name" | "eventDate">,
): Promise<SaveResult> {
  return apiFetch<SaveResult>(`api/storefront/plans/${planId}/sub-events`, {
    method: "POST",
    body: subEvent,
  });
}

// Removing a sub-event with tagged items falls back to the general plan list
// rather than cascading a delete — see Contexts user-flows Flow 2 recommendation.
export function removeSubEvent(
  planId: string,
  subEventId: string,
): Promise<SaveResult> {
  return apiFetch<SaveResult>(
    `api/storefront/plans/${planId}/sub-events/${subEventId}`,
    { method: "DELETE" },
  );
}

export function addPlanItem(
  planId: string,
  item: Omit<PlanItem, "id" | "planId">,
): Promise<SaveResult> {
  return apiFetch<SaveResult>(`api/storefront/plans/${planId}/items`, {
    method: "POST",
    body: item,
  });
}

export function removePlanItem(
  planId: string,
  itemId: string,
): Promise<SaveResult> {
  return apiFetch<SaveResult>(
    `api/storefront/plans/${planId}/items/${itemId}`,
    { method: "DELETE" },
  );
}

// Share/collaborate (Flow 3). Co-owners can edit but not submit; event planners are view-only.
export function addCoOwner(
  planId: string,
  email: string,
  role: PlanCoOwner["role"],
): Promise<SaveResult> {
  return apiFetch<SaveResult>(`api/storefront/plans/${planId}/collaborators`, {
    method: "POST",
    body: { email, role },
  });
}

export function removeCoOwner(
  planId: string,
  accountId: string,
): Promise<SaveResult> {
  return apiFetch<SaveResult>(
    `api/storefront/plans/${planId}/collaborators/${accountId}`,
    { method: "DELETE" },
  );
}

export function getPlanAuditLog(planId: string): Promise<PlanAuditLogEntry[]> {
  return apiFetch<PlanAuditLogEntry[]>(
    `api/storefront/plans/${planId}/audit-log`,
  );
}

export interface SubmitPlanPayload {
  // One combined quotation, or split per sub-event — both supported (Flow 4, resolved 2026-09-02).
  granularity: "Plan" | "PerSubEvent";
}

// Owner-only, server-enforced (Flow 3/4). Rolls Plan.status Draft -> Submitted;
// rolled back to Draft if the admin quotation-create call fails (Diagrams.md §3).
export function submitPlanForQuotation(
  planId: string,
  payload: SubmitPlanPayload,
): Promise<QuotationLink[]> {
  return apiFetch<QuotationLink[]>(`api/storefront/plans/${planId}/submit`, {
    method: "POST",
    body: payload,
  });
}
