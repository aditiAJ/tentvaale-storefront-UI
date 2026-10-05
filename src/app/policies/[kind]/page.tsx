"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/services/api-client";
import { Skeleton } from "@/components/ui/skeleton";

const KINDS = ["cancellation", "damage", "delivery", "terms"] as const;

interface Policy {
  kind: string;
  version: number;
  title: string;
  body: string;
  publishedAt?: string;
}

/**
 * A policy page the vendor publishes (cancellation, damage, delivery, terms). Public. A quotation
 * links to the version it was sent with (?version=N); with none, the latest is shown. The text is
 * shown as plain text: nothing the vendor types is ever treated as markup.
 */
export default function PolicyPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = use(params);
  const version = useSearchParams().get("version");
  const known = (KINDS as readonly string[]).includes(kind.toLowerCase());
  const query = useQuery({
    queryKey: ["policy", kind, version],
    queryFn: ({ signal }) =>
      apiFetch<Policy>(`storefront/policies/${kind.toUpperCase()}${version ? `?version=${encodeURIComponent(version)}` : ""}`, { signal }),
    enabled: known,
  });

  if (!known) {
    return <div className="mx-auto w-full max-w-3xl py-20 text-center page-x">Policy not found.</div>;
  }
  if (query.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 py-10 page-x">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (query.isError) {
    return <div className="mx-auto w-full max-w-3xl py-20 text-center page-x">We couldn&apos;t load this policy. Please try again.</div>;
  }
  const policy = query.data;
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-4 py-10 page-x">
      <h1 className="font-serif text-3xl text-foreground md:text-4xl">{policy.title}</h1>
      {policy.version > 0 && (
        <p className="text-xs text-muted-foreground">
          Version {policy.version}
          {policy.publishedAt ? ` · published ${new Date(policy.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}
        </p>
      )}
      <p className="text-sm leading-7 whitespace-pre-wrap text-foreground/85">{policy.body}</p>
    </article>
  );
}
