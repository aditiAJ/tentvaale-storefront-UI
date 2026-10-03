"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Search } from "lucide-react";
import { DUR, EASE } from "@/components/motion";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckList, FacetGroup } from "@/components/facets";
import { cn } from "@/lib/utils";
import { PRICE_BANDS } from "../price-bands";
import type { CategoryNode, ProductFilters } from "../types";

interface FilterPanelProps {
  categories: CategoryNode[];
  selectedCategories: string[];
  selectedSubCategories: string[];
  onToggleCategory: (slug: string) => void;
  onToggleSubCategory: (categorySlug: string, subSlug: string) => void;
  onClearCategories: () => void;
  filters: ProductFilters | undefined;
  facetSelection: Record<string, string[]>;
  onToggleFacet: (code: string, value: string) => void;
  priceSelection: string[];
  onTogglePrice: (bandId: string) => void;
  query: string;
  onQueryChange: (q: string) => void;
}

/**
 * The catalogue's filters, all driven by what the backend says exists: the category tree with
 * counts, the facets that occur in the products in play (with counts), and the price bands.
 * Selections live in the page's URL; this component only shows and reports them.
 */
export function FilterPanel({
  categories,
  selectedCategories,
  selectedSubCategories,
  onToggleCategory,
  onToggleSubCategory,
  onClearCategories,
  filters,
  facetSelection,
  onToggleFacet,
  priceSelection,
  onTogglePrice,
  query,
  onQueryChange,
}: FilterPanelProps) {
  const [expanded, setExpanded] = useState<string[]>([]);
  // A category's own facets lead (they are what is specific to what the shopper picked), then the shared ones.
  const facets = [...(filters?.facets ?? [])].sort((a, b) => Number(b.scope === "CATEGORY") - Number(a.scope === "CATEGORY"));

  return (
    <div className="flex flex-col">
      <div className="relative mb-4">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search in catalog"
          aria-label="Search in catalog"
          className="h-10 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-sm outline-none transition-[border-color,box-shadow] duration-200 ease-out-quint hover:border-primary/40 focus:border-primary focus:shadow-[0_0_0_3px_var(--ring)]"
        />
      </div>

      {/* Category tree: multi-select. Every row is a checkbox, categories and sub-categories alike. */}
      <FacetGroup
        title="Categories"
        defaultOpen
        count={selectedCategories.length}
        action={
          selectedCategories.length > 0 || selectedSubCategories.length > 0 ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClearCategories();
              }}
              className="text-[11px] font-medium text-primary underline-offset-2 hover:underline"
            >
              Clear all
            </button>
          ) : undefined
        }
      >
        <ul className="-mx-1 flex flex-col">
          {categories.map((c) => {
            const active = selectedCategories.includes(c.slug);
            const open = active || expanded.includes(c.slug);
            return (
              <li key={c.id}>
                <div className={cn("flex items-center rounded-md transition-colors duration-200 ease-out-quint", active ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted hover:text-foreground")}>
                  <button
                    onClick={() => setExpanded(open && !active ? expanded.filter((s) => s !== c.slug) : [...expanded, c.slug])}
                    className="flex size-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={open ? `Collapse ${c.name}` : `Expand ${c.name}`}
                    aria-expanded={open}
                  >
                    <ChevronRight className={cn("size-3.5 transition-transform duration-300 ease-out-quint", open && "rotate-90")} />
                  </button>
                  <label className={cn("flex flex-1 cursor-pointer items-center justify-between gap-2 py-2 pr-2 text-left text-sm", active && "font-medium")}>
                    <span className="flex min-w-0 items-center gap-2">
                      <Checkbox checked={active} onCheckedChange={() => onToggleCategory(c.slug)} />
                      <span className="truncate">{c.name}</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">{c.productCount}</span>
                  </label>
                </div>
                <AnimatePresence initial={false}>
                  {open && c.subCategories.length > 0 && (
                    <motion.ul
                      key="subcats"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        height: { duration: DUR.base, ease: EASE.inOut },
                        opacity: { duration: DUR.fast, ease: EASE.out },
                      }}
                      className="mt-0.5 mb-1 ml-3.5 flex flex-col overflow-hidden border-l border-border pl-2"
                    >
                      {c.subCategories.map((sub) => {
                        const on = selectedSubCategories.includes(sub.slug);
                        return (
                          <li key={sub.id}>
                            <label
                              className={cn(
                                "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors duration-200 ease-out-quint",
                                sub.productCount === 0 ? "cursor-not-allowed opacity-40" : "cursor-pointer",
                                on ? "font-medium text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                              )}
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                <Checkbox checked={on} disabled={sub.productCount === 0} onCheckedChange={() => onToggleSubCategory(c.slug, sub.slug)} />
                                <span className="truncate">{sub.name}</span>
                              </span>
                              <span className="text-[11px] text-muted-foreground tabular-nums">{sub.productCount}</span>
                            </label>
                          </li>
                        );
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </FacetGroup>

      {facets.map((facet) => (
        <FacetGroup
          key={facet.code}
          title={facet.label}
          count={facetSelection[facet.code]?.length}
          defaultOpen={facet.scope === "CATEGORY" || !!facetSelection[facet.code]?.length || facet.code.toLowerCase().startsWith("colo")}
        >
          <CheckList options={facet.values} selected={facetSelection[facet.code] ?? []} onToggle={(v) => onToggleFacet(facet.code, v)} />
        </FacetGroup>
      ))}

      <FacetGroup title="Price band" count={priceSelection.length} defaultOpen>
        {/* A tick list like every other facet; ticking several bands shows products in any of them. */}
        <CheckList
          options={PRICE_BANDS.map((b) => ({ value: b.label, count: 0 }))}
          selected={PRICE_BANDS.filter((b) => priceSelection.includes(b.id)).map((b) => b.label)}
          onToggle={(label) => {
            const band = PRICE_BANDS.find((b) => b.label === label);
            if (band) onTogglePrice(band.id);
          }}
          hideCounts
        />
      </FacetGroup>
    </div>
  );
}
