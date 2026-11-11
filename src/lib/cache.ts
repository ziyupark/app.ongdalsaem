import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 6.4b Offline: keep the last good copy of a list. `cached(key, load)` returns fresh data (and stores it), or the stored
 * copy when loading fails; it still throws when there is no copy, so callers can show the offline state.
 * Dates are revived from ISO strings for keys ending in "At".
 */
export async function cached<T>(key: string, load: () => Promise<T>): Promise<{ data: T; stale: boolean }> {
  try {
    const data = await load();
    AsyncStorage.setItem(`cache.${key}`, JSON.stringify(data)).catch(() => undefined);
    return { data, stale: false };
  } catch (e) {
    const raw = await AsyncStorage.getItem(`cache.${key}`).catch(() => null);
    if (!raw) throw e;
    const data = JSON.parse(raw, (k, v) => (typeof v === 'string' && /At$/.test(k) && /^\d{4}-\d\d-\d\dT/.test(v) ? new Date(v) : v)) as T;
    return { data, stale: true };
  }
}
