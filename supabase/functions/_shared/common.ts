// Shared by the Edge Functions: service-role client, CORS headers, the signed-in caller, request quotas.
import { createClient } from "jsr:@supabase/supabase-js@2";

export const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

export const json = (body: unknown, status = 200) => Response.json(body, { status, headers: cors });

/** The signed-in user's id from the request's JWT (checked with Supabase Auth), or null. */
export async function callerId(req: Request): Promise<string | null> {
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return null;
  const { data, error } = await admin.auth.getUser(jwt);
  return error ? null : data.user?.id ?? null;
}

type Window = "minute" | "hour" | "day";

/**
 * Takes one unit from every quota (all or nothing). false = one is used up.
 * null = the quota functions aren't there (migration 20261120000000 not applied).
 */
export async function takeQuotas(quotas: { bucket: string; window: Window; cap: number }[]): Promise<boolean | null> {
  const taken: typeof quotas = [];
  for (const q of quotas) {
    const { data, error } = await admin.rpc("take_quota", { p_bucket: q.bucket, p_window: q.window, p_cap: q.cap });
    if (error) {
      console.error("[quota]", error.message);
      await giveBack(taken);
      return null;
    }
    if (data !== true) {
      await giveBack(taken);
      return false;
    }
    taken.push(q);
  }
  return true;
}

async function giveBack(quotas: { bucket: string; window: Window }[]) {
  for (const q of quotas) await admin.rpc("give_back_quota", { p_bucket: q.bucket, p_window: q.window });
}

/** A finite number inside [min, max], or null. */
export function inRange(v: unknown, min: number, max: number): number | null {
  return typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? v : null;
}
