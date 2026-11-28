import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { AppState, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { FX_TIMING, LAUNCH_SKY, useTheme, withAlpha, type TimeOfDay, type WeatherMood } from '../theme';
import { MoodGradient } from './MoodGradient';
import { WeatherMoodLayer } from './WeatherMoodLayer';

/** Sky height (`photo:welcome` 390×420). */
const SKY_H = 420;

/** Figma layer blur 103.3 = Gaussian σ 51.65 (Figma exports blur r as stdDeviation r/2 — cf. the sun shadow's 10.55). */
const GLOW_SIGMA = 103.3 / 2;

/** Normal CDF (Abramowitz–Stegun erf, |error| < 1.5e-7). */
function phi(x: number) {
  const z = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * z);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-z * z);
  return 0.5 * (1 + (x < 0 ? -erf : erf));
}

/**
 * The two glows are full-width bands, so their blur is purely vertical: a band y0–y1 blurred by σ has opacity
 * Φ((y − y0)/σ) − Φ((y − y1)/σ). Each band = one vertical gradient over y0 − 2.5σ … y1 + 2.5σ with 13 stops of that
 * curve — an SVG Gaussian blur this large got cut off in a straight line on iOS.
 */
/** Lower glow band (990 wide, 389 tall): 1.1 Splash at y 228, 1.2 Sign in at y 236. */
const glowsFor = (lowTop: number) => ([[302, 543], [lowTop, lowTop + 389]] as const).map(([y0, y1]) => {
  const top = y0 - 2.5 * GLOW_SIGMA;
  const h = y1 - y0 + 5 * GLOW_SIGMA;
  const locations = Array.from({ length: 13 }, (_, i) => i / 12);
  const alphas = locations.map((l) => {
    const y = top + l * h;
    return phi((y - y0) / GLOW_SIGMA) - phi((y - y1) / GLOW_SIGMA);
  });
  return { top, h, locations, alphas };
});
const GLOWS_SPLASH = glowsFor(228);
const GLOWS_SIGN_IN = glowsFor(236);

/**
 * Launch backdrop shared by 1.1 Splash (1157:10518) and 1.2 Sign in (1207:10884), bottom → top:
 * - sky `photo:welcome` 390×420 = Mood/clear (LAUNCH_SKY) fading to bg/default, + Scrim top 0–120 (ink 18 % → 0);
 * - two soft white glows (layer blur 103.3): a full-width band y 302–543 and a 990-wide band y 228–617 on 1.1 / 236–625 on 1.2 (x −300),
 *   drawn as their vertical blur profile (glowsFor).
 * Design px from the top, full width (the 390 frame stretches). The Fade layer of the frames sits under the sky
 * and is fully covered by it, so it isn't drawn.
 *
 * `weather` (1.2 Sign in): the sky follows the weather now — clear keeps the launch sky, any other mood fades its
 * Weather Mood wash in over it (1200 ms) — and the Weather Mood motion (WeatherMoodLayer: rain, snow, clouds, sun
 * glow …) runs over the sky, frozen while the app is in the background. Without it (1.1 Splash): the still launch sky.
 */
export function LaunchBackdrop({ weather }: { weather?: { mood: WeatherMood; timeOfDay: TimeOfDay } }) {
  const { width } = useWindowDimensions();
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
      {(weather ? GLOWS_SIGN_IN : GLOWS_SPLASH).map((g, i) => (
        <LinearGradient
          key={i}
          colors={g.alphas.map((a) => withAlpha(glow, a)) as unknown as readonly [string, string, ...string[]]}
          locations={g.locations as unknown as readonly [number, number, ...number[]]}
          style={[styles.glow, { top: g.top, height: g.h }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sky: { position: 'absolute', left: 0, right: 0, top: 0, height: SKY_H, overflow: 'hidden' },
  scrim: { position: 'absolute', left: 0, right: 0, top: 0, height: 120 },
  glow: { position: 'absolute', left: 0, right: 0 },
});
