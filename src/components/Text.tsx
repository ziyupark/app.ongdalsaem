import { useTranslation } from 'react-i18next';
import { Platform, Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { FONT_METRICS, text, useTheme, type ColorToken, type TextVariant } from '../theme';

type Props = TextProps & { variant?: TextVariant; color?: ColorToken };

/** Korean locale: Outfit has no Hangul, so UI text switches to Noto Sans KR (docs/01-foundations.md §2.6, 05-behavior §9.1). */
const KOREAN_FAMILY: Record<string, string> = {
  'Outfit-Light': 'NotoSansKR-Regular',
  'Outfit-Regular': 'NotoSansKR-Regular',
  'Outfit-Medium': 'NotoSansKR-Medium',
};

/**
 * ja · zh-TW · th · vi: Outfit has no Kana/Han/Thai/Vietnamese glyphs, and mixing per-glyph fallbacks looks ragged —
 * UI text uses the platform system font (Hiragino / PingFang / Thonburi / SF) at the same weight instead.
 */
const SYSTEM_LANGS = new Set(['ja', 'zh-TW', 'th', 'vi']);
const SYSTEM_FONT = Platform.OS === 'ios' ? 'System' : 'sans-serif';
const SYSTEM_WEIGHT: Record<string, TextStyle['fontWeight']> = { 'Outfit-Light': '300', 'Outfit-Regular': '400', 'Outfit-Medium': '500' };

/** Font override for the current UI language (null = keep the token's family). */
export function localeFont(fontFamily: unknown, lang: string): TextStyle | null {
  const f = String(fontFamily);
  if (lang === 'ko' && KOREAN_FAMILY[f]) return { fontFamily: KOREAN_FAMILY[f] };
  if (SYSTEM_LANGS.has(lang) && SYSTEM_WEIGHT[f]) return { fontFamily: SYSTEM_FONT, fontWeight: SYSTEM_WEIGHT[f] };
  return null;
}

/**
 * Big numerals whose token line height is smaller than the font's own height (Numeric/XL 64/64 — Outfit needs ~81).
 * iOS then cuts the top of the glyphs. Render them with the font's natural line height and pull the box back in with
 * negative margins: same layout height as the token, glyphs placed exactly as in Figma (half-leading split evenly).
 */
const UNCLIP = new Set<TextVariant>(['Numeric/XL', 'Numeric/L', 'Numeric/Timer']);

function unclip(fontFamily: unknown, fontSize: number, lineHeight: number): TextStyle | null {
  const m = FONT_METRICS[String(fontFamily)];
  if (!m) return null;
  const natural = Math.ceil((m.ascent + m.descent) * fontSize);
  if (natural <= lineHeight) return null;
  const pull = -(natural - lineHeight) / 2;
  return { lineHeight: natural, marginTop: pull, marginBottom: pull };
}

/** The only text component screens should use — style and color always come from tokens. */
export function Text({ variant = 'Body/M', color = 'fg/default', style, ...rest }: Props) {
  const { color: c } = useTheme();
  const { i18n } = useTranslation();
  const base = text[variant];
  const locale = localeFont(base.fontFamily, i18n.language);
  const fit = UNCLIP.has(variant) && base.fontSize && base.lineHeight ? unclip(locale?.fontFamily ?? base.fontFamily, base.fontSize, base.lineHeight) : null;
  return <RNText {...rest} style={[base, locale, fit, { color: c(color) }, style]} />;
}
