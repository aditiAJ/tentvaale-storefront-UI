"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/features/auth/session";
import { acceptInvite, changeMemberRole, getInvite, inviteMember, planKeys, removeMember } from "./api";
import type { Plan, PlanRole } from "./types";

type Role = Exclude<PlanRole, "OWNER">;

/** After any change to who is on a plan: keep the plan the server returned, and look at the list again. */
function useStore(planId: string) {
  const queryClient = useQueryClient();
  return (plan: Plan | undefined) => {
    if (plan) queryClient.setQueryData(planKeys.detail(planId), plan);
    else queryClient.removeQueries({ queryKey: planKeys.detail(planId) });
    queryClient.invalidateQueries({ queryKey: planKeys.list });
  };
}

export function useInviteMember(planId: string) {
  const store = useStore(planId);
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: Role }) => inviteMember(planId, email, role),
    onSuccess: store,
  });
}

export function useChangeMemberRole(planId: string) {
  const store = useStore(planId);
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: Role }) => changeMemberRole(planId, memberId, role),
    onSuccess: store,
  });
}

export function useRemoveMember(planId: string) {
  const store = useStore(planId);
  return useMutation({ mutationFn: (memberId: string) => removeMember(planId, memberId), onSuccess: store });
}

/** The invitation behind a link; only the person it was sent to can read it (anyone else gets a 404). */
export function usePlanInvite(token: string) {
  const { status } = useSession();
  return useQuery({
    queryKey: ["plans", "invite", token],
    queryFn: ({ signal }) => getInvite(token, signal),
    enabled: !!token && status === "authenticated",
    retry: false,
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => acceptInvite(token),
    onSuccess: (plan) => {
      queryClient.setQueryData(planKeys.detail(plan.id), plan);
      queryClient.invalidateQueries({ queryKey: planKeys.list });
    },
  });
}
