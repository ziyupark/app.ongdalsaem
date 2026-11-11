// Fridge memo (6.3 Diary, bottom) — ingredients I put in the fridge. Device-only: AsyncStorage, never synced.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

export type FridgeItem = { id: string; name: string; /** ISO time it went in. */ addedAt: string };

const KEY = 'ongdalsaem.fridge';
let items: FridgeItem[] = [];
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

async function load() {
  loaded = true;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) items = [...(JSON.parse(raw) as FridgeItem[]), ...items];
  } catch {
    // keep whatever is in memory
  }
  emit();
}

function save(next: FridgeItem[]) {
  items = next;
  AsyncStorage.setItem(KEY, JSON.stringify(items)).catch(() => undefined);
  emit();
}

export function getFridge() {
  return items;
}
export function addFridge(name: string) {
  const n = name.trim();
  if (!n) return;
  save([{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: n, addedAt: new Date().toISOString() }, ...items]);
}
export function removeFridge(id: string) {
  save(items.filter((i) => i.id !== id));
}
export function useFridge() {
  return useSyncExternalStore((l) => {
    listeners.add(l);
    if (!loaded) load();
    return () => { listeners.delete(l); };
  }, getFridge);
}
