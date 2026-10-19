"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { listVenues, venueKeys } from "@/features/venues/api";
import { AddVenueDialog } from "@/features/venues/components/AddVenueDialog";

const MAX_SUGGESTIONS = 6;

/**
 * One field for a venue. Typing narrows the customer's saved venues into suggestions; choosing one fills
 * the field and links the saved venue. Typing something else is just free text (no saved venue linked).
 * "Add a venue" at the end of the list opens the form, pre-filled with what was typed.
 */
export function VenueField({
  id,
  value,
  venueId,
  onChange,
  placeholder,
}: {
  id: string;
  /** The text shown in the field. */
  value: string;
  /** The saved venue the text came from; empty once the customer types over it. */
  venueId?: string;
  onChange: (text: string, venueId: string) => void;
  placeholder?: string;
}) {
  const venues = useQuery({ queryKey: venueKeys.all, queryFn: ({ signal }) => listVenues(signal) });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [adding, setAdding] = useState(false);

  const typed = value.trim().toLowerCase();
  // Once a saved venue is chosen its text is in the field, so show every venue rather than only that one.
  const matches = (venues.data ?? [])
    .filter((venue) => venueId || !typed || `${venue.label} ${venue.addressText}`.toLowerCase().includes(typed))
    .slice(0, MAX_SUGGESTIONS);
  const ADD = matches.length; // the last row, "Add a venue"

  function choose(index: number) {
    if (index === ADD) {
      setAdding(true);
    } else {
      const venue = matches[index];
      onChange(`${venue.label}, ${venue.addressText}`, venue.id);
    }
    setOpen(false);
  }

  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-suggestions`}
        onChange={(e) => {
          onChange(e.target.value, "");
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (!open && e.key === "ArrowDown") setOpen(true);
          if (!open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((active + 1) % (matches.length + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((active + matches.length) % (matches.length + 1));
          } else if (e.key === "Enter") {
            e.preventDefault();
            choose(Math.min(active, ADD));
          }
        }}
      />
      {open ? (
        // onMouseDown keeps the input focused, so the click lands before the blur closes the list.
        <ul
          id={`${id}-suggestions`}
          role="listbox"
          onMouseDown={(e) => e.preventDefault()}
          className="absolute inset-x-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          {matches.map((venue, index) => (
            <li
              key={venue.id}
              role="option"
              aria-selected={index === active}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(index)}
              className={cn("flex cursor-pointer items-start gap-2 rounded-md px-2.5 py-2 text-sm", index === active && "bg-accent")}
            >
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0">
                <span className="block truncate font-medium">{venue.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{venue.addressText}</span>
              </span>
            </li>
          ))}
          <li
            role="option"
            aria-selected={active === ADD}
            onMouseEnter={() => setActive(ADD)}
            onClick={() => choose(ADD)}
            className={cn("flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-primary", active === ADD && "bg-accent")}
          >
            <Plus className="size-4 shrink-0" aria-hidden />
            {value.trim() && !venueId ? `Add “${value.trim()}” as a new venue` : "Add a venue"}
          </li>
        </ul>
      ) : null}
      {adding ? (
        <AddVenueDialog
          open
          initialLabel={venueId ? "" : value.trim()}
          onClose={() => setAdding(false)}
          onSaved={(venue) => onChange(`${venue.label}, ${venue.addressText}`, venue.id)}
        />
      ) : null}
    </div>
  );
}
