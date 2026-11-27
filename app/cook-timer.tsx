import { router } from 'expo-router';
import { KitchenTimerScreen } from '../src/components/timer/KitchenTimerScreen';

/**
 * 5.1_0 Kitchen timer from a recipe step (Figma 1219:18053) — pushed over the post, so back returns to the post at the
 * same scroll position. The step's text is the timer's food name.
 */
export default function CookTimer() {
  return <KitchenTimerScreen onBack={() => (router.canGoBack() ? router.back() : router.replace('/timer'))} />;
}
