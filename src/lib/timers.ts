// Kitchen timers (5.1) — app-wide, survive restarts (AsyncStorage) and ring as a local notification when the app is closed.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { getPrefs } from './prefs';

export type TimerSource = { foodId: string; dishName: string; step: number; stepCount: number; next?: string };

export type KitchenTimer = {
  id: string;
  label: string;
  totalSec: number;
  /** Running: epoch ms when it rings. Paused / finished: null. */
  endAt: number | null;
  /** Paused: seconds left. */
  leftSec: number;
  source?: TimerSource;
  /** 5.1 "Food Name" — typed in the Add timer sheet; recipe timers use the dish name. */
  foodName?: string;
  notificationId?: string;
};

/** The dish this timer is for: typed food name, else the recipe's dish. */
export const foodOf = (t: KitchenTimer) => t.foodName?.trim() || t.source?.dishName || null;

const KEY = 'ongdalsaem.timers';
let timers: KitchenTimer[] = [];
let loaded = false;
const listeners = new Set<() => void>();

const emit = () => {
  listeners.forEach((l) => l());
  AsyncStorage.setItem(KEY, JSON.stringify(timers)).catch(() => undefined);
};

async function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as KitchenTimer[]) : [];
    if (Array.isArray(list)) timers = list;
    listeners.forEach((l) => l());
  } catch {
    // start empty
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

async function schedule(t: KitchenTimer, seconds: number) {
  if (!getPrefs().notify.timer) return undefined;
  try {
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) {
      const asked = await Notifications.requestPermissionsAsync();
      if (!asked.granted) return undefined;
    }
    return await Notifications.scheduleNotificationAsync({
      content: { title: t.foodName ? `${t.foodName} · ${t.label}` : t.label, body: t.source ? `${t.source.dishName} · ${t.source.step}/${t.source.stepCount}` : undefined, sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, Math.round(seconds)) },
    });
  } catch {
    return undefined;
  }
}
function cancel(t: KitchenTimer) {
  if (t.notificationId) Notifications.cancelScheduledNotificationAsync(t.notificationId).catch(() => undefined);
}

function replace(id: string, next: KitchenTimer | null) {
  timers = next ? timers.map((t) => (t.id === id ? next : t)) : timers.filter((t) => t.id !== id);
  emit();
}

export function secondsLeft(t: KitchenTimer, now = Date.now()) {
  return t.endAt == null ? t.leftSec : Math.max(0, Math.ceil((t.endAt - now) / 1000));
}
export const isRunning = (t: KitchenTimer, now = Date.now()) => t.endAt != null && t.endAt > now;
export const isFinished = (t: KitchenTimer, now = Date.now()) => secondsLeft(t, now) === 0;

export async function startTimer(label: string, seconds: number, source?: TimerSource, foodName?: string) {
  const t: KitchenTimer = { id: `t-${Date.now()}`, label, totalSec: seconds, endAt: Date.now() + seconds * 1000, leftSec: seconds, source, foodName: foodName?.trim() || undefined };
  timers = [t, ...timers];
  emit();
  const nid = await schedule(t, seconds);
  if (nid) replace(t.id, { ...(timers.find((x) => x.id === t.id) ?? t), notificationId: nid });
  return t.id;
}

export function pauseTimer(id: string) {
  const t = timers.find((x) => x.id === id);
  if (!t || t.endAt == null) return;
  cancel(t);
  replace(id, { ...t, leftSec: secondsLeft(t), endAt: null, notificationId: undefined });
}

export async function resumeTimer(id: string) {
  const t = timers.find((x) => x.id === id);
  if (!t || t.endAt != null || t.leftSec <= 0) return;
  const next = { ...t, endAt: Date.now() + t.leftSec * 1000 };
  replace(id, next);
  const nid = await schedule(next, t.leftSec);
  if (nid) replace(id, { ...next, notificationId: nid });
}

export async function resetTimer(id: string) {
  const t = timers.find((x) => x.id === id);
  if (!t) return;
  cancel(t);
  replace(id, { ...t, endAt: null, leftSec: t.totalSec, notificationId: undefined });
}

/** Add time (5.1 "15s +" = 15, done banner "+1 min" = 60) — also revives a finished timer, which starts running again. */
export async function addTime(id: string, sec: number) {
  const t = timers.find((x) => x.id === id);
  if (!t) return;
  cancel(t);
  const before = secondsLeft(t);
  const left = before + sec;
  const running = t.endAt != null || before === 0;
  const next: KitchenTimer = { ...t, totalSec: t.totalSec + sec, leftSec: left, endAt: running ? Date.now() + left * 1000 : null, notificationId: undefined };
  replace(id, next);
  if (running) {
    const nid = await schedule(next, left);
    if (nid) replace(id, { ...next, notificationId: nid });
  }
}

export const addMinute = (id: string) => addTime(id, 60);

export function removeTimer(id: string) {
  const t = timers.find((x) => x.id === id);
  if (t) cancel(t);
  replace(id, null);
}

export function useTimers() {
  useEffect(() => { load(); }, []);
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => timers);
}

/** Re-render every second while mounted. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const h = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(h);
  }, [intervalMs]);
  return now;
}

export const fmt = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
