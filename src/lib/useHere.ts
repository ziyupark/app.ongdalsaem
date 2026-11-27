import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { getMyProfile } from '../services/profile';
import { supabase } from './supabase';
import { hasLocationPermission, requestDeviceLocation, reverseGeocodeCity, type Coordinates, type Place } from '../services/location';
import { fetchForecast, type Forecast } from '../services/weather';
import { geohash } from './geohash';

export type Here = {
  /** loading → ready (device location) · off (no location: the chosen city, or nothing when none was chosen). */
  status: 'loading' | 'ready' | 'off';
  coords: Coordinates | null;
  place: Place | null;
  forecast: Forecast | null;
  /** 5-char area cell for questions (null when location is off). */
  cell: string | null;
};

/**
 * Where am I + weather now — ONE shared reading for Home, Profile and Community, so the weather never differs
 * between screens. Device location only when already allowed (no prompt) — `allow()` asks. Without it, the city
 * chosen in 9.7 / onboarding. Re-read after 10 minutes, on `reload()`, or when the city changes (`refreshHere`).
 */
const TTL = 10 * 60_000;
let current: Here = { status: 'loading', coords: null, place: null, forecast: null, cell: null };
let loadedAt = 0;
let inflight: Promise<boolean> | null = null;
/** Bumped on sign-in / sign-out: a read started for the previous account (or signed out) is thrown away. */
let gen = 0;
const subs = new Set<(h: Here) => void>();
const EMPTY: Here = { status: 'loading', coords: null, place: null, forecast: null, cell: null };

/**
 * Signed out / account deleted: forget the reading — its city can come from the old profile — so the next screen reads
 * again for whoever signs in. Not stored (here.last is removed separately).
 */
export function resetHere() {
  gen++;
  current = EMPTY;
  loadedAt = 0;
  inflight = null;
  subs.forEach((s) => s(EMPTY));
}
const publish = (h: Here) => {
  current = h;
  subs.forEach((s) => s(h));
  // Last place + weather (never coordinates) so the next launch shows the same header at once.
  if (h.status !== 'loading') AsyncStorage.setItem(LAST_KEY, JSON.stringify({ place: h.place, forecast: h.forecast })).catch(() => undefined);
};

/**
 * Cached reading from the last launch: shown (still `status: 'loading'`) until the fresh one arrives, so the
 * header and the wash don't start blank. Dates in the forecast are revived.
 */
const LAST_KEY = 'here.last';
AsyncStorage.getItem(LAST_KEY)
  .then((raw) => {
    if (!raw || current.status !== 'loading' || current.forecast) return;
    const last = JSON.parse(raw, (k, v) => ((k === 'until' || k === 'at') && typeof v === 'string' ? new Date(v) : v)) as Pick<Here, 'place' | 'forecast'>;
    publish({ ...current, place: last.place ?? null, forecast: last.forecast ?? null });
  })
  .catch(() => undefined);

/** `retry`: the weather couldn't be read (no session yet, offline, server error) — don't keep the empty result for 10 min. */
type ReadResult = { ok: boolean; retry: boolean };

async function read(ask: boolean, g: number): Promise<ReadResult> {
  // The weather function needs a signed-in user (401 otherwise): signed out, skip it — sign-in reads again.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { ok: false, retry: true };
  const me = await getMyProfile().catch(() => null);
  // A city picked in 9.7 turns location off for the app even when the OS permission is still granted.
  const allowed = ask || (me?.locationEnabled !== false && (await hasLocationPermission()));
  const coords = allowed ? await requestDeviceLocation() : null;
  if (coords) {
    const [place, forecast] = await Promise.all([reverseGeocodeCity(coords).catch(() => null), fetchForecast(coords).catch(() => null)]);
    if (g !== gen) return { ok: false, retry: false };
    publish({ status: 'ready', coords, place, forecast, cell: geohash(coords.latitude, coords.longitude) });
    return { ok: true, retry: !forecast };
  }
  const forecast = me?.city ? await fetchForecast({ city: me.city }).catch(() => null) : null;
  if (g !== gen) return { ok: false, retry: false };
  publish({ status: 'off', coords: null, place: me?.city ? { city: me.city } : null, forecast, cell: null });
  return { ok: false, retry: !!me?.city && !forecast };
}

function load({ ask = false, force = false } = {}): Promise<boolean> {
  if (inflight && !ask) return inflight;
  if (!ask && !force && loadedAt && Date.now() - loadedAt < TTL) return Promise.resolve(current.status === 'ready');
  const g = gen;
  const p: Promise<boolean> = read(ask, g)
    .then((r) => { if (g === gen) loadedAt = r.retry ? 0 : Date.now(); return r.ok; })
    .finally(() => { if (inflight === p) inflight = null; });
  inflight = p;
  return p;
}

// First sign-in, or signing in again after signing out: read the weather right away for this account instead of
// waiting for the next screen or the 10-minute timer (a read made while signed out got nothing — 401).
let who: string | null = null;
supabase.auth.onAuthStateChange((event, session) => {
  const id = session?.user.id ?? null;
  if (id === who) return;
  const first = who === null && event === 'INITIAL_SESSION';
  who = id;
  if (!id) { resetHere(); return; }
  if (first) return; // app launch with a stored session: the screens' own first read covers it
  gen++;
  loadedAt = 0;
  inflight = null;
  if (subs.size) load({ force: true });
});

// Screens stay mounted (Home is a tab), so mounting alone isn't enough: re-read when the app comes back to the
// foreground and every TTL while it's open — both still respect the TTL, so this never fetches more than once per 10 min.
let tick: ReturnType<typeof setInterval> | null = null;
const startTick = () => { if (!tick) tick = setInterval(() => { if (subs.size) load(); }, TTL); };
const stopTick = () => { if (tick) clearInterval(tick); tick = null; };
AppState.addEventListener('change', (s) => {
  if (s === 'active') { if (subs.size) load(); startTick(); } else stopTick();
});
if (AppState.currentState === 'active') startTick();

/** The latest shared reading (outside React). */
export function getHere() {
  return current;
}

/** Subscribe outside React without triggering a read (push sync). Returns an unsubscribe. */
export function onHere(cb: (h: Here) => void) {
  subs.add(cb);
  return () => { subs.delete(cb); };
}

/** Call after the city or location permission changes (9.7 Choose city, onboarding). */
export function refreshHere() {
  return load({ force: true });
}

/** "Mapo-gu, Seoul" — ward + city when known. */
export function placeLabel(p: Place | null | undefined) {
  return p ? [p.district, p.city].filter(Boolean).join(', ') : '';
}

export function useHere() {
  const [here, setHere] = useState<Here>(current);
  useEffect(() => {
    subs.add(setHere);
    setHere(current);
    load();
    return () => { subs.delete(setHere); };
  }, []);
  return { here, allow: () => load({ ask: true }), reload: () => load({ force: true }) };
}

