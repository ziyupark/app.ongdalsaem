// Supabase session storage in the iOS Keychain / Android Keystore (expo-secure-store) instead of plain AsyncStorage.
//
// * SecureStore values should stay under ~2 KB, so a session is kept in chunks of 500 characters
//   (`<key>.0`, `<key>.1` …, count in `<key>.n`).
// * Keychain items can outlive an uninstall on iOS. A marker in AsyncStorage (which an uninstall does clear) tells a
//   fresh install from an update: a fresh install drops any leftover Keychain session (signed out, as before),
//   an update moves the session it had in AsyncStorage over once, so nobody is signed out by this change.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const OPTS: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK };
const CHUNK = 500; // characters (code points) — ≤ 2 KB even for 4-byte characters
const marker = (key: string) => `secure-session.${key}`;
const safe = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, '_');

async function readSecure(key: string): Promise<string | null> {
  const k = safe(key);
  const n = Number((await SecureStore.getItemAsync(`${k}.n`, OPTS)) ?? 0);
  if (!n) return null;
  let out = '';
  for (let i = 0; i < n; i++) {
    const part = await SecureStore.getItemAsync(`${k}.${i}`, OPTS);
    if (part == null) return null;
    out += part;
  }
  return out;
}

async function removeSecure(key: string) {
  const k = safe(key);
  const n = Number((await SecureStore.getItemAsync(`${k}.n`, OPTS)) ?? 0);
  await SecureStore.deleteItemAsync(`${k}.n`, OPTS);
  for (let i = 0; i < n; i++) await SecureStore.deleteItemAsync(`${k}.${i}`, OPTS);
}

async function writeSecure(key: string, value: string) {
  await removeSecure(key);
  const chars = Array.from(value);
  const parts: string[] = [];
  for (let i = 0; i < chars.length; i += CHUNK) parts.push(chars.slice(i, i + CHUNK).join(''));
  const k = safe(key);
  for (let i = 0; i < parts.length; i++) await SecureStore.setItemAsync(`${k}.${i}`, parts[i], OPTS);
  await SecureStore.setItemAsync(`${k}.n`, String(parts.length), OPTS);
}

export const secureAuthStorage = {
  async getItem(key: string): Promise<string | null> {
    if (await AsyncStorage.getItem(marker(key))) return readSecure(key);
    // First run of this build on this install.
    await removeSecure(key).catch(() => undefined);
    const legacy = await AsyncStorage.getItem(key);
    if (legacy != null) {
      await writeSecure(key, legacy);
      await AsyncStorage.removeItem(key);
    }
    await AsyncStorage.setItem(marker(key), '1');
    return legacy;
  },
  async setItem(key: string, value: string) {
    await writeSecure(key, value);
    await AsyncStorage.multiSet([[marker(key), '1']]);
    await AsyncStorage.removeItem(key);
  },
  async removeItem(key: string) {
    await removeSecure(key);
    await AsyncStorage.removeItem(key);
  },
};
