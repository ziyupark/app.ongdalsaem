// Fridge memo → "what can I cook now": match what's in my fridge against public recipes' ingredient lists.
import type { RecipeCandidate } from '../services/foods';

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
export function normalize(name: string) {
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
export function matchRecipes(fridge: string[], recipes: RecipeCandidate[], limit = 5): CookMatch[] {
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
