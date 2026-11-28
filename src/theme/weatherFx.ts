// Weather Mood motion layer — what moves over each mood wash (src/components/WeatherMoodLayer.tsx).
// Kept beside mood.ts so the wash colours and their motion are tuned in one place.
// Everything is slow on purpose: it sits behind cards and text and must never pull the eye.
import { light } from './colors';
import type { WeatherMood } from './mood';

/**
 * Particle colours (same in light and dark): white drops / flakes / motes / flash, the bolt's warm glow, and the faint
 * red · green · blue halos behind twinkling stars (one tint per star, in turn).
 */
export const FX_COLOR = { white: light['static/white'], boltGlow: '#FFF6C8', starGlow: ['#FF9A9A', '#9AFFC4', '#9AC4FF'] } as const;

/** Hard particle limits per effect at density 1 (performance): rain ≤ 60, snow ≤ 40, everything else ≤ 20. Scaled by the layer's density. */
export const FX_CAP = { rain: 60, snow: 40, other: 20 } as const;

/** Default particle multiplier everywhere (tabs · 7.1 · 1.2 Sign in): counts and caps below ×3. */
export const FX_DENSITY = 3;

/** Where the layer melts into the content: transparent over the bottom 40 % of the wash. */
export const FX_FADE_FROM = 0.6;

/** Mood change = old effect fades out 800 ms while the new one fades in 1200 ms. On entry it starts 300 ms after the wash. */
export const FX_TIMING = { fadeOut: 800, fadeIn: 1200, washIn: 400, startDelay: 300 } as const;

/** Night: particles are dimmed by this factor. */
export const FX_NIGHT_DIM = 0.6;

export type TimeOfDay = 'day' | 'night';

/** Falling streaks (rain). `slant` = sideways drift as a fraction of the fall height (tan of the tilt). */
export type RainFx = { count: number; len: [number, number]; thick: number; dur: [number, number]; slant: number; alpha: [number, number] };
/**
 * Falling (or rising) dots — snow, sleet pellets, dust, light motes. Each dot gets a depth z (0 back → 1 front):
 * front dots are bigger, faster, brighter and sway more. `sway` = side-to-side amplitude range in pt. `soft` = blurred edge.
 */
export type FlakeFx = {
  count: number; size: [number, number]; dur: [number, number]; sway: [number, number]; drift: number;
  alpha: [number, number]; color: string; soft?: boolean; rise?: boolean;
};
/**
 * Twinkling dots (stars, frost glints) — opacity eases between `alpha` in a random `period`. `glow` = a soft halo
 * `scale`× the dot, tinted red / green / blue in turn (FX_COLOR.starGlow), brightening with the twinkle up to `alpha`.
 */
export type TwinkleFx = {
  count: number; size: [number, number]; period: [number, number]; alpha: [number, number]; color: string; band: number;
  glow?: { scale: number; alpha: number };
};
/**
 * Shooting stars (night skies with stars). Each one streaks down-left at `angle`° below the horizontal, crossing
 * `travel` (fraction of the width) in `dur` ms, then waits a random `rest` ms; every pass starts somewhere new in the
 * top `band` of the wash. Not scaled by density (they're rare on purpose).
 */
export type MeteorFx = { count: number; dur: [number, number]; rest: [number, number]; len: [number, number]; travel: [number, number]; angle: number; alpha: number; band: number };
/** Soft drifting puffs (clouds, fog banks, heat haze), left → right. y/height are fractions of the wash; `durs` = ms per crossing, one per layer (parallax). */
export type PuffFx = { y: [number, number]; w: [number, number]; h: [number, number]; durs: number[]; alpha: number; color: string };
/** Thin wind lines, left → right. */
export type GustFx = { count: number; w: [number, number]; dur: [number, number]; alpha: number };
/** Breathing sun / moon glow at the mood's light blob (fractions of the wash): scale 1 → 1.06 and back over `period`. */
export type GlowFx = { cx: number; cy: number; r: number; color: string; alpha: [number, number]; period: number };
/** Lightning: a crackling flash over the wash every `every` ms (random each time); a bolt on about 1 in 3. */
export type BoltFx = { every: [number, number] };

export type WeatherFxSpec = {
  rain?: RainFx; flakes?: FlakeFx; pellets?: FlakeFx; motes?: FlakeFx; twinkle?: TwinkleFx; puffs?: PuffFx;
  gusts?: GustFx; glow?: GlowFx; bolt?: BoltFx; meteors?: MeteorFx;
};

const WHITE = FX_COLOR.white;
const DUST = '#B88A4E';
/** ≈ 10° tilt. */
const SLANT = Math.tan((10 * Math.PI) / 180);

// One streak crosses the wash in 1.2–2 s (slower than real rain); length, opacity (0.15–0.35) and speed are random.
const rain = (count: number, dur: [number, number], len: [number, number], alpha: [number, number], thick = 1.2): RainFx => ({ count, dur, len, alpha, slant: SLANT, thick });
// Snow: 2–6 pt soft dots crossing in 8–14 s, swaying 10–24 pt.
const snow = (count: number, size: [number, number] = [2, 6], alpha: [number, number] = [0.55, 0.95]): FlakeFx => ({ count, size, dur: [8000, 14000], sway: [10, 24], drift: 8, alpha, color: WHITE, soft: true });
// Clouds: 2–3 translucent layers drifting at different speeds (40 / 60 / 90 s per crossing).
const clouds = (alpha: number, durs = [40000, 60000, 90000]): PuffFx => ({ y: [0.02, 0.3], w: [0.7, 1.1], h: [0.14, 0.24], durs, alpha, color: WHITE });
const stars = (count: number): TwinkleFx => ({ count, size: [1.5, 3], period: [3000, 6000], alpha: [0.3, 0.8], color: WHITE, band: 0.45, glow: { scale: 5, alpha: 0.35 } });
// Shooting stars: 2 at a time at most, each 0.7–1.1 s across, then 6–14 s off → about one every 5 s.
const meteors: MeteorFx = { count: 2, dur: [700, 1100], rest: [6000, 14000], len: [60, 110], travel: [0.3, 0.45], angle: 32, alpha: 0.85, band: 0.3 };
// Clear: a few faint light motes rising, 12–20 s per crossing.
const motes: FlakeFx = { count: 8, size: [2.5, 5], dur: [12000, 20000], sway: [6, 14], drift: 0, alpha: [0.25, 0.5], color: WHITE, soft: true, rise: true };

export const WEATHER_FX: Record<WeatherMood, WeatherFxSpec> = {
  clear: { glow: { cx: 0.78, cy: 0.1, r: 0.3, color: WHITE, alpha: [0.45, 0.7], period: 8000 }, motes },
  'clear-night': {
    glow: { cx: 0.8, cy: 0.12, r: 0.2, color: '#FFE9B8', alpha: [0.3, 0.5], period: 8000 },
    twinkle: stars(16),
    meteors,
  },
  cloudy: { puffs: clouds(0.5) },
  overcast: { puffs: clouds(0.38, [60000, 90000]) },
  drizzle: { rain: rain(24, [1600, 2000], [8, 14], [0.15, 0.25], 1) },
  rain: { rain: rain(44, [1200, 1700], [14, 24], [0.18, 0.35], 1.3) },
  'heavy-rain': { rain: rain(60, [1200, 1500], [18, 30], [0.2, 0.35], 1.4) },
  shower: {
    rain: rain(30, [1300, 1800], [12, 20], [0.15, 0.3]),
    glow: { cx: 0.86, cy: 0.1, r: 0.22, color: '#FFE2B0', alpha: [0.35, 0.6], period: 8000 },
  },
  thunder: { rain: rain(44, [1200, 1700], [14, 24], [0.18, 0.35], 1.3), bolt: { every: [6000, 14000] } },
  sleet: {
    rain: rain(24, [1300, 1800], [10, 18], [0.15, 0.3]),
    pellets: { count: 16, size: [2.5, 4], dur: [3000, 4200], sway: [3, 6], drift: 14, alpha: [0.6, 0.9], color: WHITE },
  },
  flurries: { flakes: snow(16) },
  snow: { flakes: snow(28) },
  'heavy-snow': { flakes: snow(40, [2, 6], [0.5, 1]) },
  fog: { puffs: { y: [0.1, 0.5], w: [1.1, 1.6], h: [0.12, 0.2], durs: [60000, 90000, 120000], alpha: 0.55, color: WHITE } },
  dust: { flakes: { count: 20, size: [1.5, 3], dur: [9000, 13000], sway: [6, 12], drift: 90, alpha: [0.3, 0.55], color: DUST } },
  heat: {
    glow: { cx: 0.5, cy: 0.02, r: 0.42, color: '#FFF4E0', alpha: [0.35, 0.6], period: 8000 },
    puffs: { y: [0.3, 0.45], w: [1.2, 1.6], h: [0.05, 0.08], durs: [40000, 60000], alpha: 0.3, color: WHITE },
  },
  cold: {
    twinkle: { ...stars(12), band: 0.55, glow: undefined },
    flakes: snow(8, [2, 3.5], [0.45, 0.75]),
  },
  windy: { gusts: { count: 10, w: [50, 110], dur: [3200, 5200], alpha: 0.5 }, puffs: clouds(0.35, [40000, 60000]) },
};

/**
 * The effect for a mood at a time of day. Night dims every particle; a clear sky at night also gets stars
 * (the light motes are a daytime thing).
 */
export function weatherFxFor(mood: WeatherMood, timeOfDay: TimeOfDay): { spec: WeatherFxSpec; dim: number } {
  const base = WEATHER_FX[mood];
  if (timeOfDay !== 'night') return { spec: base, dim: 1 };
  const spec: WeatherFxSpec = { ...base };
  if (mood === 'clear') {
    delete spec.motes;
    spec.twinkle = stars(12);
    spec.meteors = meteors;
  }
  return { spec, dim: FX_NIGHT_DIM };
}
