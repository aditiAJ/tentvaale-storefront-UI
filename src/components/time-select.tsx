"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** The gap between the times on offer, in minutes (decision D2, 2026-10-12). */
export const TIME_STEP_MINUTES = 15;

const NONE = "__none";

/** "19:00" -> "7:00 PM". */
export function formatClock(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

const SLOTS: string[] = Array.from({ length: (24 * 60) / TIME_STEP_MINUTES }, (_, i) => {
  const minutes = i * TIME_STEP_MINUTES;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

/**
 * One list of times, every 15 minutes, instead of the browser's clock. The value stays "HH:mm", the shape the
 * backend already stores, so nothing about a saved time changes.
 *
 * A time saved earlier that is not on the list (say 19:05) is still shown and kept until the customer picks
 * another; it is never rounded for them. `after` hides the times at or before it, for an end time.
 */
export function TimeSelect({
  id,
  value,
  onChange,
  after,
  placeholder = "Select time",
  optional = false,
  "aria-label": ariaLabel,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  after?: string;
  placeholder?: string;
  /** Adds a "No end time" entry so the customer can clear it. */
  optional?: boolean;
  "aria-label"?: string;
}) {
  const slots = SLOTS.filter((t) => !after || t > after);
  const options = value && !slots.includes(value) ? [value, ...slots].sort() : slots;

  return (
    <Select value={value || NONE} onValueChange={(next) => next !== null && onChange(next === NONE ? "" : next)}>
      <SelectTrigger id={id} aria-label={ariaLabel} className="w-full">
        <SelectValue>{value ? formatClock(value) : <span className="text-muted-foreground">{placeholder}</span>}</SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="max-h-64">
        {optional ? <SelectItem value={NONE}>No end time</SelectItem> : null}
        {options.map((t) => (
          <SelectItem key={t} value={t}>
            {formatClock(t)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
