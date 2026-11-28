import { gradients } from '../../theme';

/** Air quality bar geometry (Figma Air Quality Card · Gradient bar): line 3 · glow 6 · knob 7 · halo 16, line 28 from the top. */
export const AIR_BAR = { height: 36, lineY: 28, pad: 8, line: 3, glow: 6, knob: 7, halo: 16 } as const;

const STOPS = gradients['Gradient/Air quality'];
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** The bar's colour at 0–1 (for the knob's halo). */
export function airColorAt(p: number) {
  const x = Math.max(0, Math.min(1, p));
  const i = Math.max(0, STOPS.findIndex((s) => s.offset >= x) - 1);
  const a = STOPS[i];
  const b = STOPS[Math.min(STOPS.length - 1, i + 1)];
  const t = b.offset === a.offset ? 0 : (x - a.offset) / (b.offset - a.offset);
  const [r, g, bl] = rgb(a.color).map((v, k) => Math.round(v + (rgb(b.color)[k] - v) * t));
  return `rgb(${r}, ${g}, ${bl})`;
}
