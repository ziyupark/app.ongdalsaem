// Weather Mood motion layer — what moves over each mood wash (src/components/WeatherFx.tsx).
// Kept beside mood.ts so the wash colours and their motion are tuned in one place.
import { light } from './colors';
import type { WeatherMood } from './mood';

/** Particle colours (same in light and dark): white drops / flakes / flash, and the bolt's warm glow. */
export const FX_COLOR = { white: light['static/white'], boltGlow: '#FFF6C8' } as const;

/** Falling streaks (rain). `slant` = sideways drift as a fraction of the fall height. */
export type RainFx = { count: number; len: [number, number]; thick: number; dur: [number, number]; slant: number; alpha: [number, number] };
/** Falling dots (snow, sleet pellets, dust). `sway` = side-to-side amplitude in pt. */
export type FlakeFx = { count: number; size: [number, number]; dur: [number, number]; sway: number; drift: number; alpha: [number, number]; color: string };
/** Twinkling dots (stars, frost glints). */
export type TwinkleFx = { count: number; size: [number, number]; period: [number, number]; color: string; band: number };
/** Soft drifting puffs (clouds, fog banks, heat haze). y/height are fractions of the wash; dur in ms per crossing. */
export type PuffFx = { count: number; y: [number, number]; w: [number, number]; h: [number, number]; dur: [number, number]; alpha: number; color: string };
/** Horizontal gust lines. */
export type GustFx = { count: number; w: [number, number]; dur: [number, number]; alpha: number };
/** Breathing sun / moon glow at the mood's light blob (fractions of the wash). */
export type GlowFx = { cx: number; cy: number; r: number; color: string; alpha: [number, number]; period: number };
/** Lightning: flash over the whole wash + a bolt. `every` = ms between strikes. */
export type BoltFx = { every: [number, number]; x: number };

export type WeatherFxSpec = {
  rain?: RainFx; flakes?: FlakeFx; pellets?: FlakeFx; twinkle?: TwinkleFx; puffs?: PuffFx;
  gusts?: GustFx; glow?: GlowFx; bolt?: BoltFx;
};

const WHITE = '#FFFFFF';
const DUST = '#B88A4E';

const rain = (count: number, dur: [number, number], len: [number, number], alpha: [number, number], slant = 0.12, thick = 1.2): RainFx => ({ count, dur, len, alpha, slant, thick });
const snow = (count: number, size: [number, number], dur: [number, number], sway: number, alpha: [number, number] = [0.7, 1]): FlakeFx => ({ count, size, dur, sway, drift: 10, alpha, color: WHITE });
const clouds = (count: number, alpha: number, dur: [number, number] = [55000, 90000]): PuffFx => ({ count, y: [0.02, 0.3], w: [0.7, 1.1], h: [0.14, 0.24], dur, alpha, color: WHITE });

export const WEATHER_FX: Record<WeatherMood, WeatherFxSpec> = {
  clear: { glow: { cx: 0.78, cy: 0.1, r: 0.3, color: WHITE, alpha: [0.35, 0.7], period: 5200 } },
  'clear-night': {
    glow: { cx: 0.8, cy: 0.12, r: 0.2, color: '#FFE9B8', alpha: [0.25, 0.5], period: 6400 },
    twinkle: { count: 26, size: [1.5, 3], period: [1800, 4200], color: WHITE, band: 0.45 },
  },
  cloudy: { puffs: clouds(4, 0.5) },
  overcast: { puffs: clouds(5, 0.38, [70000, 110000]) },
  drizzle: { rain: rain(32, [1300, 1900], [10, 16], [0.6, 0.9], 0.06, 1.2) },
  rain: { rain: rain(50, [800, 1150], [14, 24], [0.55, 0.85], 0.12, 1.4) },
  'heavy-rain': { rain: rain(80, [520, 760], [22, 36], [0.45, 0.8], 0.18, 1.4) },
  shower: {
    rain: rain(34, [850, 1200], [12, 20], [0.45, 0.75], 0.1),
    glow: { cx: 0.86, cy: 0.1, r: 0.22, color: '#FFE2B0', alpha: [0.35, 0.65], period: 5200 },
  },
  thunder: { rain: rain(60, [600, 880], [18, 30], [0.4, 0.75], 0.16, 1.3), bolt: { every: [4200, 8200], x: 0.7 } },
  sleet: {
    rain: rain(26, [800, 1150], [10, 18], [0.4, 0.65], 0.1),
    pellets: { count: 22, size: [2.5, 4], dur: [1600, 2400], sway: 4, drift: 14, alpha: [0.75, 1], color: WHITE },
  },
  flurries: { flakes: snow(22, [2.5, 5], [6500, 10000], 14) },
  snow: { flakes: snow(46, [3, 6], [5000, 8000], 16) },
  'heavy-snow': { flakes: snow(80, [3, 7], [3200, 5200], 20) },
  fog: { puffs: { count: 5, y: [0.1, 0.75], w: [1.1, 1.6], h: [0.12, 0.2], dur: [40000, 70000], alpha: 0.55, color: WHITE } },
  dust: { flakes: { count: 40, size: [1.5, 3], dur: [7000, 11000], sway: 10, drift: 90, alpha: [0.35, 0.6], color: DUST } },
  heat: {
    glow: { cx: 0.5, cy: 0.02, r: 0.42, color: '#FFF4E0', alpha: [0.3, 0.6], period: 3600 },
    puffs: { count: 3, y: [0.35, 0.7], w: [1.2, 1.6], h: [0.05, 0.08], dur: [9000, 14000], alpha: 0.3, color: WHITE },
  },
  cold: {
    twinkle: { count: 18, size: [1.5, 2.5], period: [1400, 3200], color: WHITE, band: 0.6 },
    flakes: snow(8, [2, 3.5], [8000, 12000], 10, [0.5, 0.8]),
  },
  windy: { gusts: { count: 9, w: [50, 110], dur: [1100, 1900], alpha: 0.6 }, puffs: clouds(2, 0.35, [16000, 24000]) },
};
