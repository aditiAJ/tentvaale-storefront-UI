"use client";

import { useQuery } from "@tanstack/react-query";
import { getOrder, listOrders } from "./api";
import { orderKeys } from "./keys";

export function useOrders(enabled = true) {
  return useQuery({
    queryKey: orderKeys.list,
    queryFn: ({ signal }) => listOrders(signal),
    enabled,
    // Staff move orders along in the back office; look again when the customer comes back.
    refetchOnWindowFocus: true,
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: ({ signal }) => getOrder(orderId, signal),
    retry: false,
    refetchOnWindowFocus: true,
  });
}
