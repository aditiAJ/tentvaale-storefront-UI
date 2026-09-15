"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type StepperProps = {
  min?: number;
  max?: number;
  step?: number;
  size?: "sm" | "md";
  id?: string;
  className?: string;
  "aria-label"?: string;
} & (
  | { optional?: false; value: number; onChange: (value: number) => void; placeholder?: never }
  | { optional: true; value: number | undefined; onChange: (value: number | undefined) => void; placeholder?: string }
);

// The one quantity control for the whole app: a number field with an up/down
// hint. Type a number, scroll the mouse wheel over it, use ↑/↓, or click the
// chevrons. Never goes
// below `min` (default 1). `optional` lets the field stay blank until touched.
export function NumberStepper(props: StepperProps) {
  const { min = 1, max, step = 1, size = "md", id, className } = props;
  const [draft, setDraft] = useState<string | null>(null); // text while typing
  const fieldRef = useRef<HTMLDivElement>(null);
  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min, Math.round(n)));

  const commit = (n: number | undefined) => {
    if (n !== undefined && !Number.isNaN(n)) props.onChange(clamp(n));
    else if (props.optional) props.onChange(undefined);
    else props.onChange(clamp(props.value)); // cleared a required field -> keep last valid value
  };
  const bump = (dir: 1 | -1) => commit(props.value === undefined ? min : props.value + dir * step);

  // Wheel-to-change needs a non-passive listener so the page doesn't scroll too.
  const bumpRef = useRef(bump);
  useEffect(() => {
    bumpRef.current = bump;
  });
  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      bumpRef.current(e.deltaY < 0 ? 1 : -1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const sm = size === "sm";
  const atMin = props.value !== undefined && props.value <= min;
  const atMax = max !== undefined && props.value !== undefined && props.value >= max;

  return (
    <div
      ref={fieldRef}
      title="Scroll or use ↑ ↓ to change"
      className={cn(
        "inline-flex cursor-ns-resize items-center overflow-hidden rounded-lg border border-border bg-background text-foreground transition-colors focus-within:border-primary hover:border-primary/50",
        sm ? "h-8" : "h-10",
        className,
      )}
    >
      <input
        id={id}
        type="text"
        inputMode="numeric"
        aria-label={props["aria-label"]}
        placeholder={props.optional ? props.placeholder : undefined}
        className={cn("h-full min-w-0 bg-transparent pl-2.5 text-left tabular-nums outline-none", sm ? "w-12 text-sm" : "w-20 text-base")}
        value={draft ?? (props.value === undefined ? "" : String(props.value))}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
        onBlur={() => {
          if (draft !== null) commit(draft === "" ? undefined : Number(draft));
          setDraft(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            setDraft(null);
            bump(e.key === "ArrowUp" ? 1 : -1);
          }
        }}
      />
      {/* Up/down hint — also clickable, top half +1, bottom half −1 */}
      <span className={cn("flex h-full flex-col text-muted-foreground", sm ? "w-5" : "w-6")}>
        <button type="button" tabIndex={-1} aria-label="Increase" disabled={atMax} onClick={() => bump(1)} className="flex flex-1 items-end justify-center hover:text-primary disabled:opacity-30">
          <ChevronUp className={sm ? "size-3" : "size-3.5"} />
        </button>
        <button type="button" tabIndex={-1} aria-label="Decrease" disabled={atMin} onClick={() => bump(-1)} className="flex flex-1 items-start justify-center hover:text-primary disabled:opacity-30">
          <ChevronDown className={sm ? "size-3" : "size-3.5"} />
        </button>
      </span>
    </div>
  );
}
