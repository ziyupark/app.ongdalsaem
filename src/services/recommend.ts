// Home recommendations — docs/05-behavior.md §6.1 Meal slots · §6.2 Today's pick · Mood prompt.
// Runs on the client over a pool of recent public dishes; swap for an RPC when the pool outgrows one query.
import type { Meal } from '../lib/meals';
import { supabase } from '../lib/supabase';
import { WEATHER_MOODS, type WeatherMood } from '../theme';
import { countOf, toPerson, type Person, type Row } from './foods';

export type PoolDish = {
  id: string;
  name: string;
  photo: string;
  mood: WeatherMood | null;
  tempC: number | null;
  acorns: number;
  meals: string[];
  moods: string[];
  city: string | null;
  neighborhood: string | null;
  createdAt: Date;
  creator: Person;
};

export type Place = { city?: string | null; neighborhood?: string | null };
export type Ctx = { mood?: WeatherMood | null; tempC?: number | null; place?: Place };

const POOL_DAYS = 60;
const POOL_LIMIT = 300;
const SELECT =
  'id, name, image_url, weather_condition, temperature_c, mood_tags, meal_type, city, neighborhood, created_at, ' +
  'likes(count), creator:profiles!creator_id(id, display_name, username, avatar_url)';

const asMood = (v: unknown): WeatherMood | null => (typeof v === 'string' && (WEATHER_MOODS as readonly string[]).includes(v) ? (v as WeatherMood) : null);

/** Recent public dishes that recommendations choose from. */
export async function fetchPool(): Promise<PoolDish[]> {
  const since = new Date(Date.now() - POOL_DAYS * 86400_000).toISOString();
  const { data, error } = await supabase
    .from('foods')
    .select(SELECT)
    .eq('visibility', 'everyone')
    .eq('status', 'published')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(POOL_LIMIT);
  if (error) throw error;
  return (data as Row[])
    .filter((r) => r.image_url)
    .map((r) => ({
      id: r.id,
      name: r.name,
      photo: r.image_url,
      mood: asMood(r.weather_condition),
      tempC: r.temperature_c == null ? null : Math.round(Number(r.temperature_c)),
      acorns: countOf(r.likes),
      meals: r.meal_type ?? [],
      moods: r.mood_tags ?? [],
      city: r.city ?? null,
      neighborhood: r.neighborhood ?? null,
      createdAt: new Date(r.created_at),
      creator: toPerson(r.creator),
    }));
}

/** §6.1 step 4: mood families used when no dish matches the exact weather. */
const GROUP: Record<WeatherMood, 'rain' | 'snow' | 'clear' | 'grey'> = {
  drizzle: 'rain', rain: 'rain', 'heavy-rain': 'rain', shower: 'rain', thunder: 'rain',
  sleet: 'snow', flurries: 'snow', snow: 'snow', 'heavy-snow': 'snow', cold: 'snow',
  clear: 'clear', 'clear-night': 'clear', heat: 'clear',
  cloudy: 'grey', overcast: 'grey', fog: 'grey', dust: 'grey', windy: 'grey',
};
export const sameGroup = (a: WeatherMood | null, b: WeatherMood | null) => !!a && !!b && GROUP[a] === GROUP[b];

/** Timeline meals → the Meal tags people pick in 8.2 (Late ≈ dinner/snack, Dawn ≈ breakfast/snack). */
const MEAL_TAGS: Record<Meal, string[]> = {
  breakfast: ['breakfast'], lunch: ['lunch'], snack: ['snack'], dinner: ['dinner'],
  late: ['dinner', 'snack'], dawn: ['breakfast', 'snack'],
};
const fitsMeal = (d: PoolDish, meal: Meal) => d.meals.length === 0 || d.meals.some((m) => MEAL_TAGS[meal].includes(m));

/** §6.1 step 3: acorns × freshness (last 6 h weighted) × distance (neighborhood → city → elsewhere). */
function score(d: PoolDish, place?: Place) {
  const ageH = (Date.now() - +d.createdAt) / 3600_000;
  const fresh = ageH < 6 ? 2 : ageH < 48 ? 1.3 : 1;
  const near = place?.neighborhood && d.neighborhood === place.neighborhood ? 1.6 : place?.city && d.city === place.city ? 1.25 : 1;
  return (d.acorns + 1) * fresh * near;
}

/** Weather tiers, strictest first (§6.1 steps 1 & 4). Without weather (2.6) every dish passes. */
function tiers(ctx: Ctx): ((d: PoolDish) => boolean)[] {
  const { mood, tempC } = ctx;
  if (!mood) return [() => true];
  const near = (d: PoolDish, max: number) => tempC == null || d.tempC == null || Math.abs(d.tempC - tempC) <= max;
  return [
    (d) => d.mood === mood && near(d, 3),
    (d) => d.mood === mood && near(d, 6),
    (d) => sameGroup(d.mood, mood) && near(d, 6),
    (d) => sameGroup(d.mood, mood),
  ];
}

function best(list: PoolDish[], weight: (d: PoolDish) => number) {
  let top: PoolDish | null = null;
  let topScore = -1;
  for (const d of list) {
    const s = weight(d);
    if (s > topScore) { top = d; topScore = s; }
  }
  return top;
}

/** One slot's dish, skipping ids already shown this session (New picks). */
export function pickForSlot(pool: PoolDish[], meal: Meal, ctx: Ctx, exclude: Set<string>): PoolDish | null {
  for (const keep of tiers(ctx)) {
    const hit = best(pool.filter((d) => !exclude.has(d.id) && fitsMeal(d, meal) && keep(d)), (d) => score(d, ctx.place));
    if (hit) return hit;
  }
  return null;
}

/** Today's pick prefers dishes posted within this many degrees of the current temperature. */
export const PICK_TEMP_RANGE = 1;

/**
 * §6.2 Today's pick. Candidates, first non-empty wins:
 * 1. today's weather family (rain · snow · clear · grey) within ±PICK_TEMP_RANGE °C of now;
 * 2. otherwise the same family at the closest temperature to now;
 * 3. otherwise (no dish in the family) any dish at the closest temperature — so the card never disappears.
 * Inside the candidates: same exact weather × current meal × place/acorns/freshness.
 * Location off (2.5) → the chosen city's best. No weather (2.6) → every dish is a candidate.
 * `excludeCreator` = my user id: my own dishes are never my pick.
 */
export function pickToday(all: PoolDish[], ctx: Ctx & { meal?: Meal; excludeCreator?: string | null }): PoolDish | null {
  const { mood, tempC } = ctx;
  const pool = ctx.excludeCreator ? all.filter((d) => d.creator.id !== ctx.excludeCreator) : all;
  const weight = (d: PoolDish) =>
    score(d, ctx.place) *
    (mood && d.mood === mood ? 1.6 : 1) *
    (ctx.meal && fitsMeal(d, ctx.meal) && d.meals.length ? 1.3 : 1);
  if (!mood) return best(pool, weight);

  const family = pool.filter((d) => sameGroup(d.mood, mood));
  if (tempC == null) return best(family.length ? family : pool, weight);

  const gap = (d: PoolDish) => (d.tempC == null ? Infinity : Math.abs(d.tempC - tempC));
  const inRange = family.filter((d) => gap(d) <= PICK_TEMP_RANGE);
  if (inRange.length) return best(inRange, weight);
  /** Dishes at the smallest temperature gap in a list (all of them when none has a temperature). */
  const closest = (list: PoolDish[]) => {
    const min = Math.min(...list.map(gap));
    return min === Infinity ? list : list.filter((d) => gap(d) === min);
  };
  return best(closest(family.length ? family : pool), weight);
}
