import { Extrapolation, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { WASH_FADE_BY as FADE_BY } from './weatherBackdrop';

/**
 * Home / Profile mood wash — it moves up with the content and fades out as you scroll, gone after ~300 pt.
 * Call `onY(contentOffset.y)` from the screen's onScroll and put `style` on the wash's Animated.View
 * (or hand the whole thing to <ScreenWash wash={…} /> on a tab, which drives the global WeatherBackdrop with `y`).
 */
export type WashScroll = ReturnType<typeof useWashScroll>;
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
    y,
  };
}
