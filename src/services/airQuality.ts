// Air quality now + yesterday at this time — OpenWeather Air Pollution through the `weather` Edge Function
// (kinds air · air_history; the key stays on the server). PM10 / PM2.5 in µg/m³; the grade is worked out on the
// device (src/lib/airQuality.ts, 환경부 기준). Coordinates leave the device rounded to 2 decimals only.
import { owm } from './weather';
import { roundCoord, type Coordinates } from './location';

export type AirValues = { pm10: number | null; pm25: number | null };
export type AirReading = AirValues & {
  /** When the values were measured / modelled (ms). */
  observedAt: number;
  source: 'openweather';
  /** Yesterday at about this time — null when history couldn't be read. */
  yesterday: AirValues | null;
  /** Rounded coordinates the reading is for (2 decimals). */
  lat: number;
  lon: number;
};

type OwmAir = { list?: { dt: number; components?: { pm10?: number; pm2_5?: number } }[] };

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null);
const values = (p: NonNullable<OwmAir['list']>[number]): AirValues => ({ pm10: num(p.components?.pm10), pm25: num(p.components?.pm2_5) });

/** null when the air can't be read (offline, server error, no values). */
export async function fetchAirQuality(at: Coordinates, now = Date.now()): Promise<AirReading | null> {
  const lat = roundCoord(at.latitude);
  const lon = roundCoord(at.longitude);
  // History window: yesterday −1 h … +1 h, on whole hours (the server rounds the same way, so calls share its cache).
  const target = Math.floor((now - 24 * 3600_000) / 1000);
  const start = Math.floor(target / 3600) * 3600 - 3600;
  const [cur, hist] = await Promise.all([
    owm<OwmAir>({ kind: 'air', lat, lon }),
    owm<OwmAir>({ kind: 'air_history', lat, lon, start, end: start + 3 * 3600 }),
  ]);
  const p = cur?.list?.[0];
  if (!p) return null;
  const v = values(p);
  if (v.pm10 == null && v.pm25 == null) return null;
  const past = hist?.list?.length ? hist.list.reduce((b, x) => (Math.abs(x.dt - target) < Math.abs(b.dt - target) ? x : b)) : null;
  const y = past ? values(past) : null;
  return {
    ...v,
    observedAt: p.dt * 1000,
    source: 'openweather',
    yesterday: y && (y.pm10 != null || y.pm25 != null) ? y : null,
    lat,
    lon,
  };
}
