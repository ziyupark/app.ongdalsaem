// Delete account (Settings): for the signed-in user only —
//   1. revoke the Sign in with Apple token, if one was stored (apple-token) and the Apple secrets are set
//   2. remove every file in their folder of the photo buckets (dishes, question photos, avatar)
//   3. delete the auth user — profiles and every table that hangs off it cascade (comments, likes, saves,
//      messages, push tokens, …; see supabase/migrations)
//
// Deploy:  supabase functions deploy delete-account
import { appleConfigured, revoke } from "../_shared/apple.ts";
import { admin, callerId, cors, json } from "../_shared/common.ts";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const uid = await callerId(req);
  if (!uid) return json({ error: "unauthorized" }, 401);

  if (appleConfigured()) {
    const { data } = await admin.from("apple_tokens").select("refresh_token").eq("user_id", uid).maybeSingle();
    if (data?.refresh_token) await revoke(data.refresh_token).catch((e) => console.error("[delete-account] revoke", e));
  }

  try {
    for (const bucket of BUCKETS) await removeFolder(bucket, uid);
  } catch (e) {
    console.error("[delete-account] storage", e instanceof Error ? e.message : e);
    return json({ error: "storage_failed" }, 500);
  }

  const { error } = await admin.auth.admin.deleteUser(uid);
  if (error) {
    console.error("[delete-account] user", error.message);
    return json({ error: "delete_failed" }, 500);
  }
  return json({ deleted: true });
});
