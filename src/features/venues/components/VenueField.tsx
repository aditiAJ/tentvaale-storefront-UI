"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FloatingList, useAnchoredPosition } from "@/components/floating-list";
import { cn } from "@/lib/utils";
import { listVenues, venueKeys } from "@/features/venues/api";
import { AddVenueDialog } from "@/features/venues/components/AddVenueDialog";

const MAX_SUGGESTIONS = 6;

/**
 * One field for a venue. Typing narrows the customer's saved venues into suggestions; choosing one fills
 * the field and links the saved venue. Typing something else is just free text (no saved venue linked).
 * "Add a venue" at the end of the list opens the form, pre-filled with what was typed.
 *
 * The suggestions are drawn by {@link FloatingList}, on the page body, so the dialog or scroll area the field sits in
 * cannot cut them off; they open upwards when there is no room below.
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
  const box = useRef<HTMLDivElement>(null);
  const place = useAnchoredPosition(box, open, { maxHeight: 240 });

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
    <div ref={box} className="relative">
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
      {place ? (
        // The frame keeps the input focused on mouse down, so the click lands before the blur closes the list.
        <FloatingList place={place}>
        <ul id={`${id}-suggestions`} role="listbox" className="min-h-0 flex-1 overflow-y-auto p-1">
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
        </FloatingList>
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
