// 9.4 "Today's pick" push — client half. Registers this device's Expo push token and keeps the server copy of
// what the daily send needs (time, time zone, rounded location, language, unit) in step with Settings.
// The server half: supabase/functions/send-daily-recommendation (weather + one dish, at the chosen time).
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import i18n from '../i18n';
import { roundCoord } from '../services/location';
import { getPrefs, onPrefs } from './prefs';
import { supabase } from './supabase';
import { getHere, onHere, placeLabel } from './useHere';

let token: string | null = null;
let lastSaved = '';
let timer: ReturnType<typeof setTimeout> | null = null;

async function getToken(ask: boolean): Promise<string | null> {
  if (token) return token;
  // Push tokens only exist on real devices — and not in the free-Apple-ID build (FREE_APPLE_TEAM=1, no push entitlement).
  if (!Device.isDevice || Constants.expoConfig?.extra?.freeTeam) return null;
  const projectId = (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ?? Constants.easConfig?.projectId;
  if (!projectId) {
    if (__DEV__) console.warn('[push] No EAS project id (run `eas init`) — daily pick push is off until then.');
    return null;
  }
  let perm = await Notifications.getPermissionsAsync();
  if (perm.status !== 'granted' && ask && perm.canAskAgain) perm = await Notifications.requestPermissionsAsync();
  if (perm.status !== 'granted') return null;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', { name: 'default', importance: Notifications.AndroidImportance.DEFAULT });
  }
  token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  return token;
}

/** Push the current settings to the server. `ask` = may show the iOS permission prompt (first Home visit, turning the toggle on). */
export async function syncPush({ ask = false } = {}) {
  try {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) return;
    const p = getPrefs();
    if (!p.notify.dailyPick) {
      if (lastSaved !== 'off') await supabase.from('push_tokens').update({ daily_pick: false }).eq('user_id', uid);
      lastSaved = 'off';
      return;
    }
    const to = await getToken(ask);
    if (!to) return;
    const here = getHere();
    const row: Record<string, unknown> = {
      user_id: uid,
      token: to,
      daily_pick: true,
      pick_time: p.pickTime,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      language: i18n.language,
      temp_unit: p.tempUnit,
    };
    // Location only once it's known, and only rounded (≈ 1 km). City mode (location off) sends no coordinates.
    if (here.status !== 'loading') {
      row.lat = here.coords ? roundCoord(here.coords.latitude) : null;
      row.lon = here.coords ? roundCoord(here.coords.longitude) : null;
      row.place = placeLabel(here.place) || null;
      row.city = here.place?.city ?? null;
    }
    const key = JSON.stringify(row);
    if (key === lastSaved) return;
    const { error } = await supabase.from('push_tokens').upsert(row, { onConflict: 'user_id' });
    if (!error) lastSaved = key;
  } catch {
    // Offline or not migrated yet — the next change retries.
  }
}

const later = () => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { syncPush(); }, 800);
};

/** Before signing out: this device should stop getting someone else's pick. */
export async function clearPush() {
  try {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (uid) await supabase.from('push_tokens').delete().eq('user_id', uid);
  } catch { /* ignore */ }
  lastSaved = '';
}

/** Root layout: keep the server copy in sync, and open the dish when a push is tapped. */
export function usePushSync() {
  useEffect(() => {
    syncPush();
    const auth = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') { lastSaved = ''; later(); }
    });
    const offPrefs = onPrefs(later);
    const offHere = onHere(later);
    const open = (r: Notifications.NotificationResponse | null) => {
      const url = r?.notification.request.content.data?.url;
      if (typeof url === 'string' && url.startsWith('/dish/')) router.push(url as `/dish/${string}`);
    };
    Notifications.getLastNotificationResponseAsync().then(open).catch(() => undefined);
    const tap = Notifications.addNotificationResponseReceivedListener(open);
    return () => {
      auth.data.subscription.unsubscribe();
      offPrefs();
      offHere();
      tap.remove();
    };
  }, []);
}
