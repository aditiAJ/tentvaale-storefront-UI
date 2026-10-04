"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { planKeys } from "@/features/plans/api";
import { listQuotationRequests } from "@/features/plans/quotation-request";
import {
  acceptQuotation,
  getQuotation,
  rejectQuotation,
  reopenPlan,
  requestQuotationChanges,
} from "./api";
import { quotationKeys } from "./keys";

export function useQuotation(requestId: string) {
  return useQuery({
    queryKey: quotationKeys.detail(requestId),
    queryFn: ({ signal }) => getQuotation(requestId, signal),
    retry: false,
    // The vendor works on it in another window; look again when the customer comes back to the tab.
    refetchOnWindowFocus: true,
  });
}

/** Every quotation request the customer has made, newest first. */
export function useQuotationRequests(enabled = true) {
  return useQuery({
    queryKey: quotationKeys.requests,
    queryFn: ({ signal }) => listQuotationRequests(signal),
    enabled,
  });
}

/** The customer's decisions. Each refreshes the quotation, the request list and the plans. */
export function useQuotationActions(requestId: string) {
  const queryClient = useQueryClient();
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(requestId) }),
      queryClient.invalidateQueries({ queryKey: quotationKeys.requests }),
      queryClient.invalidateQueries({ queryKey: planKeys.all }),
    ]);
  const options = { onSuccess: refresh };
  return {
    accept: useMutation({ mutationFn: () => acceptQuotation(requestId), ...options }),
    requestChanges: useMutation({ mutationFn: (note: string) => requestQuotationChanges(requestId, note), ...options }),
    reject: useMutation({ mutationFn: (reason: string) => rejectQuotation(requestId, reason), ...options }),
    reopen: useMutation({ mutationFn: () => reopenPlan(requestId), ...options }),
  };
}
