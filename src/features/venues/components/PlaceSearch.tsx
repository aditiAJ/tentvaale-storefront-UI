"use client";

import { useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FloatingList, useAnchoredPosition } from "@/components/floating-list";
import { cn } from "@/lib/utils";
import { type Place, type PlaceSuggestion } from "@/features/venues/maps";
import { usePlaceSuggestions } from "@/features/venues/usePlaceSuggestions";

/**
 * A place search over Google, drawn with the app's own input and list. Typing offers matching places; picking one
 * hands back the place with its address and position loaded. If Google cannot be reached it says so and the form's
 * own fields still work. Render it only when a Maps key is configured.
 */
export function PlaceSearch({
  id,
  onPick,
  placeholder = "Search a place or address",
}: {
  id?: string;
  onPick: (place: Place) => void | Promise<void>;
  placeholder?: string;
}) {
  const row = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [picking, setPicking] = useState(false);
  const [failed, setFailed] = useState(false);
  const places = usePlaceSuggestions(query);

  async function choose(suggestion: PlaceSuggestion) {
    setOpen(false);
    setQuery(suggestion.placePrediction.text.text);
    setPicking(true);
    try {
      await onPick(await places.pick(suggestion));
      setFailed(false);
    } catch (error) {
      console.error("Google Places details failed", error);
      setFailed(true);
    } finally {
      setPicking(false);
    }
  }

  const results = places.results;
  const showList = open && results.length > 0;
  // Drawn on the page body, so the dialog around the box cannot cut it off; opens upwards when there is no room below.
  const place = useAnchoredPosition(row, showList, { maxHeight: 256 });

  return (
    <div>
      <div ref={row} className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          id={id}
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls={id ? `${id}-places` : undefined}
          className="pr-9 pl-9"
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && showList) {
              e.stopPropagation(); // closes the list, not the dialog around it
              setOpen(false);
            } else if (showList && e.key === "ArrowDown") {
              e.preventDefault();
              setActive((active + 1) % results.length);
            } else if (showList && e.key === "ArrowUp") {
              e.preventDefault();
              setActive((active + results.length - 1) % results.length);
            } else if (e.key === "Enter" && showList) {
              e.preventDefault(); // never submits the form
              void choose(results[Math.min(active, results.length - 1)]);
            }
          }}
        />
        {places.busy || picking ? (
          <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden />
        ) : null}
        {place ? (
          // The frame keeps the box focused on mouse down, so the click lands before the blur closes the list.
          <FloatingList place={place}>
            <ul id={id ? `${id}-places` : undefined} role="listbox" className="min-h-0 flex-1 overflow-y-auto p-1">
              {results.map((suggestion, index) => {
                const { text, mainText, secondaryText } = suggestion.placePrediction;
                return (
                  <li
                    key={text.text}
                    role="option"
                    aria-selected={index === active}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => void choose(suggestion)}
                    className={cn("flex cursor-pointer items-start gap-2 rounded-md px-2.5 py-2 text-sm", index === active && "bg-accent")}
                  >
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{mainText?.text ?? text.text}</span>
                      {secondaryText?.text ? <span className="block truncate text-xs text-muted-foreground">{secondaryText.text}</span> : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          </FloatingList>
        ) : null}
      </div>
      {places.unavailable || failed ? (
        <p className="mt-1.5 text-xs text-muted-foreground">Google search is not available right now. Type the address below instead.</p>
      ) : null}
    </div>
  );
}
