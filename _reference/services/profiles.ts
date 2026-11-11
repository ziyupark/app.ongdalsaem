import { supabase } from "@/lib/supabase";
import type { AgeRange, Gender, Profile } from "@/types/profile";

/** Row shape exactly as it comes back from `profiles` (snake_case). */
interface ProfileRow {
  id: string;
  username: string | null;
  avatar_url: string | null;
  city: string | null;
  country: string | null;
  bio: string | null;
  favorite_tags: string[];
  language: string;
  notifications_enabled: boolean;
  age_range: AgeRange | null;
  gender: Gender | null;
  created_at: string;
}

function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    city: row.city ?? undefined,
    country: row.country ?? undefined,
    bio: row.bio ?? undefined,
    favoriteTags: row.favorite_tags,
    language: row.language,
    notificationsEnabled: row.notifications_enabled,
    ageRange: row.age_range ?? undefined,
    gender: row.gender ?? undefined,
    createdAt: row.created_at,
  };
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data ? mapProfileRow(data as ProfileRow) : null;
}

/**
 * Not called during sign-up — the `on_auth_user_created` trigger
 * (supabase/migrations/*_profile_on_signup.sql) already creates a profile
 * row for every new auth user reliably, without depending on the client
 * completing a second request. This exists as an explicit fallback for the
 * rare case a profile is missing (e.g. a user created before the trigger
 * existed), not as the primary creation path.
 */
export async function createProfile(
  userId: string,
  fields: Partial<Pick<Profile, "username" | "city" | "country" | "language">> = {}
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      username: fields.username ?? null,
      city: fields.city ?? null,
      country: fields.country ?? null,
      language: fields.language ?? "en",
    })
    .select()
    .single();

  if (error) throw error;
  return mapProfileRow(data as ProfileRow);
}

const UNIQUE_VIOLATION = "23505";

/** True when a failed updateProfile()/username save collided with another user's nickname (Phase 42.5 §10). */
export function isDuplicateUsernameError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === UNIQUE_VIOLATION;
}

export async function updateProfile(
  userId: string,
  fields: Partial<
    Pick<
      Profile,
      "username" | "avatarUrl" | "city" | "country" | "bio" | "language" | "ageRange" | "gender" | "notificationsEnabled"
    >
  >
): Promise<Profile> {
  const patch: Record<string, unknown> = {};
  if (fields.username !== undefined) patch.username = fields.username;
  if (fields.avatarUrl !== undefined) patch.avatar_url = fields.avatarUrl;
  if (fields.city !== undefined) patch.city = fields.city;
  if (fields.country !== undefined) patch.country = fields.country;
  if (fields.bio !== undefined) patch.bio = fields.bio;
  if (fields.language !== undefined) patch.language = fields.language;
  if (fields.ageRange !== undefined) patch.age_range = fields.ageRange;
  if (fields.gender !== undefined) patch.gender = fields.gender;
  if (fields.notificationsEnabled !== undefined) patch.notifications_enabled = fields.notificationsEnabled;

  const { data, error } = await supabase.from("profiles").update(patch).eq("id", userId).select().single();

  if (error) throw error;
  return mapProfileRow(data as ProfileRow);
}
