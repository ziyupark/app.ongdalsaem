// Account settings on `profiles` (9.2 · 9.4 · 9.5 · 9.6 · 9.7 · 9.9) + support tickets (9.8a).
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { clearLocalUserData } from '../lib/localData';
import { clearPush } from '../lib/push';
import { fetchMyProfileRow, supabase } from '../lib/supabase';
import { uploadAvatar } from './profile';
import { owm } from './weather';

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

const HANDLE_COOLDOWN_DAYS = 14;
type Row = Record<string, any>;

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('Not signed in');
  return data.user;
}

export async function fetchAccount(): Promise<AccountSettings> {
  const user = await uid();
  const data = await fetchMyProfileRow('*');
  if (!data) throw new Error('No profile');
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

/** 9.2 Save changes — bio, avatar, and (at most every 14 days) the @handle. There is no separate nickname to edit. */
export async function saveProfile(a: AccountSettings, input: { username: string; bio: string; avatarUri?: string }) {
  const user = await uid();
  const patch: Row = { bio: input.bio.trim() || null };
  if (input.avatarUri) {
    patch.avatar_url = await uploadAvatar(user.id, input.avatarUri);
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

/**
 * 9.x Delete account. The `delete-account` Edge Function removes the photos (dishes, questions, avatar), revokes the
 * Sign in with Apple token and deletes the user (every row cascades). Until that function is deployed (404), the
 * app removes its own files and calls delete_own_account() as before.
 */
export async function deleteMyAccount() {
  const { error } = await supabase.functions.invoke('delete-account', { body: {} });
  if (error) {
    const status = (error as { context?: { status?: number } }).context?.status;
    if (status !== 404) throw error;
    await removeMyFiles();
    const { error: rpcError } = await supabase.rpc('delete_own_account');
    if (rpcError) throw rpcError;
  }
  await clearPush();
  await supabase.auth.signOut().catch(() => undefined);
  await clearLocalUserData('deleteAccount');
}

/**
 * 9.3 Deactivate account — marks the account (profiles.deactivated_at) and signs out. Signing in again within
 * 30 days keeps it (auth.ts reactivate); otherwise purge-deactivated-accounts deletes it like deleteMyAccount.
 */
export async function deactivateMyAccount() {
  const { error } = await supabase.rpc('deactivate_own_account');
  if (error) throw error;
  await clearPush();
  await supabase.auth.signOut().catch(() => undefined);
  await clearLocalUserData('signOut');
}

/** Every file in my folder of both photo buckets (best effort). */
async function removeMyFiles() {
  const user = await uid();
  for (const bucket of ['food-illustrations', 'avatars']) {
    try {
      for (let round = 0; round < 50; round++) {
        const { data } = await supabase.storage.from(bucket).list(user.id, { limit: 100 });
        const paths = (data ?? []).filter((f) => f.id).map((f) => `${user.id}/${f.name}`);
        if (!paths.length) break;
        const { data: removed, error } = await supabase.storage.from(bucket).remove(paths);
        if (error || !removed?.length) break;
      }
    } catch {
      // the account is still deleted; leftover files are unlisted and unguessable
    }
  }
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
    fetchMyProfileRow('*').then((data) => ({ data })),
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
  if (q.trim().length < 2) return [];
  const json = await owm<Row[]>({ kind: 'geo', q: q.trim() });
  if (!Array.isArray(json)) return [];
  return json.map((r) => ({ name: r.local_names?.ko && /[가-힣]/.test(q) ? r.local_names.ko : r.name, country: r.country, state: r.state, lat: r.lat, lon: r.lon }));
}
