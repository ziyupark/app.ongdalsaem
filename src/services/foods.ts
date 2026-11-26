// Dishes (foods + food_images + likes/saves/comments) — docs/06-data-model.md, DB = supabase/migrations.
// Acorns = rows in `likes`. Images live in bucket `food-illustrations/<uid>/<foodId>-<n>.jpg`.
import * as Crypto from 'expo-crypto';
import * as ImageManipulator from 'expo-image-manipulator';
import { myUserId, supabase } from '../lib/supabase';
import type { Difficulty, ShareDraft } from '../lib/shareDraft';
import { geohash } from '../lib/geohash';
import { temperatureTag } from '../lib/tags';
import { WEATHER_MOODS, type WeatherMood } from '../theme';

const BUCKET = 'food-illustrations';
const MAX_EDGE = 1440;
const UNIQUE_VIOLATION = '23505';

export type Person = { id: string; name: string; handle: string | null; avatarUrl: string | null };
export type Ingredient = { name: string; amount: string };
export type Step = { text: string; timerSec?: number };

export type DishSummary = {
  id: string; name: string; photo: string; mood: WeatherMood | null; tempC: number | null; acorns: number;
  /** 8.2 tags — Dish Tile byline "Comfort · Dinner" (first mood · first meal). */
  moods?: string[]; meals?: string[];
};

export type Dish = DishSummary & {
  creator: Person;
  photos: string[];
  description: string;
  meals: string[];
  moods: string[];
  ingredients: Ingredient[];
  steps: Step[];
  calories: number | null;
  servings: number | null;
  cookMinutes: number | null;
  difficulty: Difficulty | null;
  city: string | null;
  neighborhood: string | null;
  placeName: string | null;
  createdAt: Date;
  comments: number;
  eaten: number;
  allowComments: boolean;
  isPublic: boolean;
  /** Edit mode prefill (8.2 Type · landscape · place · when). */
  type: 'home' | 'travel';
  landscape: string | null;
  country: string | null;
  takenAt: Date | null;
  /** 7.1 "I made this": the recipe post it was cooked from. */
  cookedFromId: string | null;
};

/** Thrown by createDish when one photo keeps failing (8.4). */
export class UploadError extends Error {
  constructor(public index: number) { super(`photo ${index} upload failed`); }
}

export type Comment = { id: string; body: string; createdAt: Date; author: Person; likes: number; liked: boolean };

// `!creator_id` / `!user_id`: foods↔profiles also meet through likes/saves/comments, so the direct FK is named.
export const SUMMARY_SELECT = 'id, name, image_url, weather_condition, temperature_c, mood_tags, meal_type, likes(count)';
const DISH_SELECT =
  'id, creator_id, name, description, image_url, weather_condition, temperature_c, mood_tags, meal_type, ingredients, steps, calories, servings, cook_minutes, difficulty, cooked_from_id, ' +
  'city, neighborhood, country, place_name, created_at, taken_at, dish_type, landscape, allow_comments, visibility, ' +
  'creator:profiles!creator_id(id, display_name, username, avatar_url), food_images(image_url, display_order), likes(count), comments(count), food_eaten_counts(count)';

export type Row = Record<string, any>;

const asMood = (v: unknown): WeatherMood | null => (typeof v === 'string' && (WEATHER_MOODS as readonly string[]).includes(v) ? (v as WeatherMood) : null);
export const countOf = (v: unknown) => (Array.isArray(v) && v[0] && typeof v[0].count === 'number' ? v[0].count : 0);
export const toPerson = (p: Row | null | undefined, fallbackId = ''): Person => ({
  id: p?.id ?? fallbackId,
  name: p?.display_name || p?.username || '—',
  handle: p?.username ?? null,
  avatarUrl: p?.avatar_url ?? null,
});

export function toSummary(r: Row): DishSummary {
  return {
    id: r.id,
    name: r.name,
    photo: r.image_url,
    mood: asMood(r.weather_condition),
    tempC: r.temperature_c == null ? null : Math.round(Number(r.temperature_c)),
    acorns: countOf(r.likes),
    moods: Array.isArray(r.mood_tags) ? r.mood_tags : [],
    meals: Array.isArray(r.meal_type) ? r.meal_type : [],
  };
}

function toDish(r: Row): Dish {
  const images = ((r.food_images ?? []) as Row[]).sort((a, b) => a.display_order - b.display_order).map((i) => i.image_url as string);
  const ingredients = Array.isArray(r.ingredients)
    ? (r.ingredients as Row[]).map((i) => ({ name: String(i?.name ?? ''), amount: String(i?.amount ?? i?.quantity ?? '') })).filter((i) => i.name)
    : [];
  const steps = Array.isArray(r.steps)
    ? (r.steps as unknown[]).map((s) => (typeof s === 'string' ? { text: s } : { text: String((s as Row)?.text ?? ''), timerSec: (s as Row)?.timer_sec ?? undefined })).filter((s) => s.text)
    : [];
  return {
    ...toSummary(r),
    creator: toPerson(r.creator, r.creator_id),
    photos: images.length ? images : [r.image_url],
    description: r.description ?? '',
    meals: r.meal_type ?? [],
    moods: r.mood_tags ?? [],
    ingredients,
    steps,
    calories: r.calories ?? null,
    servings: r.servings ?? null,
    cookMinutes: r.cook_minutes ?? null,
    cookedFromId: r.cooked_from_id ?? null,
    difficulty: r.difficulty === 'easy' || r.difficulty === 'medium' || r.difficulty === 'hard' ? r.difficulty : null,
    city: r.city ?? null,
    neighborhood: r.neighborhood ?? null,
    placeName: r.place_name ?? null,
    createdAt: new Date(r.created_at),
    comments: countOf(r.comments),
    eaten: countOf(r.food_eaten_counts),
    allowComments: r.allow_comments ?? true,
    isPublic: r.visibility === 'everyone',
    type: r.dish_type === 'travel' ? 'travel' : 'home',
    landscape: r.landscape ?? null,
    country: r.country ?? null,
    takenAt: r.taken_at ? new Date(r.taken_at) : null,
  };
}

const myId = myUserId;

// ---------------------------------------------------------------------------------------------- reads

/** Latest public dishes for the Home feed. */
export async function fetchFeed(limit = 10): Promise<Dish[]> {
  const { data, error } = await supabase
    .from('foods')
    .select(DISH_SELECT)
    .eq('visibility', 'everyone')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as Row[]).map(toDish);
}

export type RecipeCandidate = { id: string; name: string; photo: string | null; ingredients: string[] };
let candidates: { at: number; list: RecipeCandidate[] } | null = null;
/** Signed out / account deleted: drop the in-memory candidates so the next person loads their own. */
export function resetRecipeCandidates() {
  candidates = null;
}
/** Fridge memo "what can I cook" — the latest 200 public dishes that list ingredients. Cached in memory for 10 min. */
export async function fetchRecipeCandidates(): Promise<RecipeCandidate[]> {
  if (candidates && Date.now() - candidates.at < 10 * 60_000) return candidates.list;
  const { data, error } = await supabase
    .from('foods')
    .select('id, name, image_url, ingredients')
    .eq('visibility', 'everyone')
    .eq('status', 'published')
    .neq('ingredients', '[]')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  // ingredients jsonb = [{ name, amount | quantity }] (plain strings tolerated).
  const list = ((data ?? []) as Row[])
    .map((r) => ({
      id: r.id as string,
      name: r.name as string,
      photo: (r.image_url as string | null) ?? null,
      ingredients: (Array.isArray(r.ingredients) ? (r.ingredients as unknown[]) : [])
        .map((i) => (typeof i === 'string' ? i : String((i as Row | null)?.name ?? '')).trim())
        .filter(Boolean),
    }))
    .filter((c) => c.ingredients.length);
  candidates = { at: Date.now(), list };
  return list;
}

export async function fetchDish(id: string): Promise<Dish | null> {
  const { data, error } = await supabase.from('foods').select(DISH_SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toDish(data as Row) : null;
}

/** "More from …" row on 7.1. */
export async function fetchMoreFrom(creatorId: string, excludeId: string, limit = 8): Promise<DishSummary[]> {
  const { data, error } = await supabase
    .from('foods')
    .select(SUMMARY_SELECT)
    .eq('creator_id', creatorId)
    .eq('visibility', 'everyone')
    .eq('status', 'published')
    .neq('id', excludeId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as Row[]).map(toSummary);
}

/** 7.1 "Made by N people": public posts cooked from this recipe — N cooks and one post each (newest, at most `limit`). */
export async function fetchCookedFrom(foodId: string, limit = 10): Promise<{ cooks: number; posts: { id: string; photo: string; person: Person }[] }> {
  const { data, error } = await supabase
    .from('foods')
    .select('id, image_url, creator_id, creator:profiles!creator_id(id, display_name, username, avatar_url)')
    .eq('cooked_from_id', foodId)
    .eq('visibility', 'everyone')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  const seen = new Set<string>();
  const posts: { id: string; photo: string; person: Person }[] = [];
  for (const r of data as Row[]) {
    if (seen.has(r.creator_id)) continue;
    seen.add(r.creator_id);
    if (posts.length < limit) posts.push({ id: r.id, photo: r.image_url, person: toPerson(r.creator, r.creator_id) });
  }
  return { cooks: seen.size, posts };
}

/** 7.1 "Made with <name>'s recipe": the original post's author (null when it's gone or not visible). */
export async function fetchRecipeAuthor(foodId: string): Promise<Person | null> {
  const { data, error } = await supabase.from('foods').select('creator_id, creator:profiles!creator_id(id, display_name, username, avatar_url)').eq('id', foodId).maybeSingle();
  if (error) throw error;
  return data ? toPerson((data as Row).creator, (data as Row).creator_id) : null;
}

export type ProfileTab = 'dishes' | 'saved' | 'diary';

/** 6.1 grids. Dishes = shared publicly · Diary = only-me posts · Saved = bookmarked by me. */
export async function fetchProfileDishes(userId: string, tab: ProfileTab): Promise<DishSummary[]> {
  if (tab === 'saved') {
    const { data, error } = await supabase
      .from('saves')
      .select(`created_at, food:foods(${SUMMARY_SELECT})`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as Row[]).map((r) => r.food).filter(Boolean).map(toSummary);
  }
  const { data, error } = await supabase
    .from('foods')
    .select(SUMMARY_SELECT)
    .eq('creator_id', userId)
    .eq('status', 'published')
    .eq('visibility', tab === 'dishes' ? 'everyone' : 'only_me')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Row[]).map(toSummary);
}

/** Total acorns received on everything this cook shared (6.1 "312 acorns"). */
export async function fetchAcornTotal(userId: string) {
  const { count, error } = await supabase
    .from('likes')
    .select('id, food:foods!inner(creator_id)', { count: 'exact', head: true })
    .eq('food.creator_id', userId);
  if (error) throw error;
  return count ?? 0;
}

/** Which of these dishes I gave an acorn to / saved. */
export async function fetchMyMarks(foodIds: string[]) {
  const uid = await myId();
  if (!uid || foodIds.length === 0) return { given: new Set<string>(), saved: new Set<string>() };
  const [likes, saves] = await Promise.all([
    supabase.from('likes').select('food_id').eq('user_id', uid).in('food_id', foodIds),
    supabase.from('saves').select('food_id').eq('user_id', uid).in('food_id', foodIds),
  ]);
  return {
    given: new Set(((likes.data ?? []) as Row[]).map((r) => r.food_id as string)),
    saved: new Set(((saves.data ?? []) as Row[]).map((r) => r.food_id as string)),
  };
}

const COMMENT_SELECT = 'id, body, created_at, user_id, author:profiles!user_id(id, display_name, username, avatar_url), comment_likes(count)';

export async function fetchComments(foodId: string): Promise<Comment[]> {
  const uid = await myId();
  const { data, error } = await supabase.from('comments').select(COMMENT_SELECT).eq('food_id', foodId).order('created_at', { ascending: false }).limit(200);
  if (error) throw error;
  const rows = data as Row[];
  let liked = new Set<string>();
  if (uid && rows.length) {
    const { data: mine } = await supabase.from('comment_likes').select('comment_id').eq('user_id', uid).in('comment_id', rows.map((r) => r.id));
    liked = new Set(((mine ?? []) as Row[]).map((r) => r.comment_id as string));
  }
  return rows.map((r) => ({ id: r.id, body: r.body, createdAt: new Date(r.created_at), author: toPerson(r.author, r.user_id), likes: countOf(r.comment_likes), liked: liked.has(r.id) }));
}

/** Did I log this dish today ("I ate this" state, 7.1b)? */
export async function ateToday(foodId: string) {
  const uid = await myId();
  if (!uid) return false;
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await supabase.from('food_eaten_logs').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('food_id', foodId).eq('eaten_at', today);
  return (count ?? 0) > 0;
}

// --------------------------------------------------------------------------------------------- writes

export async function setAcorn(foodId: string, on: boolean) {
  const uid = await myId();
  if (!uid) throw new Error('Not signed in');
  if (on) {
    const { error } = await supabase.from('likes').insert({ food_id: foodId, user_id: uid });
    if (error && error.code !== UNIQUE_VIOLATION) throw error;
  } else {
    const { error } = await supabase.from('likes').delete().eq('food_id', foodId).eq('user_id', uid);
    if (error) throw error;
  }
}

export async function setSaved(foodId: string, on: boolean) {
  const uid = await myId();
  if (!uid) throw new Error('Not signed in');
  if (on) {
    const { error } = await supabase.from('saves').insert({ food_id: foodId, user_id: uid });
    if (error && error.code !== UNIQUE_VIOLATION) throw error;
  } else {
    const { error } = await supabase.from('saves').delete().eq('food_id', foodId).eq('user_id', uid);
    if (error) throw error;
  }
}

export async function addComment(foodId: string, body: string): Promise<Comment> {
  const uid = await myId();
  if (!uid) throw new Error('Not signed in');
  const { data, error } = await supabase.from('comments').insert({ food_id: foodId, user_id: uid, body: body.trim() }).select(COMMENT_SELECT).single();
  if (error) throw error;
  const r = data as Row;
  return { id: r.id, body: r.body, createdAt: new Date(r.created_at), author: toPerson(r.author, r.user_id), likes: 0, liked: false };
}

export async function deleteComment(commentId: string) {
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  if (error) throw error;
}

/** Undo today's "I ate this". */
export async function unlogEaten(foodId: string) {
  const uid = await myId();
  if (!uid) throw new Error('Not signed in');
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from('food_eaten_logs').delete().eq('user_id', uid).eq('food_id', foodId).eq('eaten_at', today);
  if (error) throw error;
}

/** "I ate this" → today's Diary entry. Returns false when it was already logged today. */
export async function logEaten(dish: Pick<Dish, 'id' | 'name' | 'photo'>) {
  const uid = await myId();
  if (!uid) throw new Error('Not signed in');
  const { error } = await supabase
    .from('food_eaten_logs')
    .insert({ user_id: uid, food_id: dish.id, food_name_snapshot: dish.name, food_image_snapshot: dish.photo });
  if (error?.code === UNIQUE_VIOLATION) return false;
  if (error) throw error;
  return true;
}

export async function deleteDish(foodId: string) {
  const uid = await myId();
  if (!uid) throw new Error('Not signed in');
  // Photo paths first (edited posts also have `<foodId>-e<time>-<n>.jpg` files).
  const { data: imgs } = await supabase.from('food_images').select('image_url').eq('food_id', foodId);
  const extra = ((imgs ?? []) as Row[]).map((r) => pathOf(String(r.image_url ?? ''))).filter((x): x is string => !!x && x.startsWith(`${uid}/`));
  const { error } = await supabase.from('foods').delete().eq('id', foodId).eq('creator_id', uid);
  if (error) throw error;
  // Files are best-effort: the row (and its food_images) is already gone. Paths are `<uid>/<foodId>-<0..9>.jpg` + edited ones.
  await supabase.storage.from(BUCKET).remove([...new Set([...Array.from({ length: 10 }, (_, i) => `${uid}/${foodId}-${i}.jpg`), ...extra])]);
}

/**
 * Resize one picked photo to MAX_EDGE (JPEG 0.82) and upload it to `path`, trying twice. false = both attempts failed.
 * upsert: false — every path is new, and upsert would also need a SELECT policy on storage.objects, which
 * food-illustrations doesn't have (→ "new row violates row-level security policy").
 */
async function uploadPhoto(p: ShareDraft['photos'][number], path: string): Promise<boolean> {
  const long = Math.max(p.width, p.height) || MAX_EDGE;
  const resize = long > MAX_EDGE ? [{ resize: p.width >= p.height ? { width: MAX_EDGE } : { height: MAX_EDGE } }] : [];
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const out = await ImageManipulator.manipulateAsync(p.fileUri ?? p.uri, resize, { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG });
      const body = await (await fetch(out.uri)).arrayBuffer();
      const { error } = await supabase.storage.from(BUCKET).upload(path, body, { contentType: 'image/jpeg', upsert: false });
      if (error) throw error;
      return true;
    } catch {
      // retry once
    }
  }
  return false;
}

/** 8.3 "Share to ongdalsaem": upload photos → foods row → food_images rows. Returns the new dish id. */
export async function createDish(draft: ShareDraft): Promise<string> {
  const uid = await myId();
  if (!uid) throw new Error('Not signed in');
  if (draft.photos.length === 0) throw new Error('No photos');
  const foodId = Crypto.randomUUID();
  const paths: string[] = [];
  const urls: string[] = [];

  try {
    for (const [i, p] of draft.photos.entries()) {
      const path = `${uid}/${foodId}-${i}.jpg`;
      if (!(await uploadPhoto(p, path))) throw new UploadError(i);
      paths.push(path);
      urls.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
    }

    const ctx = draft.context;
    const row: Record<string, unknown> = {
      id: foodId,
      creator_id: uid,
      image_url: urls[0],
      image_type: 'photo',
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      weather_condition: ctx?.mood ?? null,
      temperature_c: ctx?.tempC ?? null,
      weather_tags: ctx ? [ctx.mood] : [],
      temperature_tags: ctx ? [temperatureTag(ctx.tempC)] : [],
      mood_tags: draft.moods,
      meal_type: draft.meals,
      city: ctx?.place?.city ?? null,
      country: ctx?.place?.countryCode ?? ctx?.place?.country ?? null,
      neighborhood: ctx?.place?.district ?? null,
      // 6-char geohash ≈ 1.2 × 0.6 km — never the exact point.
      landscape: draft.landscape ?? null,
      geohash6: ctx?.coords ? geohash(ctx.coords.latitude, ctx.coords.longitude, 6) : null,
      taken_at: (ctx?.takenAt ?? draft.photos[0].takenAt ?? new Date()).toISOString(),
      weather_source: draft.placeEdited ? 'place-edited' : 'auto',
      visibility: draft.isPublic ? 'everyone' : 'only_me',
      status: 'published',
      allow_comments: draft.allowComments,
      dish_type: draft.type,
      place_name: draft.type === 'travel' && draft.placeName.trim() ? draft.placeName.trim() : null,
      // A travel dish has no recipe (8.2e).
      ingredients: draft.type === 'home' ? draft.ingredients.map((i) => ({ name: i.name.trim(), amount: i.amount.trim() })) : [],
      steps: draft.type === 'home' ? draft.steps.map((st) => (st.timerSec ? { text: st.text.trim(), timer_sec: st.timerSec } : { text: st.text.trim() })) : [],
      calories: draft.type === 'home' && /^\d+$/.test(draft.calories.trim()) ? Number(draft.calories.trim()) : null,
      servings: draft.type === 'home' ? draft.servings : 2,
      cook_minutes: draft.type === 'home' ? draft.cookMinutes : null,
      difficulty: draft.type === 'home' ? draft.difficulty : null,
      cooked_from_id: draft.cookedFromId,
    };
    let { error: foodError } = await supabase.from('foods').insert(row);
    // PGRST204 = unknown column: migration 20261106010000 (taken_at · weather_source · neighborhood) not applied yet.
    if (foodError?.code === 'PGRST204') {
      console.warn('[share] foods is missing new columns — apply supabase/migrations/20261106010000_foods_taken_at_source_neighborhood.sql', foodError.message);
      const { taken_at: _a, weather_source: _b, neighborhood: _c, geohash6: _d, landscape: _e, ...legacy } = row;
      ({ error: foodError } = await supabase.from('foods').insert(legacy));
    }
    if (foodError) throw foodError;

    const { error: imgError } = await supabase
      .from('food_images')
      .insert(urls.map((image_url, display_order) => ({ food_id: foodId, user_id: uid, image_url, image_type: 'photo', display_order })));
    if (imgError) {
      await supabase.from('foods').delete().eq('id', foodId);
      throw imgError;
    }
    return foodId;
  } catch (e) {
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
    throw e;
  }
}

/** Edit mode: a share draft filled from my post. Photos stay remote (remoteUrl) until replaced; the weather is the post's own. */
export function editDraftFrom(dish: Dish): Partial<ShareDraft> {
  const when = dish.takenAt ?? dish.createdAt;
  return {
    editId: dish.id,
    editBefore: dish.photos.filter(Boolean),
    photos: dish.photos.filter(Boolean).map((url, i) => ({ id: `remote-${i}-${url}`, uri: url, remoteUrl: url, width: 0, height: 0, takenAt: when })),
    context: dish.mood
      ? { mood: dish.mood, tempC: dish.tempC ?? 0, place: dish.city ? { city: dish.city, district: dish.neighborhood ?? undefined, countryCode: dish.country ?? undefined } : null, takenAt: when, from: 'photo' }
      : null,
    contextState: dish.mood ? 'ready' : 'none',
    type: dish.type,
    name: dish.name,
    placeName: dish.placeName ?? '',
    description: dish.description,
    meals: dish.meals,
    moods: dish.moods,
    isPublic: dish.isPublic,
    allowComments: dish.allowComments,
    ingredients: dish.ingredients.map((i) => ({ name: i.name, amount: i.amount })),
    steps: dish.steps.map((st) => ({ text: st.text, timerSec: st.timerSec })),
    calories: dish.calories != null ? String(dish.calories) : '',
    servings: dish.servings ?? 2,
    cookMinutes: dish.cookMinutes,
    difficulty: dish.difficulty,
    placeEdited: false,
    uploadFailed: null,
    challenge: null,
    landscape: dish.landscape,
  };
}

/** Storage path of one of my uploaded photos from its public URL (null when it isn't in the bucket). */
function pathOf(url: string) {
  const marker = `/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i >= 0 ? decodeURIComponent(url.slice(i + marker.length).split('?')[0]) : null;
}

/**
 * Edit mode "Save changes": upload only the new photos → UPDATE the foods row (weather, temperature, created_at and
 * taken_at stay as they were; the place only changes when it was edited in 8.2d) → replace the food_images rows.
 * Photos taken off the post are removed from storage (best effort).
 */
export async function updateDish(foodId: string, draft: ShareDraft): Promise<void> {
  const before = draft.editBefore;
  const uid = await myId();
  if (!uid) throw new Error('Not signed in');
  if (draft.photos.length === 0) throw new Error('No photos');
  const stamp = Date.now();
  const added: string[] = [];
  const urls: string[] = [];
  try {
    for (const [i, p] of draft.photos.entries()) {
      if (p.remoteUrl) { urls.push(p.remoteUrl); continue; }
      // A new name per edit: the old `<foodId>-<n>.jpg` files may still be in use, and upsert needs a storage SELECT policy.
      const path = `${uid}/${foodId}-e${stamp}-${i}.jpg`;
      if (!(await uploadPhoto(p, path))) throw new UploadError(i);
      added.push(path);
      urls.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
    }

    const ctx = draft.context;
    const row: Record<string, unknown> = {
      image_url: urls[0],
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      mood_tags: draft.moods,
      meal_type: draft.meals,
      landscape: draft.landscape ?? null,
      visibility: draft.isPublic ? 'everyone' : 'only_me',
      allow_comments: draft.allowComments,
      dish_type: draft.type,
      place_name: draft.type === 'travel' && draft.placeName.trim() ? draft.placeName.trim() : null,
      ingredients: draft.type === 'home' ? draft.ingredients.map((i) => ({ name: i.name.trim(), amount: i.amount.trim() })) : [],
      steps: draft.type === 'home' ? draft.steps.map((st) => (st.timerSec ? { text: st.text.trim(), timer_sec: st.timerSec } : { text: st.text.trim() })) : [],
      calories: draft.type === 'home' && /^\d+$/.test(draft.calories.trim()) ? Number(draft.calories.trim()) : null,
      servings: draft.type === 'home' ? draft.servings : 2,
      cook_minutes: draft.type === 'home' ? draft.cookMinutes : null,
      difficulty: draft.type === 'home' ? draft.difficulty : null,
    };
    if (draft.placeEdited && ctx) {
      row.city = ctx.place?.city ?? null;
      row.country = ctx.place?.countryCode ?? ctx.place?.country ?? null;
      row.neighborhood = ctx.place?.district ?? null;
      row.geohash6 = ctx.coords ? geohash(ctx.coords.latitude, ctx.coords.longitude, 6) : null;
    }
    const { error: foodError } = await supabase.from('foods').update(row).eq('id', foodId).eq('creator_id', uid);
    if (foodError) throw foodError;

    const { error: delError } = await supabase.from('food_images').delete().eq('food_id', foodId);
    if (delError) throw delError;
    const { error: imgError } = await supabase
      .from('food_images')
      .insert(urls.map((image_url, display_order) => ({ food_id: foodId, user_id: uid, image_url, image_type: 'photo', display_order })));
    if (imgError) throw imgError;
  } catch (e) {
    if (added.length) await supabase.storage.from(BUCKET).remove(added);
    throw e;
  }
  // Photos no longer on the post — best effort.
  const gone = before.filter((u) => !urls.includes(u)).map(pathOf).filter((x): x is string => !!x && x.startsWith(`${uid}/`));
  if (gone.length) await supabase.storage.from(BUCKET).remove(gone).catch(() => undefined);
}

// ------------------------------------------------------------------------------------- 6.2 Saved · 6.3 Diary

export type SavedDish = DishSummary & { saveId: string; savedAt: Date; cook: string; collectionIds: string[] };
export type Collection = { id: string; name: string };

export async function fetchSavedDishes(): Promise<SavedDish[]> {
  const uid = await myId();
  if (!uid) return [];
  const { data, error } = await supabase
    .from('saves')
    .select(`id, created_at, collection_items(collection_id), food:foods(${SUMMARY_SELECT}, creator:profiles!creator_id(display_name, username))`)
    .eq('user_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Row[])
    .filter((r) => r.food)
    .map((r) => ({
      ...toSummary(r.food),
      saveId: r.id,
      savedAt: new Date(r.created_at),
      cook: r.food.creator?.display_name || r.food.creator?.username || '—',
      collectionIds: ((r.collection_items ?? []) as Row[]).map((c) => c.collection_id as string),
    }));
}

export async function fetchCollections(): Promise<Collection[]> {
  const uid = await myId();
  if (!uid) return [];
  const { data, error } = await supabase.from('collections').select('id, name').eq('owner_id', uid).order('created_at');
  if (error) throw error;
  return (data ?? []) as Collection[];
}

export async function createCollection(name: string): Promise<Collection> {
  const uid = await myId();
  if (!uid) throw new Error('Not signed in');
  const { data, error } = await supabase.from('collections').insert({ owner_id: uid, name: name.trim().slice(0, 30) }).select('id, name').single();
  if (error) throw error;
  return data as Collection;
}

/** Deletes one of my collections; its items go with it (on delete cascade) — the dishes stay saved. */
export async function deleteCollection(id: string) {
  const { error } = await supabase.from('collections').delete().eq('id', id);
  if (error) throw error;
}

export async function setInCollection(collectionId: string, saveId: string, on: boolean) {
  const { error } = on
    ? await supabase.from('collection_items').insert({ collection_id: collectionId, save_id: saveId })
    : await supabase.from('collection_items').delete().eq('collection_id', collectionId).eq('save_id', saveId);
  if (error && error.code !== UNIQUE_VIOLATION) throw error;
}

export type DiaryDay = { date: string; mood: WeatherMood | null; cooked: DishSummary[] };
/** One request per month at a time — the week row, the month line and the month popup ask for the same month together. */
const diaryInFlight = new Map<string, Promise<DiaryDay[]>>();
export function fetchDiaryMonth(year: number, month: number): Promise<DiaryDay[]> {
  const k = `${year}-${month}`;
  let p = diaryInFlight.get(k);
  if (!p) {
    p = loadDiaryMonth(year, month).finally(() => diaryInFlight.delete(k));
    diaryInFlight.set(k, p);
  }
  return p;
}

/** One month of my kitchen: dishes I posted (any visibility), grouped by local day. */
async function loadDiaryMonth(year: number, month: number): Promise<DiaryDay[]> {
  const uid = await myId();
  if (!uid) return [];
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  const key = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const foods = await supabase.from('foods').select(`${SUMMARY_SELECT}, created_at, taken_at`).eq('creator_id', uid).gte('created_at', start.toISOString()).lt('created_at', end.toISOString());
  if (foods.error) throw foods.error;
  const days = new Map<string, DiaryDay>();
  const day = (k: string) => days.get(k) ?? (days.set(k, { date: k, mood: null, cooked: [] }), days.get(k)!);
  for (const r of (foods.data ?? []) as Row[]) {
    const d = day(key(new Date(r.taken_at ?? r.created_at)));
    const s = toSummary(r);
    d.cooked.push(s);
    d.mood = d.mood ?? s.mood;
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}
