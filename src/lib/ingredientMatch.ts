// Fridge memo → "what can I cook now": match what's in my fridge against public recipes' ingredient lists.
import type { RecipeCandidate } from '../services/foods';
import type { FridgeZone } from './fridge';

/** One word per ingredient family — every name in a group matches the others. */
const SYNONYMS: string[][] = [
  ['계란', '달걀', 'egg', 'eggs', '卵', '鸡蛋', '雞蛋', 'huevo', 'ovo', 'telur', 'trứng', 'ไข่'],
  ['대파', '파', '쪽파', 'green onion', 'scallion', 'spring onion', 'ねぎ', '葱', '蔥'],
  ['양파', 'onion', '玉ねぎ', '洋葱', '洋蔥', 'cebolla', 'cebola', 'bawang bombay', 'hành tây', 'หอมใหญ่'],
  ['마늘', 'garlic', 'にんにく', '大蒜', 'ajo', 'alho', 'bawang putih', 'tỏi', 'กระเทียม'],
  ['돼지고기', '삼겹살', 'pork', 'pork belly', '豚肉', '猪肉', '豬肉', 'cerdo', 'porco', 'thịt heo', 'หมู'],
  ['소고기', '쇠고기', 'beef', '牛肉', 'carne de res', 'carne bovina', 'daging sapi', 'thịt bò', 'เนื้อวัว'],
  ['닭고기', '닭', 'chicken', '鶏肉', '鸡肉', '雞肉', 'pollo', 'frango', 'ayam', 'thịt gà', 'ไก่'],
  ['두부', 'tofu', '豆腐', 'tahu', 'đậu phụ', 'เต้าหู้'],
  ['김치', 'kimchi', 'キムチ', '泡菜'],
  ['감자', 'potato', 'じゃがいも', '土豆', '馬鈴薯', 'papa', 'batata', 'kentang', 'khoai tây', 'มันฝรั่ง'],
  ['당근', 'carrot', 'にんじん', '胡萝卜', '紅蘿蔔', 'zanahoria', 'cenoura', 'wortel', 'cà rốt', 'แครอท'],
  ['애호박', '호박', 'zucchini', 'courgette', 'ズッキーニ', '櫛瓜', 'calabacín', 'abobrinha'],
  ['버섯', 'mushroom', 'きのこ', '蘑菇', '香菇', 'champiñón', 'cogumelo', 'jamur', 'nấm', 'เห็ด'],
  ['양배추', 'cabbage', 'キャベツ', '卷心菜', '高麗菜', 'repollo', 'repolho', 'kubis', 'bắp cải', 'กะหล่ำปลี'],
  ['토마토', 'tomato', 'トマト', '番茄', 'tomate', 'tomat', 'cà chua', 'มะเขือเทศ'],
  ['밥', '쌀', 'rice', 'ご飯', '米', '米饭', '白飯', 'arroz', 'nasi', 'beras', 'cơm', 'gạo', 'ข้าว'],
  ['우유', 'milk', '牛乳', '牛奶', 'leche', 'leite', 'susu', 'sữa', 'นม'],
  ['치즈', 'cheese', 'チーズ', '起司', '奶酪', 'queso', 'queijo', 'keju', 'phô mai', 'ชีส'],
  ['버터', 'butter', 'バター', '黄油', '奶油', 'mantequilla', 'manteiga', 'mentega', 'bơ', 'เนย'],
  ['새우', 'shrimp', 'prawn', 'エビ', '虾', '蝦', 'camarón', 'camarão', 'udang', 'tôm', 'กุ้ง'],
  ['참치', 'tuna', 'ツナ', '鮪魚', '金枪鱼', 'atún', 'atum', 'tuna kaleng', 'cá ngừ', 'ทูน่า'],
  ['고추', '청양고추', 'chili', 'chili pepper', '唐辛子', '辣椒', 'chile', 'pimenta', 'cabai', 'ớt', 'พริก'],
];

/** Lowercase · drop (notes) · drop amounts, units and "to taste" — keeps single spaces between words. */
function clean(name: string) {
  return name
    .toLowerCase()
    .replace(/[([{（【].*?[)\]}）】]/g, ' ')
    .replace(/[\d./½¼¾⅓⅔,~-]+\s*((g|kg|mg|ml|l|cc|oz|lbs?|tbsp|tsp|cups?|pcs?|cloves?|t)(?![a-z])|큰술|작은술|스푼|컵|개|대|쪽|톨|장|줌|꼬집|모|알|봉지|팩)?/g, ' ')
    .replace(/약간|적당량|조금|少々|適量|\b(cloves?|to taste|pinch)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
/** "대파 1/2대 (흰 부분)" → "대파" · "2 eggs" → "eggs". */
function normalize(name: string) {
  return clean(name).replace(/ /g, '');
}

const LATIN = /^[a-z ]+$/;
const GROUP = new Map<string, number>();
SYNONYMS.forEach((g, i) => g.forEach((w) => GROUP.set(normalize(w), i)));
const WORDS = SYNONYMS.flatMap((g, i) => g.map((w) => ({ w: clean(w), i }))).sort((a, b) => b.w.length - a.w.length);
/**
 * A comparable key: the synonym group when known, else the normalized name. A longer name still finds its group —
 * Latin by whole word ("aged kimchi", "pork belly"), other scripts by ending ("다진마늘", "흰쌀밥"; "고추장" stays itself).
 */
const keyOf = (name: string) => {
  const c = clean(name);
  const n = c.replace(/ /g, '');
  const exact = GROUP.get(n);
  if (exact != null) return `#${exact}`;
  const hit = WORDS.find(({ w }) => (LATIN.test(w)
    ? w.length >= 3 && new RegExp(`(^| )${w}(s|es)?( |$)`).test(c)
    : w.length >= 2 && n.endsWith(w.replace(/ /g, ''))));
  return hit ? `#${hit.i}` : n;
};

export type CookMatch = { food: RecipeCandidate; have: number; total: number; missing: string[] };

/** Score = matched ingredients / recipe ingredients. Only recipes with at least one match · best 5. */
export function matchRecipes(fridge: string[], recipes: RecipeCandidate[], limit = Infinity): CookMatch[] {
  const mine = new Set(fridge.map(keyOf).filter(Boolean));
  if (!mine.size) return [];
  return recipes
    .map((food) => {
      const keyed = food.ingredients.map((name) => ({ name, k: keyOf(name) })).filter((i) => i.k);
      const missing = keyed.filter((i) => !mine.has(i.k)).map((i) => i.name);
      return { food, have: keyed.length - missing.length, total: keyed.length, missing };
    })
    .filter((m) => m.have > 0)
    .sort((a, b) => b.have / b.total - a.have / a.total || b.have - a.have)
    .slice(0, limit);
}

/** Index of the first name in `names` that is the same ingredient as `name` (synonyms count) · -1 when none. */
export function findIngredient(name: string, names: string[]): number {
  const k = keyOf(name);
  return k ? names.findIndex((n) => keyOf(n) === k) : -1;
}

/** Kept in the freezer: anything sold frozen, meat and fish (seafood too), ice cream, ice and dumplings. Everything else → fridge. */
const FROZEN = /냉동|frozen|冷凍|冷冻|congelad|beku|đông lạnh|แช่แข็ง/;
/** Latin-script words (any language) — matched as whole words, plural s/es allowed: "ice" ≠ "rice", "pork belly" ✓. */
const FREEZER_WORDS = [
  'ice cream', 'helado', 'sorvete', 'es krim', 'kem', 'ice', 'hielo', 'gelo', 'es batu', 'đá viên',
  'dumplings', 'mandu', 'gyoza', 'empanadilla', 'bánh bao',
  // meat
  'meat', 'beef', 'pork', 'chicken', 'lamb', 'mutton', 'duck', 'turkey', 'bacon', 'steak', 'mince', 'carne', 'cerdo', 'porco',
  'pollo', 'frango', 'daging', 'ayam', 'thịt',
  // fish · seafood
  'fish', 'salmon', 'cod', 'mackerel', 'shrimp', 'prawn', 'squid', 'octopus', 'clam', 'mussel', 'scallop', 'crab', 'lobster',
  'pescado', 'peixe', 'salmón', 'salmão', 'camarón', 'camarão', 'gamba', 'calamar', 'lula', 'ikan', 'udang', 'cumi', 'cá', 'tôm', 'mực',
];
/** Other scripts — found anywhere in the name ("돼지고기", "닭가슴살", "冷凍うどん"). */
const FREEZER_PARTS = [
  '아이스크림', '얼음', '만두', 'アイス', '氷', '冰', '餃子', '饺子', '水餃', 'ไอศกรีม', 'น้ำแข็ง', 'เกี๊ยว',
  '고기', '삼겹살', '목살', '닭', '오리', '생선', '연어', '고등어', '갈치', '대구', '새우', '오징어', '문어', '조개', '홍합', '꽃게', '대게', '게살',
  '肉', '魚', '鱼', '鮭', 'サーモン', 'エビ', 'えび', '海老', '蝦', '虾', 'イカ', '烏賊', '鱿', '魷', 'タコ', '蛸',
  'เนื้อ', 'หมู', 'ไก่', 'เป็ด', 'ปลา', 'กุ้ง', 'ปลาหมึก', 'หอย',
];
/** Not raw meat or fish, even though the name says so — sauces, stocks, dried and canned goods stay out. */
const NOT_FROZEN = /sauce|stock|broth|powder|paste|flakes|dried|canned|\bcan\b|소스|육수|액젓|가루|다시다|말린|건조|통조림|캔|게맛살|ソース|だし|出汁|醤|醬|粉|缶|罐|肉桂|น้ำปลา|ซอส|kaleng|kecap|nước mắm|salsa|caldo|molho|enlatad|en lata|seco|seca/;

/** Where a bought ingredient goes in my fridge memo (shopping memo "Bought → fridge"). */
export function storageZone(name: string): FridgeZone {
  const c = clean(name);
  if (FROZEN.test(c)) return 'freezer';
  if (NOT_FROZEN.test(c)) return 'fridge';
  const words = ` ${c} `;
  const flat = c.replace(/ /g, '');
  const hit = FREEZER_WORDS.some((w) => new RegExp(` ${w}(s|es)? `).test(words)) || FREEZER_PARTS.some((w) => flat.includes(w));
  return hit ? 'freezer' : 'fridge';
}

/** Search filter "with ingredients": every wanted ingredient is in the recipe (synonyms count, e.g. 계란 = egg). */
export function hasIngredients(wanted: string[], ingredients: string[]): boolean {
  const have = new Set(ingredients.map(keyOf).filter(Boolean));
  return wanted.map(keyOf).filter(Boolean).every((k) => have.has(k));
}
