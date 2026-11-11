// Account settings on `profiles` (9.2 · 9.4 · 9.5 · 9.6 · 9.7 · 9.9) + support tickets (9.8a).
import * as Application from 'expo-application';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

export type AccountSettings = {
  id: string;
  email: string | null;
  providers: string[];
  displayName: string;
  username: string;
  avatarUrl: string | null;
  bio: string;
  handleChangedAt: Date | null;
  city: string | null;
  locationEnabled: boolean;
  defaultVisibility: 'everyone' | 'only_me';
  defaultAllowComments: boolean;
  messagePolicy: 'everyone' | 'following';
  sharedPrecision: 'neighborhood' | 'city' | 'country';
  marketingAds: boolean;
  marketingNightAds: boolean;
};

const HANDLE_COOLDOWN_DAYS = 30;
type Row = Record<string, any>;

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('Not signed in');
  return data.user;
}

export async function fetchAccount(): Promise<AccountSettings> {
  const user = await uid();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (error) throw error;
  const p = data as Row;
  return {
    id: user.id,
    email: user.email ?? null,
    providers: (user.identities ?? []).map((i) => i.provider),
    displayName: p.display_name ?? '',
    username: p.username ?? '',
    avatarUrl: p.avatar_url ?? null,
    bio: p.bio ?? '',
    handleChangedAt: p.handle_changed_at ? new Date(p.handle_changed_at) : null,
    city: p.city ?? null,
    locationEnabled: p.location_enabled ?? true,
    defaultVisibility: p.default_visibility ?? 'everyone',
    defaultAllowComments: p.default_allow_comments ?? true,
    messagePolicy: p.message_policy ?? 'everyone',
    sharedPrecision: p.shared_precision ?? 'city',
    marketingAds: p.marketing_ads ?? false,
    marketingNightAds: p.marketing_night_ads ?? false,
  };
}

/** Columns that exist on profiles (unknown ones are dropped by the caller). */
export async function updateAccount(patch: Partial<Record<string, unknown>>) {
  const user = await uid();
  const { error } = await supabase.from('profiles').update(patch).eq('id', user.id);
  if (error) throw error;
}

export function canChangeHandle(a: AccountSettings, now = new Date()) {
  if (!a.handleChangedAt) return { ok: true, nextAt: null as Date | null };
  const next = new Date(a.handleChangedAt.getTime() + HANDLE_COOLDOWN_DAYS * 86400000);
  return { ok: now >= next, nextAt: next };
}

export const HANDLE_RE = /^[a-z0-9._]{3,20}$/;

/** 9.2 Save changes — name, bio, avatar, and (at most every 30 days) the @handle. */
export async function saveProfile(a: AccountSettings, input: { displayName: string; username: string; bio: string; avatarUri?: string }) {
  const user = await uid();
  const patch: Row = { display_name: input.displayName.trim(), bio: input.bio.trim() || null };
  if (input.avatarUri) {
    const resized = await ImageManipulator.manipulateAsync(input.avatarUri, [{ resize: { width: 512 } }], { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG });
    const body = await (await fetch(resized.uri)).arrayBuffer();
    const path = `${user.id}/avatar-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('avatars').upload(path, body, { contentType: 'image/jpeg', upsert: false });
    if (error) throw error;
    patch.avatar_url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
  }
  const handle = input.username.trim().toLowerCase().replace(/^@/, '');
  if (handle !== a.username) {
    if (!HANDLE_RE.test(handle)) throw Object.assign(new Error('handle-format'), { code: 'handle-format' });
    if (!canChangeHandle(a).ok) throw Object.assign(new Error('handle-cooldown'), { code: 'handle-cooldown' });
    patch.username = handle;
    patch.handle_auto_generated = false;
    patch.handle_changed_at = new Date().toISOString();
  }
  const { error } = await supabase.from('profiles').update(patch).eq('id', user.id);
  if (error?.code === '23505') throw Object.assign(new Error('handle-taken'), { code: 'handle-taken' });
  if (error) throw error;
}

export async function deleteMyAccount() {
  const { error } = await supabase.rpc('delete_own_account');
  if (error) throw error;
  await supabase.auth.signOut();
}

export async function sendSupportTicket(input: { topic: 'bug' | 'account' | 'report_content' | 'other'; message: string; replyEmail?: string; language: string }) {
  const user = await uid();
  const { error } = await supabase.from('support_tickets').insert({
    user_id: user.id,
    topic: input.topic,
    message: input.message.trim(),
    reply_email: input.replyEmail?.trim() || null,
    app_version: `${Application.nativeApplicationVersion ?? '1.0.0'} (${Application.nativeBuildVersion ?? '0'})`,
    os: `${Platform.OS} ${Platform.Version}`.slice(0, 40),
    language: input.language,
  });
  if (error) throw error;
}

/** 9.5 Download my data — profile + dishes + comments + diary as one JSON document. */
export async function exportMyData() {
  const user = await uid();
  const [profile, foods, comments, diary, saves] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('foods').select('*, food_images(image_url, display_order)').eq('creator_id', user.id),
    supabase.from('comments').select('*').eq('user_id', user.id),
    supabase.from('food_eaten_logs').select('*').eq('user_id', user.id),
    supabase.from('saves').select('*').eq('user_id', user.id),
  ]);
  return JSON.stringify({ exportedAt: new Date().toISOString(), email: user.email, profile: profile.data, dishes: foods.data, comments: comments.data, diary: diary.data, saved: saves.data }, null, 2);
}

/** 9.7 city search — OpenWeather geocoding (names only; coordinates are not stored). */
export type CityHit = { name: string; country: string; state?: string; lat: number; lon: number };
export async function searchCities(q: string): Promise<CityHit[]> {
  const key = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
  if (!key || q.trim().length < 2) return [];
  try {
    const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q.trim())}&limit=8&appid=${key}`);
    if (!res.ok) return [];
    const json = (await res.json()) as Row[];
    return json.map((r) => ({ name: r.local_names?.ko && /[가-힣]/.test(q) ? r.local_names.ko : r.name, country: r.country, state: r.state, lat: r.lat, lon: r.lon }));
  } catch {
    return [];
  }
}
