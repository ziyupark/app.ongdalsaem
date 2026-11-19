// 2.4 Eat this nearby — Google Places through the `places-nearby` Edge Function (the key stays on the server).
import { supabase } from '../lib/supabase';
import { roundCoord } from './location';

type Money = { units: number; currency: string };
export type NearbyPlace = {
  id: string; name: string; address: string | null; kind: string | null; lat?: number | null; lon?: number | null;
  distance: number | null; walkMin: number | null; openNow: boolean | null; closesAt: string | null;
  rating: number | null; ratings: number; priceLevel: number | null; priceFrom: Money | null; priceTo: Money | null;
  summary: string | null; mapsUri: string | null; photo: string | null; photoAttribution: string | null;
};

export type PlacesQuery = { query: string; lat: number; lon: number; openNow?: boolean; radius?: number; maxPrice?: 1 | 2 | 3 | 4; language?: string };

export class PlacesError extends Error {
  constructor(public code: 'not_deployed' | 'missing_key' | 'failed') { super(code); }
}

/** Set when the exact dish found nothing and the list shows places for similar food (a family id, or "words"). */
export type NearbyResult = { places: NearbyPlace[]; similar: string | null };

export async function searchNearbyPlaces(q: PlacesQuery): Promise<NearbyResult> {
  const { data, error } = await supabase.functions.invoke('places-nearby', { body: { ...q, lat: roundCoord(q.lat, 3), lon: roundCoord(q.lon, 3) } });
  if (error) {
    const status = (error as { context?: { status?: number } }).context?.status;
    let body: { error?: string } | null = null;
    try { body = await (error as { context?: Response }).context?.json(); } catch { body = null; }
    if (status === 404) throw new PlacesError('not_deployed');
    if (body?.error === 'missing_key') throw new PlacesError('missing_key');
    throw new PlacesError('failed');
  }
  const d = data as { places?: NearbyPlace[]; similar?: string } | null;
  return { places: d?.places ?? [], similar: d?.similar ?? null };
}

export function formatDistance(m: number | null) {
  if (m == null) return null;
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
}

// The same dish → food-family table as the places-nearby function (keep the two in sync), so the app can label the
// "similar" tab and ask for that family's search — the exact query string the function uses for its own fallback,
// so both hit the same cached row.
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

export type FoodFamily = { id: string; query: string };
/** The dish's food family (soup, noodle…) and its search text for this language, or null when none fits. */
export function foodFamily(dish: string, lang: string): FoodFamily | null {
  const c = categoryOf(dish);
  return c ? { id: c.id, query: lang.startsWith('ko') ? c.q.ko : c.q.en } : null;
}
