// My diet & allergies (profiles.diet · profiles.allergies), loaded once and kept in memory for picks, search and 7.1.
import { useSyncExternalStore } from 'react';
import { ALLERGENS, DIETS, type Allergen, type Diet, type DietPrefs } from './allergens';
import { myUserId, supabase } from './supabase';

const NONE: DietPrefs = { diet: null, allergies: [] };
let prefs: DietPrefs = NONE;
let loading: Promise<DietPrefs> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const parse = (r: { diet?: unknown; allergies?: unknown } | null): DietPrefs => ({
  diet: DIETS.includes(r?.diet as Diet) ? (r!.diet as Diet) : null,
  allergies: Array.isArray(r?.allergies) ? ALLERGENS.filter((a) => (r!.allergies as unknown[]).includes(a)) : [],
});

/** Loads once per session (signing in again reloads through `reloadDietPrefs`). Never throws — no prefs on failure. */
export function loadDietPrefs(): Promise<DietPrefs> {
  if (!loading) {
    loading = (async () => {
      try {
        const uid = await myUserId();
        if (!uid) return NONE;
        const { data, error } = await supabase.from('profiles').select('diet, allergies').eq('id', uid).maybeSingle();
        if (error) throw error;
        prefs = parse(data);
        emit();
      } catch {
        loading = null; // try again next time
      }
      return prefs;
    })();
  }
  return loading;
}
export function reloadDietPrefs() {
  loading = null;
  return loadDietPrefs();
}

// Another account signs in (or this one signs out) → forget the cached prefs.
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
    if (event === 'SIGNED_OUT') { prefs = NONE; emit(); }
    loading = null;
    if (listeners.size) loadDietPrefs();
  }
});

export function getDietPrefs() {
  return prefs;
}

export async function saveDietPrefs(next: DietPrefs) {
  const uid = await myUserId();
  if (!uid) throw new Error('Not signed in');
  const { error } = await supabase.from('profiles').update({ diet: next.diet, allergies: next.allergies }).eq('id', uid);
  if (error) throw error;
  prefs = { diet: next.diet, allergies: ALLERGENS.filter((a) => next.allergies.includes(a)) };
  loading = Promise.resolve(prefs);
  emit();
}

export function useDietPrefs(): DietPrefs {
  return useSyncExternalStore((l) => {
    listeners.add(l);
    loadDietPrefs();
    return () => { listeners.delete(l); };
  }, getDietPrefs);
}

export type { Allergen, Diet, DietPrefs };
