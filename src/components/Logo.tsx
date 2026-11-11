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
  return (
    <View style={lockup === 'Acorn' ? styles.stack : styles.compact} accessible accessibilityRole="header" accessibilityLabel={word}>
      {lockup === 'Acorn' ? <Image source={ACORN_SYMBOL} style={styles.acorn} contentFit="contain" /> : null}
      <View>
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
  acorn: { width: 36, height: 46 },
  hidden: { opacity: 0 },
});
