import { apiFetch } from "@/services/api-client";
import type { DeliveryStatus, OrderLink } from "../types";

export function getOrder(orderLinkId: string): Promise<OrderLink> {
  return apiFetch<OrderLink>(`api/storefront/orders/${orderLinkId}`);
}

// Order-level only — see DeliveryStatus in ../types.ts (resolved 2026-09-02).
export function getDeliveryStatus(
  orderLinkId: string,
): Promise<{ status: DeliveryStatus }> {
  return apiFetch<{ status: DeliveryStatus }>(
    `api/storefront/orders/${orderLinkId}/delivery-status`,
  );
}

export interface CancellationPreview {
  cancellableLineIds: string[];
  nonCancellableReason?: string;
  rentalChargeRefundable: false; // always false — flat non-refundable pending tiered terms (Flow 8)
  depositRefundable: boolean;
}

export function previewCancellation(
  orderLinkId: string,
): Promise<CancellationPreview> {
  return apiFetch<CancellationPreview>(
    `api/storefront/orders/${orderLinkId}/cancellation-preview`,
  );
}

// Supports sub-event-level cancellation (lineIds omitted = cancel whole order).
// Flagged as a scope addition beyond the literal PRD text — see Flow 8 branches.
export function cancelOrder(
  orderLinkId: string,
  lineIds?: string[],
): Promise<void> {
  return apiFetch<void>(`api/storefront/orders/${orderLinkId}/cancel`, {
    method: "POST",
    body: { lineIds },
  });
}
