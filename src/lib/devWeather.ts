import { useSyncExternalStore } from 'react';
import type { TimeOfDay, WeatherMood } from '../theme';

/**
 * Dev only — forces the wash mood and time of day on every screen (app/dev/weather.tsx), so each weather
 * effect can be checked by eye. Never set in release builds; kept in memory only.
 */
export type DevWeather = { mood: WeatherMood; timeOfDay: TimeOfDay } | null;

let current: DevWeather = null;
const listeners = new Set<() => void>();

export function setDevWeather(next: DevWeather) {
  if (!__DEV__) return;
  current = next;
  listeners.forEach((l) => l());
}

export function useDevWeather(): DevWeather {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
    () => (__DEV__ ? current : null),
  );
}
