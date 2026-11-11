import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { gradients, useTheme } from '../../theme';

/**
 * Timer ring — track bg/emphasis, remaining arc Gradient/Dusk (Gradient/Done when finished), clockwise from 12 o'clock.
 * `mirror` (5.1 active ring 20:796): the spent part opens clockwise from 12 o'clock, so the remaining arc ends at the top.
 */
export function TimerRing({ size, stroke, progress, done, mirror, children }: { size: number; stroke: number; progress: number; done?: boolean; mirror?: boolean; children?: ReactNode }) {
  const { color } = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  const id = `ring-${size}`;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={mirror ? styles.mirror : undefined}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            {gradients['Gradient/Dusk'].map((s) => <Stop key={s.offset} offset={s.offset} stopColor={s.color} />)}
          </LinearGradient>
          {/* Finished (676:22871): green at the top-left fading to clay at the bottom-right — flipped back when mirrored. */}
          <LinearGradient id={`${id}-done`} x1={mirror ? '1' : '0'} y1="0" x2={mirror ? '0' : '1'} y2="1">
            {gradients['Gradient/Done'].map((s, i) => <Stop key={s.offset} offset={s.offset} stopColor={i === 0 ? color('fg/done') : s.color} />)}
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color('bg/emphasis')} strokeWidth={stroke} fill="none" />
        {p > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={done ? `url(#${id}-done)` : `url(#${id})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={c * (1 - p)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' }, mirror: { transform: [{ scaleX: -1 }] } });
