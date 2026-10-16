"use client";

import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Clock, X } from "lucide-react";
import { WheelColumn, Wheels, type WheelItem } from "@/components/date-wheel-picker";
import { cn } from "@/lib/utils";

/** The gap between the minutes on offer (decision D2, 2026-10-12). */
export const TIME_STEP_MINUTES = 15;

/** "19:00" -> "7:00 PM". */
export function formatClock(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

type Parts = { h: number; m: number; pm: boolean }; // h is 1-12

const pad = (n: number) => String(n).padStart(2, "0");
const toHHmm = ({ h, m, pm }: Parts) => `${pad((h % 12) + (pm ? 12 : 0))}:${pad(m)}`;
function fromHHmm(time?: string): Parts | null {
  const match = time?.match(/^(\d{2}):(\d{2})/);
  if (!match) return null;
  const h24 = +match[1];
  return { h: h24 % 12 || 12, m: +match[2], pm: h24 >= 12 };
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const STEP_MINUTES = Array.from({ length: 60 / TIME_STEP_MINUTES }, (_, i) => i * TIME_STEP_MINUTES);
// Used when the field is empty and nothing rules it out.
const DEFAULT_TIME = "10:00";

/**
 * App-wide time field, built like the date field: a button showing the time, opening three scroll wheels
 * (hour · minute · AM/PM). The value stays "HH:mm", the shape the backend already stores.
 *
 * Minutes come every 15. A time saved earlier off that step (say 19:05) is still shown and kept until the
 * customer picks another; it is never rounded for them. `after` disables the times at or before it, for an
 * end time. `optional` lets the customer clear the field.
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
  /** Shows a clear button so the customer can empty it. */
  optional?: boolean;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const saved = fromHHmm(value);
  const minutes = saved && !STEP_MINUTES.includes(saved.m) ? [...STEP_MINUTES, saved.m].sort((a, b) => a - b) : STEP_MINUTES;
  const allowed = (p: Parts) => !after || toHHmm(p) > after.slice(0, 5);

  // Keep the draft on an allowed time: if it falls at or before `after`, move to the first time after it.
  function normalise(p: Parts): Parts {
    if (allowed(p)) return p;
    for (const pm of [false, true])
      for (const h of HOURS)
        for (const m of minutes) if (allowed({ h, m, pm })) return { h, m, pm };
    return p;
  }
  const initialDraft = () => normalise(saved ?? fromHHmm(after && after.slice(0, 5) >= DEFAULT_TIME ? after : DEFAULT_TIME)!);
  const [draft, setDraft] = useState<Parts>(initialDraft);

  function handleOpenChange(next: boolean) {
    if (next) setDraft(initialDraft());
    setOpen(next);
  }
  const update = (patch: Partial<Parts>) => setDraft((p) => normalise({ ...p, ...patch }));

  const hours: WheelItem[] = HOURS.map((h) => ({ value: h, label: String(h), disabled: !minutes.some((m) => allowed({ h, m, pm: draft.pm })) }));
  const minuteItems: WheelItem[] = minutes.map((m) => ({ value: m, label: pad(m), disabled: !allowed({ ...draft, m }) }));
  const halves: WheelItem[] = [false, true].map((pm) => ({
    value: pm ? 1 : 0,
    label: pm ? "PM" : "AM",
    disabled: !HOURS.some((h) => minutes.some((m) => allowed({ h, m, pm }))),
  }));
  const canPick = allowed(draft);

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <div className="relative w-full">
        <Popover.Trigger
          id={id}
          type="button"
          aria-label={ariaLabel}
          className={cn(
            "flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-transparent pr-8 pl-3 text-left text-sm transition-colors outline-none hover:border-primary/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-[popup-open]:border-primary dark:bg-input/30",
            value ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <Clock className="size-4 shrink-0 text-primary" />
          <span className="truncate">{value ? formatClock(value) : placeholder}</span>
        </Popover.Trigger>
        {optional && value && (
          <button
            type="button"
            aria-label="Clear time"
            onClick={() => onChange("")}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} align="start" className="isolate z-[60]">
          <Popover.Popup className="w-64 origin-(--transform-origin) rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-xl outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0">
            <div className="grid grid-cols-3 px-1 pb-1 text-center text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              <span>Hours</span>
              <span>Minutes</span>
              <span>AM/PM</span>
            </div>
            <Wheels>
              <WheelColumn label="Hours" items={hours} selected={draft.h} onSelect={(h) => update({ h })} />
              <WheelColumn label="Minutes" items={minuteItems} selected={draft.m} onSelect={(m) => update({ m })} />
              <WheelColumn label="AM/PM" items={halves} selected={draft.pm ? 1 : 0} onSelect={(v) => update({ pm: v === 1 })} />
            </Wheels>
            <p className="mt-2 text-center text-sm text-foreground">{canPick ? formatClock(toHHmm(draft)) : "No time left after the start"}</p>
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                disabled={!canPick}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                onClick={() => {
                  onChange(toHHmm(draft));
                  setOpen(false);
                }}
              >
                Done
              </button>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
