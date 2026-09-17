"use client";

import { Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Colour choice for a product offered in several colours of the same design.
 *
 * Mirrors FabricPicker deliberately — same shape, same "undefined = standard"
 * rule — so the two choosers sitting next to each other on the product page
 * read as one control, not two conventions.
 *
 * Admin stores colour as one value per product row (`Master_Product.IDColor`),
 * so a colour here will eventually resolve to a sibling product rather than a
 * modifier on this one. `Master_Color` also carries an optional `ColorCode`
 * hex; until that reaches the storefront the swatches fall back to the name
 * map below, and to a neutral chip for anything unmapped.
 */
const SWATCH: Record<string, string> = {
  Ivory: "#F3EADA",
  White: "#FFFFFF",
  Gold: "#C9A227",
  Brass: "#B5893B",
  Silver: "#C0C4C9",
  Black: "#1B1815",
  Maroon: "#6E1F2A",
  Red: "#9B2226",
  Pink: "#E6A2B4",
  Yellow: "#E8C245",
  Mustard: "#C99A2E",
  Green: "#4A6B4A",
  Blue: "#2F4A6B",
  Brown: "#6B4A33",
  Natural: "#C8B79A",
  Clear: "transparent",
  Multicolour: "linear-gradient(135deg,#C9A227,#9B2226,#2F4A6B,#4A6B4A)",
};

export function ColourPicker({
  options,
  value,
  onChange,
}: {
  options: string[];
  value?: string;
  onChange: (colour: string | undefined) => void;
}) {
  // One colour is not a choice — the product simply is that colour.
  if (options.length < 2) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>Colour</Label>
        <span className="text-xs text-muted-foreground">{value ?? "As shown"}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {options.map((colour) => {
          const swatch = SWATCH[colour];
          const selected = value === colour;
          return (
            <button
              key={colour}
              type="button"
              onClick={() => onChange(selected ? undefined : colour)}
              aria-label={colour}
              aria-pressed={selected}
              title={colour}
              className={cn(
                "flex h-8 items-center gap-2 rounded-sm border px-2.5 text-xs transition-all duration-200 ease-out-quint",
                selected ? "glow border-primary bg-primary/15 text-primary" : "border-border text-foreground/80 hover:border-primary/50"
              )}
            >
              <span
                aria-hidden
                className="size-4 shrink-0 rounded-full ring-1 ring-foreground/20 ring-inset"
                style={swatch ? { background: swatch } : undefined}
              />
              {colour}
              {selected && <Check className="size-3" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
