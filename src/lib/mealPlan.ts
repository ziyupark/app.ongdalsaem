// Meal plan (6.3 Diary · This week) — what I plan to cook for breakfast / lunch / dinner. Device-only: AsyncStorage, never synced.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

export type PlanMeal = 'breakfast' | 'lunch' | 'dinner';
/** Display / sort order. Plans saved before breakfast existed are still 'lunch' | 'dinner'. */
export const PLAN_MEALS: PlanMeal[] = ['breakfast', 'lunch', 'dinner'];
/** A planned dish: a post (`foodId`, with its name and photo for display) or just a name. */
export type PlanItem = { id: string; /** Local date YYYY-MM-DD. */ date: string; meal: PlanMeal; foodId?: string; name: string; photo?: string };

const KEY = 'ongdalsaem.mealPlan';
let items: PlanItem[] = [];
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const pad = (n: number) => String(n).padStart(2, '0');
/** Local date key YYYY-MM-DD. */
export const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

async function load() {
  loaded = true;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    // Keep what was added before loading finished; drop plans older than 30 days.
    const cutoff = dateKey(new Date(Date.now() - 30 * 86400_000));
    if (raw) items = [...(JSON.parse(raw) as PlanItem[]).filter((i) => i.date >= cutoff), ...items];
  } catch {
    // keep whatever is in memory
  }
  emit();
}

function save(next: PlanItem[]) {
  items = next;
  AsyncStorage.setItem(KEY, JSON.stringify(items)).catch(() => undefined);
  emit();
}

function getMealPlan() {
  return items;
}
/** Plan a dish for a day's breakfast / lunch / dinner — replaces what was planned for that meal. */
export async function setPlan(date: string, meal: PlanMeal, dish: { foodId?: string; name: string; photo?: string }) {
  if (!loaded) await load();
  const name = dish.name.trim();
  if (!name) return;
  const item: PlanItem = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, date, meal, name, ...(dish.foodId ? { foodId: dish.foodId } : {}), ...(dish.photo ? { photo: dish.photo } : {}) };
  save([...items.filter((i) => !(i.date === date && i.meal === meal)), item]);
}
export function removePlan(id: string) {
  save(items.filter((i) => i.id !== id));
}
export function useMealPlan() {
  return useSyncExternalStore((l) => {
    listeners.add(l);
    if (!loaded) load();
    return () => { listeners.delete(l); };
  }, getMealPlan);
}
