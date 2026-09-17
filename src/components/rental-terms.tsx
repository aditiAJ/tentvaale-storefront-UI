"use client";

import { useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Rental terms and policies, shown on the product page and inside a Plan.
 *
 * ⚠️ PLACEHOLDER COPY — NOT LEGALLY REVIEWED.
 *
 * The client asked for obvious, sensible terms now and will supply the real
 * wording later. Two of these are NOT invented: the non-refundable rental
 * charge and the deposit's immediate-vs-pending-review split are the resolved
 * Flow 8 rules from Contexts/Tentvaale_Storefront_UserFlows.md, and the
 * cancellation page already states them — they are repeated here so the two
 * screens cannot drift apart. The rest are placeholders.
 *
 * Tiered cancellation terms are still pending from the client; until they
 * arrive the rental charge is treated as flatly non-refundable, which is what
 * the Flow 8 notes instruct.
 *
 * Replace TERMS below with the reviewed copy and delete `isPlaceholder`. The
 * banner is what stops unreviewed wording reaching production unnoticed — do
 * not remove it while the copy is still this text.
 */
const isPlaceholder = true;

const TERMS: { title: string; body: string }[] = [
  {
    title: "Rental period",
    body: "Pricing is per day unless the item states otherwise. The rental period runs from the delivery date to the scheduled return pickup, both of which are confirmed on your order.",
  },
  {
    title: "Security deposit",
    body: "A refundable security deposit is collected with the order. It is released after the items are returned and inspected.",
  },
  {
    title: "Cancellation",
    body: "The rental charge is non-refundable once an order is confirmed. Cancel before the event date and the security deposit is refunded immediately; cancel after it and the deposit is held pending a damage inspection.",
  },
  {
    title: "Damage and loss",
    body: "Items are expected back in the condition they were delivered in, allowing for normal wear. Damage, staining or loss is assessed against the security deposit, and anything beyond the deposit is invoiced separately.",
  },
  {
    title: "Delivery and pickup",
    body: "Delivery and pickup windows are agreed when the order is confirmed. Someone must be available at the venue to receive and hand back the items.",
  },
  {
    title: "Setup and handling",
    body: "Unless a styling service is included, items are delivered for you to place. Items must not be modified, repainted or permanently fixed to any surface.",
  },
];

export function RentalTerms({ className, defaultOpen = false }: { className?: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

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
        <div className="flex flex-col gap-4 border-t border-border px-4 pt-4 pb-4">
          {isPlaceholder && (
            <p className="rounded-sm border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-500">
              Draft terms — indicative only, pending final wording. These are not the contractual terms of hire.
            </p>
          )}
          <dl className="flex flex-col gap-3.5">
            {TERMS.map((term) => (
              <div key={term.title} className="flex flex-col gap-1">
                <dt className="text-sm font-medium text-foreground">{term.title}</dt>
                <dd className="text-sm leading-6 text-muted-foreground">{term.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}
