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
import { MAPS_KEY, loadMaps } from "@/features/venues/maps";

/**
 * Saves a venue. With a Google Maps key the customer searches a place, sees it on a map and can
 * drag the marker; without one it is a name and an address. Either way the text address is kept.
 */
export function AddVenueDialog({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (venue: Venue) => void;
}) {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // The map and search box need their elements, which exist once the dialog has rendered them.
  useEffect(() => {
    if (!open || !MAPS_KEY) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      void loadMaps()
        .then((maps) => {
          if (cancelled || !searchRef.current || !mapRef.current) return;
          const start = { lat: 22.3072, lng: 73.1812 };
          const map = new maps.Map(mapRef.current, { center: start, zoom: 12 });
          const marker = new maps.Marker({ position: start, map, draggable: true });
          marker.addListener("dragend", () => {
            const position = marker.getPosition();
            if (position) setPoint({ lat: position.lat(), lng: position.lng() });
          });
          const search = new maps.places.Autocomplete(searchRef.current, {
            fields: ["place_id", "formatted_address", "name", "geometry"],
          });
          search.addListener("place_changed", () => {
            const place = search.getPlace();
            const location = place.geometry?.location;
            if (!location) return;
            const next = { lat: location.lat(), lng: location.lng() };
            map.setCenter(next);
            map.setZoom(16);
            marker.setPosition(next);
            setPoint(next);
            setPlaceId(place.place_id ?? null);
            setAddress((current) => place.formatted_address ?? current);
            setLabel((current) => current || place.name || "");
          });
        })
        .catch(() => undefined);
    }, 50);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open]);

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
              <Input id="venue-search" ref={searchRef} placeholder="Search a place or address" />
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
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
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
