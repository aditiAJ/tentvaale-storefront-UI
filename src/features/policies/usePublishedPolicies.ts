"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/services/api-client";

/** The policies a business publishes in its Settings, in the order they are shown. */
export const POLICY_KINDS = ["TERMS", "CANCELLATION", "DAMAGE", "DELIVERY"] as const;

export interface PublishedPolicy {
  kind: string;
  version: number;
  title: string;
  body: string;
  publishedAt?: string;
}

/** Where a policy is read in full. */
export const policyPath = (kind: string) => `/policies/${kind.toLowerCase()}`;

/**
 * The policies in force now, straight from Settings: the one source of the app's terms. A policy never published is
 * left out, so nothing here shows a placeholder.
 */
export function usePublishedPolicies() {
  return useQuery({
    queryKey: ["policies", "published"],
    staleTime: 60_000,
    queryFn: async ({ signal }) => {
      const all = await Promise.all(
        POLICY_KINDS.map((kind) => apiFetch<PublishedPolicy>(`storefront/policies/${kind}`, { signal }).catch(() => null)),
      );
      return all.filter((p): p is PublishedPolicy => p !== null && p.version > 0 && p.body.trim() !== "");
    },
  });
}
