"use client";

import { Fragment, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FloatingList, useAnchoredPosition } from "@/components/floating-list";
import { cn } from "@/lib/utils";
import type { Venue } from "@/features/plans/types";
import { createVenue, listVenues, venueKeys } from "@/features/venues/api";
import { AddVenueDialog } from "@/features/venues/components/AddVenueDialog";
import { MAPS_KEY, type PlaceSuggestion } from "@/features/venues/maps";
import { usePlaceSuggestions } from "@/features/venues/usePlaceSuggestions";

const MAX_SAVED = 4;

type Row = { kind: "saved"; venue: Venue } | { kind: "place"; suggestion: PlaceSuggestion } | { kind: "add" };

/**
 * One field for a venue. Typing narrows the customer's saved venues into suggestions and, with a Google Maps key,
 * adds matching places from Google below them. Choosing a saved venue fills the field and links it; choosing a Google
 * place saves it as one of the customer's venues (with its map point) and links that. Typing something else is just
 * free text (no saved venue linked). "Add a venue" at the end of the list opens the form, pre-filled with what was typed.
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
  const queryClient = useQueryClient();
  const venues = useQuery({ queryKey: venueKeys.all, queryFn: ({ signal }) => listVenues(signal) });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const place = useAnchoredPosition(box, open, { maxHeight: 280 });
  // Google is asked only for typed text that is not already a chosen saved venue.
  const google = usePlaceSuggestions(value, open && !venueId);

  const typed = value.trim().toLowerCase();
  // Once a saved venue is chosen its text is in the field, so show every venue rather than only that one.
  const saved = (venues.data ?? [])
    .filter((venue) => venueId || !typed || `${venue.label} ${venue.addressText}`.toLowerCase().includes(typed))
    .slice(0, MAX_SAVED);
  const rows: Row[] = [
    ...saved.map((venue): Row => ({ kind: "saved", venue })),
    ...google.results.map((suggestion): Row => ({ kind: "place", suggestion })),
    { kind: "add" },
  ];
  const firstPlace = rows.findIndex((row) => row.kind === "place");

  async function choosePlace(suggestion: PlaceSuggestion) {
    setSaving(true);
    try {
      const picked = await google.pick(suggestion);
      const address = (picked.formattedAddress ?? picked.displayName ?? "").trim();
      const label = (picked.displayName ?? address.split(",")[0]).trim();
      if (!address || !label) throw new Error("The place has no address");
      const placeId = picked.id ?? null;
      let venue = placeId ? venues.data?.find((v) => v.placeId === placeId) : undefined;
      if (!venue) {
        venue = await createVenue({
          label: label.slice(0, 150),
          addressText: address.slice(0, 500),
          latitude: picked.location?.lat() ?? null,
          longitude: picked.location?.lng() ?? null,
          placeId,
        });
        void queryClient.invalidateQueries({ queryKey: venueKeys.all });
      }
      onChange(`${venue.label}, ${venue.addressText}`, venue.id);
    } catch (error) {
      // Google or the save failed: keep what the customer chose, as text, so nothing is lost.
      console.error("Could not use the chosen place", error);
      onChange(suggestion.placePrediction.text.text, "");
    } finally {
      setSaving(false);
    }
  }

  function choose(index: number) {
    const row = rows[index];
    setOpen(false);
    if (row.kind === "add") setAdding(true);
    else if (row.kind === "saved") onChange(`${row.venue.label}, ${row.venue.addressText}`, row.venue.id);
    else void choosePlace(row.suggestion);
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
        className={MAPS_KEY ? "pr-9" : undefined}
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
            setActive((active + 1) % rows.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((active + rows.length - 1) % rows.length);
          } else if (e.key === "Enter") {
            e.preventDefault();
            choose(Math.min(active, rows.length - 1));
          }
        }}
      />
      {saving || google.busy ? (
        <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden />
      ) : null}
      {place ? (
        // The frame keeps the input focused on mouse down, so the click lands before the blur closes the list.
        <FloatingList place={place}>
          <ul id={`${id}-suggestions`} role="listbox" className="min-h-0 flex-1 overflow-y-auto p-1">
            {rows.map((row, index) => {
              const selected = index === Math.min(active, rows.length - 1);
              const header =
                index === firstPlace ? (
                  <li role="presentation" className="flex items-center gap-1.5 px-2.5 pt-2 pb-1 text-xs text-muted-foreground">
                    <Search className="size-3" aria-hidden /> From Google Maps
                  </li>
                ) : null;
              if (row.kind === "add") {
                return (
                  <li
                    key="add"
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => choose(index)}
                    className={cn("flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-primary", selected && "bg-accent")}
                  >
                    <Plus className="size-4 shrink-0" aria-hidden />
                    {value.trim() && !venueId ? `Add “${value.trim()}” as a new venue` : "Add a venue"}
                  </li>
                );
              }
              const title = row.kind === "saved" ? row.venue.label : (row.suggestion.placePrediction.mainText?.text ?? row.suggestion.placePrediction.text.text);
              const sub = row.kind === "saved" ? row.venue.addressText : row.suggestion.placePrediction.secondaryText?.text;
              return (
                <Fragment key={row.kind === "saved" ? row.venue.id : row.suggestion.placePrediction.text.text}>
                {header}
                <li
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(index)}
                  className={cn("flex cursor-pointer items-start gap-2 rounded-md px-2.5 py-2 text-sm", selected && "bg-accent")}
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{title}</span>
                    {sub ? <span className="block truncate text-xs text-muted-foreground">{sub}</span> : null}
                  </span>
                </li>
                </Fragment>
              );
            })}
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
