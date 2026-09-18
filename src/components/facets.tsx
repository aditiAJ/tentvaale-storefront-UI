"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { DUR, EASE } from "@/components/motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * The shared filtering idiom: a collapsible group, a tick list, a sticky
 * sidebar on desktop with a bottom drawer on mobile, and removable pills for
 * what is currently on.
 *
 * Extracted from the catalogue page so every filterable listing looks and
 * behaves the same. Bundles previously had a flat row of checkboxes under the
 * heading — the same job in a different idiom, which is exactly the
 * inconsistency the card and radius passes were meant to end.
 */

export function FacetGroup({
  title,
  count,
  defaultOpen,
  action,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  // <details> stays the mechanism (keyboard + no-JS behaviour for free);
  // interpolate-size + the ::details-content rule in globals give it a real
  // height transition instead of the browser's instant snap.
  return (
    <details open={defaultOpen} className="group border-t border-border py-3 first:border-t-0 first:pt-0 [interpolate-size:allow-keywords]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-0.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase transition-colors duration-200 ease-out-quint select-none hover:text-foreground [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          {title}
          {!!count && (
            <span className="rounded-sm bg-primary px-1.5 text-[10px] leading-4 font-semibold text-primary-foreground normal-case tabular-nums">
              {count}
            </span>
          )}
        </span>
        <span className="flex items-center gap-2">
          {action}
          <ChevronDown className="size-3.5 transition-transform duration-300 ease-out-quint group-open:rotate-180" />
        </span>
      </summary>
      <div className="mt-2.5 flex flex-col gap-2">{children}</div>
    </details>
  );
}

export function CheckList({
  options,
  selected,
  onToggle,
  collapseAfter = 6,
}: {
  options: { value: string; count: number }[];
  selected: string[];
  onToggle: (v: string) => void;
  collapseAfter?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? options : options.slice(0, collapseAfter);
  return (
    <>
      {visible.map((o) => (
        <label
          key={o.value}
          className="-mx-1.5 flex cursor-pointer items-center justify-between gap-2 rounded-md px-1.5 py-1 text-sm text-foreground/80 transition-colors duration-200 ease-out-quint hover:bg-muted/60 hover:text-foreground"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Checkbox checked={selected.includes(o.value)} onCheckedChange={() => onToggle(o.value)} />
            <span className="truncate">{o.value}</span>
          </span>
          <span className="text-[11px] text-muted-foreground tabular-nums">{o.count}</span>
        </label>
      ))}
      {options.length > collapseAfter && (
        <button className="w-fit text-xs text-primary hover:underline" onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Show less" : `Show ${options.length - collapseAfter} more`}
        </button>
      )}
    </>
  );
}

/** Sticky desktop sidebar wrapper. Hidden below md — use FilterDrawer there. */
export function FilterSidebar({ onClearAll, showClear, children }: { onClearAll?: () => void; showClear?: boolean; children: React.ReactNode }) {
  return (
    <aside className="hidden w-64 shrink-0 md:block">
      <div className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-e1">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium">
            <SlidersHorizontal className="size-4 text-primary" /> Filters
          </span>
          {showClear && onClearAll && (
            <button className="text-xs text-primary hover:underline" onClick={onClearAll}>
              Clear all
            </button>
          )}
        </div>
        {children}
      </div>
    </aside>
  );
}

/** The same panel as a bottom sheet, for mobile. */
export function FilterDrawer({ activeCount, children }: { activeCount: number; children: React.ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <button className="press flex h-10 items-center gap-2 rounded-lg border border-border px-3.5 text-sm transition-colors duration-200 ease-out-quint hover:border-primary/60 md:hidden">
            <SlidersHorizontal className="size-4" /> Filters
            {activeCount > 0 && (
              <span className="rounded-sm bg-primary px-1.5 text-[10px] leading-4 font-semibold text-primary-foreground tabular-nums">{activeCount}</span>
            )}
          </button>
        }
      />
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="px-5 pb-8">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

export interface FilterPill {
  key: string;
  label: string;
  clear: () => void;
}

/**
 * Removable chips for what is currently filtered. Each pill collapses out
 * individually, so a filter you removed is seen to leave rather than vanishing
 * between frames.
 */
export function FilterPills({ pills, onClearAll }: { pills: FilterPill[]; onClearAll: () => void }) {
  return (
    <AnimatePresence initial={false}>
      {pills.length > 0 && (
        <motion.div
          key="pills"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: DUR.base, ease: EASE.inOut }}
          className="overflow-hidden"
        >
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <AnimatePresence initial={false} mode="popLayout">
              {pills.map((p) => (
                <motion.button
                  key={p.key}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: DUR.fast, ease: EASE.out }}
                  onClick={p.clear}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/5 py-1 pr-2 pl-3 text-xs text-primary",
                    "transition-colors duration-200 ease-out-quint hover:bg-primary/10",
                  )}
                >
                  {p.label}
                  <span aria-hidden>&times;</span>
                </motion.button>
              ))}
            </AnimatePresence>
            <button className="text-xs text-muted-foreground transition-colors hover:text-foreground" onClick={onClearAll}>
              Clear all
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
