"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/services/api-client";
import type { Venue } from "@/features/plans/types";
import { createVenue, venueKeys } from "@/features/venues/api";
import { PlaceSearch } from "@/features/venues/components/PlaceSearch";
import { MAPS_KEY, loadMapKit, type MapMarker, type MapView, type Place } from "@/features/venues/maps";
import { InlineError } from "@/components/inline-error";

/**
 * Saves a venue. With a Google Maps key the customer searches a place, sees it on a map and can
 * drag the marker; without one it is a name and an address. Either way the text address is kept.
 */
export function AddVenueDialog({
  open,
  onClose,
  onSaved,
  initialLabel = "",
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (venue: Venue) => void;
  /** What the customer already typed, so they do not type the venue's name twice. Read when the dialog is mounted. */
  initialLabel?: string;
}) {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState(initialLabel);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const view = useRef<{ map: MapView; marker: MapMarker } | null>(null);

  // The map needs its element, which exists once the dialog has rendered it.
  useEffect(() => {
    if (!open || !MAPS_KEY) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      void loadMapKit()
        .then(({ Map, Marker }) => {
          if (cancelled || !mapRef.current) return;
          const start = { lat: 22.3072, lng: 73.1812 };
          const map = new Map(mapRef.current, { center: start, zoom: 12 });
          const marker = new Marker({ position: start, map, draggable: true });
          marker.addListener("dragend", () => {
            const position = marker.getPosition();
            if (position) setPoint({ lat: position.lat(), lng: position.lng() });
          });
          view.current = { map, marker };
        })
        .catch(() => undefined);
    }, 50);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open]);

  // A picked place fills the address and the name (if empty), and moves the map and its marker to it.
  function fillFrom(place: Place) {
    const found = place.formattedAddress ?? place.displayName;
    if (found) setAddress(found.slice(0, 500));
    if (place.displayName) setLabel((current) => current || place.displayName!.slice(0, 150));
    setPlaceId(place.id ?? null);
    if (!place.location) return;
    const next = { lat: place.location.lat(), lng: place.location.lng() };
    setPoint(next);
    view.current?.map.setCenter(next);
    view.current?.map.setZoom(16);
    view.current?.marker.setPosition(next);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const venue = await createVenue({
        label: label.trim(),
        addressText: address.trim(),
        latitude: point?.lat ?? null,
        longitude: point?.lng ?? null,
        placeId,
        accessNotes: notes.trim() || null,
      });
      await queryClient.invalidateQueries({ queryKey: venueKeys.all });
      toast.success(`${venue.label} saved`);
      onSaved(venue);
      setLabel("");
      setAddress("");
      setNotes("");
      setPoint(null);
      setPlaceId(null);
      onClose();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "We couldn't save that venue. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a venue</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {MAPS_KEY ? (
            <div className="space-y-2">
              <Label htmlFor="venue-search">Search on the map</Label>
              <PlaceSearch id="venue-search" onPick={fillFrom} />
              <div ref={mapRef} className="h-48 w-full rounded-lg border border-border bg-muted" />
              <p className="text-xs text-muted-foreground">Drag the marker to the exact spot.</p>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="venue-label">Name *</Label>
            <Input id="venue-label" placeholder="Palace Grounds" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue-address">Address *</Label>
            <Input id="venue-address" placeholder="Race Course Road, Vadodara" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue-notes">Access notes</Label>
            <Input id="venue-notes" placeholder="Gate, parking, lift..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error ? <InlineError>{error}</InlineError> : null}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || !label.trim() || !address.trim()}>
              {saving ? "Saving…" : "Save venue"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
