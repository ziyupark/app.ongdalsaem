import { useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { iconRing, radius, space, useTheme, type ColorToken } from '../theme';
import { Icon } from './Icon';
import { RotateCcw } from './icons/ongdal';

/**
 * Refresh — 32 circle, 1px border/default ring, `rotate-ccw` 16 only. Each tap spins the icon once (400 ms)
 * and taps within 1 s are ignored (docs/05-behavior.md §6.1). Weather Card Picks head · 6.3 "What you can cook now".
 */
export function RefreshButton({ label, onPress, fill }: { label: string; onPress: () => void; fill?: ColorToken }) {
  const { color } = useTheme();
  const spin = useSharedValue(0);
  const last = useRef(0);
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${-spin.value * 360}deg` }] }));
  const press = () => {
    const now = Date.now();
    if (now - last.current < 1000) return;
    last.current = now;
    spin.value = 0;
    spin.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    onPress();
  };
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={space[6]} onPress={press}
      style={[styles.btn, { borderColor: color('border/default') }, fill ? { backgroundColor: color(fill) } : null]}>
      <Animated.View style={spinStyle}>
        <Icon icon={RotateCcw} size={16} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: 32, height: 32, borderRadius: radius.full, borderWidth: iconRing, alignItems: 'center', justifyContent: 'center' },
});
