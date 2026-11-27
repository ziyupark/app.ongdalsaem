import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { AppState, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import Svg, { Defs, FeGaussianBlur, Filter, Rect } from 'react-native-svg';
import { FX_TIMING, LAUNCH_SKY, useTheme, withAlpha, type TimeOfDay, type WeatherMood } from '../theme';
import { MoodGradient } from './MoodGradient';
import { WeatherMoodLayer } from './WeatherMoodLayer';

/** Sky height (`photo:welcome` 390×420). */
const SKY_H = 420;

/** Figma layer blur 103.3 = Gaussian σ 51.65 (Figma exports blur r as stdDeviation r/2 — cf. the sun shadow's 10.55). */
const GLOW_SIGMA = 103.3 / 2;

/**
 * Launch backdrop shared by 1.1 Splash (1157:10518) and 1.2 Sign in (1207:10884), bottom → top:
 * - sky `photo:welcome` 390×420 = Mood/clear (LAUNCH_SKY) fading to bg/default, + Scrim top 0–120 (ink 18 % → 0);
 * - two soft white glows (layer blur 103.3): a full-width band y 302–543 and a 990-wide band y 228–617 (x −300).
 * Design px from the top, full width (the 390 frame stretches). The Fade layer of the frames sits under the sky
 * and is fully covered by it, so it isn't drawn.
 *
 * `weather` (1.2 Sign in): the sky follows the weather now — clear keeps the launch sky, any other mood fades its
 * Weather Mood wash in over it (1200 ms) — and the Weather Mood motion (WeatherMoodLayer: rain, snow, clouds, sun
 * glow …) runs over the sky, frozen while the app is in the background. Without it (1.1 Splash): the still launch sky.
 */
export function LaunchBackdrop({ weather }: { weather?: { mood: WeatherMood; timeOfDay: TimeOfDay } }) {
  const { width, height } = useWindowDimensions();
  const { color } = useTheme();
  const bg = color('bg/default');
  const glow = color('bg/subtle'); // Figma #FDFDFD — white glow (dark mode: the raised dark surface)
  const ink = color('static/ink');
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => setActive(st === 'active'));
    return () => sub.remove();
  }, []);
  const mood = weather?.mood;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.sky}>
        <MoodGradient spec={LAUNCH_SKY} base={bg} />
        {mood && mood !== 'clear' ? (
          <Animated.View key={mood} entering={FadeIn.duration(FX_TIMING.fadeIn)} exiting={FadeOut.duration(FX_TIMING.fadeOut)} style={StyleSheet.absoluteFill}>
            <MoodGradient mood={mood} base={bg} />
          </Animated.View>
        ) : null}
        {weather ? (
          <WeatherMoodLayer mood={weather.mood} timeOfDay={weather.timeOfDay} running={active} width={width} height={SKY_H} delay={FX_TIMING.startDelay} />
        ) : null}
        <LinearGradient colors={[withAlpha(ink, 0.18), withAlpha(ink, 0)]} style={styles.scrim} />
      </View>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <Filter id="launch-glow" filterUnits="userSpaceOnUse" x={-400} y={0} width={width + 800} height={height}>
            <FeGaussianBlur stdDeviation={GLOW_SIGMA} />
          </Filter>
        </Defs>
        <Rect x={0} y={302} width={width} height={241} fill={glow} filter="url(#launch-glow)" />
        <Rect x={-300} y={228} width={width + 600} height={389} fill={glow} filter="url(#launch-glow)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  sky: { position: 'absolute', left: 0, right: 0, top: 0, height: SKY_H, overflow: 'hidden' },
  scrim: { position: 'absolute', left: 0, right: 0, top: 0, height: 120 },
});
