import { useId } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { MOOD_BASE, moods, type MoodSpec, type WeatherMood } from '../theme';

/** `spec` draws a gradient that isn't one of the 18 moods (e.g. LAUNCH_SKY); `mood` is ignored then. */
type Props = { mood?: WeatherMood; spec?: MoodSpec; style?: ViewStyle; opacity?: number; base?: string };

/** Weather Mood 2.0 background (docs/01-foundations.md §2.4). Fills its parent. */
export function MoodGradient({ mood = 'clear', spec: custom, style, opacity = 1, base = MOOD_BASE }: Props) {
  const spec = custom ?? moods[mood];
  const id = useId().replace(/:/g, '');
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={`${id}-base`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={spec.top} />
            <Stop offset="0.55" stopColor={spec.mid} />
            <Stop offset="1" stopColor={base} />
          </LinearGradient>
          {spec.blobs.map((bl, i) => (
            <RadialGradient key={i} id={`${id}-b${i}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={bl.color} stopOpacity={bl.a} />
              <Stop offset="0.55" stopColor={bl.color} stopOpacity={bl.a * 0.45} />
              <Stop offset="1" stopColor={bl.color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill={`url(#${id}-base)`} />
        {spec.blobs.map((bl, i) => (
          <Ellipse key={i} cx={bl.cx * 100} cy={bl.cy * 100} rx={bl.rx * 100} ry={bl.ry * 100} fill={`url(#${id}-b${i})`} />
        ))}
      </Svg>
    </View>
  );
}
