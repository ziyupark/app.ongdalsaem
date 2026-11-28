// Day / sunset / night for the Weather Mood background (docs/01-foundations.md §2.4 시간대). Pure — tests/skyPhase.test.ts.
//
//   sunset = within 1 hour either side of sunrise or sunset
//   day    = from 1 hour after sunrise to 1 hour before sunset
//   night  = the rest
// Sunrise / sunset come from the weather reading (OpenWeather sys.sunrise · sys.sunset); without them 06:00 / 18:00
// on the device clock.

export type SkyPhase = 'day' | 'sunset' | 'night';
export const SKY_PHASES: readonly SkyPhase[] = ['day', 'sunset', 'night'];

const HOUR = 3600_000;
const DAY = 24 * HOUR;
/** Half-width of the sunset band around sunrise and sunset. */
export const TWILIGHT = HOUR;

export type SunTimes = { sunrise?: number | null; sunset?: number | null };

/** 06:00 / 18:00 on `now`'s local date — the fallback when the reading has no sun times. */
function fallback(now: number) {
  const d = new Date(now);
  const at = (h: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), h).getTime();
  return { sunrise: at(6), sunset: at(18) };
}

/**
 * The occurrence of a daily time nearest to `now` — a reading from yesterday (cached) still gives today's times, and
 * after midnight the sunset that counts is last evening's.
 */
const nearest = (t: number, now: number) => t + Math.round((now - t) / DAY) * DAY;

function sunTimes(now: number, sun?: SunTimes | null) {
  const ok = sun?.sunrise != null && sun?.sunset != null && Number.isFinite(sun.sunrise) && Number.isFinite(sun.sunset) && sun.sunset > sun.sunrise;
  return ok ? { sunrise: sun!.sunrise!, sunset: sun!.sunset! } : fallback(now);
}

export function skyPhaseAt(now: number, sun?: SunTimes | null): SkyPhase {
  const s = sunTimes(now, sun);
  const rise = nearest(s.sunrise, now);
  const set = nearest(s.sunset, now);
  if (Math.abs(now - rise) <= TWILIGHT || Math.abs(now - set) <= TWILIGHT) return 'sunset';
  // Day only between the two, the same day: a "rise" in the future with a "set" in the past is night.
  return now > rise + TWILIGHT && now < set - TWILIGHT ? 'day' : 'night';
}

/** When the phase next changes (ms) — the closest band edge after `now`. */
export function nextSkyChange(now: number, sun?: SunTimes | null): number {
  const s = sunTimes(now, sun);
  const edges: number[] = [];
  for (const t of [s.sunrise, s.sunset]) {
    const n = nearest(t, now);
    // The band includes its edges: sunset starts at −1 h, and ends just after +1 h.
    for (const k of [-1, 0, 1]) edges.push(n + k * DAY - TWILIGHT, n + k * DAY + TWILIGHT + 1);
  }
  return Math.min(...edges.filter((e) => e > now));
}
