"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/features/auth/session";
import { ApiError } from "@/services/api-client";
import {
  addBundle as apiAddBundle,
  addItem as apiAddItem,
  addSubEvent as apiAddSubEvent,
  createPlan as apiCreatePlan,
  decideSharing as apiDecideSharing,
  deletePlan as apiDeletePlan,
  getPlan,
  listPlans,
  planKeys,
  removeCoverImage as apiRemoveCoverImage,
  removeItem as apiRemoveItem,
  removeSubEvent as apiRemoveSubEvent,
  updateItem as apiUpdateItem,
  updatePlan as apiUpdatePlan,
  updateSubEvent as apiUpdateSubEvent,
  uploadCoverImage as apiUploadCoverImage,
} from "./api";
import { toBoard, type BoardPlan } from "./board";
import { parseItemKey } from "./keys";
import type { AddBundleInput, AddItemInput, Plan, PlanDetailsInput, SharingDecision, SubEventInput } from "./types";

/** The signed-in customer's plans, newest first. Nothing is asked of the backend while signed out. */
export function usePlans() {
  const { status } = useSession();
  return useQuery({
    queryKey: planKeys.list,
    queryFn: ({ signal }) => listPlans(signal),
    enabled: status === "authenticated",
    staleTime: 30_000,
  });
}

/** One plan. A 404 means it is not this customer's (or not there), and is not retried. */
export function usePlan(planId: string, enabled = true) {
  const { status } = useSession();
  return useQuery({
    queryKey: planKeys.detail(planId),
    queryFn: ({ signal }) => getPlan(planId, signal),
    enabled: enabled && !!planId && status === "authenticated",
    staleTime: 15_000,
    retry: (failures, error) => !(error instanceof ApiError && (error.status === 404 || error.status === 401)) && failures < 2,
  });
}

/** The plan as the plan board screens read it. */
export function useBoard(planId: string) {
  const query = usePlan(planId);
  const board: BoardPlan | undefined = useMemo(() => (query.data ? toBoard(query.data) : undefined), [query.data]);
  return { board, query };
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PlanDetailsInput) => apiCreatePlan(input),
    onSuccess: (plan) => {
      queryClient.setQueryData(planKeys.detail(plan.id), plan);
      void queryClient.invalidateQueries({ queryKey: planKeys.list });
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => apiDeletePlan(planId),
    onSuccess: (_void, planId) => {
      queryClient.removeQueries({ queryKey: planKeys.detail(planId) });
      void queryClient.invalidateQueries({ queryKey: planKeys.list });
    },
  });
}

/**
 * Edits to one plan. Each call goes to the backend and the plan it answers with replaces the one
 * on screen.
 *
 * Edits run one after another, in the order they were made (a customer who taps + five times sends
 * five changes that must land in that order). A quantity shows its new value at once and is put
 * right if the backend refuses. Anything the backend refuses is shown as a message and nothing else
 * changes; every action resolves to the new plan, or to undefined when it was refused.
 */
export function usePlanActions(planId: string) {
  const queryClient = useQueryClient();
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const [pending, setPending] = useState(0);
  const inFlight = useRef(0);
  const detailKey = planKeys.detail(planId);

  const run = useCallback(
    async (call: () => Promise<Plan>, optimistic?: (plan: Plan) => Plan): Promise<Plan | undefined> => {
      if (optimistic) queryClient.setQueryData<Plan>(detailKey, (plan) => (plan ? optimistic(plan) : plan));
      inFlight.current += 1;
      setPending(inFlight.current);
      const result = queue.current.then(call);
      queue.current = result.catch(() => undefined);
      try {
        const plan = await result;
        // A newer edit is already queued: its answer will be the up-to-date one.
        if (inFlight.current === 1) queryClient.setQueryData(detailKey, plan);
        void queryClient.invalidateQueries({ queryKey: planKeys.list });
        return plan;
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : "That change could not be saved. Please try again.");
        void queryClient.invalidateQueries({ queryKey: detailKey });
        return undefined;
      } finally {
        inFlight.current -= 1;
        setPending(inFlight.current);
      }
    },
    [queryClient, detailKey],
  );

  const current = useCallback(() => queryClient.getQueryData<Plan>(detailKey), [queryClient, detailKey]);

  return useMemo(
    () => ({
      /** True while any change is still being saved. */
      saving: pending > 0,

      updateDetails: (input: PlanDetailsInput) => run(() => apiUpdatePlan(planId, input)),

      /** Puts a picture of the event on the plan (replacing any). A refusal is shown as a message. */
      setCoverImage: (file: File) => run(() => apiUploadCoverImage(planId, file)),

      removeCoverImage: () => run(() => apiRemoveCoverImage(planId)),

      /** The label for the items on no function ("Main function" when empty). Keeps the other details. */
      renameGeneral: (label: string) => {
        const plan = current();
        if (!plan) return Promise.resolve(undefined);
        return run(() =>
          apiUpdatePlan(planId, {
            name: plan.name,
            venue: plan.venue,
            eventDate: plan.eventDate,
            eventEndDate: plan.eventEndDate,
            guestCount: plan.guestCount,
            generalLabel: label,
            // Sent back, or the saved venue would be cleared.
            venueId: plan.venueDetail?.id ?? null,
          }),
        );
      },

      addSubEvent: (input: SubEventInput) => run(() => apiAddSubEvent(planId, input)),
      updateSubEvent: (subEventId: string, input: SubEventInput) => run(() => apiUpdateSubEvent(planId, subEventId, input)),
      removeSubEvent: (subEventId: string) => run(() => apiRemoveSubEvent(planId, subEventId)),

      addItem: (input: AddItemInput) => run(() => apiAddItem(planId, input)),
      removeItem: (itemId: string) => run(() => apiRemoveItem(planId, itemId)),

      /** Moves a line to another function, or to the plan as a whole (null). */
      moveItem: (itemId: string, subEventId: string | null) => {
        const item = findItem(current(), itemId);
        if (!item) return Promise.resolve(undefined);
        return run(() =>
          apiUpdateItem(planId, itemId, {
            subEventIds: subEventId ? [subEventId] : [],
            quantity: item.quantity,
            rentalStart: item.rentalStart,
            rentalEnd: item.rentalEnd,
          }),
        );
      },

      /** Which functions one line serves (empty = the plan as a whole). Days follow the functions' dates. */
      setFunctions: (itemId: string, subEventIds: string[]) => {
        const item = findItem(current(), itemId);
        if (!item) return Promise.resolve(undefined);
        return run(() =>
          apiUpdateItem(planId, itemId, { subEventIds, quantity: item.quantity, rentalStart: item.rentalStart, rentalEnd: item.rentalEnd }),
        );
      },

      /** For an area or length product `quantity` is the square or running feet. */
      setQuantity: (itemId: string, quantity: number) => {
        const item = findItem(current(), itemId);
        if (!item) return Promise.resolve(undefined);
        return run(
          () => apiUpdateItem(planId, itemId, { subEventIds: item.subEventIds, quantity, rentalStart: item.rentalStart, rentalEnd: item.rentalEnd }),
          (plan) => withItem(plan, itemId, (it) => ({ ...it, quantity })),
        );
      },

      addBundle: (input: AddBundleInput) => run(() => apiAddBundle(planId, input)),

      /** `key` is an item key ("42" or "42-v7"); a null decision clears the customer's call. */
      decideSharing: (key: string, decision: SharingDecision | null) => {
        const ref = parseItemKey(key);
        if (!ref) return Promise.resolve(undefined);
        return run(() => apiDecideSharing(planId, ref.productId, ref.variantId, decision));
      },
    }),
    [run, current, planId, pending],
  );
}

function findItem(plan: Plan | undefined, itemId: string) {
  if (!plan) return undefined;
  return [...plan.subEvents.flatMap((s) => s.items), ...plan.generalItems].find((it) => it.id === itemId);
}

function withItem(plan: Plan, itemId: string, change: (item: Plan["generalItems"][number]) => Plan["generalItems"][number]): Plan {
  return {
    ...plan,
    generalItems: plan.generalItems.map((it) => (it.id === itemId ? change(it) : it)),
    subEvents: plan.subEvents.map((se) => ({ ...se, items: se.items.map((it) => (it.id === itemId ? change(it) : it)) })),
  };
}
