// 2.4b "Start walking" · "View in a map app" · 2.4 "Search in a map app": hand the place (or a dish search near
// me) to a map app the phone has, by URL scheme only (no map APIs, no keys, no cost). iOS checks need the schemes in LSApplicationQueriesSchemes (app.config.ts).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { Linking, Platform } from 'react-native';

export type MapAppId = 'naver' | 'kakao' | 'google' | 'apple';
export type MapTarget = { lat: number; lon: number; name: string; mapsUri?: string | null };
export type MapAction = 'walk' | 'view';
/** A search ("Bibimbap") around a point (my location) or wherever the map app is. */
export type MapSearch = { query: string; near?: { lat: number; lon: number } | null };

const APP = 'app.ongdalsaem';
const KEY = 'ongdalsaem.mapApp';
const e = encodeURIComponent;

/** Google's web links open the Google Maps app when it is installed (Android always has a browser for them). */
const googleWeb = (t: MapTarget, a: MapAction) => (a === 'walk'
  ? `https://www.google.com/maps/dir/?api=1&destination=${t.lat},${t.lon}&travelmode=walking`
  : t.mapsUri || `https://www.google.com/maps/search/?api=1&query=${t.lat},${t.lon}`);

const URLS: Record<MapAppId, (t: MapTarget, a: MapAction) => string> = {
  naver: (t, a) => (a === 'walk'
    ? `nmap://route/walk?dlat=${t.lat}&dlng=${t.lon}&dname=${e(t.name)}&appname=${APP}`
    : `nmap://place?lat=${t.lat}&lng=${t.lon}&name=${e(t.name)}&appname=${APP}`),
  kakao: (t, a) => (a === 'walk' ? `kakaomap://route?ep=${t.lat},${t.lon}&by=FOOT` : `kakaomap://look?p=${t.lat},${t.lon}`),
  google: (t, a) => (Platform.OS === 'ios'
    ? a === 'walk'
      ? `comgooglemaps://?daddr=${t.lat},${t.lon}&directionsmode=walking`
      : `comgooglemaps://?q=${e(t.name)}&center=${t.lat},${t.lon}`
    : googleWeb(t, a)),
  apple: (t, a) => (a === 'walk' ? `maps://?daddr=${t.lat},${t.lon}&q=${e(t.name)}&dirflg=w` : `maps://?ll=${t.lat},${t.lon}&q=${e(t.name)}`),
};

/** The scheme used to check whether an app is installed. */
const PROBE: Record<MapAppId, string> = { naver: 'nmap://', kakao: 'kakaomap://', google: 'comgooglemaps://', apple: 'maps://' };

/** Korea → Naver · Kakao first; elsewhere → Google · Apple first. */
export function mapAppOrder(): MapAppId[] {
  const kr = getLocales()[0]?.regionCode === 'KR';
  return kr ? ['naver', 'kakao', 'google', 'apple'] : ['google', 'apple', 'naver', 'kakao'];
}

/** Installed map apps, in the order for this device's region. Google is always offered (web link fallback). */
export async function installedMapApps(): Promise<MapAppId[]> {
  const ok = await Promise.all(mapAppOrder().map(async (id) => {
    if (id === 'apple') return Platform.OS === 'ios';
    if (id === 'google' && Platform.OS !== 'ios') return true;
    const has = await Linking.canOpenURL(PROBE[id]).catch(() => false);
    return has || id === 'google';
  }));
  return mapAppOrder().filter((_, i) => ok[i]);
}

const googleSearchWeb = (s: MapSearch) => `https://www.google.com/maps/search/?api=1&query=${e(s.query)}`;

const SEARCH_URLS: Record<MapAppId, (s: MapSearch) => string> = {
  naver: (s) => `nmap://search?query=${e(s.query)}&appname=${APP}`,
  kakao: (s) => `kakaomap://search?q=${e(s.query)}${s.near ? `&p=${s.near.lat},${s.near.lon}` : ''}`,
  google: (s) => (Platform.OS === 'ios'
    ? `comgooglemaps://?q=${e(s.query)}${s.near ? `&center=${s.near.lat},${s.near.lon}` : ''}`
    : googleSearchWeb(s)),
  apple: (s) => `maps://?q=${e(s.query)}${s.near ? `&sll=${s.near.lat},${s.near.lon}` : ''}`,
};

/** Opens the place (or the walk there) in that app; Google without its iOS app, or any failure → Google's web link. */
export async function openMapApp(id: MapAppId, t: MapTarget, a: MapAction) {
  const noGoogleApp = id === 'google' && Platform.OS === 'ios' && !(await Linking.canOpenURL(PROBE.google).catch(() => false));
  try {
    await Linking.openURL(noGoogleApp ? googleWeb(t, a) : URLS[id](t, a));
  } catch {
    await Linking.openURL(googleWeb(t, a)).catch(() => undefined);
  }
}

/** Searches in that app; Google without its iOS app, or any failure → Google's web search. */
export async function searchInMapApp(id: MapAppId, s: MapSearch) {
  const noGoogleApp = id === 'google' && Platform.OS === 'ios' && !(await Linking.canOpenURL(PROBE.google).catch(() => false));
  try {
    await Linking.openURL(noGoogleApp ? googleSearchWeb(s) : SEARCH_URLS[id](s));
  } catch {
    await Linking.openURL(googleSearchWeb(s)).catch(() => undefined);
  }
}

/**
 * Which app to hand off to: the saved one (still installed) or the only installed one → open it straight away;
 * otherwise the installed apps for the picker ("Use this app next time").
 */
export async function chooseMapApp(): Promise<{ open: MapAppId } | { pick: MapAppId[] }> {
  const apps = await installedMapApps();
  const saved = await getSavedMapApp();
  if (saved && apps.includes(saved)) return { open: saved };
  if (apps.length === 1) return { open: apps[0] };
  return { pick: apps };
}

// "Open with this app next time" — saved on the device; changed or cleared in Settings.
export async function getSavedMapApp(): Promise<MapAppId | null> {
  const v = await AsyncStorage.getItem(KEY).catch(() => null);
  return v === 'naver' || v === 'kakao' || v === 'google' || v === 'apple' ? v : null;
}
export async function setSavedMapApp(id: MapAppId | null) {
  if (id) await AsyncStorage.setItem(KEY, id).catch(() => undefined);
  else await AsyncStorage.removeItem(KEY).catch(() => undefined);
}

/** i18n key for each app's name. */
export const MAP_APP_LABEL: Record<MapAppId, string> = {
  naver: 'mapApps.naver', kakao: 'mapApps.kakao', google: 'mapApps.google', apple: 'mapApps.apple',
};
