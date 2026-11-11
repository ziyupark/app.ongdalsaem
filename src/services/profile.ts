// profiles row for onboarding (docs/06-data-model.md User · Settings, DB = supabase/migrations).
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '../lib/supabase';
import { makeHandle, randomHandleDigits } from './username';

export type MyProfile = { id: string; displayName: string | null; username: string | null; avatarUrl: string | null; city: string | null; bio: string | null; locationEnabled: boolean };

export async function getMyProfile(): Promise<MyProfile | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url, city, bio, location_enabled')
    .eq('id', auth.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { id: auth.user.id, displayName: null, username: null, avatarUrl: null, city: null, bio: null, locationEnabled: true };
  return { id: data.id, displayName: data.display_name, username: data.username, avatarUrl: data.avatar_url, city: data.city, bio: data.bio ?? null, locationEnabled: data.location_enabled ?? true };
}

/** Onboarding is finished once a display name exists (1.3). Existing accounts go straight to Home. */
export function needsProfileSetup(p: MyProfile | null) {
  return !p?.displayName;
}

const UNIQUE_VIOLATION = '23505';

/** Avatar → 512 px JPEG in bucket `avatars/<uid>/avatar-<ts>.jpg`, returns its public URL. */
async function uploadAvatar(userId: string, localUri: string) {
  const resized = await ImageManipulator.manipulateAsync(localUri, [{ resize: { width: 512 } }], { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG });
  const body = await (await fetch(resized.uri)).arrayBuffer();
  const path = `${userId}/avatar-${Date.now()}.jpg`;
  const { error } = await supabase.storage.from('avatars').upload(path, body, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

/**
 * 1.3 Continue: save display name + auto handle (+ photo). If the handle is taken, draw new digits and retry.
 * Returns the handle that was saved.
 */
export async function saveProfileSetup(input: { displayName: string; digits: string; avatarUri?: string }) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Not signed in');
  const avatarUrl = input.avatarUri ? await uploadAvatar(auth.user.id, input.avatarUri) : undefined;

  let digits = input.digits;
  for (let attempt = 0; attempt < 6; attempt++) {
    const username = makeHandle(input.displayName, digits);
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: auth.user.id,
        display_name: input.displayName.trim(),
        username,
        handle_auto_generated: true,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      });
    if (!error) return username;
    if (error.code !== UNIQUE_VIOLATION) throw error;
    digits = randomHandleDigits();
  }
  throw new Error('Could not find a free handle');
}

/** 1.4: city/country only — never coordinates (docs/04-screens/01 1.4 개인정보). */
export async function saveLocationChoice(input: { city?: string; country?: string; locationEnabled: boolean }) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Not signed in');
  const { error } = await supabase
    .from('profiles')
    .update({ location_enabled: input.locationEnabled, ...(input.city ? { city: input.city, country: input.country ?? null } : {}) })
    .eq('id', auth.user.id);
  if (error) throw error;
}

export const MAX_BIO = 80;

/** 6.1 tap avatar — upload a new photo and save it on the profile. Returns the public URL. */
export async function updateMyAvatar(localUri: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Not signed in');
  const url = await uploadAvatar(auth.user.id, localUri);
  const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', auth.user.id);
  if (error) throw error;
  return url;
}

/** 6.1 status message (bio) — empty clears it. */
export async function updateMyBio(bio: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Not signed in');
  const value = bio.trim().slice(0, MAX_BIO) || null;
  const { error } = await supabase.from('profiles').update({ bio: value }).eq('id', auth.user.id);
  if (error) throw error;
  return value;
}
