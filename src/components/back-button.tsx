"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Takes the shopper back to where they came from (the list they picked the product from, with its filters and place
 * on the page), or to `fallback` when this page was opened on its own (a shared link, a new tab) and there is no page
 * of ours behind it.
 */
export function BackButton({ fallback, label = "Back", className }: { fallback: string; label?: string; className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
      className={cn(
        "press flex w-fit items-center gap-2 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
    >
      <ArrowLeft className="size-4" aria-hidden="true" /> {label}
    </button>
  );
}
