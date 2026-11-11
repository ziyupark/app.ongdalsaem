import { supabase } from "@/lib/supabase";
import type { FoodEatenLog } from "@/types/foodEatenLog";

// Mirrors services/foodInteractions.ts / services/comments.ts exactly — a
// 23505 (unique_violation) on insert means the desired row already exists
// (this user already logged this exact food on this exact date), so it's
// treated as an already-done no-op rather than surfaced as an error. The
// UI's own pending-state guard (useFoodEatenLog) is the primary defense
// against an accidental double-submit; this is the safety net under it.
const UNIQUE_VIOLATION = "23505";

interface FoodEatenLogRow {
  id: string;
  user_id: string;
  food_id: string | null;
  food_name_snapshot: string;
  food_image_snapshot: string | null;
  eaten_at: string;
  created_at: string;
  review: string | null;
}

function mapFoodEatenLogRow(row: FoodEatenLogRow): FoodEatenLog {
  return {
    id: row.id,
    userId: row.user_id,
    foodId: row.food_id,
    foodNameSnapshot: row.food_name_snapshot,
    foodImageSnapshot: row.food_image_snapshot ?? undefined,
    eatenAt: row.eaten_at,
    createdAt: row.created_at,
    review: row.review ?? undefined,
  };
}

interface LogFoodEatenInput {
  userId: string;
  foodId: string;
  /** Snapshot of the Food already loaded in the UI — never re-fetched, since the caller (Food Detail) already has it. */
  foodName: string;
  foodImageUrl?: string;
  /** Local "YYYY-MM-DD" — see src/lib/date/localDate.ts. */
  eatenAt: string;
  /** Optional free-text note (per user request), written alongside the eaten date. */
  review?: string;
}

/** Records "I ate this" for one day. Logging the same food on a different day is a separate call/row — only an exact (food, date) repeat is a no-op. */
export async function logFoodEaten(input: LogFoodEatenInput): Promise<FoodEatenLog> {
  const { data, error } = await supabase
    .from("food_eaten_logs")
    .insert({
      user_id: input.userId,
      food_id: input.foodId,
      food_name_snapshot: input.foodName,
      food_image_snapshot: input.foodImageUrl ?? null,
      eaten_at: input.eatenAt,
      review: input.review?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      const existing = await getEatenLogForFoodOnDate(input.userId, input.foodId, input.eatenAt);
      if (existing) return existing;
    }
    throw error;
  }
  return mapFoodEatenLogRow(data as FoodEatenLogRow);
}

export async function getEatenLogForFoodOnDate(userId: string, foodId: string, eatenAt: string): Promise<FoodEatenLog | null> {
  const { data, error } = await supabase
    .from("food_eaten_logs")
    .select()
    .eq("user_id", userId)
    .eq("food_id", foodId)
    .eq("eaten_at", eatenAt)
    .maybeSingle();
  if (error) throw error;
  return data ? mapFoodEatenLogRow(data as FoodEatenLogRow) : null;
}

/** Every log the viewer has for one specific food, most recent first — backs Food Detail's "I Ate This" state (possibly several, one per date). */
export async function getEatenLogsForFood(userId: string, foodId: string): Promise<FoodEatenLog[]> {
  const { data, error } = await supabase
    .from("food_eaten_logs")
    .select()
    .eq("user_id", userId)
    .eq("food_id", foodId)
    .order("eaten_at", { ascending: false });
  if (error) throw error;
  return (data as FoodEatenLogRow[]).map(mapFoodEatenLogRow);
}

/** The viewer's full diary, most recent first — backs Food Diary (Profile). Optional [from, to] is inclusive on both ends, local "YYYY-MM-DD". */
export async function getEatenLogs(userId: string, range?: { from?: string; to?: string }): Promise<FoodEatenLog[]> {
  let query = supabase.from("food_eaten_logs").select().eq("user_id", userId).order("eaten_at", { ascending: false });
  if (range?.from) query = query.gte("eaten_at", range.from);
  if (range?.to) query = query.lte("eaten_at", range.to);

  const { data, error } = await query;
  if (error) throw error;
  return (data as FoodEatenLogRow[]).map(mapFoodEatenLogRow);
}

/** Edits an existing log's date and/or review (per user request, both are committed together from the same Confirm action) — pass only the fields that changed. */
export async function updateEatenLog(logId: string, userId: string, updates: { eatenAt?: string; review?: string }): Promise<void> {
  const payload: Record<string, string | null> = {};
  if (updates.eatenAt !== undefined) payload.eaten_at = updates.eatenAt;
  if (updates.review !== undefined) payload.review = updates.review.trim() || null;

  const { error } = await supabase.from("food_eaten_logs").update(payload).eq("id", logId).eq("user_id", userId);
  if (error) throw error;
}

export async function deleteEatenLog(logId: string, userId: string): Promise<void> {
  const { error } = await supabase.from("food_eaten_logs").delete().eq("id", logId).eq("user_id", userId);
  if (error) throw error;
}
