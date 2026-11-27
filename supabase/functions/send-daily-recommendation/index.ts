// 9.4 "Today's pick" push — today's weather + one dish that suits it, at each of the user's chosen times (up to 5 a day).
//
// Called every 15 min by pg_cron (supabase/migrations/20261108000000_daily_pick_push.sql). For every
// push_tokens row with daily_pick on where one of its local pick_times fell in the last 15 minutes and that
// wasn't sent to in the last 15 minutes (20261130000000_daily_pick_times.sql): weather at the stored (rounded) coordinates → mood → a dish from that weather family
// (same rules as the app's Today's pick: exact weather first, then acorns × freshness × meal) → Expo push.
//
// Title: "Light rain 14° · Mapo-gu, Seoul"   Body: "Today's pick: Beef noodle soup"   (in the app language)
// Tapping it opens the dish (data.foodId → /dish/[id]).
//
// Deploy:  supabase functions deploy send-daily-recommendation
// Secret:  supabase secrets set OPENWEATHER_API_KEY=<your OpenWeather key> (the `weather` function uses the same one)
import { createClient } from "jsr:@supabase/supabase-js@2";
import STRINGS from "./strings.json" with { type: "json" };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENWEATHER_API_KEY = Deno.env.get("OPENWEATHER_API_KEY");
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const OWM_URL = "https://api.openweathermap.org/data/2.5/weather";
const WINDOW_MIN = 15;
const POOL_DAYS = 60;

type Mood =
  | "clear" | "clear-night" | "cloudy" | "overcast" | "drizzle" | "rain" | "heavy-rain" | "shower" | "thunder"
  | "sleet" | "flurries" | "snow" | "heavy-snow" | "fog" | "dust" | "heat" | "cold" | "windy";
type Lang = keyof typeof STRINGS;

const GROUP: Record<Mood, "rain" | "snow" | "clear" | "grey"> = {
  drizzle: "rain", rain: "rain", "heavy-rain": "rain", shower: "rain", thunder: "rain",
  sleet: "snow", flurries: "snow", snow: "snow", "heavy-snow": "snow", cold: "snow",
  clear: "clear", "clear-night": "clear", heat: "clear",
  cloudy: "grey", overcast: "grey", fog: "grey", dust: "grey", windy: "grey",
};

type Owm = {
  main: { temp: number }; wind?: { speed?: number };
  rain?: { "1h"?: number }; snow?: { "1h"?: number };
  weather: { id: number; icon: string }[];
};

/** Same mapping as the app (src/services/weather.ts moodFromOwm). */
function moodFromOwm(r: Owm): Mood {
  const id = r.weather[0]?.id ?? 800;
  const night = r.weather[0]?.icon?.endsWith("n") ?? false;
  const rainMm = r.rain?.["1h"] ?? 0;
  const snowCm = (r.snow?.["1h"] ?? 0) / 10;
  let sky: Mood;
  if (id >= 200 && id < 300) sky = "thunder";
  else if (id >= 300 && id < 400) sky = "drizzle";
  else if (id === 511 || (id >= 611 && id <= 616)) sky = "sleet";
  else if (id >= 520 && id < 600) sky = "shower";
  else if (id >= 500 && id < 520) sky = rainMm >= 15 || id >= 502 ? "heavy-rain" : rainMm >= 3 || id === 501 ? "rain" : "drizzle";
  else if (id >= 600 && id < 700) sky = snowCm >= 1 || id === 602 || id === 622 ? "heavy-snow" : id === 600 || id === 620 ? "flurries" : "snow";
  else if (id === 701 || id === 741) sky = "fog";
  else if (id >= 700 && id < 770) sky = "dust";
  else if (id >= 770 && id < 800) sky = "windy";
  else if (id === 804) sky = "overcast";
  else if (id === 803) sky = "cloudy";
  else sky = night ? "clear-night" : "clear";
  const precip: Mood[] = ["thunder", "heavy-rain", "heavy-snow", "sleet", "rain", "snow", "shower", "drizzle", "flurries"];
  if (precip.includes(sky)) return sky;
  if (r.main.temp >= 33) return "heat";
  if (r.main.temp <= -12) return "cold";
  if (sky === "dust" || sky === "fog") return sky;
  if ((r.wind?.speed ?? 0) >= 14) return "windy";
  return sky;
}

async function weatherAt(where: string): Promise<{ mood: Mood; tempC: number } | null> {
  if (!OPENWEATHER_API_KEY) return null;
  const res = await fetch(`${OWM_URL}?${where}&units=metric&appid=${OPENWEATHER_API_KEY}`);
  if (!res.ok) return null;
  const json = (await res.json()) as Owm;
  return { mood: moodFromOwm(json), tempC: Math.round(json.main.temp) };
}

/** Local date (YYYY-MM-DD), minutes since local midnight and hour in an IANA zone. */
function localNow(tz: string, now: Date) {
  let zone = tz;
  try { new Intl.DateTimeFormat("en-CA", { timeZone: zone }); } catch { zone = "UTC"; }
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(now).map((p) => [p.type, p.value]),
  );
  const hour = Number(parts.hour);
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: hour * 60 + Number(parts.minute), hour };
}

/** Breakfast / lunch / snack / dinner for the local hour — matches the 8.2 Meal tags. */
function mealAt(hour: number) {
  if (hour >= 5 && hour < 10) return ["breakfast"];
  if (hour >= 10 && hour < 15) return ["lunch"];
  if (hour >= 15 && hour < 17) return ["snack"];
  if (hour >= 17 && hour < 22) return ["dinner"];
  return ["dinner", "snack"];
}

type PoolDish = { id: string; name: string; mood: Mood | null; meals: string[]; acorns: number; createdAt: number; creatorId: string | null };

function pick(pool: PoolDish[], mood: Mood | null, hour: number, userId: string, blocked: Set<string>): PoolDish | null {
  const meal = mealAt(hour);
  const others = pool.filter((d) => d.creatorId !== userId && !(d.creatorId && blocked.has(d.creatorId)));
  const family = mood ? others.filter((d) => d.mood && GROUP[d.mood] === GROUP[mood]) : others;
  const candidates = family.length ? family : others;
  if (!candidates.length) return null;
  const now = Date.now();
  const weight = (d: PoolDish) => {
    const ageDays = (now - d.createdAt) / 86_400_000;
    const fresh = 1 / (1 + ageDays / 7);
    const exact = mood && d.mood === mood ? 1.6 : 1;
    const fitsMeal = d.meals.length === 0 || d.meals.some((m) => meal.includes(m)) ? 1.3 : 1;
    return (d.acorns + 1) * fresh * exact * fitsMeal;
  };
  const weights = candidates.map(weight);
  let roll = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return candidates[i];
  }
  return candidates[0];
}

type Row = {
  user_id: string; token: string; pick_times: string[]; tz: string; lat: number | null; lon: number | null;
  place: string | null; city: string | null; language: string; temp_unit: "C" | "F"; last_sent_at: string | null;
};

Deno.serve(async (req) => {
  // Only the scheduler (service role) may trigger a send.
  if (req.headers.get("Authorization") !== `Bearer ${SERVICE_KEY}`) return new Response("forbidden", { status: 403 });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const now = new Date();

  const { data: rows, error } = await supabase
    .from("push_tokens")
    .select("user_id, token, pick_times, tz, lat, lon, place, city, language, temp_unit, last_sent_at")
    .eq("daily_pick", true);
  if (error) {
    console.error("[daily-pick]", error.message);
    return new Response(JSON.stringify({ error: "query_failed" }), { status: 500 });
  }

  // Who is due: one of the local pick_times within the last WINDOW_MIN minutes, and nothing sent in that window yet.
  const windowStart = now.getTime() - WINDOW_MIN * 60_000;
  const due = ((rows ?? []) as Row[]).flatMap((r) => {
    if (r.last_sent_at && new Date(r.last_sent_at).getTime() > windowStart) return [];
    const local = localNow(r.tz, now);
    const hit = (r.pick_times ?? []).some((t) => {
      const [h, m] = t.split(":").map(Number);
      return (local.minutes - (h * 60 + m) + 1440) % 1440 < WINDOW_MIN;
    });
    return hit ? [{ ...r, local }] : [];
  });
  if (!due.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 });

  const since = new Date(now.getTime() - POOL_DAYS * 86_400_000).toISOString();
  const { data: foods } = await supabase
    .from("foods")
    .select("id, name, weather_condition, meal_type, created_at, creator_id, likes(count)")
    .eq("visibility", "everyone")
    .eq("status", "published")
    .eq("moderation_state", "visible")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(300);
  // 9.3 Deactivated cooks are hidden from everyone (20261201010000) — never push their dishes either.
  const { data: off } = await supabase.from("profiles").select("id").not("deactivated_at", "is", null);
  const deactivated = new Set((off ?? []).map((p: { id: string }) => p.id));
  const pool: PoolDish[] = (foods ?? []).filter((f: Record<string, unknown>) => !deactivated.has(f.creator_id as string)).map((f: Record<string, unknown>) => ({
    id: f.id as string,
    name: f.name as string,
    mood: (typeof f.weather_condition === "string" && f.weather_condition in GROUP ? f.weather_condition : null) as Mood | null,
    meals: (f.meal_type as string[] | null) ?? [],
    acorns: ((f.likes as { count: number }[] | null)?.[0]?.count) ?? 0,
    createdAt: new Date(f.created_at as string).getTime(),
    creatorId: (f.creator_id as string | null) ?? null,
  }));

  // Blocks hide dishes both ways (docs 6.10): never push a blocked (or blocking) cook's dish.
  const dueIds = due.map((r) => r.user_id);
  const blockedBy = new Map<string, Set<string>>();
  const addBlock = (a: string, b: string) => { if (!blockedBy.has(a)) blockedBy.set(a, new Set()); blockedBy.get(a)!.add(b); };
  for (let i = 0; i < dueIds.length; i += 200) {
    const ids = dueIds.slice(i, i + 200);
    const [mine, theirs] = await Promise.all([
      supabase.from("blocks").select("blocker_id, blocked_id").in("blocker_id", ids),
      supabase.from("blocks").select("blocker_id, blocked_id").in("blocked_id", ids),
    ]);
    for (const b of mine.data ?? []) addBlock(b.blocker_id, b.blocked_id);
    for (const b of theirs.data ?? []) addBlock(b.blocked_id, b.blocker_id);
  }

  // One weather call per ~1 km cell / city.
  const weatherCache = new Map<string, Promise<{ mood: Mood; tempC: number } | null>>();
  const messages: { to: string; title: string; body: string; sound: "default"; data: { foodId: string; url: string } }[] = [];
  const sentTo: { user_id: string; date: string }[] = [];
  const sentAt = now.toISOString();

  for (const r of due) {
    // Rounded coordinates, or the chosen city when location is off.
    const where = r.lat != null && r.lon != null ? `lat=${r.lat}&lon=${r.lon}` : r.city ? `q=${encodeURIComponent(r.city)}` : null;
    let w: { mood: Mood; tempC: number } | null = null;
    if (where) {
      if (!weatherCache.has(where)) weatherCache.set(where, weatherAt(where));
      w = await weatherCache.get(where)!;
    }
    const dish = pick(pool, w?.mood ?? null, r.local.hour, r.user_id, blockedBy.get(r.user_id) ?? new Set());
    if (!dish) continue;
    const s = STRINGS[(r.language in STRINGS ? r.language : "en") as Lang];
    const temp = w ? (r.temp_unit === "F" ? Math.round(w.tempC * 9 / 5 + 32) : w.tempC) : null;
    const head = w ? `${(s.weather as Record<string, string>)[w.mood]} ${temp}°` : s.pick;
    messages.push({
      to: r.token,
      title: r.place ? `${head} · ${r.place}` : head,
      body: `${s.pick}: ${dish.name}`,
      sound: "default",
      data: { foodId: dish.id, url: `/dish/${dish.id}` },
    });
    sentTo.push({ user_id: r.user_id, date: r.local.date });
  }

  // Expo accepts up to 100 messages per request.
  for (let i = 0; i < messages.length; i += 100) {
    await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(messages.slice(i, i + 100)),
    });
  }
  for (const s of sentTo) {
    await supabase.from("push_tokens").update({ last_sent_on: s.date, last_sent_at: sentAt }).eq("user_id", s.user_id);
  }

  return new Response(JSON.stringify({ sent: messages.length }), { status: 200 });
});
