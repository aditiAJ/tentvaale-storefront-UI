import { apiFetch } from "@/services/api-client";
import type { Venue } from "@/features/plans/types";

/** The customer's saved venues. Only the owner sees or uses them. */
export interface VenueInput {
  label: string;
  addressText: string;
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string | null;
  accessNotes?: string | null;
}

export const listVenues = (signal?: AbortSignal) => apiFetch<Venue[]>("storefront/venues", { signal });
export const createVenue = (input: VenueInput) => apiFetch<Venue>("storefront/venues", { method: "POST", body: input });
export const updateVenue = (venueId: string, input: VenueInput) =>
  apiFetch<Venue>(`storefront/venues/${venueId}`, { method: "PUT", body: input });
export const deleteVenue = (venueId: string) => apiFetch<void>(`storefront/venues/${venueId}`, { method: "DELETE" });

export const venueKeys = { all: ["venues"] as const };
