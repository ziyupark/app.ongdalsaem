import { gradients } from '../../theme';

/**
 * Air quality bar geometry (Figma Air Quality Card 1284:1087 · bar frame 32 high): line 7 across the full width ·
 * glow 13 (blurred, 45 %) · white knob 12 with a halo in the bar colour. lineY = centre of the line.
 */
export const AIR_BAR = { height: 32, lineY: 16, line: 7, glow: 13, knob: 6, halo: 9 } as const;

/** Knob centre for a 0–1 position, kept inside the bar. */
export const knobX = (width: number, p: number) => AIR_BAR.knob + Math.max(0, width - AIR_BAR.knob * 2) * Math.max(0, Math.min(1, p));

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
