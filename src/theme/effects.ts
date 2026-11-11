// Effect styles — docs/01-foundations.md §2.7. Shadow colour is #1A1A21 for every elevation.
import type { ViewStyle } from 'react-native';

const SHADOW = '#1A1A21';
const shadow = (y: number, blur: number, opacity: number): ViewStyle => ({
  shadowColor: SHADOW, shadowOffset: { width: 0, height: y }, shadowRadius: blur / 2, shadowOpacity: opacity, elevation: Math.round(y / 2),
});

export const elevation = {
  /** Soft IconButton, small chips */
  'Elevation/1 Low': shadow(4, 12, 0.06),
  /** White button, ETA chip */
  'Elevation/2 Raised': shadow(6, 18, 0.12),
  /** CreateFAB, TabBar glass bar, Weather Card */
  'Elevation/3 Float': shadow(10, 30, 0.08),
  'Elevation/4 Overlay': shadow(12, 32, 0.14),
} as const;

/** Background blur radii (expo-blur intensity is 0–100; these map the Figma px radius). */
export const blur = { S: 12, M: 16, L: 20, XL: 24 } as const;
