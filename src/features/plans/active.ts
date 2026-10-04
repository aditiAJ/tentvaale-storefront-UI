"use client";

import { itemKey } from "./keys";
import { usePlan, usePlans } from "./hooks";

/**
 * The plan a shopper is most likely adding to right now: their newest draft. Listing cards use it
 * to show "already in your plan" with a quantity control instead of Add. (Adding to a different plan
 * goes through the Add dialog, which asks.)
 */
export function useActivePlan() {
  const plans = usePlans();
  const draftId = plans.data?.find((p) => p.status === "DRAFT")?.id ?? "";
  const plan = usePlan(draftId);
  return { planId: draftId, plan: plan.data };
}

/** Where a product (or one option of it) already sits in the active plan, last added first. */
export function useActivePlanLine(productId: number, variantId?: number | null) {
  const { planId, plan } = useActivePlan();
  if (!plan) return null;
  const key = itemKey(productId, variantId);
  const lines = [...plan.subEvents.flatMap((s) => s.items), ...plan.generalItems].filter((it) => itemKey(it.productId, it.variantId) === key);
  const line = lines[lines.length - 1];
  return line ? { planId, planName: plan.name, itemId: line.id, quantity: line.quantity } : null;
}
