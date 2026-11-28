import { useSyncExternalStore } from 'react';
import type { WeatherMood } from '../theme';
import type { SkyPhase } from './skyPhase';

/**
 * Dev only — forces the wash mood and day / sunset / night on every screen (app/dev/weather.tsx), so each weather
 * effect can be checked by eye. Never set in release builds; kept in memory only.
 */
export type DevWeather = { mood: WeatherMood; phase: SkyPhase } | null;

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
