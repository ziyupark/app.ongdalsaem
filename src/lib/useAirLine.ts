import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { chooseLine, type AirCopy, type AirGrade, type AirLast, type AirLine, type AirTimeSlot, type MenuPick } from './airQuality';

/** Last line shown per grade · time slot, on the device only: { "bad:dinner": { templateId, menu } }. */
const LAST_KEY = 'air.lastLine';
/** Pick without waiting any longer for the dish pool (slow network) — the card never waits on it forever. */
const POOL_WAIT = 6000;

async function readLast(): Promise<Record<string, AirLast>> {
  try {
    const raw = await AsyncStorage.getItem(LAST_KEY);
    return raw ? (JSON.parse(raw) as Record<string, AirLast>) : {};
  } catch {
    return {};
  }
}

/**
 * The card's line: chosen once per grade · slot while Home is mounted (not on every render), skipping the template and
 * menu shown last time for that grade · slot, and saved as the new "last". Waits for the dish pool (`menusReady`)
 * for at most POOL_WAIT, then picks with whatever menus there are (none → the grade's fallback).
 */
export function useAirLine(copy: AirCopy, grade: AirGrade | null, slot: AirTimeSlot, menus: MenuPick[], menusReady: boolean): AirLine | null {
  const [line, setLine] = useState<{ key: string; line: AirLine } | null>(null);
  const [waited, setWaited] = useState(false);
  const menusRef = useRef(menus);
  menusRef.current = menus;
  const key = grade ? `${grade}:${slot}` : null;

  useEffect(() => {
    const h = setTimeout(() => setWaited(true), POOL_WAIT);
    return () => clearTimeout(h);
  }, []);

  useEffect(() => {
    if (!grade || !key || line?.key === key || (!menusReady && !waited)) return;
    let alive = true;
    (async () => {
      const all = await readLast();
      if (!alive) return;
      const next = chooseLine(copy, grade, slot, menusRef.current, all[key] ?? null);
      setLine({ key, line: next });
      all[key] = { templateId: next.templateId, menu: next.dish?.name ?? null };
      AsyncStorage.setItem(LAST_KEY, JSON.stringify(all)).catch(() => undefined);
    })();
    return () => { alive = false; };
  }, [copy, grade, slot, key, menusReady, waited, line?.key]);

  return line?.key === key ? line.line : null;
}
