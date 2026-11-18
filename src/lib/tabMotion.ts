import { useRef } from 'react';
import {
  Easing, FadeIn, ReduceMotion, useReducedMotion, withTiming, type EntryExitAnimationFunction,
} from 'react-native-reanimated';

/**
 * Bottom tab switch (Home · Community · Timer · Profile): the stack swaps screens instantly (animation 'none'), and only
 * the body under the ScreenHeader comes in — opacity 0 → 1 + scale 0.98 → 1, 200 ms ease-out (YouTube / X / Material
 * "fade through"). Header, mood wash, weather and the tab bar stay put. Reduce Motion: fade only.
 * No animation on app launch or when the current tab is pressed again: TabBar arms it only for a different tab.
 */
const DURATION = 200;
const EASE = Easing.out(Easing.cubic);
/** A switch arms the next tab screen that mounts within this window (stale arms never fire later). */
const ARM_MS = 800;
/** Content that mounts this soon after the screen (e.g. list cells) joins the same entrance. */
const JOIN_MS = 250;

let armedAt = 0;

/** TabBar calls this when a different tab is pressed, just before navigating. */
export function armTabEnter() {
  armedAt = Date.now();
}

const fadeScale: EntryExitAnimationFunction = () => {
  'worklet';
  const cfg = { duration: DURATION, easing: EASE };
  return {
    initialValues: { opacity: 0, transform: [{ scale: 0.98 }] },
    animations: { opacity: withTiming(1, cfg), transform: [{ scale: withTiming(1, cfg) }] },
  };
};
// Reduce Motion: keep the fade (ReduceMotion.Never — the system setting would otherwise skip it entirely).
const fadeOnly = FadeIn.duration(DURATION).easing(EASE).reduceMotion(ReduceMotion.Never);

/**
 * `entering` for a tab screen's body. Returns the animation only for the mount that follows a tab switch (and for
 * content mounting within ~250 ms of it); otherwise undefined → shown at once.
 */
export function useTabEnter() {
  const reduce = useReducedMotion();
  const start = useRef<number | null>(null);
  if (start.current == null) {
    const now = Date.now();
    start.current = now - armedAt < ARM_MS ? now : 0;
    armedAt = 0;
  }
  const on = start.current > 0 && Date.now() - start.current < JOIN_MS;
  return on ? (reduce ? fadeOnly : fadeScale) : undefined;
}
