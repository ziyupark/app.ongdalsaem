import { supabase } from "@/lib/supabase";

const UNIQUE_VIOLATION = "23505";

export interface FoodInteractionState {
  isLiked: boolean;
  isSaved: boolean;
}

/**
 * Current user's Like/Save state for one Food (Phase 34 §29) — two small
 * existence checks run concurrently, never a public/aggregate query (§20/§21:
 * only the current user's own state is an MVP requirement).
 */
export async function getInteractionState(foodId: string, userId: string): Promise<FoodInteractionState> {
  const [likeResult, saveResult] = await Promise.all([
    supabase.from("likes").select("id").eq("food_id", foodId).eq("user_id", userId).maybeSingle(),
    supabase.from("saves").select("id").eq("food_id", foodId).eq("user_id", userId).maybeSingle(),
  ]);
  if (likeResult.error) throw likeResult.error;
  if (saveResult.error) throw saveResult.error;
  return { isLiked: !!likeResult.data, isSaved: !!saveResult.data };
}

/** A unique-violation here means the Like already exists (e.g. a raced double-tap) — the desired end state already holds, so it's not an error. */
export async function likeFood(foodId: string, userId: string): Promise<void> {
  const { error } = await supabase.from("likes").insert({ food_id: foodId, user_id: userId });
  if (error && error.code !== UNIQUE_VIOLATION) throw error;
}

export async function unlikeFood(foodId: string, userId: string): Promise<void> {
  const { error } = await supabase.from("likes").delete().eq("food_id", foodId).eq("user_id", userId);
  if (error) throw error;
}

export async function saveFood(foodId: string, userId: string): Promise<void> {
  const { error } = await supabase.from("saves").insert({ food_id: foodId, user_id: userId });
  if (error && error.code !== UNIQUE_VIOLATION) throw error;
}

export async function unsaveFood(foodId: string, userId: string): Promise<void> {
  const { error } = await supabase.from("saves").delete().eq("food_id", foodId).eq("user_id", userId);
  if (error) throw error;
}
