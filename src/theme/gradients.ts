// Gradient paint styles & primitives used by them — docs/01-foundations.md §2.2 · §2.3.
// Screens never type these HEX values; they import the named gradient.

/** sunset primitives (Signature gradients only). */
const sunset = {
  100: '#FFDB29', 200: '#FFC450', 300: '#F9C152', 400: '#FEA344', 500: '#FFA528',
  600: '#F2A04A', 700: '#FE923F', 800: '#FF773A', 900: '#DD7350',
} as const;

export type GradientStop = { offset: number; color: string };

export const gradients = {
  /** radial — mood orb, Now slot ring, 1.1 splash glow */
  'Gradient/Sunset': [
    { offset: 0, color: sunset[300] },
    { offset: 0.6, color: sunset[600] },
    { offset: 1, color: sunset[900] },
  ],
  /** linear — 1.1b sunset band, home title accent word */
  'Gradient/Sunset linear': [
    { offset: 0, color: sunset[100] },
    { offset: 0.23077, color: sunset[200] },
    { offset: 0.75962, color: sunset[700] },
    { offset: 1, color: sunset[400] },
  ],
  /** linear (top → bottom) — Logo wordmark, dark chips/badges */
  'Gradient/Ink metal': [
    { offset: 0, color: '#6A6760' },
    { offset: 1, color: '#1B1C22' },
  ],
  /** linear (top → bottom) — 4.2 Tag / 4.3 Country hero (Figma raw fill #B8401A → #E5743F) */
  'Gradient/Ember': [
    { offset: 0, color: '#B8401A' },
    { offset: 1, color: '#E5743F' },
  ],
  /** linear (top-left → bottom-right) — 5.2 finished timer ring 676:22871 (fg/done → sage → clay; first stop follows fg/done) */
  'Gradient/Done': [
    { offset: 0, color: '#5E8B6A' },
    { offset: 0.68, color: '#7A876B' },
    { offset: 1, color: '#A8826D' },
  ],
  /** linear — TabBar active icon */
  'Gradient/Dusk': [
    { offset: 0, color: sunset[500] },
    { offset: 1, color: sunset[800] },
  ],
} as const satisfies Record<string, readonly GradientStop[]>;

/**
 * Third-party brand colours that the provider's branding rules fix (Auth Button, docs/02-components.md
 * "Auth Button 브랜드 규정"). They are not part of the ongdalsaem palette and must not be used elsewhere.
 */
export const thirdPartyBrand = {
  /** Both buttons: white fill + the Google Light-theme outline (Apple allows a bezel stroke on custom buttons). */
  surface: '#FFFFFF',
  outline: '#747775',
  /** Apple logo and title: black only. */
  appleInk: '#000000',
  googleInk: '#1F1F1F',
} as const;

/** Same colour with a new alpha (0–1). Accepts #RRGGBB or #RRGGBBAA. */
export function withAlpha(hex: string, alpha: number) {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, '0').toUpperCase();
  return `${hex.slice(0, 7)}${a}`;
}
