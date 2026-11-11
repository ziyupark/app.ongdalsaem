import { Extrapolation, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

/** Scroll distance (pt) by which the mood wash has fully faded out. */
const FADE_BY = 300;

/**
 * Home / Profile mood wash — it moves up with the content and fades out as you scroll, gone after ~300 pt.
 * Call `onY(contentOffset.y)` from the screen's onScroll and put `style` on the wash's Animated.View.
 */
export function useWashScroll() {
  const y = useSharedValue(0);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [0, FADE_BY], [1, 0], Extrapolation.CLAMP),
    // Pulled down (overscroll) it stays put; scrolled up it travels with the content.
    transform: [{ translateY: -Math.max(0, y.value) }],
  }));
  return {
    onY: (v: number) => {
      y.value = v;
    },
    style,
  };
}
