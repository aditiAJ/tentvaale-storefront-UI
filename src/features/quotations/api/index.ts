import { apiFetch } from "@/services/api-client";
import type { QuotationRequest } from "@/features/plans/quotation-request";
import type { CustomerQuotation } from "../types";

/**
 * The customer's side of a quotation request. Every call is addressed by the request id (what the
 * customer holds), never the vendor's quotation id, and the backend only answers for the account
 * that owns the request: anyone else gets a 404.
 */
const base = (requestId: string) => `storefront/ordering/quotation-requests/${encodeURIComponent(requestId)}`;

export const getQuotation = (requestId: string, signal?: AbortSignal) =>
  apiFetch<CustomerQuotation>(`${base(requestId)}/quotation`, { signal });

/** Accepts the whole quotation, which creates the order. 422 with the reason if it cannot be accepted. */
export const acceptQuotation = (requestId: string) =>
  apiFetch<QuotationRequest>(`${base(requestId)}/accept`, { method: "POST" });

/** Asks the vendor to revise the quotation; it stays open and returns when re-sent. */
export const requestQuotationChanges = (requestId: string, note: string) =>
  apiFetch<QuotationRequest>(`${base(requestId)}/request-changes`, { method: "POST", body: { note } });

export const rejectQuotation = (requestId: string, reason: string) =>
  apiFetch<QuotationRequest>(`${base(requestId)}/reject`, { method: "POST", body: { reason } });

/** After a rejected or expired quotation: closes the request and makes the plan a draft again. */
export const reopenPlan = (requestId: string) =>
  apiFetch<QuotationRequest>(`${base(requestId)}/reopen-plan`, { method: "POST" });
