import { Image } from 'expo-image';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { getHere, onHere } from '../lib/useHere';
import { WEATHER_3D, WEATHER_FX, type WeatherMood } from '../theme';

/** One slow breath: up 6 pt and a 2° sway, then back (ms per half-cycle). */
const FLOAT_MS = 3200;
const FLOAT_Y = 6;
const FLOAT_DEG = 2;
/** Where the mood's light sits when it has no glow spec (fractions of the wash). */
const SPOT = { cx: 0.78, cy: 0.1, r: 0.3 };

/**
 * 3D Weather Mood image in the screen wash (inside <WeatherFx>, above the glow, under rain / snow). Sits on the mood's
 * light spot (WEATHER_FX glow) at half the glow's size and floats gently. `still` (Reduce Motion / screen not focused)
 * shows it without motion. Moods without a 3D image show nothing. Same image in light and dark (no tint).
 */
export function WeatherIcon3D({ mood, w, h, still }: { mood: WeatherMood; w: number; h: number; still: boolean }) {
  const { t } = useTranslation();
  const p = useSharedValue(0);
  useEffect(() => {
    if (still) { cancelAnimation(p); p.value = 0; return; }
    p.value = withRepeat(withTiming(1, { duration: FLOAT_MS, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(p);
  }, [still, p]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -FLOAT_Y * p.value }, { rotate: `${FLOAT_DEG * (p.value - 0.5)}deg` }],
  }));
  const source = WEATHER_3D[mood];
  if (!source) return null;
  const spot = WEATHER_FX[mood].glow ?? SPOT;
  const d = spot.r * w;
  return (
    <Animated.View style={[styles.abs, { left: spot.cx * w - d / 2, top: spot.cy * h - d / 2, width: d, height: d }, style]}>
      <Image source={source} style={StyleSheet.absoluteFill} contentFit="contain" accessible accessibilityRole="image" accessibilityLabel={t(`weather.${mood}`)} />
    </Animated.View>
  );
}

/** App start: decode only the current weather's 3D image (and again when the mood changes). Returns an unsubscribe. */
export function preloadWeather3D() {
  const done = new Set<WeatherMood>();
  const load = (mood?: WeatherMood) => {
    const source = mood ? WEATHER_3D[mood] : undefined;
    if (!mood || !source || done.has(mood)) return;
    done.add(mood);
    Image.loadAsync(source).catch(() => done.delete(mood));
  };
  load(getHere().forecast?.mood);
  return onHere((h) => load(h.forecast?.mood));
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
});
