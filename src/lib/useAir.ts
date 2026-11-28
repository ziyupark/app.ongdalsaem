import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { fetchAirQuality, type AirReading } from '../services/airQuality';
import { roundCoord } from '../services/location';
import type { Here } from './useHere';

/**
 * Home air quality card state (docs/05-behavior.md §6.11). Never stays on `loading`: a read that hasn't answered in
 * READ_TIMEOUT becomes `error` (noData), unless the last good reading for this place is on the device — then that one
 * is shown (the card marks it stale when it is more than 3 hours old).
 * off = no device location (permission denied, or a city chosen in 9.7) → the locationDenied state.
 */
export type AirState =
  | { status: 'loading' }
  | { status: 'off' }
  | { status: 'error' }
  | { status: 'ready'; reading: AirReading };

const TTL = 30 * 60_000;
const READ_TIMEOUT = 10_000;
const LAST_KEY = 'air.last';

let memo: { key: string; reading: AirReading; at: number } | null = null;
const keyOf = (lat: number, lon: number) => `${roundCoord(lat)},${roundCoord(lon)}`;

const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);

async function lastFor(key: string): Promise<AirReading | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_KEY);
    const last = raw ? (JSON.parse(raw) as { key: string; reading: AirReading }) : null;
    return last?.key === key ? last.reading : null;
  } catch {
    return null;
  }
}

export function useAir(here: Here) {
  const [state, setState] = useState<AirState>({ status: 'loading' });
  const lat = here.coords?.latitude;
  const lon = here.coords?.longitude;
  const key = lat != null && lon != null ? keyOf(lat, lon) : null;
  const run = useRef(0);

  const read = useCallback(async (force = false) => {
    if (here.status === 'loading') return;
    if (!key || lat == null || lon == null) { setState({ status: 'off' }); return; }
    if (!force && memo?.key === key && Date.now() - memo.at < TTL) { setState({ status: 'ready', reading: memo.reading }); return; }
    const n = ++run.current;
    setState((s) => (s.status === 'ready' ? s : { status: 'loading' }));
    const fresh = await withTimeout(fetchAirQuality({ latitude: lat, longitude: lon }).catch(() => null), READ_TIMEOUT);
    if (n !== run.current) return;
    if (fresh) {
      memo = { key, reading: fresh, at: Date.now() };
      AsyncStorage.setItem(LAST_KEY, JSON.stringify({ key, reading: fresh })).catch(() => undefined);
      setState({ status: 'ready', reading: fresh });
      return;
    }
    const last = memo?.key === key ? memo.reading : await lastFor(key);
    if (n !== run.current) return;
    setState(last ? { status: 'ready', reading: last } : { status: 'error' });
  }, [here.status, key, lat, lon]);

  useEffect(() => { read(); }, [read]);
  // Back to the foreground: re-read (still within the 30-minute TTL → no network).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') read(); });
    return () => sub.remove();
  }, [read]);

  return { air: state, retry: () => read(true) };
}
