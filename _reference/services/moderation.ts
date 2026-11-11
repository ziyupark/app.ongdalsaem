import { supabase } from "@/lib/supabase";

const UNIQUE_VIOLATION = "23505";

/** 7.3 reasons — keep in sync with reports_reason_check (supabase/migrations/20261030010000_moderation.sql). */
export type ReportReason =
  | "sexual"
  | "child_safety"
  | "harassment"
  | "hate_violence"
  | "copyright"
  | "spam"
  | "unsafe_recipe"
  | "off_topic"
  | "other";

/** `reports` (docs/06-data-model.md — P1, required for App Store review on user-generated content). RLS: reporter_id must be auth.uid(). */
export async function createReport(params: {
  reporterId: string;
  foodId?: string;
  reportedUserId?: string;
  reason: ReportReason;
  /** Optional detail, max 200 chars (reports.note). */
  note?: string;
}): Promise<void> {
  const { error } = await supabase.from("reports").insert({
    reporter_id: params.reporterId,
    food_id: params.foodId ?? null,
    reported_user_id: params.reportedUserId ?? null,
    reason: params.reason,
    note: params.note?.trim() ? params.note.trim().slice(0, 200) : null,
  });
  if (error) throw error;
}

/** Blocks the creator — every one of their foods disappears from the blocker's feeds, not just this one (per user request, distinct from hideFood below). A unique-violation here means the block already exists (e.g. a raced double-tap) — the desired end state already holds, so it's not an error (mirrors foodInteractions.ts's likeFood/saveFood). Just the insert — the actual hiding happens at the RLS layer (supabase/migrations/20261014000000_filter_blocked_foods.sql), not here. */
export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
  const { error } = await supabase.from("blocks").insert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error && error.code !== UNIQUE_VIOLATION) throw error;
}

/** Hides just this one food (per user request, distinct from blockUser above, which hides everything that creator has posted) — same unique-violation-isn't-an-error reasoning. Hiding happens at the RLS layer (supabase/migrations/20261014010000_hidden_foods.sql). */
export async function hideFood(userId: string, foodId: string): Promise<void> {
  const { error } = await supabase.from("hidden_foods").insert({ user_id: userId, food_id: foodId });
  if (error && error.code !== UNIQUE_VIOLATION) throw error;
}

export interface BlockedUser {
  /** The `blocks` row's own id — not the blocked user's id — so unblock() below has a stable key even if a username changes. */
  id: string;
  blockedUserId: string;
  username: string;
  avatarUrl?: string;
}

interface BlockedUserRow {
  id: string;
  blocked_id: string;
  profiles: { username: string; avatar_url: string | null } | null;
}

/** Settings → Blocked Accounts (per user request — docs/06-data-model.md flagged this as required but never built). `profiles!blocked_id` disambiguates which of `blocks`' two profiles FKs (blocker_id/blocked_id) to embed — profiles are publicly readable, so this works under the viewer's own RLS same as any other profile lookup. */
export async function getBlockedUsers(blockerId: string): Promise<BlockedUser[]> {
  const { data, error } = await supabase
    .from("blocks")
    .select("id, blocked_id, profiles!blocked_id(username, avatar_url)")
    .eq("blocker_id", blockerId)
    .order("created_at", { ascending: false })
    .returns<BlockedUserRow[]>();
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    blockedUserId: row.blocked_id,
    username: row.profiles?.username ?? "Unknown",
    avatarUrl: row.profiles?.avatar_url ?? undefined,
  }));
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  const { error } = await supabase.from("blocks").delete().eq("blocker_id", blockerId).eq("blocked_id", blockedId);
  if (error) throw error;
}
