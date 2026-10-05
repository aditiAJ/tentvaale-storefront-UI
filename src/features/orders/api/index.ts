import { apiFetch } from "@/services/api-client";
import type { Order, OrderSummary } from "../types";

/** The customer's own orders, newest first. Read-only: the back office moves an order along. */
export const listOrders = (signal?: AbortSignal) => apiFetch<OrderSummary[]>("storefront/orders", { signal });

/** 404 when the order is not this account's. */
export const getOrder = (orderId: string, signal?: AbortSignal) =>
  apiFetch<Order>(`storefront/orders/${encodeURIComponent(orderId)}`, { signal });
