import { roundCoord } from './location';
// Current weather → Weather Mood (docs/01-foundations.md §2.4 판정 기준 · 우선순위). Provider = OpenWeather,
// called through the `weather` Edge Function so the API key stays on the server.
import { supabase } from '../lib/supabase';
import type { Weather3DKey, WeatherMood } from '../theme';
import type { Coordinates } from './location';

type Where = Coordinates | { city: string };

/** OpenWeather JSON through the proxy (current · forecast · city search), or null when it can't be reached. */
export async function owm<T>(body: Record<string, unknown>): Promise<T | null> {
  try {
    const { data, error } = await supabase.functions.invoke('weather', { body });
    if (error && __DEV__) {
      // Dev builds only: why the weather is empty in the Metro log. HTTP / relay errors carry the Response
      // (status + the function's error code); a network error (FunctionsFetchError) carries the fetch error instead.
      const ctx = (error as { context?: unknown }).context;
      const detail =
        ctx && typeof (ctx as Response).text === 'function'
          ? `${(ctx as Response).status} ${await (ctx as Response).text().catch(() => '')}`
          : `${error.name}: ${error.message}${ctx ? ` — ${String((ctx as Error).message ?? ctx)}` : ''}`;
      console.warn('[weather]', body.kind, detail);
    }
    return error || data == null ? null : (data as T);
  } catch (e) {
    if (__DEV__) console.warn('[weather]', body.kind, e);
    return null;
  }
}

const at = (where: Where) =>
  'city' in where ? { city: where.city } : { lat: roundCoord(where.latitude), lon: roundCoord(where.longitude) };

export type CurrentWeather = {
  city: string;
  countryCode: string;
  tempC: number;
  mood: WeatherMood;
  /** Finer 3D icon key for the large weather icon (absent in forecasts cached before it existed → use `mood`). */
  icon?: Weather3DKey;
  /** seconds from UTC at that place */
  timezoneOffset?: number;
};

type OwmResponse = {
  name: string;
  sys: { country: string };
  timezone?: number;
  main: { temp: number; temp_min?: number; temp_max?: number };
  wind?: { speed?: number };
  rain?: { '1h'?: number };
  snow?: { '1h'?: number };
  weather: { id: number; icon: string }[];
};

/** OpenWeather condition code → mood, then temperature / wind overrides in the documented priority order. */
function moodFromOwm(r: OwmResponse): WeatherMood {
  const id = r.weather[0]?.id ?? 800;
  const night = r.weather[0]?.icon?.endsWith('n') ?? false;
  const rainMm = r.rain?.['1h'] ?? 0;
  const snowCm = (r.snow?.['1h'] ?? 0) / 10;

  let sky: WeatherMood;
  if (id >= 200 && id < 300) sky = 'thunder';
  else if (id >= 300 && id < 400) sky = 'drizzle';
  else if (id === 511 || (id >= 611 && id <= 616)) sky = 'sleet';
  else if (id >= 520 && id < 600) sky = 'shower';
  else if (id >= 500 && id < 520) sky = rainMm >= 15 || id >= 502 ? 'heavy-rain' : rainMm >= 3 || id === 501 ? 'rain' : 'drizzle';
  else if (id >= 600 && id < 700) sky = snowCm >= 1 || id === 602 || id === 622 ? 'heavy-snow' : id === 600 || id === 620 ? 'flurries' : 'snow';
  else if (id === 701 || id === 741) sky = 'fog';
  else if (id >= 700 && id < 770) sky = 'dust';
  else if (id >= 770 && id < 800) sky = 'windy';
  else if (id === 804) sky = 'overcast';
  else if (id === 803) sky = 'cloudy';
  else sky = night ? 'clear-night' : 'clear';

  // thunder > heavy > sleet > rain/snow/shower > drizzle/flurries > heat/cold > dust > fog > windy > overcast > cloudy > clear
  const precip: WeatherMood[] = ['thunder', 'heavy-rain', 'heavy-snow', 'sleet', 'rain', 'snow', 'shower', 'drizzle', 'flurries'];
  if (precip.includes(sky)) return sky;
  if (r.main.temp >= 33) return 'heat';
  if (r.main.temp <= -12) return 'cold';
  if (sky === 'dust' || sky === 'fog') return sky;
  if ((r.wind?.speed ?? 0) >= 14) return 'windy';
  return sky;
}

const NIGHT_VARIANT = new Set<Weather3DKey>([
  'drizzle', 'shower', 'rain', 'heavy-rain', 'thunder', 'rain-thunder', 'flurries', 'snow', 'heavy-snow', 'rain-snow', 'hail', 'fog',
]);

/**
 * Mood → the finer Weather 3D key (Figma 1132:220). Cloud amount picks the sky icon (801 few → mostly-sunny / mostly-clear,
 * 802 scattered → partly-cloudy(-night), 803 broken → cloudy / mostly-cloudy-night, 804 → overcast); thunderstorm with rain
 * → rain-thunder, light thunderstorm by day → partly-sunny-thunder; freezing rain → ice; rain and snow → rain-snow;
 * tornado or hurricane-force wind (≥ 32.7 m/s) → hurricane. After sunset the 12 Night icons replace their Day forms.
 */
function iconFromOwm(r: OwmResponse, mood: WeatherMood): Weather3DKey {
  const id = r.weather[0]?.id ?? 800;
  const night = r.weather[0]?.icon?.endsWith('n') ?? false;
  if (id === 781 || (r.wind?.speed ?? 0) >= 32.7) return 'hurricane';
  let key: Weather3DKey = mood;
  switch (mood) {
    case 'clear':
    case 'clear-night':
      key = id === 801 ? (night ? 'mostly-clear' : 'mostly-sunny') : id === 802 ? (night ? 'partly-cloudy-night' : 'partly-cloudy') : night ? 'clear-night' : 'clear';
      return key;
    case 'cloudy':
      return night ? 'mostly-cloudy-night' : 'cloudy';
    case 'thunder':
      key = (id >= 200 && id <= 202) || (id >= 230 && id <= 232) ? 'rain-thunder' : id === 210 && !night ? 'partly-sunny-thunder' : 'thunder';
      break;
    case 'sleet':
      key = id === 511 ? 'ice' : id === 615 || id === 616 ? 'rain-snow' : 'sleet';
      break;
  }
  return night && NIGHT_VARIANT.has(key) ? (`${key}-night` as Weather3DKey) : key;
}

export async function fetchCurrentWeather(where: Where): Promise<CurrentWeather | null> {
  const json = await owm<OwmResponse>({ kind: 'current', ...at(where) });
  if (!json?.main || !json.weather) return null;
  try {
    const mood = moodFromOwm(json);
    return { city: json.name, countryCode: json.sys.country, tempC: Math.round(json.main.temp), mood, icon: iconFromOwm(json, mood), timezoneOffset: json.timezone };
  } catch {
    return null;
  }
}

type OwmForecast = { list: (Omit<OwmResponse, 'name' | 'sys'> & { dt: number })[] };

type ForecastPoint = { at: Date; tempC: number; mood: WeatherMood; icon?: Weather3DKey };
export type Forecast = CurrentWeather & {
  hi: number;
  lo: number;
  /** When the current mood is expected to change (first 3-hour step with another mood), if within ~24 h. */
  until?: Date;
  points: ForecastPoint[];
};

/** Current weather + 5-day/3-hour forecast (free tier) → H/L for the rest of today, "until", per-time temps. */
export async function fetchForecast(where: Where): Promise<Forecast | null> {
  const now = await fetchCurrentWeather(where);
  if (!now) return null;
  try {
    const json = await owm<OwmForecast>({ kind: 'forecast', cnt: 16, ...at(where) });
    if (!json?.list) throw new Error('forecast');
    const points: ForecastPoint[] = json.list.map((p) => {
      const r = { ...p, name: '', sys: { country: '' } } as OwmResponse;
      const mood = moodFromOwm(r);
      return { at: new Date(p.dt * 1000), tempC: Math.round(p.main.temp), mood, icon: iconFromOwm(r, mood) };
    });
    const today = new Date();
    const todays = points.filter((p) => p.at.toDateString() === today.toDateString());
    const temps = [now.tempC, ...todays.map((p) => p.tempC)];
    const change = points.find((p) => p.mood !== now.mood);
    return { ...now, hi: Math.max(...temps), lo: Math.min(...temps), until: change?.at, points };
  } catch {
    return { ...now, hi: now.tempC, lo: now.tempC, points: [] };
  }
}

/** Forecast temperature closest to a time (falls back to the current temperature). */
export function tempAt(f: Forecast, at: Date) {
  if (!f.points.length) return f.tempC;
  return f.points.reduce((best, p) => (Math.abs(+p.at - +at) < Math.abs(+best.at - +at) ? p : best)).tempC;
}

export type DailyForecast = { /** Local date YYYY-MM-DD. */ date: string; mood: WeatherMood; hi: number; lo: number };

/**
 * Day-by-day forecast from the same 5-day / 3-hour feed (free tier) — about 5 days ahead.
 * A day's weather = the most common mood between 9:00 and 21:00 (all of its steps when none fall there).
 */
export async function fetchDailyForecast(where: Where): Promise<DailyForecast[]> {
  const json = await owm<OwmForecast>({ kind: 'forecast', ...at(where) });
  if (!json?.list) throw new Error('forecast');
  const pad = (n: number) => String(n).padStart(2, '0');
  const days = new Map<string, ForecastPoint[]>();
  for (const p of json.list) {
    const at = new Date(p.dt * 1000);
    const key = `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
    const point = { at, tempC: Math.round(p.main.temp), mood: moodFromOwm({ ...p, name: '', sys: { country: '' } } as OwmResponse) };
    days.set(key, [...(days.get(key) ?? []), point]);
  }
  return [...days.entries()].map(([date, pts]) => {
    const day = pts.filter((p) => p.at.getHours() >= 9 && p.at.getHours() <= 21);
    const counts = new Map<WeatherMood, number>();
    (day.length ? day : pts).forEach((p) => counts.set(p.mood, (counts.get(p.mood) ?? 0) + 1));
    const mood = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const temps = pts.map((p) => p.tempC);
    return { date, mood, hi: Math.max(...temps), lo: Math.min(...temps) };
  });
}
