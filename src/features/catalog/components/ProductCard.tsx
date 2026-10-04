"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Heart, Minus, Plus } from "lucide-react";
import { ProductThumb } from "@/components/product-thumb";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import { useMockStore } from "@/mock-data/store";
import { useActivePlanLine } from "@/features/plans/active";
import { usePlanActions } from "@/features/plans/hooks";
import { rateUnitShort } from "../format";
import { registerCard } from "../plan-bridge";
import type { ProductCard as ProductCardData } from "../types";


/**
 * Compact − qty + control shown in place of Add once the product is in a plan. Plain buttons, not
 * NumberStepper: that one captures the mouse wheel, which would hijack page scrolling while the
 * cursor crosses a card.
 */
function CardQty({ card, line }: { card: ProductCardData; line: NonNullable<ReturnType<typeof useActivePlanLine>> }) {
  const actions = usePlanActions(line.planId);
  const unit = card.rateType === "QTY" ? "" : ` ${rateUnitShort(card.rateType)}`;

  async function dec() {
    if (line.quantity <= 1) {
      if (await actions.removeItem(line.itemId)) toast(`Removed ${card.name} from ${line.planName}`);
    } else void actions.setQuantity(line.itemId, line.quantity - 1);
  }

  return (
    <div
      className="flex h-8 shrink-0 items-center overflow-hidden rounded-md border border-primary bg-primary/10 text-primary"
      title={`In ${line.planName}`}
    >
      <button onClick={dec} className="flex h-full w-7 items-center justify-center transition-colors hover:bg-primary hover:text-primary-foreground" aria-label={line.quantity <= 1 ? `Remove ${card.name} from plan` : `Decrease ${card.name}`}>
        <Minus className="size-3.5" />
      </button>
      <span className="min-w-7 px-1 text-center text-xs font-semibold tabular-nums" aria-live="polite">
        {line.quantity}
        {unit}
      </span>
      <button
        onClick={() => void actions.setQuantity(line.itemId, line.quantity + 1)}
        className="flex h-full w-7 items-center justify-center transition-colors hover:bg-primary hover:text-primary-foreground"
        aria-label={`Increase ${card.name}`}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

export function ProductCard({ card, onQuickAdd }: { card: ProductCardData; onQuickAdd: (card: ProductCardData) => void }) {
  const { currentAccount, wishlist, toggleWishlist } = useMockStore();
  const planId = String(card.id);
  const wishlisted = wishlist.includes(planId);
  const line = useActivePlanLine(card.id);
  const href = `/catalog/${card.slug}`;

  return (
    // h-full keeps cards in a grid row the same height. No lift on hover: the listing grid
    // deliberately stays still; the colour change is the affordance.
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-e1 transition-[box-shadow,border-color] duration-[260ms] ease-out-quint hover:glow hover:border-[var(--glow)]">
      <div className="relative overflow-hidden bg-muted/60">
        <Link href={href} className="block">
          <ProductThumb imageUrl={card.imageUrl} alt={card.name} className="aspect-[4/3] w-full rounded-none bg-transparent" />
        </Link>
        {currentAccount && (
          <button
            // No chip behind the icon; a drop-shadow keeps the glyph legible over pale photos.
            className="press absolute top-2 right-2 flex size-8 items-center justify-center rounded-md transition-colors duration-200 ease-out-quint"
            onClick={() => {
              if (!wishlisted) registerCard(card);
              toggleWishlist(planId);
            }}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={wishlisted}
          >
            <Heart
              className={cn(
                "size-4 [filter:drop-shadow(0_1px_2px_rgb(0_0_0/0.45))] transition-[transform,color,fill] duration-300 ease-out-quint",
                wishlisted ? "scale-110 fill-primary text-primary" : "text-white hover:text-primary",
              )}
            />
          </button>
        )}
      </div>

      <div className="flex flex-col px-3 pt-2.5 pb-3">
        <Link
          href={href}
          className="line-clamp-2 text-sm leading-5 font-medium text-foreground transition-colors duration-200 ease-out-quint group-hover:text-primary"
          title={card.name}
        >
          {card.name}
        </Link>

        <div className="mt-2 flex items-center justify-between gap-2">
          <Link href={href} className="min-w-0 truncate leading-none">
            <span className="font-serif text-base text-primary">{formatMoney(card.dailyRate)}</span>
            <span className="text-[11px] text-muted-foreground"> /{rateUnitShort(card.rateType)}</span>
          </Link>
          {line ? (
            <CardQty card={card} line={line} />
          ) : (
            <button
              onClick={() => onQuickAdd(card)}
              className="press inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-primary px-2.5 text-[11px] font-semibold tracking-wide text-primary uppercase transition-colors duration-200 ease-out-quint hover:bg-primary hover:text-primary-foreground focus-visible:bg-primary focus-visible:text-primary-foreground"
              aria-label={`Add ${card.name} to plan`}
            >
              <Plus className="size-3.5" strokeWidth={2.5} />
              Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
