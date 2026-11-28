import { useTranslation } from 'react-i18next';
import { Platform, Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { FONT_METRICS, fontScaleMax, text, useTheme, type ColorToken, type TextVariant } from '../theme';

type Props = TextProps & {
  variant?: TextVariant;
  color?: ColorToken;
  /** Tighter line height than the token (multi-line labels, e.g. "Shopping / list" at 16). See `tighten`. */
  leading?: number;
  /** Text that is in another language than the app (the Korean-only air quality copy) — picks that language's font. */
  lang?: string;
};

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
function localeFont(fontFamily: unknown, lang: string): TextStyle | null {
  const f = String(fontFamily);
  if (lang === 'ko' && KOREAN_FAMILY[f]) return { fontFamily: KOREAN_FAMILY[f] };
  if (SYSTEM_LANGS.has(lang) && SYSTEM_WEIGHT[f]) return { fontFamily: SYSTEM_FONT, fontWeight: SYSTEM_WEIGHT[f] };
  return null;
}

/**
 * Any token whose line height is smaller than the font's own height — Title/M 18/18 (Outfit needs 23), Overline 13/14,
 * Display/XL 46/49 (Fraunces needs 57), the big numerals (Numeric/XL 72/66 needs 91) … iOS then cuts the top and the
 * descenders (g · y · p) of the glyphs. Render them with the font's natural line height and pull the box back in with
 * negative margins: same layout height as the token, glyphs placed exactly as in Figma (half-leading split evenly).
 * Tokens whose line height already fits (Body/M 15/20 …) are left as they are.
 */

/**
 * Scripts drawn taller than Outfit / Fraunces: Korean (Noto Sans KR, ~1.45 em) and the system fonts used for
 * ja · zh-TW · vi (~1.4 em) and th (~1.6 em, stacked marks). The Figma line heights are set for Outfit (e.g. Title/M
 * 18/18), so in these languages every variant gets the same unclip as the big numerals — otherwise iOS cuts the top of
 * the glyphs (seen on "비슷한 한 입"). Fraunces has no Hangul / Kana / Han / Thai either: those glyphs fall back to the
 * system font, so display text uses the system estimate. Latin languages (en · es · pt-BR · id) are unchanged.
 */
const TALL_SCRIPT = new Set(['ko', 'ja', 'zh-TW', 'th', 'vi']);
const SYSTEM_METRICS: Record<string, { ascent: number; descent: number }> = {
  th: { ascent: 1.15, descent: 0.45 },
  default: { ascent: 1.05, descent: 0.35 },
};
const metricsFor = (fontFamily: string, lang: string) =>
  (fontFamily === SYSTEM_FONT || fontFamily.startsWith('Fraunces')) && TALL_SCRIPT.has(lang)
    ? SYSTEM_METRICS[lang] ?? SYSTEM_METRICS.default
    : FONT_METRICS[fontFamily];

function unclip(fontFamily: unknown, fontSize: number, lineHeight: number, lang = 'en'): TextStyle | null {
  const m = metricsFor(String(fontFamily), lang);
  if (!m) return null;
  const natural = Math.ceil((m.ascent + m.descent) * fontSize);
  if (natural <= lineHeight) return null;
  const pull = -(natural - lineHeight) / 2;
  return { lineHeight: natural, marginTop: pull, marginBottom: pull };
}

/**
 * A line height smaller than the font's own height (`leading` prop): iOS and Android keep the descent and cut the
 * extra from the top of every line, so the glyphs sit (natural − leading) / 2 higher than Figma's even half-leading.
 * Push the text back down by that much (the box keeps its height), so a centred multi-line label is truly centred.
 */
function tighten(fontFamily: unknown, fontSize: number, leading: number, lang = 'en'): TextStyle {
  const m = metricsFor(String(fontFamily), lang);
  const natural = m ? Math.ceil((m.ascent + m.descent) * fontSize) : leading;
  const shift = Math.max(0, natural - leading) / 2;
  return { lineHeight: leading, marginTop: shift, marginBottom: -shift };
}

/** The only text component screens should use — style and color always come from tokens. */
export function Text({ variant = 'Body/M', color = 'fg/default', leading, lang: textLang, style, ...rest }: Props) {
  const { color: c } = useTheme();
  const { i18n } = useTranslation();
  const base = text[variant];
  const lang = textLang ?? i18n.language;
  const locale = localeFont(base.fontFamily, lang);
  const family = locale?.fontFamily ?? base.fontFamily;
  const fit = leading != null && base.fontSize
    ? tighten(family, base.fontSize, leading, lang)
    : base.fontSize && base.lineHeight
    ? unclip(locale?.fontFamily ?? base.fontFamily, base.fontSize, base.lineHeight, lang)
    : null;
  return <RNText maxFontSizeMultiplier={fontScaleMax(base.fontSize)} {...rest} style={[base, locale, fit, { color: c(color) }, style]} />;
}
