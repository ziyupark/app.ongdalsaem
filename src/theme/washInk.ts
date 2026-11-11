// Text over a Weather Mood wash — always readable (WCAG contrast), whatever the weather.
// Light washes keep the Figma inks (fg/default · fg/secondary · fg/muted · fg/disabled); dark washes
// (clear-night, thunder, heavy-rain …) switch to the on-photo inks. A weaker ink that falls below its
// minimum steps up to the next stronger one.
import { useMemo } from 'react';
import { MOOD_BASE, moods, type WeatherMood } from './mood';
import { useTheme } from './index';
import type { ColorToken } from './colors';

type RGB = [number, number, number];

const parse = (hex: string): { rgb: RGB; a: number } => {
  const h = hex.replace('#', '');
  const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
  return { rgb: [n(0), n(2), n(4)], a: h.length >= 8 ? n(6) / 255 : 1 };
};
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const lin = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]: RGB) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contrast = (a: RGB, b: RGB) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

/** Wash colour at a height (0 = top, 1 = bottom of the wash), shown at `opacity` over `base` — same stops as MoodGradient. */
export function washColorAt(mood: WeatherMood, at: number, opacity = 1, base = MOOD_BASE): RGB {
  const spec = moods[mood];
  const b = parse(base).rgb;
  const t = Math.min(1, Math.max(0, at));
  const c = t <= 0.55 ? mix(parse(spec.top).rgb, parse(spec.mid).rgb, t / 0.55) : mix(parse(spec.mid).rgb, b, (t - 0.55) / 0.45);
  return mix(b, c, opacity);
}

export type WashInk = {
  strong: ColorToken;
  secondary: ColorToken;
  muted: ColorToken;
  disabled: ColorToken;
  /** Indicator / hairline colour as a string (no token covers both polarities). */
  line: string;
  rule: string;
  /** For expo-status-bar. */
  bar: 'light' | 'dark';
  /** true when the on-photo (light) inks are in use. */
  light: boolean;
  /** Pure black or white — whichever contrasts more with the wash at this spot. */
  bw: ColorToken;
};

/** Pure black or white for text on a solid colour (hex), by higher contrast. */
export function bwOn(hex: string): ColorToken {
  const bg = parse(hex).rgb;
  return contrast([0, 0, 0], bg) >= contrast([255, 255, 255], bg) ? 'static/ink' : 'static/white';
}
const bwOnRgb = (bg: RGB): ColorToken => (contrast([0, 0, 0], bg) >= contrast([255, 255, 255], bg) ? 'static/ink' : 'static/white');

const DARK: ColorToken[] = ['fg/default', 'fg/secondary', 'fg/muted', 'fg/disabled'];
const LIGHT: ColorToken[] = ['fg/on-photo', 'fg/on-photo-secondary', 'fg/on-photo-tertiary', 'fg/on-photo-tertiary'];
/** Minimum contrast per role: body text 4.5 · muted labels 2.6 · decorative display 1.4 (both = the Figma 2.1 / 3.1 rain screens, so those stay as drawn). */
const MIN = [4.5, 4.5, 2.6, 1.4];

/** Pure version (for lists — no hook). `color` = the theme's token resolver. */
export function washInkFor(mood: WeatherMood, at: number, opacity: number, color: (t: ColorToken) => string, scheme: 'light' | 'dark'): WashInk {
  const bg = washColorAt(mood, at, opacity);
  const on = (tok: ColorToken) => { const p = parse(color(tok)); return contrast(mix(bg, p.rgb, p.a), bg); };
  const ladder = on('fg/default') >= on('fg/on-photo') ? DARK : LIGHT;
  const role = (i: number) => {
    for (let k = i; k >= 0; k--) if (on(ladder[k]) >= MIN[i]) return ladder[k];
    return ladder[0];
  };
  const light = ladder === LIGHT;
  return {
    strong: ladder[0],
    secondary: role(1),
    muted: role(2),
    disabled: role(3),
    line: light ? '#FFFFFF' : color('bg/primary'),
    rule: light ? '#FFFFFF33' : color('border/default'),
    bar: light || scheme === 'dark' ? 'light' : 'dark',
    light,
    bw: bwOnRgb(bg),
  };
}

/**
 * Inks for text sitting on a wash. `at` = where the text sits within the wash height (0–1).
 * Returns null without a mood (plain background → normal tokens).
 */
export function useWashInk(mood: WeatherMood | null | undefined, at = 0.15, opacity = 1): WashInk | null {
  const { color, scheme } = useTheme();
  return useMemo(() => (mood ? washInkFor(mood, at, opacity, color, scheme) : null), [mood, at, opacity, color, scheme]);
}
