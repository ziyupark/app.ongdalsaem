// Device-side preferences (9.1 Appearance · Temperature · 9.4 notification toggles · 9.6 language).
// Account-level values (privacy, location, marketing) live on profiles and are saved by services/settings.ts.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import i18n, { deviceLanguage, ensureLanguage, type AppLanguage } from '../i18n';

export { deviceLanguage, NATIVE_NAMES, SUPPORTED_LANGUAGES } from '../i18n';

export type Appearance = 'system' | 'light' | 'dark';
export type TempUnit = 'C' | 'F';
export type Prefs = {
  appearance: Appearance;
  tempUnit: TempUnit;
  /** null = follow the device language. */
  language: AppLanguage | null;
  notify: { acorns: boolean; comments: boolean; followers: boolean; dailyPick: boolean; timer: boolean };
  /** "HH:MM", 24 h. */
  pickTime: string;
};

const KEY = 'ongdalsaem.prefs';
const defaults: Prefs = {
  appearance: 'system',
  tempUnit: 'C',
  language: null,
  notify: { acorns: true, comments: true, followers: true, dailyPick: true, timer: true },
  pickTime: '07:30',
};

let prefs: Prefs = defaults;
const listeners = new Set<() => void>();


function apply() {
  const lng = prefs.language ?? deviceLanguage();
  if (i18n.language !== lng) {
    ensureLanguage(lng);
    i18n.changeLanguage(lng).catch(() => undefined);
  }
}

export async function loadPrefs() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Prefs>;
      prefs = { ...defaults, ...saved, notify: { ...defaults.notify, ...(saved.notify ?? {}) } };
    }
  } catch {
    prefs = defaults;
  }
  apply();
  listeners.forEach((l) => l());
}

export function getPrefs() {
  return prefs;
}
export function setPrefs(patch: Partial<Prefs>) {
  prefs = { ...prefs, ...patch, notify: { ...prefs.notify, ...(patch.notify ?? {}) } };
  AsyncStorage.setItem(KEY, JSON.stringify(prefs)).catch(() => undefined);
  apply();
  listeners.forEach((l) => l());
}
/** Subscribe outside React (push sync). Returns an unsubscribe. */
export function onPrefs(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
export function usePrefs() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, getPrefs);
}

/** °C stored everywhere; shown in the unit picked in 9.1. */
export function displayTemp(c: number, unit: TempUnit = prefs.tempUnit) {
  return unit === 'F' ? Math.round((c * 9) / 5 + 32) : Math.round(c);
}
export function useTemp() {
  const { tempUnit } = usePrefs();
  return (c: number) => displayTemp(c, tempUnit);
}
