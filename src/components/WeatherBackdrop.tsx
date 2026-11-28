import { useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { WASH_FADE_BY, washScrollY, WEATHER_BG_MAX_HEIGHT, WEATHER_BG_TIMING, WEATHER_FX_HEIGHT, weatherBgFor } from '../lib/weatherBackdrop';
import { FX_TIMING, useTheme } from '../theme';
import { MoodGradient } from './MoodGradient';
import { timeOfDayFor, useScreenWeather, useWashLook } from './ScreenHeader';
import { WeatherMoodLayer } from './WeatherMoodLayer';

/**
 * The one weather background of the app: bg/default → Mood wash → WeatherMoodLayer, behind the whole navigator.
 * Mounted once at the root (sibling of the Stack), so the weather motion keeps running across tab switches, pushes
 * and back — nothing on a screen change re-creates it. Screens on WEATHER_BG_ROUTES are transparent and show it;
 * on any other route it fades out (300 ms) and freezes, and fades back in where it stopped on return.
 *
 * - Wash height per route (display option) animates over 400 ms; the motion layer keeps its size.
 * - Scrolling a tab moves the wash up with the content and fades it out by 300 pt (washScrollY).
 * - 2.6 Weather unavailable (no reading): the wash stays, the motion layer is faded out and frozen.
 * - App in the background: frozen; back in the foreground it simply carries on (no fade).
 * - Cold start: the wash fades in (400 ms), then the motion fades in 300 ms later (1200 ms).
 */
export function WeatherBackdrop() {
  const { color } = useTheme();
  const look = useWashLook();
  const { width } = useWindowDimensions();
  const segments = useSegments();
  const route = weatherBgFor(segments as string[]);
  const { on, mood, forecast, dev } = useScreenWeather();
  const fxMood = dev?.mood ?? forecast?.mood ?? null;
  const timeOfDay = dev?.timeOfDay ?? timeOfDayFor(mood, new Date());

  const shown = !!route && on; // the wash
  const fxShown = shown && !!fxMood; // the motion on top of it

  // App in the background → freeze immediately; back → resume as is.
  const [active, setActive] = useState(AppState.currentState !== 'background');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setActive(s === 'active'));
    return () => sub.remove();
  }, []);

  // Wash: cold-start fade-in, then 300 ms hide / show per route.
  const washIn = useSharedValue(0);
  const wash = useSharedValue(shown ? 1 : 0);
  useEffect(() => { washIn.value = withTiming(1, { duration: FX_TIMING.washIn }); }, [washIn]);
  useEffect(() => {
    wash.value = withTiming(shown ? 1 : 0, { duration: shown ? WEATHER_BG_TIMING.show : WEATHER_BG_TIMING.hide });
  }, [shown, wash]);

  // Motion: fade out → then freeze; unfreeze → fade in. Frozen while faded out, so a hidden screen costs no frames.
  const fx = useSharedValue(fxShown ? 1 : 0);
  const [fxRunning, setFxRunning] = useState(fxShown);
  useEffect(() => {
    if (fxShown) {
      setFxRunning(true);
      fx.value = withTiming(1, { duration: WEATHER_BG_TIMING.show });
    } else {
      fx.value = withTiming(0, { duration: WEATHER_BG_TIMING.hide }, (done) => { if (done) scheduleOnRN(setFxRunning, false); });
    }
  }, [fxShown, fx]);

  const height = useSharedValue(route?.washHeight ?? WEATHER_BG_MAX_HEIGHT);
  useEffect(() => {
    if (route) height.value = withTiming(route.washHeight, { duration: WEATHER_BG_TIMING.height });
  }, [route?.washHeight, height]); // eslint-disable-line react-hooks/exhaustive-deps

  const washStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: washIn.value * wash.value * interpolate(washScrollY.value, [0, WASH_FADE_BY], [1, 0], Extrapolation.CLAMP),
    // Pulled down (overscroll) it stays put; scrolled up it travels with the content.
    transform: [{ translateY: -Math.max(0, washScrollY.value) }],
  }));
  // Motion: its own box (WEATHER_FX_HEIGHT, taller than the wash) so it reaches the Weather Card; same scroll move / fade as the wash.
  const fxStyle = useAnimatedStyle(() => ({
    opacity: fx.value * washIn.value * wash.value * interpolate(washScrollY.value, [0, WASH_FADE_BY], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: -Math.max(0, washScrollY.value) }],
  }));

  // Mood for the motion layer: keep the last one while it fades out for 2.6, so it doesn't vanish mid-fade.
  const [layerMood, setLayerMood] = useState(fxMood);
  useEffect(() => { if (fxMood) setLayerMood(fxMood); }, [fxMood]);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: color('bg/default') }]}>
      {on ? (
        <>
          <Animated.View style={[styles.wash, washStyle]}>
            <MoodGradient mood={mood} opacity={look.opacity} base={look.base} />
          </Animated.View>
          <Animated.View style={[styles.wash, { height: WEATHER_FX_HEIGHT }, fxStyle]}>
            <WeatherMoodLayer
              mood={layerMood}
              timeOfDay={timeOfDay}
              running={fxRunning && active}
              width={width}
              height={WEATHER_FX_HEIGHT}
              delay={FX_TIMING.washIn + FX_TIMING.startDelay}
            />
          </Animated.View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wash: { position: 'absolute', left: 0, right: 0, top: 0, overflow: 'hidden' },
});
