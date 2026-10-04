"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberStepper } from "@/components/number-stepper";
import { ProductThumb } from "@/components/product-thumb";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useCategories, useProduct, useProductList } from "@/features/catalog/hooks";
import { quantityLabel, rateUnitLabel } from "@/features/catalog/format";
import type { ProductCard } from "@/features/catalog/types";

/** A "Complete your setup" prompt (Entry Gate, Stage…) or the open catalogue. */
export interface PickerPrompt {
  key: string;
  label: string;
  /** Names of the shop's categories that suit the prompt; matched to the real categories by name. */
  categories: string[];
}

export interface PickedLine {
  productId: number;
  variantId: number | null;
  quantity: number;
}

interface Selected {
  quantity: number;
  /** undefined until the product's options have loaded (a product with options must have one chosen). */
  variantId?: number;
}

/**
 * The side panel for putting products on a plan: search the real catalogue, tick what you want, set
 * quantities (and the option, for a product that has options), add them all at once. A prompt such as
 * "Stage" opens it on the matching categories; "Show all products" widens it to everything.
 */
export function ItemPicker({
  prompt,
  targetLabel,
  onClose,
  onAdd,
}: {
  /** null = closed */
  prompt: PickerPrompt | null;
  targetLabel: string;
  onClose: () => void;
  /** Adds the lines; resolves true when they were all saved (then the panel closes). */
  onAdd: (lines: PickedLine[]) => Promise<boolean>;
}) {
  return (
    <Sheet open={prompt !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-md">
        {/* Remounted per prompt so a fresh search and selection start each time. */}
        {prompt && <PickerBody key={prompt.key} prompt={prompt} targetLabel={targetLabel} onClose={onClose} onAdd={onAdd} />}
      </SheetContent>
    </Sheet>
  );
}

const BROWSE_KEY = "browse";

function PickerBody({ prompt, targetLabel, onClose, onAdd }: { prompt: PickerPrompt; targetLabel: string; onClose: () => void; onAdd: (lines: PickedLine[]) => Promise<boolean> }) {
  const browsing = prompt.key === BROWSE_KEY;
  const categories = useCategories().data ?? [];
  const suggested = categories.filter((c) => prompt.categories.some((name) => name.toLowerCase() === c.name.toLowerCase())).map((c) => c.slug);
  // A prompt whose categories the shop does not have shows everything rather than nothing.
  const canFilter = !browsing && suggested.length > 0;
  const [showAll, setShowAll] = useState(false);
  const [typed, setTyped] = useState("");
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<Record<number, Selected>>({});
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(typed.trim()), 300);
    return () => clearTimeout(timer);
  }, [typed]);

  const list = useProductList({ q: query || undefined, categories: canFilter && !showAll ? suggested : undefined, sort: query ? "RELEVANCE" : "NAME" });
  const cards = list.data?.pages.flatMap((p) => p.items) ?? [];
  const ids = Object.keys(selection).map(Number);

  function toggle(card: ProductCard) {
    setSelection((s) => {
      const next = { ...s };
      if (next[card.id]) delete next[card.id];
      else next[card.id] = { quantity: 1 };
      return next;
    });
  }

  async function add() {
    setAdding(true);
    const ok = await onAdd(ids.map((id) => ({ productId: id, variantId: selection[id].variantId ?? null, quantity: selection[id].quantity })));
    setAdding(false);
    if (ok) onClose();
  }

  return (
    <>
      <SheetHeader className="gap-1">
        <SheetTitle>{browsing ? "Add items" : `Choose a ${prompt.label}`}</SheetTitle>
        <p className="text-sm text-muted-foreground">Adding to {targetLabel} · tick items and set quantities</p>
      </SheetHeader>
      <div className="flex flex-col gap-3 px-4 pb-3">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search products" aria-label="Search products" className="pl-9" value={typed} onChange={(e) => setTyped(e.target.value)} />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{canFilter && !showAll ? prompt.categories.join(" · ") : "All products"}</span>
          {canFilter && (
            <button className="text-primary hover:underline" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Suggested only" : "Show all products"}
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto border-t border-border">
        {list.isError ? (
          <div role="alert" className="flex flex-col items-center gap-3 p-6 text-center">
            <p className="text-sm text-muted-foreground">We couldn&apos;t load the products.</p>
            <Button variant="outline" size="sm" onClick={() => list.refetch()}>
              Try again
            </Button>
          </div>
        ) : list.isPending ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Loading products…</p>
        ) : cards.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No products match.{canFilter && !showAll ? ' Try "Show all products".' : ""}</p>
        ) : (
          <>
            {cards.map((card) => (
              <PickerRow
                key={card.id}
                card={card}
                selected={selection[card.id]}
                onToggle={() => toggle(card)}
                onChange={(change) => setSelection((s) => (s[card.id] ? { ...s, [card.id]: { ...s[card.id], ...change } } : s))}
              />
            ))}
            {list.hasNextPage && (
              <div className="flex justify-center p-4">
                <Button variant="outline" size="sm" disabled={list.isFetchingNextPage} onClick={() => list.fetchNextPage()}>
                  {list.isFetchingNextPage ? "Loading…" : "Show more"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      <div className="border-t border-border p-4">
        <Button className="w-full" disabled={ids.length === 0 || adding} onClick={add}>
          {ids.length === 0 ? "Select products to add" : adding ? "Adding…" : `Add ${ids.length} selected`}
        </Button>
      </div>
    </>
  );
}

function PickerRow({ card, selected, onToggle, onChange }: { card: ProductCard; selected?: Selected; onToggle: () => void; onChange: (change: Partial<Selected>) => void }) {
  // The product's options are only fetched once it is ticked.
  const detail = useProduct(selected ? card.slug : undefined);
  const variants = useMemo(() => detail.data?.variants ?? [], [detail.data]);
  const variantId = selected?.variantId;

  useEffect(() => {
    if (selected && variants.length > 0 && variantId === undefined) onChange({ variantId: variants[0].id });
  }, [selected, variants, variantId, onChange]);

  return (
    <div className={cn("flex w-full flex-col gap-2 border-b border-border p-4 transition-colors", selected ? "bg-primary/5" : "hover:bg-secondary")}>
      <div className="flex items-center gap-3">
        <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={onToggle} aria-pressed={!!selected}>
          <span className={cn("flex size-5 shrink-0 items-center justify-center rounded border", selected ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
            {selected && <Check className="size-3" />}
          </span>
          <ProductThumb imageUrl={card.imageUrl} alt={card.name} className="size-14 shrink-0" />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm text-foreground">{card.name}</span>
            <span className="text-xs text-primary">
              {formatMoney(card.dailyRate)} {rateUnitLabel(card.rateType)}
            </span>
          </span>
        </button>
        {selected && (
          <NumberStepper size="sm" className="shrink-0" aria-label={`${card.name} ${quantityLabel(card.rateType).toLowerCase()}`} value={selected.quantity} onChange={(v) => onChange({ quantity: v })} />
        )}
      </div>
      {selected && variants.length > 0 && (
        <Select value={String(variantId ?? variants[0].id)} onValueChange={(v) => v && onChange({ variantId: Number(v) })}>
          <SelectTrigger className="h-8 w-full text-xs" aria-label={`${card.name} option`}>
            <SelectValue>{variants.find((v) => v.id === (variantId ?? variants[0].id))?.name}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {variants.map((v) => (
              <SelectItem key={v.id} value={String(v.id)}>
                {v.name} · {formatMoney(v.dailyRate)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {selected && card.rateType !== "QTY" && <p className="text-[11px] text-muted-foreground">{quantityLabel(card.rateType)}</p>}
    </div>
  );
}
