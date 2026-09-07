// Delivery status is surfaced at ORDER level only — resolved 2026-09-02, see
// ARCHITECTURE.md "Delivery status" and Diagrams.md §5. Admin's stock movement
// can't be attributed below order-level, so the UI must not imply per-sub-event precision.
export type DeliveryStatus = "InProgress" | "FullyDelivered";

export interface OrderLink {
  id: string;
  quotationLinkId: string;
  adminOrderId: string;
  deliveryStatus: DeliveryStatus;
}
