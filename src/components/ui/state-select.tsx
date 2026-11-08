"use client";

import { Combobox } from "@base-ui/react/combobox";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { INDIAN_STATES, matchState, type IndianStateEntry } from "@/lib/indian-states";
import { cn } from "@/lib/utils";

/** All 36, A to Z. */
const ITEMS: readonly IndianStateEntry[] = [...INDIAN_STATES].sort((a, b) => a.name.localeCompare(b.name));

/** Every typed word must appear in the name, the abbreviation (GJ) or the GST code (24). */
function matches(state: IndianStateEntry, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = `${state.name} ${state.abbreviation} ${state.gstCode}`.toLowerCase();
  return words.every((word) => haystack.includes(word));
}

/**
 * What a form should start with for a saved value: the canonical name when it is a known state in any spelling, the
 * value as it was when it is not (so it can be shown and corrected, never silently dropped), and empty when none.
 */
export function initialState(saved: string | null | undefined): string {
  return matchState(saved)?.name ?? saved?.trim() ?? "";
}

/**
 * The one place a State or Union Territory is chosen: a searchable list of the 36, on Base UI's Combobox (the same
 * library as the other selects). Its list is drawn in a portal on the page, so a dialog or a short screen cannot clip
 * it; it opens by tap or click, narrows as you type, and works with the arrow keys, Enter and Escape.
 *
 * `value` is what the form holds: a canonical name, empty, or an old value nobody can read. An old value is not shown as
 * an empty box: a note says what was saved so the person can pick the right state (or clear it when optional).
 */
export function StateSelect({
  id,
  name,
  value,
  onChange,
  clearable = false,
  disabled,
  "aria-invalid": invalid,
}: {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  /** Optional fields can be emptied; required ones cannot. */
  clearable?: boolean;
  disabled?: boolean;
  "aria-invalid"?: boolean;
}) {
  const saved = value.trim();
  const matched = matchState(saved);
  const unreadable = saved !== "" && !matched;

  return (
    <div className="flex flex-col gap-1.5">
      <Combobox.Root
        items={ITEMS}
        value={matched}
        onValueChange={(next) => onChange(next?.name ?? "")}
        itemToStringLabel={(state) => state.name}
        itemToStringValue={(state) => state.name}
        isItemEqualToValue={(a, b) => a.name === b.name}
        filter={matches}
        name={name}
        disabled={disabled}
        autoHighlight
      >
        <div className="relative">
          <Combobox.Input
            id={id}
            placeholder="Select State"
            aria-invalid={invalid || unreadable || undefined}
            className={cn(
              "h-11 w-full min-w-0 rounded-lg border border-input bg-card py-2 pr-16 pl-3 text-sm outline-none",
              "placeholder:text-muted-foreground hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              "disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
            )}
          />
          <div className="absolute inset-y-0 right-1 flex items-center">
            {clearable && saved && !disabled ? (
              <button
                type="button"
                aria-label="Clear state"
                onClick={() => onChange("")}
                className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-4" />
              </button>
            ) : null}
            <Combobox.Trigger
              aria-label="Show the states"
              className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <ChevronDownIcon className="size-4" />
            </Combobox.Trigger>
          </div>
        </div>

        <Combobox.Portal>
          <Combobox.Positioner sideOffset={4} className="isolate z-50">
            <Combobox.Popup
              className={cn(
                "w-(--anchor-width) min-w-56 origin-(--transform-origin) overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-e3 ring-1 ring-foreground/10",
                "max-h-[min(18rem,var(--available-height))] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
              )}
            >
              <Combobox.Empty className="px-3 py-3 text-sm text-muted-foreground empty:hidden">No state matches that.</Combobox.Empty>
              <Combobox.List className="max-h-[min(18rem,var(--available-height))] overflow-y-auto p-1 [scroll-padding:0.25rem]">
                {(state: IndianStateEntry) => (
                  <Combobox.Item
                    key={state.name}
                    value={state}
                    className="relative flex min-h-10 cursor-default items-center gap-2 rounded-md py-2 pr-8 pl-2.5 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                  >
                    <span className="flex-1 truncate">{state.name}</span>
                    <span className="text-xs text-muted-foreground">{state.abbreviation}</span>
                    <Combobox.ItemIndicator className="absolute right-2 flex size-4 items-center justify-center">
                      <CheckIcon className="size-4" />
                    </Combobox.ItemIndicator>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>

      {unreadable ? (
        <p role="note" className="text-xs text-amber-700 dark:text-amber-400">
          Previously saved: “{saved}”. Please select the correct state{clearable ? " or clear it" : ""}.
        </p>
      ) : null}
    </div>
  );
}
