import { supabase } from "@/lib/supabase";
import type { Comment } from "@/types/comment";

const UNIQUE_VIOLATION = "23505";

/** Shape of a row exactly as it comes back from `comments` (snake_case, per supabase/migrations/20260930000000_comments.sql). */
interface CommentRow {
  id: string;
  food_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: { username: string; avatar_url: string | null; city: string | null; country: string | null } | null;
  // Embedded via `.select("..., comment_likes(count)")`, same aggregate-count
  // shape `likes(count)` already uses on `foods` — one row, `[{ count: N }]`.
  comment_likes?: { count: number }[];
  // Embedded via the aliased `mine:comment_likes(user_id)`, filtered to the
  // viewer's own id — same pattern as `foods`'s own `mine:likes(user_id)`.
  mine?: { user_id: string }[];
}

function mapCommentRow(row: CommentRow): Comment {
  const region = [row.profiles?.city, row.profiles?.country].filter(Boolean).join(", ");
  return {
    id: row.id,
    foodId: row.food_id,
    userId: row.user_id,
    username: row.profiles?.username ?? "Unknown",
    avatarUrl: row.profiles?.avatar_url ?? undefined,
    region: region || undefined,
    body: row.body,
    likeCount: row.comment_likes?.[0]?.count ?? 0,
    isLikedByMe: Boolean(row.mine?.length),
    createdAt: row.created_at,
  };
}

function commentColumns(viewerId?: string): string {
  const base = "*, profiles!user_id(username, avatar_url, city, country), comment_likes(count)";
  return viewerId ? `${base}, mine:comment_likes(user_id)` : base;
}

/** Every comment on one Food, oldest first (reads top-to-bottom like the conversation it is). `viewerId` additionally resolves each comment's `isLikedByMe`, same as `services/foods.ts`'s own viewer-scoped embed. */
export async function getComments(foodId: string, viewerId?: string): Promise<Comment[]> {
  let query = supabase
    .from("comments")
    .select(commentColumns(viewerId))
    .eq("food_id", foodId)
    .order("created_at", { ascending: true });
  if (viewerId) query = query.eq("mine.user_id", viewerId);

  const { data, error } = await query;
  if (error) throw error;
  return ((data as unknown as CommentRow[]) ?? []).map(mapCommentRow);
}

export async function createComment(foodId: string, userId: string, body: string): Promise<Comment> {
  const { data, error } = await supabase
    .from("comments")
    .insert({ food_id: foodId, user_id: userId, body })
    .select(commentColumns(userId))
    .single();
  if (error) throw error;
  return mapCommentRow(data as unknown as CommentRow);
}

export async function deleteComment(commentId: string, userId: string): Promise<void> {
  const { error } = await supabase.from("comments").delete().eq("id", commentId).eq("user_id", userId);
  if (error) throw error;
}

/** A unique-violation here means the Like already exists (e.g. a raced double-tap) — the desired end state already holds, so it's not an error. Mirrors services/foodInteractions.ts's likeFood exactly. */
export async function likeComment(commentId: string, userId: string): Promise<void> {
  const { error } = await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: userId });
  if (error && error.code !== UNIQUE_VIOLATION) throw error;
}

export async function unlikeComment(commentId: string, userId: string): Promise<void> {
  const { error } = await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", userId);
  if (error) throw error;
}
