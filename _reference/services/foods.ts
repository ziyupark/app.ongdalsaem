import * as Crypto from "expo-crypto";

import { supabase } from "@/lib/supabase";
import { contentTypeForUri, deleteFoodImage, extensionForContentType, uploadFoodImage } from "@/services/storage";
import type {
  Food,
  FoodDifficulty,
  FoodImage,
  FoodImageType,
  FoodIngredient,
  FoodStatus,
  FoodStep,
  FoodVisibility,
} from "@/types/food";

/**
 * Shape of a row exactly as it comes back from `foods` (snake_case, per
 * supabase/migrations/*_initial_schema.sql). Hand-written rather than
 * generated — there is no live Supabase project to run `supabase gen types`
 * against yet (Phase 27 scope). Keep in sync with the migration by hand.
 */
interface FoodRow {
  id: string;
  creator_id: string;
  image_url: string | null;
  image_type: FoodImageType;
  name: string;
  description: string | null;
  ingredients: FoodIngredient[];
  steps: FoodStep[];
  cooking_time_minutes: number | null;
  servings: number | null;
  difficulty: FoodDifficulty | null;
  calories: number | null;
  weather_condition: string | null;
  temperature_c: number | null;
  weather_tags: string[];
  temperature_tags: string[];
  mood_tags: string[];
  meal_type: string[];
  character_tags: string[];
  city: string | null;
  country: string | null;
  visibility: FoodVisibility;
  status: FoodStatus;
  created_at: string;
  updated_at: string;
  // Embedded via `.select("*, food_images(*)")` — absent (undefined) if a
  // caller doesn't ask for it, empty array if the food genuinely has none
  // yet (shouldn't happen for a published food, but mock/legacy rows never
  // got food_images rows at all — mapFoodRow treats both the same way).
  food_images?: FoodImageRow[];
  // Embedded via `.select("*, likes(count)")` (Phase 38.6) — PostgREST's
  // aggregate-count syntax returns exactly one row, `[{ count: N }]`, per
  // food in the same query as everything else. No per-card query, so N
  // Food Cards never mean N extra round trips.
  likes?: { count: number }[];
  // Embedded via `.select("*, food_eaten_counts(count)")` (per user
  // request) — same aggregate-count pattern as `likes` above, for the
  // "I Ate This" count shown next to Like. Reads from the food_eaten_counts
  // view, not food_eaten_logs directly (see foodColumns' comment).
  food_eaten_counts?: { count: number }[];
  // Embedded via the aliased `mine:likes(user_id)` — only requested (and only
  // filtered to the viewer's own id) when a viewerId is passed in, so signed-
  // out reads never pay for it. A non-empty array means the current viewer
  // has liked this Food.
  mine?: { user_id: string }[];
  // Embedded via the `creator_id` FK (Phase 39) — a many-foods-to-one-profile
  // join comes back as a single nested object, not an array. Absent if the
  // creator's profile row is missing (shouldn't happen post-onboarding, but
  // never assume).
  profiles?: { username: string } | null;
}

/** Shape of a row from the Phase 38 `food_images` table (snake_case). */
interface FoodImageRow {
  id: string;
  food_id: string;
  user_id: string;
  image_url: string;
  image_type: FoodImageType;
  display_order: number;
  created_at: string;
}

function mapFoodImageRow(row: FoodImageRow): FoodImage {
  return {
    id: row.id,
    foodId: row.food_id,
    userId: row.user_id,
    imageUrl: row.image_url,
    imageType: row.image_type,
    displayOrder: row.display_order,
    createdAt: row.created_at,
  };
}

function mapFoodRow(row: FoodRow): Food {
  // Sort defensively even though the query already requests
  // display_order ascending — nothing downstream should have to re-sort.
  const images = row.food_images
    ? [...row.food_images].sort((a, b) => a.display_order - b.display_order).map(mapFoodImageRow)
    : undefined;

  return {
    id: row.id,
    userId: row.creator_id,
    name: row.name,
    description: row.description ?? undefined,
    imageUrl: row.image_url ?? undefined,
    imageType: row.image_type,
    images,
    ingredients: row.ingredients,
    steps: row.steps,
    cookingTimeMinutes: row.cooking_time_minutes ?? undefined,
    servings: row.servings ?? undefined,
    calories: row.calories ?? undefined,
    difficulty: row.difficulty ?? undefined,
    weatherCondition: row.weather_condition ?? undefined,
    temperature: row.temperature_c ?? undefined,
    weatherTags: row.weather_tags,
    temperatureTags: row.temperature_tags,
    moodTags: row.mood_tags,
    mealType: row.meal_type,
    characterTags: row.character_tags,
    locationCity: row.city ?? undefined,
    locationCountry: row.country ?? undefined,
    visibility: row.visibility,
    status: row.status,
    likeCount: row.likes?.[0]?.count ?? 0,
    eatenCount: row.food_eaten_counts?.[0]?.count ?? 0,
    isLikedByMe: Boolean(row.mine?.length),
    creatorUsername: row.profiles?.username,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Every fetch that returns full Food records embeds the gallery, like count,
// AND creator username in the same query (one round trip, no N+1) — Food
// Card only ever reads images?.[0], likeCount, and creatorUsername, but Food
// Detail needs the whole image array, and there's no cheaper way to know in
// advance which caller is which. Screens that don't render one of these
// (e.g. Discover's grid cards never show creatorUsername or likeCount) just
// ignore the extra field — cheaper than forking this into several
// almost-identical column sets.
// `mine:likes(user_id)` is only added when a viewerId is given, and filtered
// to just that viewer's own row via `.eq("mine.user_id", viewerId)` below —
// signed-out reads (Discover is browsable without login) never request it.
function foodColumns(viewerId?: string): string {
  // food_eaten_counts (not food_eaten_logs directly) — that table's own RLS
  // is owner-only (a personal diary, "never meant to be a public signal"),
  // so embedding it here would silently only count the *viewer's own* log
  // for each food, not a real public total. food_eaten_counts is a view
  // (supabase/migrations/20261011020000_food_eaten_counts.sql) that exposes
  // just food_id + count — safe to read publicly since it never surfaces
  // who logged what.
  const base = "*, food_images(*), likes(count), food_eaten_counts(count), profiles!creator_id(username)";
  return viewerId ? `${base}, mine:likes(user_id)` : base;
}

export interface FoodPage {
  foods: Food[];
  nextOffset: number | null;
}

interface PageParams {
  limit?: number;
  offset?: number;
}

const DISCOVER_PAGE_SIZE = 20;

interface PublicFoodsFilters {
  city?: string;
  country?: string;
}

/**
 * Shared primitive behind every Discover tab (docs/04-screens/03-nearby.md
 * §12): published + everyone-visible foods, newest first, optionally scoped
 * to a city and/or country. This WHERE clause is belt-and-suspenders — the
 * `foods` RLS policy ("published foods are publicly readable") already
 * enforces the same restriction server-side regardless of what the client
 * sends.
 */
async function getPublicFoodsPage(
  filters: PublicFoodsFilters,
  { limit = DISCOVER_PAGE_SIZE, offset = 0 }: PageParams,
  viewerId?: string
): Promise<FoodPage> {
  let query = supabase
    .from("foods")
    .select(foodColumns(viewerId))
    .eq("visibility", "everyone")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .order("display_order", { foreignTable: "food_images", ascending: true })
    .range(offset, offset + limit - 1);

  if (filters.city) query = query.eq("city", filters.city);
  if (filters.country) query = query.eq("country", filters.country);
  if (viewerId) query = query.eq("mine.user_id", viewerId);

  const { data, error } = await query;
  if (error) throw error;

  const foods = (data as unknown as FoodRow[] ?? []).map(mapFoodRow);
  return { foods, nextOffset: foods.length === limit ? offset + limit : null };
}

/**
 * DS-03 Latest: all public foods, newest first, paginated. `viewerId` (the
 * signed-in viewer, not the creator) is optional — pass it to also resolve
 * each Food's `isLikedByMe` in this same query; omit it for a signed-out
 * read. `city`, when given, scopes "Latest" the same way "Nearby" is scoped.
 * `country` backs the Global tab (same newest-first order, scoped to one
 * country instead of one city) — every other caller (Home, widget, For
 * You/Nearby/Trending's own candidate fetch) omits both and keeps seeing
 * every published Food.
 */
export function getLatestFoods(page: PageParams = {}, viewerId?: string, city?: string, country?: string): Promise<FoodPage> {
  return getPublicFoodsPage({ city, country }, page, viewerId);
}

/**
 * DS-02 Nearby: public foods matching a city (docs/03-ia-and-flows.md —
 * city/country only, no map or distance calculation this phase).
 */
export function getNearbyFoods(city: string, page: PageParams = {}, viewerId?: string): Promise<FoodPage> {
  return getPublicFoodsPage({ city }, page, viewerId);
}

/**
 * Global tab's country filter chips — every distinct country among recent
 * public Foods, alphabetical. A plain `select` + client-side dedupe rather
 * than a Postgres `DISTINCT`/RPC, matching this codebase's existing
 * "bounded recent window, ranked/grouped client-side" pattern (see
 * useDiscoverFoods.ts) rather than adding server-side aggregation for an MVP
 * filter list.
 */
export async function getDiscoverCountries(): Promise<string[]> {
  const { data, error } = await supabase
    .from("foods")
    .select("country")
    .eq("visibility", "everyone")
    .eq("status", "published")
    .not("country", "is", null)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;

  const countries = new Set<string>();
  for (const row of (data as { country: string | null }[] | null) ?? []) {
    if (row.country) countries.add(row.country);
  }
  return Array.from(countries).sort((a, b) => a.localeCompare(b));
}

/**
 * Home's "Yesterday's Kozycast" paging page — the actual most recent public
 * Food posted yesterday (by created_at, device-local day boundaries), not a
 * synthesized recommendation. `viewerId` resolves isLikedByMe the same way
 * every other fetch here does. Returns null if nobody posted yesterday.
 */
export async function getYesterdaysFood(viewerId?: string): Promise<Food | null> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  let query = supabase
    .from("foods")
    .select(foodColumns(viewerId))
    .eq("visibility", "everyone")
    .eq("status", "published")
    .gte("created_at", startOfYesterday.toISOString())
    .lt("created_at", startOfToday.toISOString())
    .order("created_at", { ascending: false })
    .order("display_order", { foreignTable: "food_images", ascending: true })
    .limit(1);

  if (viewerId) query = query.eq("mine.user_id", viewerId);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data ? mapFoodRow(data as unknown as FoodRow) : null;
}

const SEARCH_RESULTS_LIMIT = 50;

/**
 * Name search across all public foods (Phase 42.6) — case-insensitive
 * substring match on `name` only (no full-text ranking, no country/cuisine
 * field to search by; searching a dish's name already surfaces foods from
 * any country, e.g. "curry" or "ramen"). A single bounded, unpaginated
 * result set — good enough for an MVP search box.
 */
export async function searchFoods(query: string, viewerId?: string): Promise<Food[]> {
  let q = supabase
    .from("foods")
    .select(foodColumns(viewerId))
    .eq("visibility", "everyone")
    .eq("status", "published")
    .ilike("name", `%${query}%`)
    .order("created_at", { ascending: false })
    .order("display_order", { foreignTable: "food_images", ascending: true })
    .limit(SEARCH_RESULTS_LIMIT);

  if (viewerId) q = q.eq("mine.user_id", viewerId);

  const { data, error } = await q;
  if (error) throw error;
  return (data as unknown as FoodRow[] ?? []).map(mapFoodRow);
}

/** A single Food by id, with its full image gallery. Relies on RLS to hide private/draft foods from non-owners. */
export async function getFoodById(id: string): Promise<Food | null> {
  const { data, error } = await supabase
    .from("foods")
    .select(foodColumns())
    .eq("id", id)
    .order("display_order", { foreignTable: "food_images", ascending: true })
    .maybeSingle();

  if (error) throw error;
  return data ? mapFoodRow(data as unknown as FoodRow) : null;
}

// Same reasoning as SAVED_FOODS_LIMIT below — bounded by one user's own
// posting activity, not a platform-wide feed, so a single generous cap is a
// proportionate MVP bound rather than full infinite-scroll pagination
// (Profile's grid isn't built for incremental loading the way Discover's
// FlatList is). Without it, a prolific creator's My Foods fetched every
// food they ever posted, with the full image gallery/likes/profile embed,
// on every Profile mount.
const MY_FOODS_LIMIT = 100;

/** All foods created by a given user, newest first — backs Profile → My Foods. */
export async function getMyFoods(userId: string): Promise<Food[]> {
  const { data, error } = await supabase
    .from("foods")
    .select(foodColumns(userId))
    .eq("creator_id", userId)
    .eq("mine.user_id", userId)
    .order("created_at", { ascending: false })
    .order("display_order", { foreignTable: "food_images", ascending: true })
    .limit(MY_FOODS_LIMIT);

  if (error) throw error;
  return (data as unknown as FoodRow[] ?? []).map(mapFoodRow);
}

// A personal Saved list is bounded by one user's own tapping — nothing like
// Discover's platform-wide feeds — so a single generous cap (Phase 34 §19)
// is a safe, proportionate MVP bound; real infinite-scroll pagination isn't
// needed until Saved lists routinely approach it.
const SAVED_FOODS_LIMIT = 100;

/** All foods a given user has saved, newest save first — backs the Saved tab. */
export async function getSavedFoods(userId: string): Promise<Food[]> {
  const { data, error } = await supabase
    .from("saves")
    .select(`created_at, foods(${foodColumns(userId)})`)
    .eq("user_id", userId)
    .eq("foods.mine.user_id", userId)
    .order("created_at", { ascending: false })
    .order("display_order", { foreignTable: "foods.food_images", ascending: true })
    .limit(SAVED_FOODS_LIMIT);

  if (error) throw error;

  return ((data as unknown as { foods: FoodRow | null }[]) ?? [])
    .map((row) => row.foods)
    .filter((food): food is FoodRow => food !== null)
    .map(mapFoodRow);
}

interface CreateFoodImageInput {
  uri: string;
  mimeType?: string | null;
  imageType: FoodImageType;
}

export interface CreateFoodInput {
  /** 1-10 images, in display order — images[0] becomes the representative photo (Phase 38 §8). */
  images: CreateFoodImageInput[];
  name: string;
  description?: string;
  ingredients: FoodIngredient[];
  steps: FoodStep[];
  calories?: number;
  weatherTags: string[];
  temperatureTags: string[];
  moodTags: string[];
  mealType: string[];
  characterTags: string[];
  locationCity?: string;
  locationCountry?: string;
  visibility: FoodVisibility;
  /** Defaults to "published" — pass "draft" to publish later without changing this function's own failure-recovery behavior. */
  status?: FoodStatus;
}

export const MIN_FOOD_IMAGES = 1;
export const MAX_FOOD_IMAGES = 10;

/**
 * Publish sequence (Phase 29 §16, extended Phase 38 for multiple images):
 * generate the id client-side so storage paths can embed it, upload every
 * image, insert the `foods` row as a draft (mirroring images[0] into
 * image_url/image_type for backward compatibility — see the food_images
 * migration's header comment), insert one `food_images` row per image,
 * then flip the row to its real target status last. `userId` must come
 * from the authenticated session (auth.uid()) — never a client-editable
 * field; RLS enforces this as the second layer regardless.
 *
 * The row is always inserted as a draft first and only flipped to
 * `input.status` as the final step (docs/05-behavior.md: "support saving
 * the creation as a draft so the user's illustration is not lost") — any
 * failure from the `foods` insert onward leaves that draft row (and
 * whatever food_images rows made it in) behind instead of deleting the
 * user's already-uploaded illustration. Only an upload failure itself
 * cleans up and fully rethrows, since nothing durable exists yet at that
 * point. A Food is still never left *published* with 0 images — the
 * final flip never runs unless food_images succeeded first.
 */
export async function createFood(input: CreateFoodInput, userId: string): Promise<Food> {
  if (input.images.length < MIN_FOOD_IMAGES) {
    throw new Error(`A food needs at least ${MIN_FOOD_IMAGES} photo.`);
  }
  if (input.images.length > MAX_FOOD_IMAGES) {
    throw new Error(`A food can have at most ${MAX_FOOD_IMAGES} photos.`);
  }

  const foodId = Crypto.randomUUID();
  const uploadedPaths: string[] = [];

  async function cleanupUploads() {
    await Promise.all(uploadedPaths.map((path) => deleteFoodImage(path).catch(() => {})));
  }

  let uploadedImages: { url: string; imageType: FoodImageType }[];
  try {
    uploadedImages = await Promise.all(
      input.images.map(async (image, displayOrder) => {
        const contentType = contentTypeForUri(image.uri, image.mimeType);
        const extension = extensionForContentType(contentType);
        const path = `${userId}/${foodId}/${displayOrder}.${extension}`;
        const url = await uploadFoodImage(image.uri, path, contentType);
        uploadedPaths.push(path);
        return { url, imageType: image.imageType };
      })
    );
  } catch (error) {
    // Nothing durable exists yet — no row, no food_images — so there's
    // nothing to preserve as a draft here, only the upload itself to retry.
    await cleanupUploads();
    throw error;
  }

  const cover = uploadedImages[0];
  const targetStatus: FoodStatus = input.status ?? "published";

  const { data: draftRow, error: draftError } = await supabase
    .from("foods")
    .insert({
      id: foodId,
      creator_id: userId,
      image_url: cover.url,
      image_type: cover.imageType,
      name: input.name,
      description: input.description || null,
      ingredients: input.ingredients,
      steps: input.steps,
      calories: input.calories ?? null,
      weather_tags: input.weatherTags,
      temperature_tags: input.temperatureTags,
      mood_tags: input.moodTags,
      meal_type: input.mealType,
      character_tags: input.characterTags,
      city: input.locationCity || null,
      country: input.locationCountry || null,
      visibility: input.visibility,
      status: "draft",
    })
    .select()
    .single();

  if (draftError) {
    // The row itself never made it in — still nothing to salvage.
    await cleanupUploads();
    throw draftError;
  }

  const { data: imageRows, error: imagesError } = await supabase
    .from("food_images")
    .insert(
      uploadedImages.map((image, displayOrder) => ({
        food_id: foodId,
        user_id: userId,
        image_url: image.url,
        image_type: image.imageType,
        display_order: displayOrder,
      }))
    )
    .select();

  if (imagesError) {
    // Unlike before, this no longer deletes the foods row — it's left
    // behind as a draft (image_url/image_type on the row itself still has
    // the cover image, even with 0 food_images rows) rather than destroying
    // the user's already-uploaded illustration.
    throw imagesError;
  }

  if (targetStatus === "draft") {
    return mapFoodRow({ ...(draftRow as FoodRow), food_images: imageRows as FoodImageRow[] });
  }

  const { data: publishedRow, error: publishError } = await supabase
    .from("foods")
    .update({ status: targetStatus })
    .eq("id", foodId)
    .select()
    .single();

  if (publishError) {
    // Row + images both made it in as a draft — the illustration and
    // recipe are safe, just not yet flipped to the target status. Surface
    // the error so the caller can tell the user, but don't delete anything.
    throw publishError;
  }

  return mapFoodRow({ ...(publishedRow as FoodRow), food_images: imageRows as FoodImageRow[] });
}
