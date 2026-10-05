import type { Money } from "@/lib/money";

/**
 * A customer's order (CustomerOrderView on the backend): what was ordered, where it has got to,
 * what has gone out and come back, and what is happening with the security deposit.
 *
 * Dispatch and return are recorded for the whole order, not per function of the plan, so the
 * delivery history is order-level. Every amount is the backend's; nothing here is calculated on.
 */
export type OrderStatus = "CONFIRMED" | "DISPATCHED" | "RETURNED" | "COMPLETED" | "CANCELLED";

export type DepositStatus = "HELD" | "REFUND_PENDING" | "REFUNDED" | "FORFEITED";

export interface OrderSummary {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  requestId: string;
  planId: string;
  planName: string;
  eventDate?: string;
  totalAmount: Money;
  itemCount: number;
  placedAt?: string;
}

export interface OrderLine {
  productId: number;
  variantId?: number | null;
  productName: string;
  quantity: number;
  rentalDays: number;
  lineTotal: Money;
}

export interface OrderMovement {
  movementNumber: string;
  direction: "OUTWARD" | "INWARD";
  movedOn: string;
  items: { productId: number; variantId?: number | null; productName: string; quantity: number }[];
}

export interface OrderDeposit {
  status: DepositStatus;
  amountHeld: Money;
  amountRefunded: Money;
  amountForfeited: Money;
  reason?: string;
  heldAt: string;
  settledAt?: string;
}

export interface Order extends Omit<OrderSummary, "itemCount"> {
  quotationNumber: string;
  securityDeposit: Money;
  /** Total less any credit notes. Payments are not recorded yet. */
  balanceOwed: Money;
  dispatchedAt?: string;
  returnedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  lines: OrderLine[];
  movements: OrderMovement[];
  /** Absent when the order has no security deposit. */
  deposit?: OrderDeposit;
}

/** What the customer reads for each status. */
export const STATUS_COPY: Record<
  OrderStatus,
  { label: string; tone: "default" | "success" | "warning" | "destructive"; text: string }
> = {
  CONFIRMED: {
    label: "Confirmed",
    tone: "default",
    text: "Your order is confirmed. We will prepare it and be in touch about delivery.",
  },
  DISPATCHED: { label: "Dispatched", tone: "warning", text: "Your items have been sent for your event." },
  RETURNED: {
    label: "Returned",
    tone: "default",
    text: "Your items are back with us. We are settling the security deposit.",
  },
  COMPLETED: { label: "Completed", tone: "success", text: "All done. Thank you for choosing Tentvaale." },
  CANCELLED: { label: "Cancelled", tone: "destructive", text: "This order was cancelled." },
};

export const DEPOSIT_COPY: Record<DepositStatus, { label: string; text: string }> = {
  HELD: { label: "Held", text: "Held as security. It is returned after your items come back in good condition." },
  REFUND_PENDING: { label: "Refund on its way", text: "Your refund has been approved and is being paid out." },
  REFUNDED: { label: "Refunded", text: "Your deposit has been refunded." },
  FORFEITED: { label: "Retained", text: "The deposit, or part of it, was kept. See the reason below." },
};
