import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
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

/**
 * A MoodGradient that cross-fades when the background changes (mood family or day / sunset / night): the new one fades
 * in over `duration` (1 s) on top of the old, which is then dropped. `id` = the background key (e.g. `rain_sunset`).
 */
export function FadingMoodGradient({ id, spec, opacity = 1, base = MOOD_BASE, duration = 1000 }: { id: string; spec: MoodSpec; opacity?: number; base?: string; duration?: number }) {
  const seq = useRef(0);
  const [layers, setLayers] = useState<{ key: number; id: string; spec: MoodSpec; fade: boolean }[]>(() => [{ key: 0, id, spec, fade: false }]);
  useEffect(() => {
    setLayers((ls) => (ls[ls.length - 1].id === id ? ls : [ls[ls.length - 1], { key: ++seq.current, id, spec, fade: true }]));
  }, [id, spec]);
  const settle = useCallback((key: number) => setLayers((ls) => (ls[ls.length - 1].key === key ? ls.slice(-1) : ls)), []);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      {layers.map((l) => (
        <FadeIn key={l.key} fade={l.fade} duration={duration} onDone={() => settle(l.key)}>
          <MoodGradient spec={l.spec} base={base} />
        </FadeIn>
      ))}
    </View>
  );
}

function FadeIn({ fade, duration, onDone, children }: { fade: boolean; duration: number; onDone: () => void; children: React.ReactNode }) {
  const o = useSharedValue(fade ? 0 : 1);
  useEffect(() => {
    if (!fade) return;
    o.value = withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }, (done) => { if (done) scheduleOnRN(onDone); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[StyleSheet.absoluteFill, style]}>{children}</Animated.View>;
}
