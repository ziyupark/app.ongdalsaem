// profiles row for onboarding (docs/06-data-model.md User · Settings, DB = supabase/migrations).
import * as ImageManipulator from 'expo-image-manipulator';
import { fetchMyProfileRow, myUserId, supabase } from '../lib/supabase';
import { makeHandle, randomHandleDigits } from './username';

export type MyProfile = { id: string; displayName: string | null; username: string | null; avatarUrl: string | null; city: string | null; bio: string | null; locationEnabled: boolean };

export async function getMyProfile(): Promise<MyProfile | null> {
  const uid = await myUserId();
  if (!uid) return null;
  const data = await fetchMyProfileRow('id, display_name, username, avatar_url, city, bio, location_enabled');
  if (!data) return { id: uid, displayName: null, username: null, avatarUrl: null, city: null, bio: null, locationEnabled: true };
  return { id: data.id, displayName: data.display_name, username: data.username, avatarUrl: data.avatar_url, city: data.city, bio: data.bio ?? null, locationEnabled: data.location_enabled ?? true };
}

/** A new account has no @username yet → make one (ensureHandle) and run onboarding. There is no nickname step. */
export function needsProfileSetup(p: MyProfile | null) {
  return !p?.username;
}

const UNIQUE_VIOLATION = '23505';

/** Avatar → 512 px JPEG in bucket `avatars/<uid>/avatar-<ts>.jpg`, returns its public URL. */
export async function uploadAvatar(userId: string, localUri: string) {
  const resized = await ImageManipulator.manipulateAsync(localUri, [{ resize: { width: 512 } }], { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG });
  const body = await (await fetch(resized.uri)).arrayBuffer();
  const path = `${userId}/avatar-${Date.now()}.jpg`;
  const { error } = await supabase.storage.from('avatars').upload(path, body, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

/**
 * First sign-in: give the account an automatic @username (from the Apple / Google name, else "cook") — the only name
 * shown in the app; it can be changed in 9.2. If the handle is taken, draw new digits and retry. Returns the handle.
 */
export async function ensureHandle(suggestedName = '') {
  const uid = await myUserId();
  if (!uid) throw new Error('Not signed in');

  let digits = randomHandleDigits();
  for (let attempt = 0; attempt < 6; attempt++) {
    const username = makeHandle(suggestedName, digits);
    const fields = { username, handle_auto_generated: true };
    // The sign-up trigger already made the row, so this is an update; insert only if it's missing.
    // (Not upsert: ON CONFLICT DO UPDATE needs read access to columns others can't read — see my_profile().)
    let { error, count } = await supabase.from('profiles').update(fields, { count: 'exact' }).eq('id', uid);
    if (!error && count === 0) ({ error } = await supabase.from('profiles').insert({ id: uid, ...fields }));
    if (!error) return username;
    if (error.code !== UNIQUE_VIOLATION) throw error;
    digits = randomHandleDigits();
  }
  throw new Error('Could not find a free handle');
}

/** 1.4: city/country only — never coordinates (docs/04-screens/01 1.4 개인정보). */
export async function saveLocationChoice(input: { city?: string; country?: string; locationEnabled: boolean }) {
  const uid = await myUserId();
  if (!uid) throw new Error('Not signed in');
  const { error } = await supabase
    .from('profiles')
    .update({ location_enabled: input.locationEnabled, ...(input.city ? { city: input.city, country: input.country ?? null } : {}) })
    .eq('id', uid);
  if (error) throw error;
}

/** Onboarding taste step: preset tag keys (lib/tags) the user likes — Today's pick leans toward them. */
export async function saveFavoriteTags(tags: string[]) {
  const uid = await myUserId();
  if (!uid) throw new Error('Not signed in');
  const { error } = await supabase.from('profiles').update({ favorite_tags: tags }).eq('id', uid);
  if (error) throw error;
}

export async function fetchMyFavoriteTags(): Promise<string[]> {
  const uid = await myUserId();
  if (!uid) return [];
  const data = await fetchMyProfileRow('favorite_tags').catch(() => null);
  return (data?.favorite_tags as string[] | null) ?? [];
}

export const MAX_BIO = 80;

/** 6.1 tap avatar — upload a new photo and save it on the profile. Returns the public URL. */
export async function updateMyAvatar(localUri: string) {
  const uid = await myUserId();
  if (!uid) throw new Error('Not signed in');
  const url = await uploadAvatar(uid, localUri);
  const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', uid);
  if (error) throw error;
  return url;
}

/** 6.1 status message (bio) — empty clears it. */
export async function updateMyBio(bio: string) {
  const uid = await myUserId();
  if (!uid) throw new Error('Not signed in');
  const value = bio.trim().slice(0, MAX_BIO) || null;
  const { error } = await supabase.from('profiles').update({ bio: value }).eq('id', uid);
  if (error) throw error;
  return value;
}
