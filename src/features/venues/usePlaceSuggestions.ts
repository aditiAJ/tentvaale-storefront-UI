"use client";

import { useEffect, useRef, useState } from "react";
import { MAPS_KEY, loadPlaces, type Place, type PlaceSuggestion } from "@/features/venues/maps";

const MIN_CHARS = 3;
const WAIT_MS = 250;

/**
 * Google place suggestions for what is typed: one search at a time, after the typing pauses, and an answer that
 * arrives after a newer one was asked for is dropped. Without a key (or while `active` is false) it offers nothing.
 * `pick` loads the details of the chosen suggestion and ends the billing session, so the next search starts a new one.
 */
export function usePlaceSuggestions(query: string, active = true) {
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const latest = useRef(0);
  const session = useRef<unknown>(undefined);
  const text = query.trim();
  const eligible = Boolean(MAPS_KEY) && active && text.length >= MIN_CHARS;

  useEffect(() => {
    if (!eligible) return;
    const ask = ++latest.current;
    const timer = setTimeout(async () => {
      setBusy(true);
      try {
        const { AutocompleteSuggestion, AutocompleteSessionToken } = await loadPlaces();
        session.current ??= new AutocompleteSessionToken();
        const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: text,
          sessionToken: session.current,
          includedRegionCodes: ["in"],
        });
        if (ask !== latest.current) return;
        setResults(suggestions.slice(0, 5));
        setUnavailable(false);
      } catch (error) {
        console.error("Google Places search failed", error);
        if (ask === latest.current) setUnavailable(true);
      } finally {
        if (ask === latest.current) setBusy(false);
      }
    }, WAIT_MS);
    return () => clearTimeout(timer);
  }, [eligible, text]);

  async function pick(suggestion: PlaceSuggestion): Promise<Place> {
    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({ fields: ["id", "location", "displayName", "formattedAddress", "addressComponents"] });
      return place;
    } finally {
      session.current = undefined;
    }
  }

  return { results: eligible ? results : [], busy: eligible && busy, unavailable: eligible && unavailable, pick };
}
