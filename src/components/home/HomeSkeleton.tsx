import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import { radius, space, useTheme } from '../../theme';

/** One shimmering bar (bg/muted ↔ bg/emphasis, 1.2 s loop — docs/04-screens/02-home.md 2.7). */
function Bone({ style, t }: { style: ViewStyle; t: SharedValue<number> }) {
  const { color } = useTheme();
  const a = color('bg/muted');
  const b = color('bg/emphasis');
  const anim = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(t.value, [0, 1], [a, b]) }));
  return <Animated.View style={[style, anim]} />;
}

/** 2.7 State · Loading 76:2961 — Home's body (weather card → pick → feed) at 2.1's positions, under the real header and wash. */
export function HomeSkeleton() {
  const { color } = useTheme();
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
  }, [t]);
  const card = { backgroundColor: color('bg/subtle'), borderColor: color('border/default') };
  return (
    <View accessibilityLabel="Loading" accessibilityRole="progressbar">
      {/* The header (logo · date · title) is the real ScreenHeader above — only the body shimmers. */}
      <View style={styles.weather}>
        <View style={[styles.weatherCard, card]}>
          <View style={styles.now}>
            <Bone t={t} style={{ width: 96, height: 56, borderRadius: radius.md }} />
            <View style={{ gap: space[8] }}>
              <Bone t={t} style={{ width: 110, height: 14, borderRadius: radius.full }} />
              <Bone t={t} style={{ width: 150, height: 12, borderRadius: radius.full }} />
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: color('border/default') }]} />
          <View style={styles.slots}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.slot}>
                <Bone t={t} style={{ width: 36, height: 10, borderRadius: radius.full }} />
                <Bone t={t} style={{ width: 52, height: 52, borderRadius: radius.full }} />
                <Bone t={t} style={{ width: 28, height: 10, borderRadius: radius.full }} />
              </View>
            ))}
          </View>
        </View>
      </View>
      <View style={styles.pick}>
        <Bone t={t} style={{ height: 273, borderRadius: radius['2xl'] }} />
        <View style={[styles.nearby, card]}>
          <Bone t={t} style={{ width: 72, height: 72, borderRadius: radius.lg }} />
          <View style={{ gap: space[8] }}>
            <Bone t={t} style={{ width: 90, height: 10, borderRadius: radius.full }} />
            <Bone t={t} style={{ width: 180, height: 16, borderRadius: radius.sm }} />
            <Bone t={t} style={{ width: 130, height: 12, borderRadius: radius.full }} />
          </View>
        </View>
      </View>
      <View style={styles.feed}>
        <View style={styles.feedHeader}>
          <Bone t={t} style={{ width: 150, height: 11, borderRadius: radius.full }} />
          <Bone t={t} style={{ width: 220, height: 24, borderRadius: radius.md }} />
        </View>
        <View style={styles.chips}>
          {[49, 110, 72, 92].map((w) => <Bone key={w} t={t} style={{ width: w, height: 36, borderRadius: radius.full }} />)}
        </View>
        <View style={{ gap: space[12] }}>
          <View style={styles.postHead}>
            <Bone t={t} style={{ width: 32, height: 32, borderRadius: radius.full }} />
            <View style={{ gap: space[6] }}>
              <Bone t={t} style={{ width: 90, height: 12, borderRadius: radius.full }} />
              <Bone t={t} style={{ width: 120, height: 10, borderRadius: radius.full }} />
            </View>
          </View>
          <Bone t={t} style={{ height: 440, borderRadius: radius.xs }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  weather: { paddingHorizontal: space[20] },
  weatherCard: { height: 239, borderRadius: radius['2xl'], borderWidth: 1, padding: space[20], justifyContent: 'space-between' },
  now: { flexDirection: 'row', alignItems: 'center', gap: space[16] },
  divider: { height: 1 },
  slots: { flexDirection: 'row', justifyContent: 'space-between' },
  slot: { alignItems: 'center', gap: space[8] },
  pick: { paddingTop: space[16], paddingHorizontal: space[20], gap: space[16] },
  nearby: { flexDirection: 'row', alignItems: 'center', gap: space[14], padding: space[14], borderRadius: radius['2xl'], borderWidth: 1 },
  feed: { paddingTop: space[40], gap: space[14] },
  feedHeader: { paddingLeft: space[20], gap: space[8] },
  chips: { flexDirection: 'row', gap: space[8], paddingLeft: space[20] },
  postHead: { flexDirection: 'row', alignItems: 'center', gap: space[10], paddingLeft: space[20] },
});
