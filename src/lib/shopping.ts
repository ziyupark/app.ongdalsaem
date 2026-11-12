// Shopping list (6.3 Diary, under the fridge) — ingredients to buy. Device-only like the fridge memo: AsyncStorage, never synced.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { addFridge } from './fridge';

export type ShoppingItem = { id: string; name: string; amount?: string; /** The dish it came from (7.1 "Add to shopping list"). */ fromFoodId?: string; checked: boolean };

const KEY = 'ongdalsaem.shopping';
let items: ShoppingItem[] = [];
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

async function load() {
  loaded = true;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) items = [...items, ...(JSON.parse(raw) as ShoppingItem[])];
  } catch {
    // keep whatever is in memory
  }
  emit();
}

function save(next: ShoppingItem[]) {
  items = next;
  AsyncStorage.setItem(KEY, JSON.stringify(items)).catch(() => undefined);
  emit();
}

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export function getShopping() {
  return items;
}
/** Add ingredients — one already on the list from the same dish is updated (amount) instead of added twice. */
export async function addShopping(list: { name: string; amount?: string }[], fromFoodId?: string) {
  if (!loaded) await load();
  let next = [...items];
  for (const it of list) {
    const name = it.name.trim();
    if (!name) continue;
    const amount = it.amount?.trim() || undefined;
    const at = next.findIndex((x) => same(x.name, name) && x.fromFoodId === fromFoodId);
    if (at >= 0) next[at] = { ...next[at], amount, checked: false };
    else next = [...next, { id: newId(), name, amount, fromFoodId, checked: false }];
  }
  save(next);
}
export function toggleShopping(id: string) {
  save(items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
}
export function removeShopping(id: string) {
  save(items.filter((i) => i.id !== id));
}
/** "Bought → to the fridge": checked items go into the fridge (fridge zone) and leave the list. */
export function moveCheckedToFridge() {
  const done = items.filter((i) => i.checked);
  done.forEach((i) => addFridge(i.name, 'fridge'));
  save(items.filter((i) => !i.checked));
}
export function useShopping() {
  return useSyncExternalStore((l) => {
    listeners.add(l);
    if (!loaded) load();
    return () => { listeners.delete(l); };
  }, getShopping);
}
