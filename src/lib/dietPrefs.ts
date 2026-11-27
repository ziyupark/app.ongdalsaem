// My diet & allergies (profiles.diet · profiles.allergies), loaded once and kept in memory for picks, search and 7.1.
import { useSyncExternalStore } from 'react';
import { ALLERGENS, DIETS, MAX_DIET_TAGS, NO_DIET, type Diet, type DietPrefs } from './allergens';
import { fetchMyProfileRow, myUserId, supabase } from './supabase';

const NONE = NO_DIET;
let prefs: DietPrefs = NONE;
let loading: Promise<DietPrefs> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const tags = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()).slice(0, MAX_DIET_TAGS) : []);
const parse = (r: { diet?: unknown; allergies?: unknown; custom_diet?: unknown; custom_allergies?: unknown } | null): DietPrefs => ({
  diet: DIETS.includes(r?.diet as Diet) ? (r!.diet as Diet) : null,
  allergies: Array.isArray(r?.allergies) ? ALLERGENS.filter((a) => (r!.allergies as unknown[]).includes(a)) : [],
  customDiet: tags(r?.custom_diet),
  customAllergies: tags(r?.custom_allergies),
});

/** Loads once per session (the auth listener below reloads on sign-in / sign-out). Never throws — no prefs on failure. */
function loadDietPrefs(): Promise<DietPrefs> {
  if (!loading) {
    loading = (async () => {
      try {
        const uid = await myUserId();
        if (!uid) return NONE;
        // custom_* arrive with migration 20261129000000 — until it's applied, read the fixed lists only.
        const data = await fetchMyProfileRow('diet, allergies, custom_diet, custom_allergies').catch((e) => {
          if (e?.code === '42703' || e?.code === 'PGRST204') return fetchMyProfileRow('diet, allergies');
          throw e;
        });
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
// Another account signs in (or this one signs out) → forget the cached prefs.
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
    if (event === 'SIGNED_OUT') { prefs = NONE; emit(); }
    loading = null;
    if (listeners.size) loadDietPrefs();
  }
});

function getDietPrefs() {
  return prefs;
}

export async function saveDietPrefs(next: DietPrefs) {
  const uid = await myUserId();
  if (!uid) throw new Error('Not signed in');
  const { error } = await supabase
    .from('profiles')
    .update({ diet: next.diet, allergies: next.allergies, custom_diet: next.customDiet, custom_allergies: next.customAllergies })
    .eq('id', uid);
  if (error) throw error;
  prefs = { ...next, allergies: ALLERGENS.filter((a) => next.allergies.includes(a)) };
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

export type { DietPrefs };
