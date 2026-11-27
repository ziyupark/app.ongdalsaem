// Diet & allergies — keyword dictionary over ingredient names (and the dish name) in the app's 9 languages.
// A dish "contains" an allergen when any keyword appears: Latin words as whole words (plural s/es allowed), other scripts
// as substrings. It's a best-effort guard, not a guarantee — the cook's ingredient list is free text.

export const ALLERGENS = ['peanut', 'tree_nut', 'milk', 'egg', 'wheat', 'shellfish', 'fish', 'soy', 'sesame'] as const;
export type Allergen = (typeof ALLERGENS)[number];
export const DIETS = ['vegetarian', 'vegan', 'pescatarian'] as const;
export type Diet = (typeof DIETS)[number];
/** customDiet · customAllergies = words the user typed in ("Add your own"), each a word to stay away from. */
export type DietPrefs = { diet: Diet | null; allergies: Allergen[]; customDiet: string[]; customAllergies: string[] };
export const NO_DIET: DietPrefs = { diet: null, allergies: [], customDiet: [], customAllergies: [] };
export const MAX_DIET_TAG_LENGTH = 20;
export const MAX_DIET_TAGS = 20;
export const hasDietPrefs = (p: DietPrefs | null) => !!p && (!!p.diet || !!p.allergies.length || !!p.customDiet.length || !!p.customAllergies.length);

type Group = Allergen | 'meat' | 'honey';

const WORDS: Record<Group, string[]> = {
  peanut: [
    'peanut', 'peanut butter', 'groundnut', '땅콩', '피넛', 'cacahuete', 'cacahuate', 'maní', 'mani', 'amendoim', 'kacang tanah', 'selai kacang',
    'ピーナッツ', '落花生', '花生', 'ถั่วลิสง', 'đậu phộng', 'lạc',
  ],
  tree_nut: [
    'almond', 'walnut', 'cashew', 'pecan', 'pistachio', 'hazelnut', 'macadamia', 'pine nut', 'chestnut', 'nut',
    '견과', '아몬드', '호두', '캐슈', '피스타치오', '헤이즐넛', '잣', '마카다미아', '피칸',
    'almendra', 'nuez', 'nueces', 'anacardo', 'pistacho', 'avellana', 'amêndoa', 'noz', 'nozes', 'castanha', 'avelã',
    'almond', 'kenari', 'kacang mete', 'mete', 'kemiri',
    'アーモンド', 'くるみ', 'クルミ', 'カシューナッツ', 'ピスタチオ', 'ヘーゼルナッツ', 'ナッツ',
    '杏仁', '核桃', '腰果', '開心果', '开心果', '榛果', '堅果', '坚果', '松子',
    'อัลมอนด์', 'วอลนัท', 'เม็ดมะม่วงหิมพานต์', 'พิสตาชิโอ', 'hạnh nhân', 'óc chó', 'hạt điều', 'hạt dẻ',
  ],
  milk: [
    'milk', 'cheese', 'butter', 'cream', 'yogurt', 'yoghurt', 'mozzarella', 'parmesan', 'ricotta', 'ghee', 'whey',
    '우유', '치즈', '버터', '생크림', '크림', '요거트', '요구르트', '연유', '모짜렐라', '파마산',
    'leche', 'queso', 'mantequilla', 'nata', 'crema', 'yogur', 'leite', 'queijo', 'manteiga', 'creme', 'iogurte', 'requeijão',
    'susu', 'keju', 'mentega', 'krim', 'yoghurt',
    '牛乳', 'ミルク', 'チーズ', 'バター', '生クリーム', 'ヨーグルト', '牛奶', '奶酪', '起司', '芝士', '黃油', '黄油', '鮮奶油', '奶油', '優格', '酸奶',
    'นม', 'ชีส', 'เนย', 'ครีม', 'โยเกิร์ต', 'sữa', 'phô mai', 'bơ lạt', 'kem', 'sữa chua',
  ],
  egg: [
    'egg', 'mayonnaise', 'mayo', 'meringue', '계란', '달걀', '마요네즈', '메추리알', 'huevo', 'ovo', 'gema', 'maionese', 'mayonesa',
    'telur', '卵', 'たまご', 'マヨネーズ', '蛋', 'ไข่', 'trứng',
  ],
  wheat: [
    'wheat', 'flour', 'bread', 'pasta', 'spaghetti', 'noodle', 'udon', 'ramen', 'couscous', 'breadcrumb', 'tortilla', 'semolina',
    '밀', '밀가루', '빵', '빵가루', '파스타', '스파게티', '국수', '우동', '라면', '칼국수', '부침가루', '튀김가루', '만두피',
    'trigo', 'harina', 'pan', 'farinha', 'pão', 'macarrão', 'fideos', 'tepung terigu', 'terigu', 'roti', 'mie',
    '小麦', '小麦粉', 'パン', 'パン粉', 'うどん', 'ラーメン', 'パスタ', '麺', '麵', '面粉', '麵粉', '麵包', '面包', '麵條', '面条',
    'แป้งสาลี', 'ขนมปัง', 'บะหมี่', 'พาสต้า', 'bột mì', 'bánh mì', 'mì',
  ],
  shellfish: [
    'shrimp', 'prawn', 'crab', 'lobster', 'crayfish', 'krill', '새우', '꽃게', '대게', '게살', '크랩', '랍스터', '가재', '대하',
    'camarón', 'camarones', 'gamba', 'cangrejo', 'langosta', 'camarão', 'caranguejo', 'lagosta', 'siri',
    'udang', 'kepiting', 'lobster', 'エビ', '海老', 'えび', 'カニ', '蟹', 'ロブスター', '虾', '蝦', '龍蝦', '龙虾',
    'กุ้ง', 'ปู', 'tôm', 'cua', 'tôm hùm',
  ],
  fish: [
    'fish', 'salmon', 'tuna', 'cod', 'mackerel', 'anchovy', 'anchovies', 'sardine', 'trout', 'tilapia', 'fish sauce', 'bonito',
    '생선', '연어', '참치', '고등어', '멸치', '대구', '명태', '동태', '황태', '꽁치', '갈치', '삼치', '어묵', '액젓', '가쓰오',
    'pescado', 'salmón', 'atún', 'bacalao', 'anchoa', 'sardina', 'peixe', 'salmão', 'atum', 'sardinha',
    'ikan', 'salmon', 'tuna', 'teri', '魚', 'さかな', '鮭', 'サーモン', 'マグロ', 'ツナ', 'さば', 'サバ', 'かつお', '鰹', 'しらす',
    '鱼', '鮭魚', '三文鱼', '鮪魚', '金枪鱼', '鯖魚', '鲭鱼', '魚露', '鱼露',
    'ปลา', 'น้ำปลา', 'cá', 'nước mắm',
  ],
  soy: [
    'soy', 'soya', 'tofu', 'edamame', 'miso', 'tempeh', 'soy sauce', '대두', '콩가루', '두부', '된장', '간장', '청국장', '두유', '유부',
    'soja', 'kecap', 'tahu', 'tempe', '大豆', '豆腐', '味噌', '醤油', 'しょうゆ', '枝豆', '豆乳', '黃豆', '黄豆', '醬油', '酱油', '豆漿', '豆浆',
    'ถั่วเหลือง', 'เต้าหู้', 'ซีอิ๊ว', 'đậu nành', 'đậu phụ', 'xì dầu', 'nước tương',
  ],
  sesame: [
    'sesame', 'tahini', '참깨', '들깨', '깨소금', '통깨', '참기름', '들기름', 'sésamo', 'ajonjolí', 'gergelim', 'wijen',
    'ごま', '胡麻', 'ゴマ', '芝麻', '麻油', 'งา', 'vừng', 'mè',
  ],
  meat: [
    'meat', 'beef', 'pork', 'chicken', 'lamb', 'mutton', 'bacon', 'ham', 'sausage', 'turkey', 'duck', 'steak', 'mince', 'pepperoni', 'salami', 'pancetta', 'prosciutto', 'chorizo',
    '고기', '소고기', '쇠고기', '돼지고기', '삼겹살', '목살', '닭', '닭고기', '양고기', '오리', '베이컨', '햄', '소시지', '차돌', '갈비', '불고기', '스팸', '육수',
    'carne', 'res', 'cerdo', 'pollo', 'cordero', 'tocino', 'jamón', 'chorizo', 'porco', 'frango', 'cordeiro', 'presunto', 'linguiça', 'bife',
    'daging', 'sapi', 'babi', 'ayam', 'kambing', 'bebek', 'sosis',
    '肉', '牛肉', '豚肉', '鶏肉', 'ベーコン', 'ハム', 'ソーセージ', '猪肉', '豬肉', '鸡肉', '雞肉', '羊肉', '鴨', '鸭', '培根', '香腸', '香肠', '火腿',
    'เนื้อ', 'หมู', 'ไก่', 'เบคอน', 'แฮม', 'ไส้กรอก', 'thịt', 'bò', 'heo', 'lợn', 'gà', 'vịt', 'xúc xích',
  ],
  honey: ['honey', '꿀', 'miel', 'mel', 'madu', '蜂蜜', 'はちみつ', 'น้ำผึ้ง', 'mật ong'],
};

// Phrases blanked out before matching a group, because a keyword hides inside them
// ("nut" in "nutmeg" / "coconut", "butter" in "peanut butter", "milk" in "coconut milk", 콩 in 땅콩).
const NOT: Partial<Record<Group, string[]>> = {
  tree_nut: ['nutmeg', 'coconut', 'butternut', 'doughnut', 'donut', 'peanut', 'groundnut'],
  milk: ['peanut butter', 'cocoa butter', 'coconut milk', 'coconut cream', 'almond milk', 'soy milk', 'oat milk', '땅콩버터', '코코넛밀크', '코코넛 밀크', '두유', 'leche de coco', 'leite de coco', 'santan', 'ココナッツミルク', '椰奶', '椰漿', 'กะทิ', 'nước cốt dừa'],
  egg: ['eggplant'],
  wheat: ['밀크', 'buckwheat', '메밀'],
  soy: ['땅콩'],
};

const LATIN = /^[a-zà-ỹ' ]+$/i;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const matcher = (w: string) => {
  const lw = w.toLowerCase();
  return LATIN.test(lw) ? ((s: string) => new RegExp(`(^|[^\\p{L}])${esc(lw)}(s|es)?($|[^\\p{L}])`, 'u').test(s)) : ((s: string) => s.includes(lw));
};
const MATCHERS = Object.fromEntries((Object.keys(WORDS) as Group[]).map((g) => [g, WORDS[g].map(matcher)])) as Record<Group, ((s: string) => boolean)[]>;

/** Lowercased text with that group's false friends blanked out. */
function prepare(text: string, g: Group) {
  let s = ` ${text.toLowerCase()} `;
  for (const n of NOT[g] ?? []) s = s.split(n).join(' ');
  return s;
}

function has(texts: string[], g: Group) {
  return texts.some((t) => {
    const s = prepare(t, g);
    return MATCHERS[g].some((m) => m(s));
  });
}

/** Which of `mine` the dish contains (by name + ingredient names), in ALLERGENS order. */
export function allergensIn(texts: string[], mine: readonly Allergen[]): Allergen[] {
  return ALLERGENS.filter((a) => mine.includes(a) && has(texts, a));
}

/** Which of my own tags (typed words) appear in the dish name / ingredients — same word rules as the dictionary. */
export function customIn(texts: string[], words: readonly string[]): string[] {
  if (!words.length) return [];
  const lower = texts.map((t) => ` ${t.toLowerCase()} `);
  return words.filter((w) => {
    const m = matcher(w.trim());
    return w.trim() && lower.some((s) => m(s));
  });
}

/** The diet rules this dish breaks: vegan = no meat · fish · shellfish · egg · milk · honey; vegetarian = no meat · fish · shellfish; pescatarian = no meat. */
function breaksDiet(texts: string[], diet: Diet | null): boolean {
  if (!diet) return false;
  const groups: Group[] = diet === 'pescatarian' ? ['meat'] : diet === 'vegetarian' ? ['meat', 'fish', 'shellfish'] : ['meat', 'fish', 'shellfish', 'egg', 'milk', 'honey'];
  return groups.some((g) => has(texts, g));
}

/** Leave this dish out of picks and search results? */
export function clashes(texts: string[], prefs: DietPrefs | null): boolean {
  if (!prefs || !hasDietPrefs(prefs)) return false;
  return breaksDiet(texts, prefs.diet) || allergensIn(texts, prefs.allergies).length > 0 || customIn(texts, [...prefs.customDiet, ...prefs.customAllergies]).length > 0;
}
