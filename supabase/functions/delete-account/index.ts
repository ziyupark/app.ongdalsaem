// Delete account (Settings 9.9): for the signed-in user only — Apple token revoked, photos removed, auth user
// deleted (every row cascades). The steps are in ../_shared/deleteUser.ts (shared with purge-deactivated-accounts).
//
// Deploy:  supabase functions deploy delete-account
import { callerId, cors, json } from "../_shared/common.ts";
import { deleteUser } from "../_shared/deleteUser.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const uid = await callerId(req);
  if (!uid) return json({ error: "unauthorized" }, 401);

  const result = await deleteUser(uid);
  if (result !== "deleted") return json({ error: result }, 500);
  return json({ deleted: true });
});
