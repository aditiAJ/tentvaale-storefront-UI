import { apiFetch } from "@/services/api-client";

/**
 * Sending a plan to the vendor for pricing. The backend turns the plan into a draft quotation the
 * vendor reviews and sends back, links it to this plan, and locks the plan against further edits.
 * (The rest of the quotation journey, seeing and accepting the quotation, is a later phase.)
 */
export type QuotationRequestStatus = string;

export interface QuotationRequest {
  id: string;
  planId: string;
  quotationId: string;
  /** The vendor's reference for it, e.g. what the customer quotes when they call. */
  quotationNumber: string;
  orderId?: string;
  orderNumber?: string;
  status: QuotationRequestStatus;
  submittedAt: string;
}

export const submitPlanForQuotation = (planId: string) =>
  apiFetch<QuotationRequest>("storefront/ordering/quotation-requests", { method: "POST", body: { planId } });

export const listQuotationRequests = (signal?: AbortSignal) =>
  apiFetch<QuotationRequest[]>("storefront/ordering/quotation-requests", { signal });
