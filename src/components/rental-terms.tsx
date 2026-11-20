"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { policyPath, usePublishedPolicies } from "@/features/policies/usePublishedPolicies";

/**
 * Rental terms and policies, shown on the product page and inside a Plan. The text is the business's own policies
 * from Settings (the same ones on the policy pages and in every quotation), never wording kept in this file. Each is
 * shown in brief with a link to read it in full. Nothing shows until a policy has been published.
 */
export function RentalTerms({ className, defaultOpen = false }: { className?: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const policies = usePublishedPolicies().data ?? [];
  if (policies.length === 0) return null;

  return (
    <section className={cn("rounded-lg border border-border bg-card", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <span className="flex items-center gap-2.5">
          <FileText className="size-4 shrink-0 text-primary" />
          <span className="text-sm font-medium text-foreground">Rental terms &amp; policies</span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out-quint", open && "rotate-180")} />
      </button>

      {open && (
        <dl className="flex flex-col gap-3.5 border-t border-border px-4 pt-4 pb-4">
          {policies.map((policy) => (
            <div key={policy.kind} className="flex flex-col gap-1">
              <dt className="text-sm font-medium text-foreground">{policy.title}</dt>
              <dd className="text-sm leading-6 whitespace-pre-line text-muted-foreground line-clamp-3">{policy.body}</dd>
              <Link href={policyPath(policy.kind)} className="text-xs text-primary hover:underline">
                Read the full policy
              </Link>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
