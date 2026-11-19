// Stores the Sign in with Apple refresh token for the signed-in user (public.apple_tokens, service role only), so
// delete-account can revoke it (App Store Review Guideline 5.1.1(v)). The app calls this right after the native
// Apple sign-in with credential.authorizationCode. Without the Apple secrets it does nothing.
//
// Deploy:  supabase functions deploy apple-token
// Secrets: APPLE_TEAM_ID · APPLE_KEY_ID · APPLE_PRIVATE_KEY (see ../_shared/apple.ts)
import { appleConfigured, exchangeCode } from "../_shared/apple.ts";
import { admin, callerId, cors, json, takeQuotas } from "../_shared/common.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const uid = await callerId(req);
  if (!uid) return json({ error: "unauthorized" }, 401);
  if (!appleConfigured()) return json({ stored: false });
  let body: { code?: unknown };
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  const code = typeof body.code === "string" ? body.code : "";
  if (code.length < 10 || code.length > 2000) return json({ error: "bad_request" }, 400);
  if ((await takeQuotas([{ bucket: `apple:u:${uid}`, window: "hour", cap: 10 }])) === false) return json({ error: "rate_limited" }, 429);

  const token = await exchangeCode(code);
  if (!token) return json({ stored: false });
  const { error } = await admin.from("apple_tokens").upsert({ user_id: uid, refresh_token: token, updated_at: new Date().toISOString() });
  if (error) console.error("[apple-token]", error.message);
  return json({ stored: !error });
});
