"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Upholstery choice for Furniture, from the product's options in the shared
// fabric vocabulary. undefined = standard (as photographed).
export function FabricPicker({ options, value, onChange }: { options: string[]; value?: string; onChange: (fabric: string | undefined) => void }) {
  if (options.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>Upholstery fabric</Label>
        <span className="text-xs text-muted-foreground">{value ?? "Standard (as shown)"}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {[undefined, ...options].map((f) => (
          <button
            key={f ?? "standard"}
            type="button"
            onClick={() => onChange(f)}
            className={cn(
              "h-8 rounded-sm border px-3 text-xs transition-all",
              value === f ? "glow border-primary bg-primary/15 text-primary" : "border-border text-foreground/80 hover:border-primary/50",
            )}
          >
            {f ?? "Standard"}
          </button>
        ))}
      </div>
    </div>
  );
}
