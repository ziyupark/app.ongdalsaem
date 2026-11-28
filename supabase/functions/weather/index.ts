// OpenWeather proxy — the API key stays on the server (secret OPENWEATHER_API_KEY, the same one
// send-daily-recommendation uses), so it is no longer shipped inside the app.
//
// Request  { kind: "current" | "forecast" | "geo" | "air" | "air_history", lat?, lon?, city?, q?, cnt?, start?, end? }
// Signed-in users: every kind. Signed out (1.2 Sign in shows the weather where you are): current · forecast by
// coordinates only, 30 cache misses an hour per IP.
// Response OpenWeather's own JSON for /data/2.5/weather · /data/2.5/forecast · /geo/1.0/direct ·
//          /data/2.5/air_pollution · /data/2.5/air_pollution/history (Home air quality card — coordinates only;
//          history = unix start · end, at most 6 hours apart, rounded down to the hour so nearby calls share a cache)
//
// Shared cache in public.owm_cache (coordinates rounded to 2 decimals ≈ 1 km, the same rounding the app sends):
// current 10 min · forecast 30 min · city search 30 days · air 30 min · air history 6 h. Cache misses are capped at 50 a minute for everyone
// (inside OpenWeather's free 60/min) and 200 an hour per user.
//
// Deploy:  supabase functions deploy weather
import { admin, callerId, cors, inRange, json, takeQuotas } from "../_shared/common.ts";

/** The caller's IP (first x-forwarded-for hop) — the signed-out quota key. */
const clientIp = (req: Request) => (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";

const KEY = Deno.env.get("OPENWEATHER_API_KEY");
const BASE = "https://api.openweathermap.org";
const TTL = { current: 10 * 60_000, forecast: 30 * 60_000, geo: 30 * 24 * 3600_000, air: 30 * 60_000, air_history: 6 * 3600_000 } as const;
const PATH: Record<Kind, string> = {
  current: "/data/2.5/weather",
  forecast: "/data/2.5/forecast",
  geo: "/geo/1.0/direct",
  air: "/data/2.5/air_pollution",
  air_history: "/data/2.5/air_pollution/history",
};
const isAir = (k: Kind) => k === "air" || k === "air_history";
type Kind = keyof typeof TTL;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!KEY) return json({ error: "missing_key" }, 500);
  const uid = await callerId(req);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  const kind = body.kind as Kind;
  if (!(kind in TTL)) return json({ error: "bad_request" }, 400);
  // Signed out: only the weather at the device's own (rounded) coordinates — no city search, no city names.
  if (!uid && (kind === "geo" || isAir(kind) || typeof body.lat !== "number" || typeof body.lon !== "number")) return json({ error: "unauthorized" }, 401);

  const params = new URLSearchParams();
  if (kind === "geo") {
    const q = typeof body.q === "string" ? body.q.trim() : "";
    if (q.length < 2 || q.length > 100) return json({ error: "bad_request" }, 400);
    params.set("q", q);
    params.set("limit", "8");
  } else if (isAir(kind)) {
    const lat = inRange(body.lat, -90, 90), lon = inRange(body.lon, -180, 180);
    if (lat == null || lon == null) return json({ error: "bad_request" }, 400);
    params.set("lat", lat.toFixed(2));
    params.set("lon", lon.toFixed(2));
    if (kind === "air_history") {
      const hour = (v: unknown) => { const n = inRange(v, 1_600_000_000, 4_000_000_000); return n == null ? null : Math.floor(n / 3600) * 3600; };
      const start = hour(body.start), end = hour(body.end);
      if (start == null || end == null || end <= start || end - start > 6 * 3600) return json({ error: "bad_request" }, 400);
      params.set("start", String(start));
      params.set("end", String(end));
    }
  } else {
    const lat = inRange(body.lat, -90, 90), lon = inRange(body.lon, -180, 180);
    const city = typeof body.city === "string" ? body.city.trim() : "";
    if (lat != null && lon != null) {
      params.set("lat", lat.toFixed(2));
      params.set("lon", lon.toFixed(2));
    } else if (city.length >= 1 && city.length <= 100) {
      params.set("q", city);
    } else {
      return json({ error: "bad_request" }, 400);
    }
    params.set("units", "metric");
    const cnt = inRange(body.cnt, 1, 40);
    if (kind === "forecast" && cnt != null) params.set("cnt", String(Math.round(cnt)));
  }

  const key = [kind, params.toString().toLowerCase()].join("|");
  const { data: hit } = await admin.from("owm_cache").select("body, created_at").eq("key", key).maybeSingle();
  if (hit && Date.now() - new Date(hit.created_at).getTime() < TTL[kind]) return json(hit.body);

  const ok = await takeQuotas([
    { bucket: "owm:all", window: "minute", cap: 50 },
    uid
      ? { bucket: `owm:u:${uid}`, window: "hour", cap: 200 }
      : { bucket: `owm:ip:${clientIp(req)}`, window: "hour", cap: 30 },
  ]);
  if (ok === false) return json({ error: "rate_limited" }, 429);

  params.set("appid", KEY);
  const r = await fetch(`${BASE}${PATH[kind]}?${params.toString()}`);
  if (!r.ok) {
    console.error("[weather] upstream", r.status);
    return json({ error: "weather_failed" }, 502);
  }
  const data = await r.json();
  await admin.from("owm_cache").upsert({ key, body: data, created_at: new Date().toISOString() });
  return json(data);
});
