"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { canGoBackInApp, isPlainClick, safeInternalPath, type NavigationLike } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * Takes the shopper back to where they came from (the list they picked the product from, with its filters and place
 * on the page), or to `fallback` when there is no page of ours behind this one: a shared link, a new tab, a refresh
 * after arriving from another site. It never goes back to another site.
 *
 * It is a real link to `fallback`, so a middle click or "open in new tab" opens the fallback, and it works before
 * the page's scripts have loaded. Only a plain click on a page with one of ours behind it goes back in history.
 */
export function BackButton({ fallback, label = "Back", className }: { fallback: string; label?: string; className?: string }) {
  const router = useRouter();
  const href = safeInternalPath(fallback) ?? "/";
  return (
    <Link
      href={href}
      onClick={(event) => {
        if (!isPlainClick(event)) return;
        if (canGoBackInApp((window as Window & { navigation?: NavigationLike }).navigation)) {
          event.preventDefault();
          router.back();
        }
      }}
      className={cn(
        "press flex w-fit items-center gap-2 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
    >
      <ArrowLeft className="size-4" aria-hidden="true" /> {label}
    </Link>
  );
}
