/**
 * Google Maps, loaded only when a key is configured (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY). Without one the
 * venue form is text only. Just the few calls the venue picker uses are typed here.
 */
export interface LatLng {
  lat: number;
  lng: number;
}

interface PlaceResult {
  place_id?: string;
  formatted_address?: string;
  name?: string;
  geometry?: { location?: { lat(): number; lng(): number } };
}

interface MapsApi {
  Map: new (el: HTMLElement, options: { center: LatLng; zoom: number }) => { setCenter(p: LatLng): void; setZoom(z: number): void };
  Marker: new (options: { position: LatLng; map: unknown; draggable?: boolean }) => {
    setPosition(p: LatLng): void;
    addListener(event: string, handler: () => void): void;
    getPosition(): { lat(): number; lng(): number } | undefined;
  };
  places: {
    Autocomplete: new (input: HTMLInputElement, options?: { fields?: string[] }) => {
      addListener(event: string, handler: () => void): void;
      getPlace(): PlaceResult;
    };
  };
}

declare global {
  interface Window {
    google?: { maps?: MapsApi };
  }
}

export type { PlaceResult, MapsApi };

export const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

let loading: Promise<MapsApi> | null = null;

export function loadMaps(): Promise<MapsApi> {
  if (typeof window === "undefined" || !MAPS_KEY) return Promise.reject(new Error("Maps is not configured"));
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  loading ??= new Promise<MapsApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(MAPS_KEY)}&libraries=places`;
    script.async = true;
    script.onload = () => (window.google?.maps ? resolve(window.google.maps) : reject(new Error("Maps did not load")));
    script.onerror = () => reject(new Error("Maps could not be loaded"));
    document.head.appendChild(script);
  });
  return loading;
}
