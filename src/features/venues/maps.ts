/**
 * Google Maps, loaded only when a key is configured (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY). Without one the
 * venue forms are text only. Place search uses the Places API (New); the small map in the venue form uses the
 * Maps library. Just the few calls the venue pickers use are typed here.
 */
export interface LatLng {
  lat: number;
  lng: number;
}

interface AddressComponent {
  longText: string | null;
  types: string[];
}

export interface Place {
  id?: string | null;
  location?: { lat(): number; lng(): number } | null;
  formattedAddress?: string | null;
  displayName?: string | null;
  addressComponents?: AddressComponent[] | null;
  fetchFields(options: { fields: string[] }): Promise<unknown>;
}

/** One line of the place search: what to show, and the place it stands for. */
export interface PlaceSuggestion {
  placePrediction: {
    text: { text: string };
    mainText?: { text: string } | null;
    secondaryText?: { text: string } | null;
    toPlace(): Place;
  };
}

interface PlacesLibrary {
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions(request: {
      input: string;
      sessionToken?: unknown;
      includedRegionCodes?: string[];
    }): Promise<{ suggestions: PlaceSuggestion[] }>;
  };
  AutocompleteSessionToken: new () => unknown;
}

export interface MapView {
  setCenter(p: LatLng): void;
  setZoom(z: number): void;
}

export interface MapMarker {
  setPosition(p: LatLng): void;
  addListener(event: string, handler: () => void): void;
  getPosition(): { lat(): number; lng(): number } | undefined | null;
}

interface MapLibrary {
  Map: new (el: HTMLElement, options: { center: LatLng; zoom: number }) => MapView;
}

interface MarkerLibrary {
  Marker: new (options: { position: LatLng; map: unknown; draggable?: boolean }) => MapMarker;
}

interface GoogleMaps {
  importLibrary(name: "places"): Promise<PlacesLibrary>;
  importLibrary(name: "maps"): Promise<MapLibrary>;
  importLibrary(name: "marker"): Promise<MarkerLibrary>;
}

declare global {
  interface Window {
    google?: { maps?: GoogleMaps };
  }
}

export const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

let loading: Promise<GoogleMaps> | null = null;

function loadMaps(): Promise<GoogleMaps> {
  if (typeof window === "undefined" || !MAPS_KEY) return Promise.reject(new Error("Maps is not configured"));
  loading ??= new Promise<GoogleMaps>((resolve, reject) => {
    if (window.google?.maps?.importLibrary) return resolve(window.google.maps);
    // With loading=async the script's own load event fires before google.maps.importLibrary exists; Google's
    // callback fires when it is ready.
    const callback = "__tentvaaleMapsReady";
    (window as unknown as Record<string, () => void>)[callback] = () => {
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error("Maps did not load"));
    };
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(MAPS_KEY)}&loading=async&v=weekly&callback=${callback}`;
    script.async = true;
    script.onerror = () => reject(new Error("Maps could not be loaded"));
    document.head.appendChild(script);
  }).catch((error) => {
    loading = null;
    throw error;
  });
  return loading;
}

export const loadPlaces = () => loadMaps().then((maps) => maps.importLibrary("places"));

/** The map and its draggable marker, for the venue form. */
export async function loadMapKit(): Promise<{ Map: MapLibrary["Map"]; Marker: MarkerLibrary["Marker"] }> {
  const maps = await loadMaps();
  const [{ Map }, { Marker }] = await Promise.all([maps.importLibrary("maps"), maps.importLibrary("marker")]);
  return { Map, Marker };
}

/** A venue as one line: its name and address, without repeating the name when the address already starts with it. */
export function describePlace(place: Place): string {
  const name = place.displayName?.trim();
  const address = place.formattedAddress?.trim();
  if (name && address && !address.toLowerCase().startsWith(name.toLowerCase())) return `${name}, ${address}`;
  return address || name || "";
}
