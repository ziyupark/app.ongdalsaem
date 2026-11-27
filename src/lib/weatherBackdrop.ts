import { makeMutable } from 'react-native-reanimated';

/**
 * Global weather background (src/components/WeatherBackdrop.tsx) — one Mood wash + WeatherMoodLayer behind every
 * screen, mounted once at the app root so the motion never restarts on navigation.
 *
 * Shown only on the routes below (their screens are transparent so it shows through). Everywhere else — post detail
 * 7.x, settings, notifications, Question, Special days around the world and every other pushed screen — it fades
 * out (300 ms) and pauses behind that screen's opaque bg token (7.1 draws its own wash + motion, ScreenWash `motion`), then fades back in and resumes where it stopped.
 * Pushed screens can't be transparent: the native stack would show the tab underneath through them.
 *
 * Key = expo-router segments joined with '/'. Add or remove a route here only.
 */
export const WEATHER_BG_ROUTES: Record<string, { washHeight: number }> = {
  '(tabs)/home': { washHeight: 420 },
  '(tabs)/community': { washHeight: 420 },
  '(tabs)/timer': { washHeight: 420 },
  '(tabs)/profile': { washHeight: 420 },
  // Dev mood preview (a transparent sheet over the tabs).
  'dev/weather': { washHeight: 420 },
};

/** Tallest wash — the motion layer is laid out once at this size; the visible height is clipped. */
export const WEATHER_BG_MAX_HEIGHT = Math.max(...Object.values(WEATHER_BG_ROUTES).map((r) => r.washHeight));

export const WEATHER_BG_TIMING = { hide: 300, show: 300, height: 400 } as const;

/** Scroll offset of the focused tab screen — the wash moves up with its content and fades out by 300 pt. */
export const washScrollY = makeMutable(0);
export const WASH_FADE_BY = 300;

export function weatherBgFor(segments: string[]) {
  return WEATHER_BG_ROUTES[segments.join('/')] ?? null;
}
