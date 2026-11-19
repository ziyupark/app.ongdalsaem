import { Image } from 'expo-image';
import { useId, useState } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { gradients, space, text } from '../theme';
import { Text } from './Text';

/** tone 'light' = solid white wordmark for dark backgrounds (dark weather washes). */
type Props = { lockup: 'Acorn' | 'Compact'; tagline?: string; tone?: 'ink' | 'light' };

const ACORN_SYMBOL = require('../../assets/brand/acorn-symbol.svg');

/**
 * Logo 4:18 — "ongdalsaem" wordmark filled with Gradient/Ink metal (top → bottom).
 * Acorn = Acorn Symbol 36×46 → Wordmark 34/36 → Tagline, centred, gap 10 (1.1 Splash).
 * Compact = 24/26 header wordmark, left aligned (1.2).
 * The invisible Text sizes the box; the SVG paints the gradient fill on top of it. The RN measure and the SVG text
 * width don't always agree on device, so the Acorn lockup anchors the SVG text on the box centre (it stays centred
 * under the acorn whatever the measure) and Compact anchors it on the left edge.
 * The wordmark is always Outfit (never the locale font), and the SVG overhangs the box by PAD on every side so the
 * "g" descender, the ascenders and the last letter are never clipped — the box keeps the token's size for layout.
 */
const PAD = 0.35;

/** Outfit Medium metrics (per em) the optical corrections are derived from. */
const OUTFIT = { baseline: 0.35, xHeight: 0.49, ascender: 0.71 }; // baseline = below the line box centre (see SvgText y)
/** Acorn Symbol 36×46: the cap + nut ("body") run y 4–46; only the stem sits above (0–8). */
const ACORN = { w: 36, h: 46, bodyTop: 4 };

/**
 * Optical spacing — position corrections only (sizes stay the Figma tokens), each a fraction of the logo's own size:
 * - iconOffsetY (× acorn height): centre the acorn on its body, not its bounding box — the stem side gives up its room.
 * - wordmarkOffsetY (× font size): centre the wordmark on its x-height; the "g" descender doesn't count.
 * - gap (× font size): ascender ink above the baseline — the Acorn lockup's space[10] runs from the acorn body to that
 *   ink, not to the line box top.
 * - overshoot: round forms read smaller than letters; the acorn is drawn 2 % larger (layout box unchanged).
 * - splashLift (× screen height): 1.1 Splash places the lockup on the visual centre, 2.5 % above the middle.
 */
export const LOGO_OPTICAL = {
  iconOffsetY: -ACORN.bodyTop / ACORN.h / 2,
  wordmarkOffsetY: -(OUTFIT.baseline - OUTFIT.xHeight / 2),
  gap: OUTFIT.ascender - OUTFIT.baseline,
  overshoot: 1.02,
  /** Splash: the lockup sits this share of the screen height above the mathematical centre (visual centre). */
  splashLift: 0.025,
};

export function Logo({ lockup, tagline, tone = 'ink' }: Props) {
  const variant = lockup === 'Acorn' ? 'Wordmark' : 'Wordmark/Compact';
  const style = text[variant];
  const id = useId().replace(/:/g, '');
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const word = 'ongdalsaem';
  const pad = Math.ceil((style.fontSize as number) * PAD);
  const centred = lockup === 'Acorn';
  // Horizontal room on each side for SVG text that runs wider than the RN measure (kerning / tracking).
  const side = pad + (style.fontSize as number) * 2;
  const fs = style.fontSize as number;
  const lh = style.lineHeight as number;
  const iconY = LOGO_OPTICAL.iconOffsetY * ACORN.h;
  const acornShift = { transform: [{ translateY: iconY }, { scale: LOGO_OPTICAL.overshoot }] };
  // Acorn lockup: the wordmark (and the tagline under it) moves up by the empty line-box room above the ascender ink,
  // plus what the acorn body moved up / grew, so acorn body → letters reads as exactly space[10].
  const inkTop = lh / 2 - fs * LOGO_OPTICAL.gap;
  const lift = centred ? -(inkTop - iconY - (LOGO_OPTICAL.overshoot - 1) * ACORN.h / 2) : 0;
  // Compact: the wordmark sits on its x-height centre, so the header row and its icon buttons line up on it.
  const wordShift = { transform: [{ translateY: fs * LOGO_OPTICAL.wordmarkOffsetY }] };
  return (
    <View style={lockup === 'Acorn' ? styles.stack : styles.compact} accessible accessibilityRole="header" accessibilityLabel={word}>
      {lockup === 'Acorn' ? <Image source={ACORN_SYMBOL} style={[styles.acorn, acornShift]} contentFit="contain" /> : null}
      <View style={centred ? { marginTop: lift } : wordShift}>
        <RNText style={[style, styles.hidden]} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
          {word}
        </RNText>
        {box ? (
          <Svg
            width={box.w + side * 2}
            height={box.h + pad * 2}
            style={{ position: 'absolute', left: -side, top: -pad }}
            pointerEvents="none"
          >
            <Defs>
              <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                {gradients['Gradient/Ink metal'].map((s) => <Stop key={s.offset} offset={s.offset} stopColor={s.color} />)}
              </LinearGradient>
            </Defs>
            <SvgText
              x={centred ? side + box.w / 2 : side}
              textAnchor={centred ? 'middle' : 'start'}
              // Baseline ≈ line box centre + 0.35 em (Outfit metrics).
              y={pad + box.h / 2 + (style.fontSize as number) * 0.35}
              fill={tone === 'light' ? '#FFFFFF' : `url(#${id})`}
              fontFamily={style.fontFamily as string}
              fontSize={style.fontSize as number}
              letterSpacing={style.letterSpacing as number}
            >
              {word}
            </SvgText>
          </Svg>
        ) : null}
      </View>
      {/* Letter spacing also lands after the last letter; pull that trailing gap back so the tagline centres on its glyphs. */}
      {tagline ? <Text variant="Tagline" color="fg/muted" style={{ marginRight: -Number(text.Tagline.letterSpacing) }}>{tagline}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  compact: { alignItems: 'flex-start' },
  stack: { alignItems: 'center', gap: space[10] },
  acorn: { width: ACORN.w, height: ACORN.h },
  hidden: { opacity: 0 },
});
