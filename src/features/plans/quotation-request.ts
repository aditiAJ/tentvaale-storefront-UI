import { apiFetch } from "@/services/api-client";
import type { QuotationStage } from "@/features/quotations/types";

/**
 * Sending a plan to the vendor for pricing. The backend turns the plan into a draft quotation the
 * vendor reviews and sends back, links it to this plan, and locks the plan against further edits.
 * The customer then follows it through features/quotations.
 */
export type QuotationRequestStatus = "SUBMITTED" | "ORDERED" | "REJECTED" | "CANCELLED";

export interface QuotationRequest {
  id: string;
  planId: string;
  quotationId: string;
  /** The vendor's reference for it, e.g. what the customer quotes when they call. */
  quotationNumber: string;
  orderId?: string;
  orderNumber?: string;
  status: QuotationRequestStatus;
  /** Where it stands for the customer: being prepared, ready, revision requested, ordered ... */
  stage: QuotationStage;
  submittedAt: string;
}

export const submitPlanForQuotation = (planId: string) =>
  apiFetch<QuotationRequest>("storefront/ordering/quotation-requests", { method: "POST", body: { planId } });

export const listQuotationRequests = (signal?: AbortSignal) =>
  apiFetch<QuotationRequest[]>("storefront/ordering/quotation-requests", { signal });
