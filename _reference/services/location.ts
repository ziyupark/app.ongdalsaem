import * as Location from "expo-location";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ReverseGeocodedPlace {
  city: string;
  country?: string;
}

/**
 * Device location for weather purposes only (Phase 31 §4). Returns null —
 * never throws — for every "no location" outcome (undetermined-then-denied,
 * services off, a lookup error): the caller's existing manual city fallback
 * is the expected path here, not an exceptional one. Only prompts when
 * permission is genuinely undetermined, so a prior denial is never re-asked
 * (§4's "do not repeatedly request permission").
 */
export async function getDeviceLocation(): Promise<Coordinates | null> {
  try {
    const existing = await Location.getForegroundPermissionsAsync();
    let status = existing.status;
    if (status === Location.PermissionStatus.UNDETERMINED) {
      status = (await Location.requestForegroundPermissionsAsync()).status;
    }
    if (status !== Location.PermissionStatus.GRANTED) return null;
    if (!(await Location.hasServicesEnabledAsync())) return null;

    // City-level precision is all weather needs — also keeps us well clear
    // of "don't expose exact location" (§21).
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch {
    return null;
  }
}

/** Coordinates → city/country only — never surface raw coordinates to the UI or persist them (§21). */
export async function reverseGeocodeCity(coordinates: Coordinates): Promise<ReverseGeocodedPlace | null> {
  try {
    const [place] = await Location.reverseGeocodeAsync(coordinates);
    const city = place?.city ?? place?.subregion ?? place?.region;
    if (!city) return null;
    return { city, country: place?.country ?? undefined };
  } catch {
    return null;
  }
}

// City name → approximate coordinates, cached in memory — a handful of
// distinct city names recur across many Foods and across repeated Discover
// loads, so this avoids re-geocoding the same city over and over. City-level
// only (never a per-Food exact address), matching how `foods.city` is
// already stored — this doesn't add any new precise-location data, just
// computes a distance from names that were already public.
const cityCoordinateCache = new Map<string, Coordinates | null>();

export async function geocodeCity(city: string, country?: string): Promise<Coordinates | null> {
  const key = `${city.toLowerCase()}|${(country ?? "").toLowerCase()}`;
  if (cityCoordinateCache.has(key)) return cityCoordinateCache.get(key) ?? null;

  let result: Coordinates | null = null;
  try {
    const [match] = await Location.geocodeAsync(country ? `${city}, ${country}` : city);
    if (match) result = { latitude: match.latitude, longitude: match.longitude };
  } catch {
    result = null;
  }
  cityCoordinateCache.set(key, result);
  return result;
}

// Same OpenWeather account/key services/weather.ts already uses — its
// Geocoding API (not the Weather API) returns named, disambiguated matches
// for a typed query, which expo-location's geocodeAsync doesn't (coordinates
// only). Backs Discover Nearby's "Change City" sheet.
const OPENWEATHER_GEOCODING_URL = "https://api.openweathermap.org/geo/1.0/direct";
const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;

export interface CitySearchResult {
  city: string;
  country: string;
  state?: string;
  coordinates: Coordinates;
}

interface OpenWeatherGeocodingEntry {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

export async function searchCities(query: string): Promise<CitySearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  if (!OPENWEATHER_API_KEY) throw new Error("City search is not configured.");

  const params = new URLSearchParams({ q: trimmed, limit: "8", appid: OPENWEATHER_API_KEY });
  const response = await fetch(`${OPENWEATHER_GEOCODING_URL}?${params.toString()}`);
  if (!response.ok) throw new Error(`City search failed (${response.status}).`);

  const entries = (await response.json()) as OpenWeatherGeocodingEntry[];
  return entries.map((entry) => ({
    city: entry.name,
    country: entry.country,
    state: entry.state,
    coordinates: { latitude: entry.lat, longitude: entry.lon },
  }));
}

/** Great-circle distance in km between two points (Haversine) — city-level precision, not for exact addresses. */
export function distanceKm(a: Coordinates, b: Coordinates): number {
  const EARTH_RADIUS_KM = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}
