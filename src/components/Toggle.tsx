import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { Easing, interpolateColor, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { elevation, radius, useTheme } from '../theme';

const W = 51;
const H = 31;
const THUMB = 27;
const INSET = (H - THUMB) / 2;
const TRAVEL = W - THUMB - INSET * 2;

/**
 * Switch 6:253 — 51×31, thumb 27 (2 inset, Elevation/4 Overlay), On = bg/primary track + white thumb at the right, Off = bg/emphasis.
 * Drawn here instead of the system Switch: iOS 26's native switch is larger than the box React Native lays out
 * (51×31), so it overflowed up and to the right of every row. This one is exactly the Figma size on every OS.
 */
export function Toggle({ value, onValueChange, disabled, accessibilityLabel }: { value: boolean; onValueChange: (v: boolean) => void; disabled?: boolean; accessibilityLabel: string }) {
  const { color } = useTheme();
  const reduce = useReducedMotion();
  const on = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    on.value = withTiming(value ? 1 : 0, { duration: reduce ? 0 : 180, easing: Easing.out(Easing.cubic) });
  }, [value, reduce, on]);
  const offTrack = color('bg/emphasis');
  const onTrack = color('bg/primary');
  const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(on.value, [0, 1], [offTrack, onTrack]) }));
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: on.value * TRAVEL }] }));
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled: !!disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={() => onValueChange(!value)}
      style={disabled ? styles.disabled : null}
    >
      <Animated.View style={[styles.track, track]}>
        <Animated.View style={[styles.thumb, elevation['Elevation/4 Overlay'], { backgroundColor: color('static/white') }, thumb]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: W, height: H, borderRadius: radius.full, padding: INSET },
  thumb: { width: THUMB, height: THUMB, borderRadius: radius.full },
  disabled: { opacity: 0.4 },
});
