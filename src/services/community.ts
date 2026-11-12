// Community (3.x Nearby · 4.x Global / Following / Tables / Challenges) — reads and writes on the tables in
// supabase/migrations/20261029000000_follows_and_messages.sql and 20261030020000_tables_questions_challenges.sql.
import { clashes, type DietPrefs } from '../lib/allergens';
import { hasIngredients } from '../lib/ingredientMatch';
import { supabase } from '../lib/supabase';
import type { WeatherMood } from '../theme';
import { countOf, SUMMARY_SELECT, toPerson, toSummary, type DishSummary, type Person, type Row } from './foods';

export type CardDish = DishSummary & {
  creator: Person;
  moods: string[];
  meals: string[];
  city: string | null;
  neighborhood: string | null;
  country: string | null;
  createdAt: Date;
  description: string;
  photoCount: number;
  comments: number;
};

const CARD_SELECT = `${SUMMARY_SELECT}, city, neighborhood, country, created_at, description, food_images(count), comments(count), creator:profiles!creator_id(id, display_name, username, avatar_url)`;

const toCard = (r: Row): CardDish => ({
  ...toSummary(r),
  creator: toPerson(r.creator, r.creator_id),
  moods: r.mood_tags ?? [],
  meals: r.meal_type ?? [],
  city: r.city ?? null,
  neighborhood: r.neighborhood ?? null,
  country: r.country ?? null,
  createdAt: new Date(r.created_at),
  description: r.description ?? '',
  photoCount: Math.max(1, countOf(r.food_images)),
  comments: countOf(r.comments),
});

const publicFoods = (select = CARD_SELECT) => supabase.from('foods').select(select).eq('visibility', 'everyone').eq('status', 'published');

async function uid() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
async function needUid() {
  const id = await uid();
  if (!id) throw new Error('Not signed in');
  return id;
}

export type Sort = 'popular' | 'latest';
const byAcorns = (a: DishSummary, b: DishSummary) => b.acorns - a.acorns;

async function list(q: any, sort: Sort = 'latest', limit = 40): Promise<CardDish[]> {
  const { data, error } = await q.order('created_at', { ascending: false }).limit(sort === 'popular' ? 100 : limit);
  if (error) throw error;
  const rows = (data as Row[]).map(toCard);
  return sort === 'popular' ? rows.sort(byAcorns).slice(0, limit) : rows;
}

// ---------------------------------------------------------------------------------------------- dishes

export type NearbyFilter = {
  city?: string | null; neighborhood?: string | null; cells?: string[] | null; mood?: WeatherMood | null; query?: string;
  /** Search filters (Explore filter popup): cook time at most n minutes · difficulty · every listed ingredient. */
  maxMinutes?: number | null; difficulty?: 'easy' | 'medium' | 'hard' | null; ingredients?: string[];
  /** My diet & allergies — dishes that clash are left out. */
  diet?: DietPrefs | null;
};

/** 3.1 / 3.5 / 3.6 — dishes shared in your city (or neighbourhood), optionally the same weather or matching a search. */
export async function fetchNearby(f: NearbyFilter, sort: Sort = 'latest') {
  const wanted = f.ingredients?.filter((i) => i.trim()) ?? [];
  const avoid = !!f.diet && (!!f.diet.diet || f.diet.allergies.length > 0);
  let q = publicFoods(wanted.length || avoid ? `${CARD_SELECT}, ingredients` : CARD_SELECT);
  if (f.cells?.length) q = q.in('geohash6', f.cells);
  else if (f.neighborhood) q = q.eq('neighborhood', f.neighborhood);
  else if (f.city) q = q.eq('city', f.city);
  if (f.mood) q = q.eq('weather_condition', f.mood);
  if (f.query?.trim()) q = q.or(searchOr(f.query));
  if (f.maxMinutes) q = q.lte('cook_minutes', f.maxMinutes);
  if (f.difficulty) q = q.eq('difficulty', f.difficulty);
  if (!wanted.length && !avoid) return list(q, sort);
  // Ingredients (synonyms: 계란 = egg) and diet / allergies are matched on the device — read a wider page, keep what fits.
  const { data, error } = await q.order('created_at', { ascending: false }).limit(200);
  if (error) throw error;
  const names = (r: Row) => (Array.isArray(r.ingredients) ? (r.ingredients as Row[]).map((i) => String(i?.name ?? '')).filter(Boolean) : []);
  const rows = (data as Row[])
    .filter((r) => (!wanted.length || hasIngredients(wanted, names(r))) && !clashes([String(r.name ?? ''), ...names(r)], f.diet ?? null))
    .map(toCard);
  return (sort === 'popular' ? rows.sort(byAcorns) : rows).slice(0, 40);
}

/** Search term → PostgREST `or` over name, description and mood tags. Commas/parens are stripped so the filter stays valid. */
function searchOr(term: string) {
  const t = term.trim().replace(/[,()*%]/g, ' ').trim();
  const tag = t.toLowerCase().replace(/\s+/g, '-');
  return `name.ilike.*${t}*,description.ilike.*${t}*,mood_tags.cs.{${tag}}`;
}

/** 3.4 Search · Typing — dish names that start with / contain the term, with how many there are near you. */
export async function searchSuggestions(term: string, city: string | null) {
  const t = term.trim().replace(/[,()*%]/g, ' ').trim();
  if (t.length < 2) return [];
  let q = supabase.from('foods').select('name').eq('visibility', 'everyone').eq('status', 'published').ilike('name', `%${t}%`);
  if (city) q = q.eq('city', city);
  const { data, error } = await q.limit(200);
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const r of data as Row[]) {
    const key = String(r.name).trim().toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, n]) => ({ name, n }));
}

/** 4.1 Global — public dishes, optionally one landscape (forest / sea / …). */
export async function fetchGlobal(landscape?: string | null, sort: Sort = 'popular') {
  let q = publicFoods();
  if (landscape) q = q.eq('landscape', landscape);
  return list(q, sort);
}

/** 4.2 Tag — dishes with the mood/character tag. `near` limits to a city. */
export async function fetchByTag(tag: string, sort: Sort = 'popular', city?: string | null) {
  let q = publicFoods().contains('mood_tags', [tag.toLowerCase()]);
  if (city) q = q.eq('city', city);
  return list(q, sort);
}

/** 4.3 Country — dishes shared in that country (ISO code, e.g. 'JP'). */
export async function fetchByCountry(code: string, sort: Sort = 'popular', mood?: WeatherMood | null) {
  let q = publicFoods().eq('country', code.toUpperCase());
  if (mood) q = q.eq('weather_condition', mood);
  return list(q, sort);
}

/** Tag counts inside a list (4.2 "Cooked in 18 countries" / 4.3 "Signature dishes"). */
export function topTags(rows: CardDish[], key: 'moods' | 'meals' = 'moods', max = 6) {
  const m = new Map<string, number>();
  for (const r of rows) for (const t of r[key]) m.set(t, (m.get(t) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, max).map(([t]) => t);
}
export function countries(rows: CardDish[]) {
  return [...new Set(rows.map((r) => r.country).filter((c): c is string => !!c))];
}

/** 4.1 Trending by Country — the most-acorned recent dish per country. */
export async function fetchTrendingByCountry(): Promise<CardDish[]> {
  // Last 14 days; if no dish there has a country, widen to 60 days so the section doesn't vanish.
  for (const days of [14, 60]) {
    const since = new Date(Date.now() - days * 864e5).toISOString();
    const { data, error } = await publicFoods().not('country', 'is', null).gte('created_at', since).order('created_at', { ascending: false }).limit(150);
    if (error) throw error;
    const best = new Map<string, CardDish>();
    for (const d of (data as Row[]).map(toCard)) {
      const c = d.country!.toUpperCase();
      const cur = best.get(c);
      if (!cur || d.acorns > cur.acorns) best.set(c, d);
    }
    if (best.size) return [...best.values()].sort(byAcorns).slice(0, 8);
  }
  return [];
}

/**
 * 4.1 Story of the day — the most-acorned dish with a caption from the last 2 days; else from the last 30 days;
 * else the most-acorned of the newest dishes even without a caption (the card leaves the caption out), so the section stays.
 */
export async function fetchStoryOfTheDay(): Promise<CardDish | null> {
  const recent = async (days: number, captioned: boolean) => {
    const since = new Date(Date.now() - days * 864e5).toISOString();
    let q = publicFoods().gte('created_at', since);
    if (captioned) q = q.neq('description', '');
    const { data, error } = await q.order('created_at', { ascending: false }).limit(60);
    if (error) throw error;
    return (data as Row[]).map(toCard).filter((d) => !captioned || d.description).sort(byAcorns)[0] ?? null;
  };
  return (await recent(2, true)) ?? (await recent(30, true)) ?? (await recent(3650, false)); // last: newest 60 dishes of any age
}

// ---------------------------------------------------------------------------------------------- Our area · today

/** Local midnight today (the "today" of Our area — top dishes). */
export const localMidnight = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
/** Local date as 'YYYY-MM-DD'. */
export const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export type TopDish = { name: string; count: number; photo: string; dishId: string };
/** How far Popular today had to widen: my cells → district → city (today) → city, last 3 days → same weather, recent. */
export type TopScope = 'area' | 'district' | 'city' | 'city3d' | 'weather';

const TOP_N = 3;

/**
 * Our area · Popular today — public dishes grouped by name (case / spaces ignored), ranked by count (then acorns); the
 * representative is the most-acorned (then newest) dish of that name. Always tries for 3: starts with today in your
 * area cell + its neighbours (`cells`, 5-char), then tops up — skipping names already in — from today in the district →
 * today in the city → the city's last 3 days → the same weather (`mood`) over the last 7 days, anywhere. `scope` = the
 * widest step that added a name. Fewer than 3 after every step → just those.
 */
export async function fetchTodayTopDishes(at: { cells: string[]; district?: string | null; city?: string | null; mood?: WeatherMood | null }): Promise<{ items: TopDish[]; scope: TopScope }> {
  const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString();
  const today = localMidnight().toISOString();
  const from = (since: string) => publicFoods(`${SUMMARY_SELECT}, created_at`).gte('created_at', since);
  const steps: { load: () => any; scope: TopScope }[] = [];
  const cells = at.cells.filter((c) => /^[0-9b-hjkmnp-z]{5}$/.test(c));
  if (cells.length) steps.push({ load: () => from(today).or(cells.map((c) => `geohash6.like.${c}*`).join(',')), scope: 'area' });
  if (at.district) steps.push({ load: () => (at.city ? from(today).eq('city', at.city) : from(today)).eq('neighborhood', at.district!), scope: 'district' });
  if (at.city) {
    steps.push({ load: () => from(today).eq('city', at.city!), scope: 'city' });
    steps.push({ load: () => from(daysAgo(3)).eq('city', at.city!), scope: 'city3d' });
  }
  if (at.mood) steps.push({ load: () => from(daysAgo(7)).eq('weather_condition', at.mood!), scope: 'weather' });

  const key = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ');
  const items: TopDish[] = [];
  let scope: TopScope = 'area';
  for (const step of steps) {
    if (items.length >= TOP_N) break;
    const { data, error } = await step.load().order('created_at', { ascending: false }).limit(300);
    if (error) continue;
    const groups = new Map<string, { count: number; acorns: number; rep: DishSummary }>();
    for (const d of (data as Row[]).map(toSummary)) {
      const k = key(d.name ?? '');
      if (!k) continue;
      const g = groups.get(k);
      if (!g) groups.set(k, { count: 1, acorns: d.acorns, rep: d });
      else {
        g.count += 1;
        g.acorns += d.acorns;
        if (d.acorns > g.rep.acorns) g.rep = d; // rows are newest first, so ties keep the newest
      }
    }
    const have = new Set(items.map((i) => key(i.name)));
    const added = [...groups.entries()]
      .filter(([k]) => !have.has(k))
      .sort(([, a], [, b]) => b.count - a.count || b.acorns - a.acorns)
      .slice(0, TOP_N - items.length)
      .map(([, g]) => ({ name: g.rep.name.trim(), count: g.count, photo: g.rep.photo, dishId: g.rep.id }));
    if (added.length) { items.push(...added); scope = step.scope; }
  }
  return { items, scope };
}

// ---------------------------------------------------------------------------------------------- following

export async function fetchFolloweeIds() {
  const me = await uid();
  if (!me) return [];
  const { data, error } = await supabase.from('follows').select('followee_id').eq('follower_id', me);
  if (error) throw error;
  return (data as Row[]).map((r) => r.followee_id as string);
}

export type FollowingItem = CardDish & { fromTable: string | null };

/** 4.4 Following — dishes from cooks you follow, plus the dishes posted in your tables. */
export async function fetchFollowingFeed(only: 'all' | 'people' | 'tables' = 'all'): Promise<FollowingItem[]> {
  const me = await uid();
  if (!me) return [];
  const [ids, tables] = await Promise.all([fetchFolloweeIds(), only === 'people' ? Promise.resolve([]) : fetchMyTables()]);
  const out = new Map<string, FollowingItem>();
  if (only !== 'tables' && ids.length) {
    const { data, error } = await publicFoods().in('creator_id', ids).order('created_at', { ascending: false }).limit(40);
    if (error) throw error;
    for (const d of (data as Row[]).map(toCard)) out.set(d.id, { ...d, fromTable: null });
  }
  if (only !== 'people' && tables.length) {
    const { data, error } = await supabase
      .from('table_posts')
      .select(`created_at, table:topic_tables(name), food:foods!inner(${CARD_SELECT}, visibility)`)
      .in('table_id', tables.map((t) => t.id))
      .eq('food.visibility', 'everyone')
      .order('created_at', { ascending: false })
      .limit(40);
    if (error) throw error;
    for (const r of data as Row[]) if (r.food && !out.has(r.food.id)) out.set(r.food.id, { ...toCard(r.food), fromTable: r.table?.name ?? null });
  }
  return [...out.values()].filter((d) => d.creator.id !== me).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/** 4.4 Table · my seat — my own published dishes since `since` (any visibility), newest first. */
export async function fetchMyDishesSince(since: Date): Promise<CardDish[]> {
  const me = await uid();
  if (!me) return [];
  const { data, error } = await supabase.from('foods').select(CARD_SELECT).eq('creator_id', me).eq('status', 'published')
    .gte('created_at', since.toISOString()).order('created_at', { ascending: false }).limit(20);
  if (error) throw error;
  return (data as Row[]).map(toCard);
}

/** 4.4b Table · no follows yet — recent popular cooks (acorns over 14 days), each with their most-liked dish. */
export async function fetchSuggestedPlates(limit = 3): Promise<CardDish[]> {
  const me = await uid();
  const { data, error } = await publicFoods().gte('created_at', new Date(Date.now() - 14 * 864e5).toISOString())
    .order('created_at', { ascending: false }).limit(200);
  if (error) throw error;
  const followed = new Set(await fetchFolloweeIds());
  const best = new Map<string, { dish: CardDish; total: number }>();
  for (const d of (data as Row[]).map(toCard)) {
    if (d.creator.id === me || followed.has(d.creator.id)) continue;
    const cur = best.get(d.creator.id);
    if (!cur) best.set(d.creator.id, { dish: d, total: d.acorns });
    else best.set(d.creator.id, { dish: d.acorns > cur.dish.acorns ? d : cur.dish, total: cur.total + d.acorns });
  }
  return [...best.values()].sort((a, b) => b.total - a.total).slice(0, limit).map((b) => b.dish);
}

export type CookCard = Person & { city: string | null; acorns: number; following: boolean; mood: WeatherMood | null; tempC: number | null };

/** 4.4 Suggested for you / 4.6 Cooks in your weather — cooks who recently shared in `mood`, closest temperature first, then acorns. */
export async function fetchCooksInWeather(mood: WeatherMood | null, tempC: number | null, limit = 20): Promise<CookCard[]> {
  const me = await uid();
  let q = publicFoods(`id, creator_id, weather_condition, temperature_c, city, likes(count), creator:profiles!creator_id(id, display_name, username, avatar_url)`)
    .gte('created_at', new Date(Date.now() - 30 * 864e5).toISOString());
  if (mood) q = q.eq('weather_condition', mood);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(200);
  if (error) throw error;
  const cooks = new Map<string, CookCard & { gap: number }>();
  for (const r of data as Row[]) {
    if (!r.creator || r.creator_id === me) continue;
    const temp = r.temperature_c == null ? null : Math.round(Number(r.temperature_c));
    const gap = tempC != null && temp != null ? Math.abs(temp - tempC) : 99;
    const cur = cooks.get(r.creator_id);
    const acorns = (cur?.acorns ?? 0) + countOf(r.likes);
    if (!cur || gap < cur.gap) cooks.set(r.creator_id, { ...toPerson(r.creator), city: r.city ?? null, acorns, following: false, mood: r.weather_condition ?? null, tempC: temp, gap });
    else cur.acorns = acorns;
  }
  const followed = new Set(await fetchFolloweeIds());
  return [...cooks.values()]
    .map((c) => ({ ...c, following: followed.has(c.id) }))
    .sort((a, b) => a.gap - b.gap || b.acorns - a.acorns)
    .slice(0, limit)
    .map(({ gap: _g, ...c }) => c);
}

// ---------------------------------------------------------------------------------------------- tables

export type Table = { id: string; slug: string; name: string; description: string | null; rules: string | null; coverUrl: string | null; members: number; postsToday: number; joined: boolean; hostedBy: string | null };

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); };

async function decorateTables(rows: Row[]): Promise<Table[]> {
  if (!rows.length) return [];
  const me = await uid();
  const ids = rows.map((r) => r.id);
  const [mine, today] = await Promise.all([
    me ? supabase.from('table_members').select('table_id').eq('user_id', me).in('table_id', ids) : Promise.resolve({ data: [] as Row[] }),
    supabase.from('table_posts').select('table_id').in('table_id', ids).gte('created_at', startOfToday()),
  ]);
  const joined = new Set(((mine.data ?? []) as Row[]).map((r) => r.table_id));
  const posts = new Map<string, number>();
  for (const r of (today.data ?? []) as Row[]) posts.set(r.table_id, (posts.get(r.table_id) ?? 0) + 1);
  return rows.map((r) => ({
    id: r.id, slug: r.slug, name: r.name, description: r.description ?? null, rules: r.rules ?? null, coverUrl: r.cover_url ?? null,
    members: r.member_count ?? 0, postsToday: posts.get(r.id) ?? 0, joined: joined.has(r.id), hostedBy: r.host?.username ?? null,
  }));
}

const TABLE_SELECT = 'id, slug, name, description, rules, cover_url, member_count, host:profiles!created_by(username)';

/** 4.7 Tables · Browse — popular tables (by members), optional search. */
export async function fetchTables(term = ''): Promise<Table[]> {
  let q = supabase.from('topic_tables').select(TABLE_SELECT);
  const t = term.trim().replace(/[,()*%#]/g, '');
  if (t) q = q.or(`name.ilike.*${t}*,description.ilike.*${t}*`);
  const { data, error } = await q.order('member_count', { ascending: false }).limit(40);
  if (error) throw error;
  return decorateTables(data as Row[]);
}

/** Tables you joined (4.7 "Your tables", 4.4 chips). */
export async function fetchMyTables(): Promise<Table[]> {
  const me = await uid();
  if (!me) return [];
  const { data, error } = await supabase.from('table_members').select(`joined_at, table:topic_tables(${TABLE_SELECT})`).eq('user_id', me).order('joined_at', { ascending: false });
  if (error) throw error;
  return decorateTables((data as Row[]).map((r) => r.table).filter(Boolean));
}

export async function fetchTable(slug: string): Promise<Table | null> {
  const { data, error } = await supabase.from('topic_tables').select(TABLE_SELECT).eq('slug', slug).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return (await decorateTables([data as Row]))[0];
}

/** 4.8 — dishes posted to the table, newest first. */
export async function fetchTablePosts(tableId: string): Promise<CardDish[]> {
  const { data, error } = await supabase
    .from('table_posts')
    .select(`created_at, food:foods!inner(${CARD_SELECT}, visibility)`)
    .eq('table_id', tableId)
    .eq('food.visibility', 'everyone')
    .order('created_at', { ascending: false })
    .limit(60);
  if (error) throw error;
  return (data as Row[]).map((r) => toCard(r.food));
}

/** Up to 3 member avatars for the "12.4k members" row. */
export async function fetchTableFaces(tableId: string): Promise<Person[]> {
  const { data } = await supabase.from('table_members').select('user:profiles!user_id(id, display_name, username, avatar_url)').eq('table_id', tableId).order('joined_at', { ascending: false }).limit(3);
  return ((data ?? []) as Row[]).map((r) => toPerson(r.user));
}

export async function setTableJoined(tableId: string, on: boolean) {
  const me = await needUid();
  const { error } = on
    ? await supabase.from('table_members').insert({ table_id: tableId, user_id: me })
    : await supabase.from('table_members').delete().eq('table_id', tableId).eq('user_id', me);
  if (error && error.code !== '23505') throw error;
}

/** Share one of your public dishes to a table you joined. */
export async function postToTable(tableId: string, foodId: string) {
  const { error } = await supabase.from('table_posts').insert({ table_id: tableId, food_id: foodId });
  if (error && error.code !== '23505') throw error;
}

// ---------------------------------------------------------------------------------------------- questions

/** 4.6 Ask · Category — required, default whatToEat (20261118000000_questions_list_category_weather.sql). */
export const QUESTION_CATEGORIES = ['whatToEat', 'recipe', 'restaurant', 'groceries', 'tools'] as const;
export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];

export type Question = {
  id: string; body: string; category: QuestionCategory; imageUrl: string | null; place: string | null;
  author: Person; answers: number; meToo: number; mine: boolean; meTooByMe: boolean; bestAnswerId: string | null; createdAt: Date;
  /** Weather when it was asked. */
  mood: WeatherMood | null; tempC: number | null;
  /** Set when a question came from a wider range than your area cell (Explore · Our area), e.g. "Dongjak-gu", "Seoul". */
  range?: string;
};
export type Answer = { id: string; body: string; author: Person; helpful: number; helpfulByMe: boolean; place: string | null; createdAt: Date };

async function decorateQuestions(rows: Row[]): Promise<Question[]> {
  if (!rows.length) return [];
  const me = await uid();
  const authorIds = [...new Set(rows.map((r) => r.author_id))];
  const [authors, mine] = await Promise.all([
    supabase.from('profiles').select('id, display_name, username, avatar_url').in('id', authorIds),
    me ? supabase.from('question_me_too').select('question_id').eq('user_id', me).in('question_id', rows.map((r) => r.id)) : Promise.resolve({ data: [] as Row[] }),
  ]);
  const byId = new Map(((authors.data ?? []) as Row[]).map((p) => [p.id, toPerson(p)]));
  const meToo = new Set(((mine.data ?? []) as Row[]).map((r) => r.question_id));
  return rows.map((r) => ({
    id: r.id, body: r.body, category: r.category, imageUrl: r.image_url ?? null,
    place: r.neighborhood ?? r.city ?? r.country ?? null,
    author: byId.get(r.author_id) ?? toPerson(null, r.author_id),
    answers: r.answer_count ?? 0, meToo: r.me_too_count ?? 0, mine: r.author_id === me, meTooByMe: meToo.has(r.id),
    bestAnswerId: r.best_answer_id ?? null, createdAt: new Date(r.created_at),
    mood: r.mood ?? null, tempC: r.temp_c == null ? null : Number(r.temp_c),
  }));
}

/** 3.1 — open questions in your area cell (server decides who sees what; your exact location never leaves the RPC). */
export async function fetchNearbyQuestions(geohash: string, limit = 10): Promise<Question[]> {
  const { data, error } = await supabase.rpc('nearby_questions', { p_geohash: geohash, p_limit: limit });
  if (error) throw error;
  return decorateQuestions((data ?? []) as Row[]);
}

/**
 * Explore · Our area: questions in your area cell, topped up to `min` (never past `max`) from wider ranges, skipping ids
 * already in — neighbouring cells (one geohash level wider) → same district → same city → newest anywhere. Questions
 * from a wider range carry `range`: the district / city of that step, or the question's own place for the others.
 */
export async function fetchAreaQuestions(
  geohash: string, at: { district?: string | null; city?: string | null }, min = 3, max = 5,
): Promise<Question[]> {
  const own = await fetchNearbyQuestions(geohash, max);
  if (own.length >= min) return own;
  const open = () => supabase.from('questions').select('*').is('table_id', null).order('created_at', { ascending: false }).limit(max);
  const steps: { load: () => PromiseLike<{ data: unknown; error: unknown }>; range?: string }[] = [
    { load: () => supabase.rpc('nearby_questions_wide', { p_geohash: geohash, p_limit: max }) },
  ];
  if (at.district) steps.push({ load: () => (at.city ? open().eq('city', at.city) : open()).eq('neighborhood', at.district!), range: at.district });
  if (at.city) steps.push({ load: () => open().eq('city', at.city!), range: at.city });
  steps.push({ load: () => open() });

  const seen = new Set(own.map((q) => q.id));
  const rows: { row: Row; range?: string }[] = [];
  for (const step of steps) {
    if (own.length + rows.length >= min) break;
    const { data, error } = await Promise.resolve(step.load()).catch((e) => ({ data: null, error: e }));
    if (error) continue; // e.g. the wide RPC isn't on the server yet — try the next range
    for (const row of (data ?? []) as Row[]) {
      if (own.length + rows.length >= min) break;
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      rows.push({ row, range: step.range });
    }
  }
  const extra = await decorateQuestions(rows.map((r) => r.row));
  return [...own, ...extra.map((q, i) => ({ ...q, range: rows[i].range ?? q.place ?? undefined }))];
}

export async function fetchQuestion(id: string): Promise<Question | null> {
  const { data, error } = await supabase.from('questions').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? (await decorateQuestions([data as Row]))[0] : null;
}

export async function askQuestion(input: { body: string; category: QuestionCategory; geohash: string; neighborhood?: string | null; city?: string | null; country?: string | null; imageUri?: string | null; mood?: WeatherMood | null; tempC?: number | null }) {
  let imageUrl: string | null = null;
  if (input.imageUri) {
    const me = await needUid();
    const body = await (await fetch(input.imageUri)).arrayBuffer();
    const path = `${me}/question-${Date.now()}.jpg`;
    const up = await supabase.storage.from('food-illustrations').upload(path, body, { contentType: 'image/jpeg', upsert: false });
    if (up.error) throw up.error;
    imageUrl = supabase.storage.from('food-illustrations').getPublicUrl(path).data.publicUrl;
  }
  const { data, error } = await supabase.rpc('ask_question', {
    p_body: input.body.trim(), p_category: input.category, p_image_url: imageUrl,
    p_neighborhood: input.neighborhood ?? null, p_city: input.city ?? null, p_country: input.country ?? null, p_geohash: input.geohash,
    p_mood: input.mood ?? null, p_temp_c: input.tempC ?? null,
  });
  if (error) throw error;
  return (data as Row).id as string;
}

/** Asker edits their own question (body · category). */
export async function updateQuestion(id: string, input: { body: string; category: QuestionCategory }) {
  const { error } = await supabase.from('questions').update({ body: input.body.trim(), category: input.category }).eq('id', id);
  if (error) throw error;
}

export async function reportQuestion(questionId: string, authorId: string, reason: string) {
  const me = await needUid();
  const { error } = await supabase.from('reports').insert({ reporter_id: me, question_id: questionId, reported_user_id: authorId, reason });
  if (error) throw error;
}

/** 4.5 Questions · List — paging state: which range we're in, how far into it, ids already shown. */
export type QuestionCursor = { tier: number; offset: number; seen: string[] };
export type QuestionFilter = { category: QuestionCategory | null; query: string };

/**
 * 4.5 Questions · List — 20 at a time: your area cell first, then (same order as fetchAreaQuestions) neighbouring
 * cells → district → city, skipping ids already shown. Each range is read to the end before the next one starts.
 * Questions from a wider range than your cell carry `range`. `next` = null when every range is used up.
 */
export async function fetchQuestionsPage(
  at: { geohash: string | null; district?: string | null; city?: string | null },
  f: QuestionFilter, cursor: QuestionCursor | null, size = 20,
): Promise<{ items: Question[]; next: QuestionCursor | null }> {
  const query = f.query.trim();
  const like = `%${query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const open = (from: number, n: number) => {
    let q = supabase.from('questions').select('*').is('table_id', null);
    if (f.category) q = q.eq('category', f.category);
    if (query) q = q.ilike('body', like);
    return q.order('created_at', { ascending: false }).order('id').range(from, from + n - 1);
  };
  const area = (chars: number) => (from: number, n: number) => supabase.rpc('area_questions', {
    p_geohash: at.geohash, p_chars: chars, p_category: f.category, p_query: query || null, p_limit: n, p_offset: from,
  });
  const tiers: { load: (from: number, n: number) => PromiseLike<{ data: unknown; error: unknown }>; range?: string; wide?: boolean }[] = [];
  if (at.geohash) tiers.push({ load: area(4) }, { load: area(3), wide: true });
  if (at.district) tiers.push({ load: (from, n) => (at.city ? open(from, n).eq('city', at.city) : open(from, n)).eq('neighborhood', at.district!), range: at.district });
  if (at.city) tiers.push({ load: (from, n) => open(from, n).eq('city', at.city!), range: at.city });

  let { tier, offset } = cursor ?? { tier: 0, offset: 0 };
  const seen = new Set(cursor?.seen ?? []);
  const rows: { row: Row; range?: string; wide?: boolean }[] = [];
  while (rows.length < size && tier < tiers.length) {
    const step = tiers[tier];
    const n = size - rows.length;
    const { data, error } = await Promise.resolve(step.load(offset, n)).catch((e) => ({ data: null, error: e }));
    const got = error ? [] : ((data ?? []) as Row[]);
    for (const row of got) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      rows.push({ row, range: step.range, wide: step.wide });
    }
    if (got.length < n) { tier += 1; offset = 0; } else offset += got.length;
  }
  const items = await decorateQuestions(rows.map((r) => r.row));
  return {
    items: items.map((q, i) => (rows[i].range || rows[i].wide ? { ...q, range: rows[i].range ?? q.place ?? undefined } : q)),
    next: tier < tiers.length ? { tier, offset, seen: [...seen] } : null,
  };
}

export async function deleteQuestion(id: string) {
  const { error } = await supabase.from('questions').delete().eq('id', id);
  if (error) throw error;
}

export async function setMeToo(questionId: string, on: boolean) {
  const me = await needUid();
  const { error } = on
    ? await supabase.from('question_me_too').insert({ question_id: questionId, user_id: me })
    : await supabase.from('question_me_too').delete().eq('question_id', questionId).eq('user_id', me);
  if (error && error.code !== '23505') throw error;
}

export async function fetchAnswers(questionId: string): Promise<Answer[]> {
  const me = await uid();
  const { data, error } = await supabase
    .from('answers')
    .select('id, body, helpful_count, created_at, author:profiles!author_id(id, display_name, username, avatar_url, city)')
    .eq('question_id', questionId)
    .order('created_at');
  if (error) throw error;
  const rows = data as Row[];
  const mine = me && rows.length ? await supabase.from('answer_helpful').select('answer_id').eq('user_id', me).in('answer_id', rows.map((r) => r.id)) : { data: [] as Row[] };
  const set = new Set(((mine.data ?? []) as Row[]).map((r) => r.answer_id));
  return rows.map((r) => ({ id: r.id, body: r.body, author: toPerson(r.author), helpful: r.helpful_count ?? 0, helpfulByMe: set.has(r.id), place: r.author?.city ?? null, createdAt: new Date(r.created_at) }));
}

export async function addAnswer(questionId: string, body: string) {
  const me = await needUid();
  const { error } = await supabase.from('answers').insert({ question_id: questionId, author_id: me, body: body.trim() });
  if (error) throw error;
}

export async function deleteAnswer(id: string) {
  const { error } = await supabase.from('answers').delete().eq('id', id);
  if (error) throw error;
}

export async function setHelpful(answerId: string, on: boolean) {
  const me = await needUid();
  const { error } = on
    ? await supabase.from('answer_helpful').insert({ answer_id: answerId, user_id: me })
    : await supabase.from('answer_helpful').delete().eq('answer_id', answerId).eq('user_id', me);
  if (error && error.code !== '23505') throw error;
}

/** Asker's pick. */
export async function setBestAnswer(questionId: string, answerId: string | null) {
  const { error } = await supabase.from('questions').update({ best_answer_id: answerId }).eq('id', questionId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------------------------- challenges

export type ChallengePhase = 'soon' | 'running' | 'ended';
export type Challenge = {
  id: string; slug: string; title: string; description: string | null; rule: string | null; tag: string; country: string | null; coverUrl: string | null;
  startsAt: Date; endsAt: Date; participants: number; entries: number; joined: boolean; phase: ChallengePhase;
  /** Illustration theme (lib/holidays THEME_IMAGE): chuseok · halloween · christmas · seollal · valentine · diwali · forest. */
  theme: string;
  /** I've posted an entry. */
  entered: boolean;
};

const phaseOf = (s: Date, e: Date, now = Date.now()): ChallengePhase => (now < s.getTime() ? 'soon' : now >= e.getTime() ? 'ended' : 'running');

async function decorateChallenges(rows: Row[]): Promise<Challenge[]> {
  if (!rows.length) return [];
  const me = await uid();
  const mine = me ? await supabase.from('challenge_participants').select('challenge_id').eq('user_id', me).in('challenge_id', rows.map((r) => r.id)) : { data: [] as Row[] };
  const joined = new Set(((mine.data ?? []) as Row[]).map((r) => r.challenge_id));
  const posted = me ? await supabase.from('challenge_entries').select('challenge_id').eq('user_id', me).in('challenge_id', rows.map((r) => r.id)) : { data: [] as Row[] };
  const entered = new Set(((posted.data ?? []) as Row[]).map((r) => r.challenge_id));
  return rows.map((r) => {
    const startsAt = new Date(r.starts_at);
    const endsAt = new Date(r.ends_at);
    return {
      id: r.id, slug: r.slug, title: r.title, description: r.description ?? null, rule: r.rule ?? null, tag: r.tag, country: r.country ?? null, coverUrl: r.cover_url ?? null,
      startsAt, endsAt, participants: r.participant_count ?? 0, entries: r.entry_count ?? 0, joined: joined.has(r.id), phase: phaseOf(startsAt, endsAt),
      theme: r.theme ?? 'forest', entered: entered.has(r.id),
    };
  });
}

/** 4.9 — all challenges (ended ones from the last 30 days). */
export async function fetchChallenges(): Promise<Challenge[]> {
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const { data, error } = await supabase.from('challenges').select('*').gte('ends_at', since).order('ends_at');
  if (error) throw error;
  return decorateChallenges(data as Row[]);
}

export async function fetchChallenge(slug: string): Promise<Challenge | null> {
  const { data, error } = await supabase.from('challenges').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data ? (await decorateChallenges([data as Row]))[0] : null;
}

/** 2.1c — the running challenge you joined that ends soonest. */
export async function fetchMyActiveChallenge(): Promise<Challenge | null> {
  const me = await uid();
  if (!me) return null;
  const { data, error } = await supabase.from('challenge_participants').select('challenge:challenges(*)').eq('user_id', me);
  if (error) return null;
  const list = await decorateChallenges(((data ?? []) as Row[]).map((r) => r.challenge).filter(Boolean));
  return list.filter((c) => c.phase === 'running').sort((a, b) => a.endsAt.getTime() - b.endsAt.getTime())[0] ?? null;
}

export async function setChallengeJoined(challengeId: string, on: boolean) {
  const me = await needUid();
  const { error } = on
    ? await supabase.from('challenge_participants').insert({ challenge_id: challengeId, user_id: me })
    : await supabase.from('challenge_participants').delete().eq('challenge_id', challengeId).eq('user_id', me);
  if (error && error.code !== '23505') throw error;
}

export async function fetchChallengeEntries(challengeId: string, limit = 30): Promise<DishSummary[]> {
  const { data, error } = await supabase
    .from('challenge_entries')
    .select(`created_at, food:foods(${SUMMARY_SELECT})`)
    .eq('challenge_id', challengeId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as Row[]).filter((r) => r.food).map((r) => toSummary(r.food));
}

export async function fetchChallengeFaces(challengeId: string): Promise<Person[]> {
  const { data } = await supabase.from('challenge_participants').select('user:profiles!user_id(id, display_name, username, avatar_url)').eq('challenge_id', challengeId).order('joined_at', { ascending: false }).limit(4);
  return ((data ?? []) as Row[]).map((r) => toPerson(r.user));
}

/** After sharing a dish while in a challenge, enter it (RLS checks the dish is yours, public and the challenge is running). */
export async function enterChallenge(challengeId: string, foodId: string) {
  const me = await needUid();
  const { error } = await supabase.from('challenge_entries').insert({ challenge_id: challengeId, food_id: foodId, user_id: me });
  if (error && error.code !== '23505') throw error;
}

/** "2d 22h" / "5h 10m" until `to`. */
export function timeLeft(to: Date, now = Date.now()) {
  const ms = Math.max(0, to.getTime() - now);
  const d = Math.floor(ms / 864e5);
  const h = Math.floor((ms % 864e5) / 36e5);
  const m = Math.floor((ms % 36e5) / 6e4);
  return d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`;
}
