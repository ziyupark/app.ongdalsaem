// Kitchen timers (5.1) — app-wide, survive restarts (AsyncStorage) and ring as a local notification when the app is closed.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
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
  watchEnds();
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
    watchEnds();
  } catch {
    // start empty
  }
}

// App open: a timer's notification only plays its sound — the in-app "— done" toast stands in for the banner.
// Other notifications (and timers ringing while the app is closed) are unchanged.
Notifications.setNotificationHandler({
  handleNotification: async (n) => {
    const timer = typeof n.request.content.data?.timerId === 'string';
    return { shouldShowBanner: !timer, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false };
  },
});

// Tiny stores: finished timers waiting for their toast (one at a time, oldest first) and the latest "show this timer" request.
const uiListeners = new Set<() => void>();
const uiEmit = () => uiListeners.forEach((l) => l());
const uiSub = (l: () => void) => { uiListeners.add(l); return () => { uiListeners.delete(l); }; };
let doneQueue: string[] = [];
let focusReq: { id: string } | null = null;

export function useDoneQueue() {
  useEffect(() => { load(); }, []);
  return useSyncExternalStore(uiSub, () => doneQueue);
}
export function dismissDone(id: string) {
  if (!doneQueue.includes(id)) return;
  doneQueue = doneQueue.filter((x) => x !== id);
  uiEmit();
}
/** Ask the Timer screen to put this timer on the big ring (a new object each time, so the same id works twice). */
export function focusTimer(id: string) {
  focusReq = { id };
  uiEmit();
}
export const useFocusRequest = () => useSyncExternalStore(uiSub, () => focusReq);

const buzzed = new Set<string>();
/** The phone buzzes 3× (Success) and, with the app open, a "— done" toast queues. Once per run of a timer, whether the ring, the notification or the foreground watch sees the end first. */
export function ringFinished(id: string) {
  const t = timers.find((x) => x.id === id);
  if (!t) return;
  const key = `${id}:${t.endAt}`;
  if (buzzed.has(key)) return;
  buzzed.add(key);
  [0, 400, 800].forEach((ms) => setTimeout(() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined); }, ms));
  if (AppState.currentState === 'active' && !doneQueue.includes(id)) {
    doneQueue = [...doneQueue, id];
    uiEmit();
  }
}
Notifications.addNotificationReceivedListener((n) => {
  const id = n.request.content.data?.timerId;
  if (typeof id === 'string') ringFinished(id);
});

// While the app is open, catch each end on any screen (also with timer notifications off).
let watch: ReturnType<typeof setTimeout> | undefined;
function watchEnds() {
  clearTimeout(watch);
  watch = undefined;
  if (AppState.currentState !== 'active') return;
  const now = Date.now();
  const next = timers.reduce((m, t) => (t.endAt != null && t.endAt > now ? Math.min(m, t.endAt) : m), Infinity);
  if (next === Infinity) return;
  watch = setTimeout(() => {
    const at = Date.now();
    timers.forEach((t) => { if (t.endAt != null && t.endAt <= at) ringFinished(t.id); });
    watchEnds();
  }, Math.min(next - now + 50, 2 ** 31 - 1));
}
AppState.addEventListener('change', watchEnds);

async function schedule(t: KitchenTimer, seconds: number) {
  if (!getPrefs().notify.timer) return undefined;
  try {
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) {
      const asked = await Notifications.requestPermissionsAsync();
      if (!asked.granted) return undefined;
    }
    return await Notifications.scheduleNotificationAsync({
      content: { title: t.foodName ? `${t.foodName} · ${t.label}` : t.label, body: t.source ? `${t.source.dishName} · ${t.source.step}/${t.source.stepCount}` : undefined, data: { timerId: t.id }, sound: 'default', interruptionLevel: 'timeSensitive' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, Math.round(seconds)) },
    });
  } catch {
    return undefined;
  }
}

// Each schedule / cancel bumps the timer's generation; a schedule that resolves after a later pause / reset / remove
// (or a newer schedule) is stale and its notification is cancelled straight away.
const gens = new Map<string, number>();
const bump = (id: string) => { const g = (gens.get(id) ?? 0) + 1; gens.set(id, g); return g; };
const cancelId = (nid: string) => { Notifications.cancelScheduledNotificationAsync(nid).catch(() => undefined); };

function cancel(t: KitchenTimer) {
  bump(t.id);
  if (t.notificationId) cancelId(t.notificationId);
}

async function arm(t: KitchenTimer, seconds: number) {
  const gen = bump(t.id);
  const nid = await schedule(t, seconds);
  if (!nid) return;
  const cur = timers.find((x) => x.id === t.id);
  if (gens.get(t.id) !== gen || !cur || cur.endAt !== t.endAt) {
    cancelId(nid);
    return;
  }
  replace(t.id, { ...cur, notificationId: nid });
}

function replace(id: string, next: KitchenTimer | null) {
  timers = next ? timers.map((t) => (t.id === id ? next : t)) : timers.filter((t) => t.id !== id);
  emit();
}

export function secondsLeft(t: KitchenTimer, now = Date.now()) {
  return t.endAt == null ? t.leftSec : Math.max(0, Math.ceil((t.endAt - now) / 1000));
}
export const isFinished = (t: KitchenTimer, now = Date.now()) => secondsLeft(t, now) === 0;

export async function startTimer(label: string, seconds: number, source?: TimerSource, foodName?: string) {
  const t: KitchenTimer = { id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, label, totalSec: seconds, endAt: Date.now() + seconds * 1000, leftSec: seconds, source, foodName: foodName?.trim() || undefined };
  timers = [t, ...timers];
  emit();
  await arm(t, seconds);
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
  await arm(next, t.leftSec);
}

export async function resetTimer(id: string) {
  const t = timers.find((x) => x.id === id);
  if (!t) return;
  cancel(t);
  replace(id, { ...t, endAt: null, leftSec: t.totalSec, notificationId: undefined });
}

/**
 * Add time (5.1 "15s +" = 15, done banner "+1 min" = 60) — also revives a finished timer, which starts running again.
 * Only the time left grows; totalSec stays, so the ring caps at full (min(1, left / total)).
 */
export async function addTime(id: string, sec: number) {
  const t = timers.find((x) => x.id === id);
  if (!t) return;
  cancel(t);
  const before = secondsLeft(t);
  const left = before + sec;
  const running = t.endAt != null || before === 0;
  const next: KitchenTimer = { ...t, leftSec: left, endAt: running ? Date.now() + left * 1000 : null, notificationId: undefined };
  replace(id, next);
  if (running) await arm(next, left);
}

export const addMinute = (id: string) => addTime(id, 60);

/** Set the time left directly (dragging the big ring). `run` → it counts down from there; otherwise it stays paused. */
export async function setTimeLeft(id: string, sec: number, run: boolean) {
  const t = timers.find((x) => x.id === id);
  if (!t) return;
  cancel(t);
  const left = Math.max(1, Math.round(sec));
  const next: KitchenTimer = { ...t, leftSec: left, endAt: run ? Date.now() + left * 1000 : null, notificationId: undefined };
  replace(id, next);
  if (run) await arm(next, left);
}

export function removeTimer(id: string) {
  const t = timers.find((x) => x.id === id);
  if (t) cancel(t);
  replace(id, null);
}

export function useTimers() {
  useEffect(() => { load(); }, []);
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => timers);
}

/** Re-render on every second boundary while mounted and `active`; stops while the app is in the background. */
export function useNow(active = true) {
  const [now, setNow] = useState(Date.now());
  // Turning on (a timer starts) → read the clock in this render, not the stale value from when ticking stopped.
  const [wasActive, setWasActive] = useState(active);
  if (wasActive !== active) {
    setWasActive(active);
    if (active) setNow(Date.now());
  }
  useEffect(() => {
    if (!active) return;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let interval: ReturnType<typeof setInterval> | undefined;
    const stop = () => {
      clearTimeout(timeout);
      clearInterval(interval);
      timeout = interval = undefined;
    };
    const start = () => {
      stop();
      setNow(Date.now());
      timeout = setTimeout(() => {
        setNow(Date.now());
        interval = setInterval(() => setNow(Date.now()), 1000);
      }, 1000 - (Date.now() % 1000));
    };
    if (AppState.currentState !== 'background') start();
    const sub = AppState.addEventListener('change', (s) => (s === 'active' ? start() : s === 'background' ? stop() : undefined));
    return () => {
      stop();
      sub.remove();
    };
  }, [active]);
  return now;
}

const pad = (n: number) => String(n).padStart(2, '0');
/** MM:SS, or H:MM:SS from an hour up. */
export const fmt = (sec: number) => (sec >= 3600 ? `${Math.floor(sec / 3600)}:${pad(Math.floor((sec % 3600) / 60))}:${pad(sec % 60)}` : `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`);
