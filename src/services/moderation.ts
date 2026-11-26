// Reports & blocks — DB: reports (reason check in 20261030010000_moderation.sql), blocks.
import { myUserId, supabase } from '../lib/supabase';

export const REPORT_REASONS = ['sexual', 'child_safety', 'harassment', 'hate_violence', 'copyright', 'spam', 'unsafe_recipe', 'off_topic', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

async function myId() {
  const id = await myUserId();
  if (!id) throw new Error('Not signed in');
  return id;
}

export async function reportDish(foodId: string, ownerId: string, reason: ReportReason, note?: string) {
  const uid = await myId();
  const { error } = await supabase.from('reports').insert({ reporter_id: uid, food_id: foodId, reported_user_id: ownerId, reason, note: note?.slice(0, 200) ?? null });
  if (error) throw error;
}

export async function reportComment(commentId: string, foodId: string, authorId: string, reason: ReportReason) {
  const uid = await myId();
  const { error } = await supabase.from('reports').insert({ reporter_id: uid, food_id: foodId, comment_id: commentId, reported_user_id: authorId, reason });
  if (error) throw error;
}

export async function reportAnswer(answerId: string, questionId: string, authorId: string, reason: ReportReason) {
  const uid = await myId();
  const { error } = await supabase.from('reports').insert({ reporter_id: uid, question_id: questionId, answer_id: answerId, reported_user_id: authorId, reason });
  if (error) throw error;
}

/** A direct message (the newest one from the other person, if any) — DB: reports.message_id (20261121000000). */
export async function reportMessage(otherId: string, messageId: string | null, reason: ReportReason) {
  const uid = await myId();
  const { error } = await supabase.from('reports').insert({ reporter_id: uid, message_id: messageId, reported_user_id: otherId, reason });
  if (error) throw error;
}

/** A person (their name, @handle, photo or bio): only reported_user_id is set. */
export async function reportUser(userId: string, reason: ReportReason) {
  const uid = await myId();
  const { error } = await supabase.from('reports').insert({ reporter_id: uid, reported_user_id: userId, reason });
  if (error) throw error;
}

/** The server's word filter refused the text (trigger ugc_filter, 20261121000000). */
export function isObjectionable(e: unknown) {
  return typeof e === 'object' && e !== null && String((e as { message?: unknown }).message ?? '').includes('objectionable_content');
}

export async function blockUser(userId: string) {
  const uid = await myId();
  const { error } = await supabase.from('blocks').insert({ blocker_id: uid, blocked_id: userId });
  if (error && error.code !== '23505') throw error;
}

export async function unblockUser(userId: string) {
  const uid = await myId();
  const { error } = await supabase.from('blocks').delete().eq('blocker_id', uid).eq('blocked_id', userId);
  if (error) throw error;
}

export type BlockedUser = { id: string; name: string; handle: string | null; avatarUrl: string | null };
export async function fetchBlocked(): Promise<BlockedUser[]> {
  const uid = await myId();
  const { data, error } = await supabase
    .from('blocks')
    .select('blocked_id, who:profiles!blocked_id(id, display_name, username, avatar_url)')
    .eq('blocker_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as Record<string, any>[]).map((r) => ({
    id: r.blocked_id,
    name: r.who?.username || r.who?.display_name || '—',
    handle: r.who?.username ?? null,
    avatarUrl: r.who?.avatar_url ?? null,
  }));
}
