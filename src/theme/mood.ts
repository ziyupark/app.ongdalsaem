// Weather Mood 2.0 — docs/01-foundations.md §2.4 (Figma styles Mood/<key>).
// Each mood = a vertical base fade (top → mid at 55% → bg/default) + soft radial blobs.
// Blob coordinates are fractions of the box: centre (cx, cy), radii (rx, ry), centre alpha a.
// Every blob fades a → a·0.45 at 55% → 0 at the edge.

export const WEATHER_MOODS = [
  'clear', 'clear-night', 'cloudy', 'overcast', 'drizzle', 'rain', 'heavy-rain', 'shower', 'thunder',
  'sleet', 'flurries', 'snow', 'heavy-snow', 'fog', 'dust', 'heat', 'cold', 'windy',
] as const;
export type WeatherMood = (typeof WEATHER_MOODS)[number];

type Blob = { color: string; cx: number; cy: number; rx: number; ry: number; a: number };
export type MoodSpec = { top: string; mid: string; blobs: Blob[] };

const b = (color: string, cx: number, cy: number, rx: number, ry: number, a: number): Blob => ({ color, cx, cy, rx, ry, a });
export const MOOD_BASE = '#F5F2ED'; // = bg/default (light)

export const moods: Record<WeatherMood, MoodSpec> = {
  clear: { top: '#FFCF73', mid: '#F9E2B6', blobs: [b('#FF9E5E', .18, .04, .42, .34, .55), b('#FFB13D', .76, .10, .46, .38, .95), b('#FFFFFF', .78, .10, .13, .11, .85)] },
  'clear-night': { top: '#22335C', mid: '#6F7FA8', blobs: [b('#3A5A9C', .18, .06, .5, .36, .9), b('#FFD27A', .8, .12, .15, .13, .9), b('#FFE9B8', .8, .12, .05, .045, 1)] },
  cloudy: { top: '#B9C2CC', mid: '#D6DEE5', blobs: [b('#A9B1BA', .84, 0, .46, .34, .85), b('#BFD3E3', .22, .06, .48, .34, .9), b('#F6F2EC', .46, .2, .46, .2, .95), b('#EADFE0', .62, .16, .22, .12, .45), b('#E3F0F4', .34, .24, .2, .1, .55)] },
  overcast: { top: '#AFB6BE', mid: '#D5D7D8', blobs: [b('#8E98A3', .5, -.04, .62, .36, .85), b('#DCD8D1', .15, .28, .38, .22, .7)] },
  drizzle: { top: '#A9C6D2', mid: '#D3DEE1', blobs: [b('#7FB3C6', .72, .06, .42, .34, .8), b('#D3EAE3', .2, .2, .36, .24, .8)] },
  rain: { top: '#7C9EBA', mid: '#BFCCD6', blobs: [b('#4F7DAD', .3, -.02, .52, .36, .9), b('#9BC6DE', .86, .22, .34, .26, .75)] },
  'heavy-rain': { top: '#4A6382', mid: '#9AABBF', blobs: [b('#2E4A6B', .5, -.06, .62, .4, .95), b('#6E95BA', .14, .26, .36, .24, .6)] },
  shower: { top: '#9ACFE6', mid: '#CCE2EA', blobs: [b('#5DB8E6', .24, .06, .42, .32, .85), b('#FFC27A', .86, .1, .3, .24, .85), b('#FFFFFF', .6, .3, .3, .16, .6)] },
  thunder: { top: '#3B4760', mid: '#8E97AA', blobs: [b('#232C40', .38, -.04, .56, .38, .95), b('#FFD86B', .76, .16, .3, .26, .4), b('#FFF2A8', .76, .16, .09, .08, .95)] },
  sleet: { top: '#A6BACB', mid: '#D1D9DE', blobs: [b('#C5DCEC', .24, .1, .4, .28, .9), b('#86A1B9', .82, .04, .36, .3, .8)] },
  flurries: { top: '#CFE2EF', mid: '#E4EBEE', blobs: [b('#FFFFFF', .5, .1, .5, .28, .9), b('#AED2EE', .14, 0, .36, .3, .8)] },
  snow: { top: '#B4CDE4', mid: '#D8E1E9', blobs: [b('#E8F2FA', .62, .14, .46, .3, .95), b('#93B9DD', .14, .04, .36, .3, .85)] },
  'heavy-snow': { top: '#89AACA', mid: '#C4D2DD', blobs: [b('#6890B8', .5, -.04, .56, .38, .9), b('#E2EDF7', .8, .3, .36, .24, .85)] },
  fog: { top: '#CBC7C0', mid: '#E2DFD9', blobs: [b('#B5B0A8', .2, 0, .42, .3, .75), b('#EEEBE6', .5, .22, .75, .12, .9)] },
  dust: { top: '#DFC496', mid: '#EBDDC6', blobs: [b('#CF9F5E', .72, .04, .46, .34, .85), b('#F3DFBB', .2, .22, .36, .24, .8)] },
  heat: { top: '#FFAE6A', mid: '#F9D3B2', blobs: [b('#FF7438', .5, -.04, .54, .38, .9), b('#FFD27A', .16, .18, .34, .26, .85), b('#FFF4E0', .55, .12, .16, .1, .7)] },
  cold: { top: '#A6C4E2', mid: '#D1DDE8', blobs: [b('#7AA4D4', .82, 0, .46, .34, .85), b('#E6F0F9', .2, .2, .36, .24, .9)] },
  windy: { top: '#BBD6D3', mid: '#DBE5E1', blobs: [b('#86BFBA', .14, .04, .46, .32, .85), b('#E6F1EC', .78, .22, .5, .14, .85)] },
};

/**
 * Figma `Mood/clear` as drawn on the launch screens (1.1 Splash 1157:10518 · 1.2 Sign in 1207:10884, layer photo:welcome,
 * 390×420): clear-sky blue. Same blob geometry as `moods.clear`; the app-wide `moods.clear` still has the warm values.
 */
export const LAUNCH_SKY: MoodSpec = {
  top: '#5DA8EE',
  mid: '#BCDCF5',
  blobs: [b('#3B8BE0', .1765, .0408, .4202, .3401, .85), b('#8ED3F7', .7615, .0985, .4587, .3788, .8), b('#FFF6D8', .7792, .0989, .1299, .1099, .95)],
};
