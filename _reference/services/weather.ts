import AsyncStorage from "@react-native-async-storage/async-storage";

import { supabase } from "@/lib/supabase";
import type { KozycastHourlyForecastPoint, KozycastWeather, KozycastWeatherCondition, KozycastWeatherContext } from "@/types/weather";

/**
 * Weather provider: OpenWeather (Phase 31 §2). WeatherKit would need either
 * ejecting from the managed Expo Go workflow this whole project has run in
 * (native framework) or a server-signed JWT (REST API) — neither fits an
 * MVP with no backend yet, whereas OpenWeather is a plain HTTPS call. Only
 * this file and normalizeCondition/CONDITION_LABELS below know that —
 * nothing else in the app sees a provider-shaped response.
 */
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
// 5-day/3-hour forecast — same free tier as the current-weather endpoint
// above, no paid plan needed (Home's hourly strip, per user request for
// real rather than fabricated per-slot temperatures).
const OPENWEATHER_FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";
const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;

if (!OPENWEATHER_API_KEY) {
  console.warn(
    "[weather] EXPO_PUBLIC_OPENWEATHER_API_KEY is not set. Copy .env.example to .env and fill in an OpenWeather API key — weather requests will fail until then."
  );
}

export interface WeatherQuery {
  city: string;
  country?: string;
  coordinates?: { latitude: number; longitude: number };
}

const CONDITION_LABELS: Record<KozycastWeatherCondition, string> = {
  clear: "Clear",
  cloudy: "Cloudy",
  rain: "Rainy",
  snow: "Snowy",
  windy: "Windy",
  storm: "Stormy",
  fog: "Foggy",
  unknown: "Unknown",
};

// Beaufort 6 ("strong breeze"), in m/s — OpenWeather's `units=metric` wind speed unit.
const WINDY_THRESHOLD_MS = 10.8;

/**
 * OpenWeather condition-code ranges → Kozycast's fixed condition set (§6).
 * Codes per https://openweathermap.org/weather-conditions. The one place
 * this mapping happens — nothing else should branch on a raw provider code.
 * "windy" has no dedicated OpenWeather code (wind is a separate field), so
 * it's derived from actual wind speed, and only when it's the most salient
 * feature (a clear/cloudy sky, not an active storm) — using real provider
 * data, never inventing a condition the response doesn't support.
 */
function normalizeCondition(owmConditionId: number, windSpeedMs: number | undefined): KozycastWeatherCondition {
  let base: KozycastWeatherCondition;
  if (owmConditionId >= 200 && owmConditionId < 300) base = "storm";
  else if ((owmConditionId >= 300 && owmConditionId < 400) || (owmConditionId >= 500 && owmConditionId < 600)) base = "rain";
  else if (owmConditionId >= 600 && owmConditionId < 700) base = "snow";
  else if (owmConditionId >= 700 && owmConditionId < 800) base = "fog";
  else if (owmConditionId === 800) base = "clear";
  else if (owmConditionId > 800 && owmConditionId < 900) base = "cloudy";
  else base = "unknown";

  if ((base === "clear" || base === "cloudy") && windSpeedMs !== undefined && windSpeedMs >= WINDY_THRESHOLD_MS) {
    return "windy";
  }
  return base;
}

interface OpenWeatherResponse {
  weather: { id: number }[];
  main: { temp: number; temp_min: number; temp_max: number; humidity: number };
  wind?: { speed: number };
  sys: { sunrise: number; sunset: number; country?: string };
  dt: number;
}

async function fetchFromOpenWeather(query: WeatherQuery): Promise<OpenWeatherResponse> {
  if (!OPENWEATHER_API_KEY) throw new Error("Weather provider is not configured.");

  const params = new URLSearchParams({ appid: OPENWEATHER_API_KEY, units: "metric" });
  if (query.coordinates) {
    params.set("lat", String(query.coordinates.latitude));
    params.set("lon", String(query.coordinates.longitude));
  } else {
    // ponytail: city-name-only query, no ISO country-code mapping yet (profile
    // city/country are stored as full names, not codes) — add one if
    // city-name collisions turn out to matter.
    params.set("q", query.city);
  }

  const response = await fetch(`${OPENWEATHER_BASE_URL}?${params.toString()}`);
  if (!response.ok) throw new Error(`Weather request failed (${response.status}).`);
  return (await response.json()) as OpenWeatherResponse;
}

function normalizeWeather(raw: OpenWeatherResponse, city: string, country: string | undefined): KozycastWeather {
  const condition = normalizeCondition(raw.weather[0]?.id ?? -1, raw.wind?.speed);
  return {
    city,
    country: country ?? raw.sys.country,
    temperatureC: Math.round(raw.main.temp),
    temperatureMinC: Math.round(raw.main.temp_min),
    temperatureMaxC: Math.round(raw.main.temp_max),
    condition,
    conditionLabel: CONDITION_LABELS[condition],
    humidity: raw.main.humidity,
    sunrise: new Date(raw.sys.sunrise * 1000).toISOString(),
    sunset: new Date(raw.sys.sunset * 1000).toISOString(),
    timestamp: new Date(raw.dt * 1000).toISOString(),
  };
}

interface OpenWeatherForecastResponse {
  list: { dt: number; main: { temp: number }; weather: { id: number }[] }[];
}

async function fetchForecastFromOpenWeather(query: WeatherQuery): Promise<OpenWeatherForecastResponse> {
  if (!OPENWEATHER_API_KEY) throw new Error("Weather provider is not configured.");

  const params = new URLSearchParams({ appid: OPENWEATHER_API_KEY, units: "metric" });
  if (query.coordinates) {
    params.set("lat", String(query.coordinates.latitude));
    params.set("lon", String(query.coordinates.longitude));
  } else {
    params.set("q", query.city);
  }

  const response = await fetch(`${OPENWEATHER_FORECAST_URL}?${params.toString()}`);
  if (!response.ok) throw new Error(`Weather forecast request failed (${response.status}).`);
  return (await response.json()) as OpenWeatherForecastResponse;
}

/**
 * getHourlyForecast (Home's hourly strip, per user request) — the provider's
 * real 3-hour-step points, normalized the same way getCurrentWeather's
 * single reading is. No caching (unlike getCurrentWeather): this is one call
 * per Home load, well within the free tier, and forecast points go stale
 * faster than a current reading would anyway.
 */
export async function getHourlyForecast(query: WeatherQuery): Promise<KozycastHourlyForecastPoint[]> {
  const raw = await fetchForecastFromOpenWeather(query);
  return raw.list.map((entry) => ({
    timestamp: new Date(entry.dt * 1000).toISOString(),
    temperatureC: Math.round(entry.main.temp),
    condition: normalizeCondition(entry.weather[0]?.id ?? -1, undefined),
  }));
}

// Matches weather_cache's own default freshness window (supabase/migrations/20260921000000_initial_schema.sql).
const CACHE_FRESHNESS_MS = 60 * 60 * 1000;
const LOCAL_CACHE_STORAGE_KEY = "@kozycast/weather-cache";

interface LocalCacheEntry {
  locationKey: string;
  weather: KozycastWeather;
  cachedAt: number;
}

function locationKey(query: WeatherQuery): string {
  if (query.coordinates) {
    return `coords:${query.coordinates.latitude.toFixed(2)},${query.coordinates.longitude.toFixed(2)}`;
  }
  return `city:${query.city.toLowerCase()}|${(query.country ?? "").toLowerCase()}`;
}

async function readLocalCache(): Promise<LocalCacheEntry | null> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_CACHE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalCacheEntry) : null;
  } catch {
    return null;
  }
}

async function writeLocalCache(entry: LocalCacheEntry): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCAL_CACHE_STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // Best-effort — a failed cache write must not fail the weather fetch itself.
  }
}

function isKnownCondition(value: string | null): value is KozycastWeatherCondition {
  return !!value && value in CONDITION_LABELS;
}

/**
 * Opportunistic read of the shared Supabase weather_cache table (§9).
 * Writes are backend-only by design (see that table's RLS policy comment) —
 * no backend process populates it in this environment, so this will
 * realistically miss every time here, but the integration point is real:
 * once a backend job writes to it, this starts serving from it for free.
 */
async function readSharedCache(city: string, country: string | undefined): Promise<KozycastWeather | null> {
  if (!country) return null;
  try {
    const { data, error } = await supabase
      .from("weather_cache")
      .select("*")
      .eq("city", city)
      .eq("country", country)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    const condition: string | null = data?.weather_condition ?? null;
    if (error || !data || data.temperature_c === null || !isKnownCondition(condition)) return null;

    return {
      city: data.city,
      country: data.country,
      temperatureC: Number(data.temperature_c),
      condition,
      conditionLabel: CONDITION_LABELS[condition],
      humidity: data.humidity ?? 0,
      sunrise: data.sunrise ?? data.fetched_at,
      sunset: data.sunset ?? data.fetched_at,
      timestamp: data.fetched_at,
    };
  } catch {
    return null;
  }
}

/**
 * getCurrentWeather(location) (§2/§10): local cache → shared cache →
 * provider, in that order, each cheaper than the next. On a provider
 * failure, falls back to whatever's in the local cache regardless of its
 * age ("Use Recent / Default Context", docs/03-ia-and-flows.md) — only
 * throws when there's truly nothing to fall back to, which the caller
 * turns into the "Weather unavailable" state (§13).
 */
export async function getCurrentWeather(query: WeatherQuery): Promise<KozycastWeather> {
  const key = locationKey(query);
  const cached = await readLocalCache();
  if (cached && cached.locationKey === key && Date.now() - cached.cachedAt < CACHE_FRESHNESS_MS) {
    return cached.weather;
  }

  const shared = await readSharedCache(query.city, query.country);
  if (shared) {
    await writeLocalCache({ locationKey: key, weather: shared, cachedAt: Date.now() });
    return shared;
  }

  try {
    const raw = await fetchFromOpenWeather(query);
    const weather = normalizeWeather(raw, query.city, query.country);
    await writeLocalCache({ locationKey: key, weather, cachedAt: Date.now() });
    return weather;
  } catch (error) {
    if (cached) return cached.weather;
    throw error;
  }
}

const TEMPERATURE_THRESHOLDS_C = { cold: 10, mild: 19, warm: 27 } as const;

function temperatureTag(temperatureC: number): KozycastWeatherContext["temperatureTag"] {
  if (temperatureC < TEMPERATURE_THRESHOLDS_C.cold) return "Cold";
  if (temperatureC < TEMPERATURE_THRESHOLDS_C.mild) return "Mild";
  if (temperatureC < TEMPERATURE_THRESHOLDS_C.warm) return "Warm";
  return "Hot";
}

// Restricted to the app's own documented weather-tag vocabulary
// (docs/05-behavior.md) — conditions with no confident match suggest no tag.
const CONDITION_TO_WEATHER_TAG: Partial<Record<KozycastWeatherCondition, string>> = {
  clear: "Sunny",
  cloudy: "Cloudy",
  rain: "Rainy",
  snow: "Snowy",
};

/**
 * getKozycastWeatherContext (§8): deterministic weather+temperature → Kozycast
 * context labeling. Contextual suggestions only — not a recommendation
 * score, and never applied to a Food automatically (§16/§17).
 */
export function getKozycastWeatherContext(weather: KozycastWeather): KozycastWeatherContext {
  const temperature = temperatureTag(weather.temperatureC);
  const moodTags: string[] = [];
  if (weather.condition === "rain" || weather.condition === "snow" || temperature === "Cold") {
    moodTags.push("Cozy");
  }
  if (temperature === "Hot") {
    moodTags.push("Fresh", "Light");
  }

  return {
    weatherTag: CONDITION_TO_WEATHER_TAG[weather.condition] ?? null,
    temperatureTag: temperature,
    moodTags,
  };
}
