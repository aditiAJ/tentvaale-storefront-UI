"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listVenues, venueKeys } from "@/features/venues/api";
import { AddVenueDialog } from "@/features/venues/components/AddVenueDialog";

const NONE = "__none";
const ADD = "__add";

/** A dropdown of the customer's saved venues, with "Add a venue" at the end. */
export function VenueSelect({
  value,
  onChange,
  noneLabel = "No saved venue",
}: {
  value?: string;
  /** `text` is the venue's name and address, for a text field that should follow the choice. */
  onChange: (venueId: string, text: string) => void;
  noneLabel?: string;
}) {
  const venues = useQuery({ queryKey: venueKeys.all, queryFn: ({ signal }) => listVenues(signal) });
  const [adding, setAdding] = useState(false);
  const chosen = venues.data?.find((venue) => venue.id === value);

  return (
    <>
      <Select
        value={value || NONE}
        onValueChange={(next) => {
          if (next === null) return;
          if (next === ADD) {
            setAdding(true);
          } else if (next === NONE) {
            onChange("", "");
          } else {
            const venue = venues.data?.find((candidate) => candidate.id === next);
            onChange(next, venue ? `${venue.label}, ${venue.addressText}` : "");
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue>{chosen ? chosen.label : noneLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>{noneLabel}</SelectItem>
          {(venues.data ?? []).map((venue) => (
            <SelectItem key={venue.id} value={venue.id}>
              {venue.label}
            </SelectItem>
          ))}
          <SelectItem value={ADD}>Add a venue…</SelectItem>
        </SelectContent>
      </Select>
      <AddVenueDialog
        open={adding}
        onClose={() => setAdding(false)}
        onSaved={(venue) => onChange(venue.id, `${venue.label}, ${venue.addressText}`)}
      />
    </>
  );
}
