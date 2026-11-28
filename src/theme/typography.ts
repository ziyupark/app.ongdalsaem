// Text styles — generated from Figma text styles. docs/01-foundations.md §2.3.
// Fonts: Fraunces (display), Outfit (UI), Noto Sans KR (Korean / CJK fallback), Gaegu (1.1b handwriting). All SIL OFL.
import type { TextStyle } from 'react-native';

/** Loaded before the first screen. */
export const coreFontFiles = {
  'Fraunces-SemiBold': require('@expo-google-fonts/fraunces/600SemiBold/Fraunces_600SemiBold.ttf'),
  'Fraunces-Bold': require('@expo-google-fonts/fraunces/700Bold/Fraunces_700Bold.ttf'),
  'Outfit-Light': require('@expo-google-fonts/outfit/300Light/Outfit_300Light.ttf'),
  'Outfit-Regular': require('@expo-google-fonts/outfit/400Regular/Outfit_400Regular.ttf'),
  'Outfit-Medium': require('@expo-google-fonts/outfit/500Medium/Outfit_500Medium.ttf'),
  'Gaegu-Bold': require('@expo-google-fonts/gaegu/700Bold/Gaegu_700Bold.ttf'),
  // Sign in with Google branding font (Auth Button · Google only).
  'GoogleSans-Medium': require('@expo-google-fonts/google-sans/500Medium/GoogleSans_500Medium.ttf'),
};
/** Noto Sans KR (~12 MB) — drawn only in the Korean UI (components/Text), so only Korean waits for it. */
export const koreanFontFiles = {
  'NotoSansKR-Regular': require('@expo-google-fonts/noto-sans-kr/400Regular/NotoSansKR_400Regular.ttf'),
  'NotoSansKR-Medium': require('@expo-google-fonts/noto-sans-kr/500Medium/NotoSansKR_500Medium.ttf'),
};

type T = Pick<TextStyle, 'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing' | 'textTransform'>;
const t = (fontFamily: string, fontSize: number, lineHeight: number, letterSpacing = 0, upper = false): T => ({
  fontFamily, fontSize, lineHeight, letterSpacing, ...(upper ? { textTransform: 'uppercase' as const } : {}),
});

/** hhea ascent / descent per em (read from the bundled .ttf files) — used to keep tight line heights from clipping glyphs. */
export const FONT_METRICS: Record<string, { ascent: number; descent: number }> = {
  'Fraunces-SemiBold': { ascent: 0.978, descent: 0.255 },
  'Fraunces-Bold': { ascent: 0.978, descent: 0.255 },
  'Outfit-Light': { ascent: 1, descent: 0.26 },
  'Outfit-Regular': { ascent: 1, descent: 0.26 },
  'Outfit-Medium': { ascent: 1, descent: 0.26 },
  'NotoSansKR-Regular': { ascent: 1.16, descent: 0.288 },
  'NotoSansKR-Medium': { ascent: 1.16, descent: 0.288 },
};

export const text = {
  'Display/XL': t('Fraunces-Bold', 46, 49, -1.5),
  'Display/L': t('Fraunces-Bold', 34, 37, -0.9),
  'Display/M': t('Fraunces-SemiBold', 24, 29, -0.45),
  'Display/Quote': t('Fraunces-SemiBold', 22, 29, -0.5),
  /** Home air quality card grade ("Good" · "Unhealthy" …) — Figma text style Title/XL. */
  'Title/XL': t('Outfit-Medium', 37, 39, -0.6),
  'Title/L': t('Outfit-Medium', 22, 27, -0.35),
  'Title/M': t('Outfit-Medium', 18, 18, -0.2),
  'Title/S': t('Outfit-Medium', 16, 21, -0.1),
  'Body/L': t('Outfit-Regular', 17, 22, -0.15),
  'Body/M': t('Outfit-Regular', 15, 20, 0.13),
  'Body/M Strong': t('Outfit-Medium', 15, 21, -0.1),
  'Body/S': t('Outfit-Regular', 13, 16),
  'Body/S Strong': t('Outfit-Medium', 13, 18),
  Caption: t('Outfit-Regular', 12, 16, 0.1),
  'Caption Strong': t('Outfit-Medium', 12, 15, 0.1),
  Overline: t('Outfit-Medium', 13, 14, 1, true),
  /** Figma "XXL 80" — Home Weather Card · 6.1 Profile temperature. */
  'XXL 80': t('Outfit-Light', 80, 66, -2.6),
  'Numeric/XL': t('Outfit-Light', 72, 66, -2.6),
  'Numeric/L': t('Outfit-Medium', 28, 31, -0.7),
  'Numeric/M': t('Outfit-Medium', 17, 21, -0.25),
  'Numeric/S': t('Outfit-Medium', 12, 15, 0.3),
  // Figma Numeric/Timer (5.1 mid 20:799): Fraunces SemiBold 52 / 58, +2.
  'Numeric/Timer': t('Fraunces-SemiBold', 52, 58, 2),
  Statement: t('Outfit-Medium', 24, 29, -0.45),
  'Button/L': t('Outfit-Medium', 17, 22, -0.15),
  'Button/M': t('Outfit-Medium', 15, 20, -0.05),
  'Tab label': t('Outfit-Regular', 11, 13, 0.2),
  'Nav label': t('Outfit-Regular', 11, 13, -0.2),
  Wordmark: t('Outfit-Medium', 34, 36, -1.2),
  Tagline: t('Outfit-Regular', 11, 14, 2.4, true),
  /** Compact logo wordmark (Logo Lockup=Compact). */
  'Wordmark/Compact': t('Outfit-Medium', 24, 26, -0.8),
  /** 1.1b letter body only (Figma 436:385 — raw 15/22, not a shared style). */
  'Body/Letter': t('Outfit-Regular', 15, 22, -0.05),
  /** Comment body only (Comment 132:4846 — raw 14.8/18, +0.13, not a shared style). 7.1 comments · 3.8 answers. */
  'Body/Comment': t('Outfit-Regular', 14.8, 18, 0.13),
  /** 1.1b letter signature only. */
  Handwriting: t('Gaegu-Bold', 20, 24),
  /** Auth Button · Google — Google Sans Medium, 14/20 at 40 tall scaled to the 44 button (Google branding guidelines). */
  'Auth label/Google': t('GoogleSans-Medium', 15, 22),
  /** Auth Button · Apple (custom button) — same font as Google; size = 43% of the 44 button height (Apple HIG). */
  'Auth label/Apple': t('GoogleSans-Medium', 19, 23),
} as const;

export type TextVariant = keyof typeof text;

/**
 * Dynamic Type cap. Buttons, chips, inputs and the tab bar have fixed heights (Figma variant sizes), so text may grow
 * only this far before it would clip. Text at 28 and up (Display · Numeric) is already large and does not grow.
 */
export const FONT_SCALE_MAX = 1.3;
export const fontScaleMax = (fontSize: number | undefined) => ((fontSize ?? 0) >= 28 ? 1 : FONT_SCALE_MAX);
