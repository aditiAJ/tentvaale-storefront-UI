import { apiFetch } from "@/services/api-client";
import type { QuotationDetail } from "../types";

export function getQuotation(quotationLinkId: string): Promise<QuotationDetail> {
  return apiFetch<QuotationDetail>(
    `api/storefront/quotations/${quotationLinkId}`,
  );
}

export function getQuotationHistory(
  quotationLinkId: string,
): Promise<QuotationDetail[]> {
  return apiFetch<QuotationDetail[]>(
    `api/storefront/quotations/${quotationLinkId}/history`,
  );
}

// Owner can accept only the confirmed/acceptable subset (Flow 5) — not all-or-nothing.
export function acceptQuotationLines(
  quotationLinkId: string,
  planItemIds: string[],
): Promise<{ payableAmount: number }> {
  return apiFetch<{ payableAmount: number }>(
    `api/storefront/quotations/${quotationLinkId}/accept`,
    { method: "POST", body: { planItemIds } },
  );
}

export function rejectQuotation(quotationLinkId: string): Promise<void> {
  return apiFetch<void>(`api/storefront/quotations/${quotationLinkId}/reject`, {
    method: "POST",
  });
}
