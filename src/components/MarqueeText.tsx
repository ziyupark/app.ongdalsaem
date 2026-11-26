import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import type { ColorToken, TextVariant } from '../theme';
import { Text } from './Text';

/** Space between the end of the text and its next copy while scrolling. */
const GAP = 40;
/** Scroll speed (pt per second) and the pause at the start of each lap. */
const SPEED = 32;
const PAUSE_MS = 1200;

/**
 * One line of text, centred. When it is wider than the room it has, it scrolls to the left in a loop
 * (the text and a copy side by side, pausing at the start of each lap). Reduce Motion = ends with … instead.
 */
export function MarqueeText({ text, variant, color }: { text: string; variant: TextVariant; color?: ColorToken }) {
  const reduce = useReducedMotion();
  const [boxW, setBoxW] = useState(0);
  const [textW, setTextW] = useState(0);
  const scroll = !reduce && boxW > 0 && textW > boxW + 0.5;
  const x = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(x);
    x.value = 0;
    if (!scroll) return;
    const d = textW + GAP;
    x.value = withRepeat(
      withSequence(withDelay(PAUSE_MS, withTiming(-d, { duration: (d / SPEED) * 1000, easing: Easing.linear })), withTiming(0, { duration: 0 })),
      -1,
    );
    return () => cancelAnimation(x);
  }, [scroll, textW, x]);

  const anim = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={styles.box} onLayout={(e) => setBoxW(e.nativeEvent.layout.width)}>
      {/* Measures the text's natural width without wrapping. */}
      <View style={styles.measure} pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants">
        <Text variant={variant} numberOfLines={1} onLayout={(e) => setTextW(e.nativeEvent.layout.width)}>{text}</Text>
      </View>
      {scroll ? (
        <Animated.View accessible accessibilityLabel={text} style={[styles.row, { width: textW * 2 + GAP }, anim]}>
          <Text variant={variant} color={color} numberOfLines={1} style={{ width: textW }}>{text}</Text>
          <Text variant={variant} color={color} numberOfLines={1} style={{ width: textW, marginLeft: GAP }} accessible={false}>{text}</Text>
        </Animated.View>
      ) : (
        <Text variant={variant} color={color} numberOfLines={1} style={styles.center}>{text}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignSelf: 'stretch', overflow: 'hidden' },
  measure: { position: 'absolute', left: 0, top: 0, width: 10000, flexDirection: 'row', opacity: 0 },
  row: { flexDirection: 'row', alignSelf: 'flex-start' },
  center: { textAlign: 'center' },
});
