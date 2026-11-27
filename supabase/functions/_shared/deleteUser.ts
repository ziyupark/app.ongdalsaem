// Deletes one account for good (delete-account · purge-deactivated-accounts):
//   1. revoke the Sign in with Apple token, if one was stored (apple-token) and the Apple secrets are set
//   2. remove every file in their folder of the photo buckets (dishes, question photos, avatar)
//   3. delete the auth user — profiles and every table that hangs off it cascade (comments, likes, saves,
//      messages, push tokens, …; see supabase/migrations)
import { appleConfigured, revoke } from "./apple.ts";
import { admin } from "./common.ts";

const BUCKETS = ["food-illustrations", "avatars"];

async function removeFolder(bucket: string, uid: string) {
  for (let round = 0; round < 100; round++) {
    const { data, error } = await admin.storage.from(bucket).list(uid, { limit: 1000 });
    if (error) throw error;
    const paths = (data ?? []).filter((f) => f.id).map((f) => `${uid}/${f.name}`);
    if (!paths.length) return;
    const { error: removeError } = await admin.storage.from(bucket).remove(paths);
    if (removeError) throw removeError;
  }
}

export async function deleteUser(uid: string): Promise<"deleted" | "storage_failed" | "delete_failed"> {
  if (appleConfigured()) {
    const { data } = await admin.from("apple_tokens").select("refresh_token").eq("user_id", uid).maybeSingle();
    if (data?.refresh_token) await revoke(data.refresh_token).catch((e) => console.error("[delete-user] revoke", e));
  }

  try {
    for (const bucket of BUCKETS) await removeFolder(bucket, uid);
  } catch (e) {
    console.error("[delete-user] storage", e instanceof Error ? e.message : e);
    return "storage_failed";
  }

  const { error } = await admin.auth.admin.deleteUser(uid);
  if (error) {
    console.error("[delete-user] user", error.message);
    return "delete_failed";
  }
  return "deleted";
}
