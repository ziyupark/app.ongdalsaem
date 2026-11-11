// 2.4 Eat this nearby — server-side proxy to Google Places API (New) so the API key never ships in the app.
//
// Cost-lean on purpose: location fields only (name · address · position · type · Maps link), which bills as
// "Text Search Pro" — 5,000 free searches a month — with no photos, ratings, hours or summaries (those would move
// every call to the Enterprise SKUs). Results are cached for 24 h per (query · ~1 km cell · filters · language)
// in public.places_cache, 30 min when "Open now" is on, so repeat visits cost nothing.
//
// Deploy (once):
//   1. run supabase/migrations/20261108020000_places_cache.sql
//   2. supabase functions deploy places-nearby
//   3. supabase secrets set GOOGLE_PLACES_API_KEY=<key with "Places API (New)" enabled>
// The app calls it with the signed-in user's JWT (verify_jwt stays on).
//
// Request  { query: string, lat: number, lon: number, openNow?: boolean, radius?: number, maxPrice?: 1|2|3|4, language?: string }
// Response { places: Place[], similar?: category id | "words" }  — sorted by distance, at most 10.
//          `similar` is set when the exact dish found nothing and these are places for similar food.
import { createClient } from "jsr:@supabase/supabase-js@2";

const KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
// Pro-tier fields only — adding rating / hours / photos / summary would bill the Enterprise SKUs.
const FIELDS = ["places.id", "places.displayName", "places.formattedAddress", "places.location", "places.googleMapsUri", "places.primaryTypeDisplayName"].join(",");
const DAY = 24 * 3600_000;
// Hard daily cap on real Google calls (Google won't let this project lower SearchTextRequest per day).
// 150 a day ≈ 4,500 a month — inside the 5,000 free Text Search Pro calls. Change with: supabase secrets set PLACES_DAILY_CAP=...
const DAILY_CAP = Number(Deno.env.get("PLACES_DAILY_CAP") ?? 150);
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const PRICE = ["PRICE_LEVEL_FREE", "PRICE_LEVEL_INEXPENSIVE", "PRICE_LEVEL_MODERATE", "PRICE_LEVEL_EXPENSIVE", "PRICE_LEVEL_VERY_EXPENSIVE"];
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

type GPlace = Record<string, any>;

// Similar-food fallback: a dish title → one food family, searched when the exact dish finds nothing nearby.
// Order matters (칼국수 is noodle before soup; bánh mì is a sandwich before noodle). Latin keywords match whole
// words (+s/es), other scripts match as substrings.
const CATEGORIES: { id: string; kw: string[]; q: { en: string; ko: string } }[] = [
  { id: "burger", kw: ["burger", "sandwich", "bánh mì", "banh mi", "버거", "햄버거", "샌드위치", "ハンバーガー", "サンドイッチ", "漢堡", "三明治", "hamburguesa", "sanduíche", "sándwich"], q: { en: "burger sandwich", ko: "버거 샌드위치" } },
  { id: "meat", kw: ["탕수육", "돈까스", "돈가스", "tonkatsu", "とんかつ", "唐揚げ"], q: { en: "barbecue grill restaurant", ko: "고기 맛집" } },
  { id: "noodle", kw: ["noodle", "ramen", "ramyeon", "udon", "soba", "pho", "phở", "bún", "pasta", "spaghetti", "naengmyeon", "jjamppong", "jajangmyeon", "laksa", "mie", "fideos", "macarrão", "국수", "칼국수", "쌀국수", "라면", "라멘", "우동", "냉면", "파스타", "스파게티", "짬뽕", "짜장", "소바", "ラーメン", "うどん", "そば", "パスタ", "麺", "麵", "面", "ก๋วยเตี๋ยว", "ผัดไทย"], q: { en: "noodle restaurant", ko: "국수 맛집" } },
  { id: "curry", kw: ["curry", "카레", "커리", "カレー", "咖哩", "แกง", "kari"], q: { en: "curry restaurant", ko: "카레 맛집" } },
  { id: "dumpling", kw: ["dumpling", "mandu", "gyoza", "dim sum", "dimsum", "xiaolongbao", "bakso", "만두", "교자", "딤섬", "餃子", "饺子", "小籠包", "点心", "點心"], q: { en: "dumpling restaurant", ko: "만두 맛집" } },
  { id: "soup", kw: ["soup", "stew", "jjigae", "guk", "tang", "hotpot", "hot pot", "broth", "chowder", "sopa", "caldo", "canh", "lẩu", "soto", "찌개", "국", "탕", "전골", "수프", "스프", "국밥", "スープ", "鍋", "汤", "湯", "ต้ม"], q: { en: "soup restaurant", ko: "국물 요리 맛집" } },
  { id: "rice", kw: ["rice", "bibimbap", "kimbap", "gimbap", "risotto", "donburi", "paella", "biryani", "nasi", "cơm", "arroz", "밥", "덮밥", "비빔밥", "볶음밥", "김밥", "리조또", "丼", "ご飯", "炒飯", "飯", "饭", "ข้าว"], q: { en: "rice bowl restaurant", ko: "밥집" } },
  { id: "seafood", kw: ["sushi", "sashimi", "seafood", "fish", "shrimp", "salmon", "tuna", "crab", "oyster", "poke", "pescado", "peixe", "초밥", "스시", "회", "생선", "해물", "새우", "연어", "寿司", "壽司", "刺身", "海鮮", "海鲜", "魚", "鱼"], q: { en: "seafood restaurant", ko: "해산물 맛집" } },
  { id: "meat", kw: ["bbq", "barbecue", "steak", "bulgogi", "galbi", "samgyeopsal", "pork", "beef", "chicken", "kebab", "sate", "satay", "carne", "frango", "pollo", "고기", "삼겹살", "불고기", "갈비", "스테이크", "치킨", "닭", "焼肉", "焼き鳥", "唐揚げ", "肉", "烤"], q: { en: "barbecue grill restaurant", ko: "고기 맛집" } },
  { id: "pizza", kw: ["pizza", "피자", "ピザ", "披薩", "比萨"], q: { en: "pizza", ko: "피자" } },
  { id: "salad", kw: ["salad", "ensalada", "salada", "salat", "샐러드", "サラダ", "沙拉", "สลัด"], q: { en: "salad", ko: "샐러드" } },
  { id: "dessert", kw: ["cake", "dessert", "ice cream", "gelato", "bingsu", "cookie", "pudding", "panna cotta", "tart", "pastel", "bolo", "flan", "kue", "케이크", "디저트", "아이스크림", "빙수", "쿠키", "푸딩", "타르트", "ケーキ", "パフェ", "蛋糕", "甜點", "甜点", "ขนม"], q: { en: "dessert cafe", ko: "디저트 카페" } },
  { id: "bread", kw: ["bread", "toast", "croissant", "bagel", "pancake", "waffle", "brunch", "pan", "pão", "roti", "빵", "토스트", "크루아상", "베이글", "팬케이크", "와플", "브런치", "パン", "トースト", "麵包", "面包", "ขนมปัง"], q: { en: "bakery", ko: "베이커리" } },
];
const LATIN = /^[\p{Script=Latin}\s]+$/u;
function categoryOf(name: string) {
  const n = name.toLowerCase();
  return CATEGORIES.find((c) => c.kw.some((k) => LATIN.test(k)
    ? new RegExp(`(^|[^\\p{L}])${k}(s|es)?([^\\p{L}]|$)`, "u").test(n)
    : n.includes(k)));
}


function meters(a: { lat: number; lon: number }, b: { latitude: number; longitude: number }) {
  const R = 6371000, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.lat), dLon = toRad(b.longitude - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!KEY) return Response.json({ error: "missing_key" }, { status: 500, headers: cors });
  let body: { query?: string; lat?: number; lon?: number; openNow?: boolean; radius?: number; maxPrice?: number; language?: string };
  try { body = await req.json(); } catch { return Response.json({ error: "bad_json" }, { status: 400, headers: cors }); }
  const { query, lat, lon } = body;
  if (!query || typeof lat !== "number" || typeof lon !== "number") return Response.json({ error: "bad_request" }, { status: 400, headers: cors });

  const radius = Math.min(Math.max(body.radius ?? 1500, 200), 5000);
  const lang = body.language ?? "en";
  const ttl = body.openNow ? 30 * 60_000 : DAY;
  const since = new Date(); since.setUTCHours(0, 0, 0, 0);

  // A recipe title ("Rainy-day Kimchi Stew") often matches nothing on Maps, so when a search comes back empty we
  // retry with the core food words (last two, then last one). Each try is its own cached row → still counted by the cap.
  const words = query.trim().replace(/[^\p{L}\p{N}\s-]/gu, " ").split(/\s+/).filter(Boolean);
  // Order: the exact dish → a similar-food search for its family (soup, noodle…) → the core words.
  const cat = categoryOf(query);
  const catQuery = cat ? (lang.startsWith("ko") ? cat.q.ko : cat.q.en) : null;
  const tries = [...new Set([query.trim(), ...(catQuery ? [catQuery] : []), words.slice(-2).join(" "), words.slice(-1).join(" ")].filter((q) => q.length > 1))];
  // Tell the app when it is looking at "similar" places, so it can say so.
  const note = (q: string) => (q === tries[0] ? {} : q === catQuery ? { similar: cat!.id } : { similar: "words" });

  const withDistance = (list: any[]) => list
    .map((p) => ({ ...p, distance: p.lat != null ? meters({ lat, lon }, { latitude: p.lat, longitude: p.lon }) : null }))
    .map((p) => ({ ...p, walkMin: p.distance == null ? null : Math.max(1, Math.round(p.distance / 80)) }))
    .sort((a, b) => (a.distance ?? 1e9) - (b.distance ?? 1e9));

  for (const q of tries) {
    // Cache: same search in the same ~1 km cell → reuse (24 h; 30 min for "Open now"). "v2" drops pre-fallback rows.
    const key = ["v2", q.toLowerCase().slice(0, 80), lang, lat.toFixed(2), lon.toFixed(2), radius, body.openNow ? 1 : 0, body.maxPrice ?? 0].join("|");
    const { data: hit } = await db.from("places_cache").select("places, created_at").eq("key", key).maybeSingle();
    if (hit && Date.now() - new Date(hit.created_at).getTime() < ttl) {
      if ((hit.places as any[]).length) return Response.json({ places: withDistance(hit.places as any[]), cached: true, ...note(q) }, { headers: cors });
      continue;
    }
    // Every cache miss writes (or refreshes) one row, so rows touched since 00:00 UTC = Google calls today.
    const { count } = await db.from("places_cache").select("key", { count: "exact", head: true }).gte("created_at", since.toISOString());
    if ((count ?? 0) >= DAILY_CAP) return Response.json({ error: "daily_limit" }, { status: 429, headers: cors });

    const search: Record<string, unknown> = {
      textQuery: q.slice(0, 80),
      maxResultCount: 10,
      rankPreference: "DISTANCE",
      languageCode: lang,
      locationBias: { circle: { center: { latitude: lat, longitude: lon }, radius } },
    };
    // Short fallback words ("bowl", "roll") are ambiguous on their own, so keep those to restaurants.
    if (q !== tries[0] && q !== catQuery) search.includedType = "restaurant";
    if (body.openNow) search.openNow = true;
    if (body.maxPrice) search.priceLevels = PRICE.slice(1, Math.min(body.maxPrice, 4) + 1);

    const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": KEY, "X-Goog-FieldMask": FIELDS },
      body: JSON.stringify(search),
    });
    if (!r.ok) return Response.json({ error: "places_failed", status: r.status, detail: (await r.text()).slice(0, 300) }, { status: 502, headers: cors });
    const list = ((await r.json()) as { places?: GPlace[] }).places ?? [];

    const places = list.map((p) => ({
      id: p.id as string,
      name: p.displayName?.text ?? "",
      address: p.formattedAddress ?? null,
      kind: p.primaryTypeDisplayName?.text ?? null,
      lat: p.location?.latitude ?? null,
      lon: p.location?.longitude ?? null,
      mapsUri: p.googleMapsUri ?? null,
      // Not fetched (Enterprise-tier fields) — kept so the app's Place type stays the same.
      openNow: null, closesAt: null, rating: null, ratings: 0, priceLevel: null, priceFrom: null, priceTo: null, summary: null, photo: null, photoAttribution: null,
    }));
    await db.from("places_cache").upsert({ key, places, created_at: new Date().toISOString() });
    if (places.length) return Response.json({ places: withDistance(places), ...note(q) }, { headers: cors });
  }
  return Response.json({ places: [] }, { headers: cors });
});
