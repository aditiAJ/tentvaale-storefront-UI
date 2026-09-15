"use client";

import { useEffect, useRef, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { CalendarDays, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatEventDate } from "@/mock-data/seed";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const ITEM_H = 36; // px per row
const VISIBLE = 5; // rows shown; the middle one is the selection

type Parts = { d: number; m: number; y: number }; // m is 0-11

const pad = (n: number) => String(n).padStart(2, "0");
const daysIn = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const toIso = ({ d, m, y }: Parts) => `${y}-${pad(m + 1)}-${pad(d)}`;
function fromIso(iso?: string): Parts | null {
  const match = iso?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? { y: +match[1], m: +match[2] - 1, d: +match[3] } : null;
}
function todayParts(): Parts {
  const t = new Date();
  return { d: t.getDate(), m: t.getMonth(), y: t.getFullYear() };
}
// Keep the day valid for the month and never earlier than `min`.
function normalise(p: Parts, min: Parts | null): Parts {
  let next = { ...p, d: Math.min(p.d, daysIn(p.y, p.m)) };
  if (min && toIso(next) < toIso(min)) next = { ...min };
  return next;
}

type WheelItem = { value: number; label: string; disabled?: boolean };

// One scroll-snapping column. Scroll, drag or click a row; the row that
// settles in the middle band is the selection.
function WheelColumn({ items, selected, onSelect, label }: { items: WheelItem[]; selected: number; onSelect: (v: number) => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const firstPaint = useRef(true);
  const index = Math.max(0, items.findIndex((i) => i.value === selected));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const top = index * ITEM_H;
    if (Math.abs(el.scrollTop - top) > 1) el.scrollTo({ top, behavior: firstPaint.current ? "auto" : "smooth" });
    firstPaint.current = false;
  }, [index, items.length]);

  useEffect(() => () => clearTimeout(settle.current), []);

  function onScroll() {
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const i = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM_H)));
      const item = items[i];
      if (item.disabled) el.scrollTo({ top: index * ITEM_H, behavior: "smooth" });
      else if (item.value !== selected) onSelect(item.value);
    }, 110);
  }

  return (
    <div className="relative flex-1">
      <div
        ref={ref}
        role="listbox"
        aria-label={label}
        tabIndex={0}
        onScroll={onScroll}
        onKeyDown={(e) => {
          if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
          e.preventDefault();
          const dir = e.key === "ArrowDown" ? 1 : -1;
          for (let i = index + dir; i >= 0 && i < items.length; i += dir) {
            if (!items[i].disabled) return onSelect(items[i].value);
          }
        }}
        className="relative z-10 snap-y snap-mandatory overflow-y-auto overscroll-contain outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-primary/40 [&::-webkit-scrollbar]:hidden"
        style={{ height: ITEM_H * VISIBLE, paddingBlock: ITEM_H * Math.floor(VISIBLE / 2) }}
      >
        {items.map((item, i) => (
          <button
            key={item.value}
            type="button"
            role="option"
            aria-selected={i === index}
            disabled={item.disabled}
            onClick={() => onSelect(item.value)}
            className={cn(
              "flex w-full snap-center items-center justify-center text-sm tabular-nums transition-colors",
              i === index ? "font-semibold text-primary" : Math.abs(i - index) === 1 ? "text-foreground/80" : "text-muted-foreground/60",
              item.disabled && "cursor-not-allowed line-through opacity-30",
            )}
            style={{ height: ITEM_H }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

type DateWheelPickerProps = {
  value: string; // "yyyy-mm-dd" or ""
  onChange: (value: string) => void;
  min?: string;
  id?: string;
  placeholder?: string;
  clearable?: boolean;
  className?: string;
};

// App-wide date field: a button showing the date, opening three scroll wheels
// (day · month · year). Values stay ISO yyyy-mm-dd, same as <input type="date">.
export function DateWheelPicker({ value, onChange, min, id, placeholder = "Select date", clearable = true, className }: DateWheelPickerProps) {
  const [open, setOpen] = useState(false);
  const minParts = fromIso(min);
  const [draft, setDraft] = useState<Parts>(() => normalise(fromIso(value) ?? todayParts(), minParts));

  function handleOpenChange(next: boolean) {
    if (next) setDraft(normalise(fromIso(value) ?? todayParts(), fromIso(min)));
    setOpen(next);
  }
  const update = (patch: Partial<Parts>) => setDraft((p) => normalise({ ...p, ...patch }, minParts));

  const thisYear = new Date().getFullYear();
  const firstYear = Math.min(minParts?.y ?? thisYear - 1, draft.y, thisYear - 1);
  const years: WheelItem[] = Array.from({ length: thisYear + 10 - firstYear + 1 }, (_, i) => {
    const y = firstYear + i;
    return { value: y, label: String(y), disabled: !!minParts && y < minParts.y };
  });
  const months: WheelItem[] = MONTHS.map((label, m) => ({
    value: m,
    label,
    disabled: !!minParts && (draft.y < minParts.y || (draft.y === minParts.y && m < minParts.m)),
  }));
  const days: WheelItem[] = Array.from({ length: daysIn(draft.y, draft.m) }, (_, i) => {
    const d = i + 1;
    return { value: d, label: pad(d), disabled: !!minParts && toIso({ d, m: draft.m, y: draft.y }) < toIso(minParts) };
  });

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <div className={cn("relative w-full", className)}>
        <Popover.Trigger
          id={id}
          type="button"
          className={cn(
            "flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-transparent pr-8 pl-3 text-left text-sm transition-colors outline-none hover:border-primary/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-[popup-open]:border-primary dark:bg-input/30",
            value ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <CalendarDays className="size-4 shrink-0 text-primary" />
          <span className="truncate">{value ? formatEventDate(value) : placeholder}</span>
        </Popover.Trigger>
        {clearable && value && (
          <button
            type="button"
            aria-label="Clear date"
            onClick={() => onChange("")}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} align="start" className="isolate z-[60]">
          <Popover.Popup className="w-72 origin-(--transform-origin) rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-xl outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0">
            <div className="grid grid-cols-3 px-1 pb-1 text-center text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              <span>Day</span>
              <span>Month</span>
              <span>Year</span>
            </div>
            <div className="relative flex gap-1">
              {/* selection band */}
              <div className="pointer-events-none absolute inset-x-0 rounded-lg border border-primary/40 bg-primary/10" style={{ top: ITEM_H * Math.floor(VISIBLE / 2), height: ITEM_H }} />
              {/* fade top/bottom */}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-14 bg-gradient-to-b from-popover to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-14 bg-gradient-to-t from-popover to-transparent" />
              <WheelColumn label="Day" items={days} selected={draft.d} onSelect={(d) => update({ d })} />
              <WheelColumn label="Month" items={months} selected={draft.m} onSelect={(m) => update({ m })} />
              <WheelColumn label="Year" items={years} selected={draft.y} onSelect={(y) => update({ y })} />
            </div>
            <p className="mt-2 text-center text-sm text-foreground">{formatEventDate(toIso(draft))}</p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                className="rounded-md px-2 py-1.5 text-xs text-primary hover:bg-primary/10"
                onClick={() => setDraft(normalise(todayParts(), minParts))}
              >
                Today
              </button>
              <div className="flex gap-2">
                <button type="button" className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  onClick={() => {
                    onChange(toIso(draft));
                    setOpen(false);
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
