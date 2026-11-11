import { supabase } from "@/lib/supabase";

/** Owner-only table (supabase/migrations/20261015010000_profile_push_token.sql) — see that migration for why this isn't a column on the publicly-readable `profiles` row. */
export async function upsertPushToken(userId: string, token: string): Promise<void> {
  const { error } = await supabase.from("push_tokens").upsert({ user_id: userId, token, updated_at: new Date().toISOString() });
  if (error) throw error;
}

/** Called when the user turns notifications off, so a stale token isn't sent to later. */
export async function deletePushToken(userId: string): Promise<void> {
  const { error } = await supabase.from("push_tokens").delete().eq("user_id", userId);
  if (error) throw error;
}
