// Air quality → grade → home-cooking line (docs/05-behavior.md §6.11). Pure logic, no React Native imports, so
// tests/airQuality.test.ts runs it in plain Node. All words come from src/copy/airquality-copy.<lang>.json.

export const AIR_GRADES = ['good', 'normal', 'bad', 'veryBad'] as const;
export type AirGrade = (typeof AIR_GRADES)[number];

export type AirTimeSlot = 'morning' | 'lunch' | 'dinner' | 'night';
export type AirActionKey = 'recipe' | 'shopping' | 'neighbors' | 'pantry' | 'byMethod';
export type AirTemplate = { id: string; text: string; action: AirActionKey };

/** Shape of src/copy/airquality-copy.<lang>.json. */
export type AirCopy = {
  version: number;
  placeholder: string;
  timeSlots: Record<AirTimeSlot, { label: string; from: string; to: string }>;
  actions: Record<AirActionKey, { button: string; usesMenu: boolean }>;
  grades: Record<AirGrade, {
    label: string;
    status: string;
    /** Cooking method labels (keys of `methods`' values), or ["*"] for any dish. */
    allowedMethods: string[];
    templates: Record<AirTimeSlot, AirTemplate[]>;
    fallback: AirTemplate;
  }>;
  compare: Record<AirCompare, string>;
  states: Record<'locationDenied' | 'noData' | 'stale', { text: string; button: string | null }>;
  labels: Record<'title' | 'pm10' | 'pm25' | 'value' | 'basedAt' | 'loading', string>;
  /** Cooking method key (foods.cooking_methods) → its label in this language. */
  methods: Record<string, string>;
};

// ------------------------------------------------------------------------------------------- grade

/** 환경부 기준 (µg/m³, upper bound of each grade): PM10 30 · 80 · 150, PM2.5 15 · 35 · 75. */
const PM10_MAX = [30, 80, 150] as const;
const PM25_MAX = [15, 35, 75] as const;
/** AQI-only sources (0–500 scale): 50 · 100 · 200. */
const AQI_MAX = [50, 100, 200] as const;

const valid = (v: number | null | undefined): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;

/** Values are compared as whole numbers — the same rounding the card shows, so "30" is always 좋음. */
function bucket(v: number, max: readonly [number, number, number]): AirGrade {
  const n = Math.round(v);
  return n <= max[0] ? 'good' : n <= max[1] ? 'normal' : n <= max[2] ? 'bad' : 'veryBad';
}

export const gradePm10 = (v: number) => bucket(v, PM10_MAX);
export const gradePm25 = (v: number) => bucket(v, PM25_MAX);
export const gradeAqi = (v: number) => bucket(v, AQI_MAX);

export const worseGrade = (a: AirGrade, b: AirGrade): AirGrade => (AIR_GRADES.indexOf(a) >= AIR_GRADES.indexOf(b) ? a : b);

/**
 * Concentrations first (the worse of PM10 and PM2.5); only when neither is there, a 0–500 AQI. null = no usable value.
 * (OpenWeather's own `main.aqi` is a 1–5 scale — never pass it here.)
 */
export function airGrade(r: { pm10?: number | null; pm25?: number | null; aqi?: number | null }): AirGrade | null {
  const g = [valid(r.pm10) ? gradePm10(r.pm10) : null, valid(r.pm25) ? gradePm25(r.pm25) : null].filter((x): x is AirGrade => !!x);
  if (g.length) return g.reduce(worseGrade);
  return valid(r.aqi) ? gradeAqi(r.aqi) : null;
}

export type AirCompare = 'better' | 'worse' | 'same';
/** Yesterday at this time vs now, by grade. */
export function compareGrades(now: AirGrade, yesterday: AirGrade): AirCompare {
  const d = AIR_GRADES.indexOf(now) - AIR_GRADES.indexOf(yesterday);
  return d < 0 ? 'better' : d > 0 ? 'worse' : 'same';
}

/** Whole hours since the reading when it is more than 3 hours old, else null. */
export const STALE_AFTER_MS = 3 * 3600_000;
export function staleHours(observedAt: number, now: number): number | null {
  const age = now - observedAt;
  return age > STALE_AFTER_MS ? Math.floor(age / 3600_000) : null;
}

// ------------------------------------------------------------------------------------------- time slot

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
};

/** The copy's time slot for a local time — `from` inclusive, `to` exclusive; a slot may wrap past midnight (night). */
export function timeSlotAt(date: Date, slots: AirCopy['timeSlots']): AirTimeSlot {
  const t = date.getHours() * 60 + date.getMinutes();
  for (const [key, s] of Object.entries(slots) as [AirTimeSlot, AirCopy['timeSlots'][AirTimeSlot]][]) {
    const from = minutes(s.from);
    const to = minutes(s.to);
    if (from <= to ? t >= from && t < to : t >= from || t < to) return key;
  }
  return 'night';
}

// ------------------------------------------------------------------------------------------- menus

/** Cooking method keys a grade allows, or 'any' (["*"]). Labels are mapped back to keys through `copy.methods`. */
export function allowedMethodKeys(copy: AirCopy, grade: AirGrade): string[] | 'any' {
  const labels = copy.grades[grade].allowedMethods;
  if (labels.includes('*')) return 'any';
  const byLabel = new Map(Object.entries(copy.methods).map(([k, label]) => [label, k]));
  return labels.map((l) => byLabel.get(l)).filter((k): k is string => !!k);
}

export type MenuDish = { id: string; name: string; methods: string[]; acorns: number; neighborhood: string | null; city: string | null; createdAt: number };
export type MenuPick = { id: string; name: string };

/**
 * Dishes whose cooking methods fit the grade, most popular in my neighborhood first: same ward → same city → elsewhere,
 * then acorns, then newer. One entry per dish name (the most popular one).
 */
export function rankMenus(dishes: MenuDish[], allowed: string[] | 'any', place?: { city?: string | null; neighborhood?: string | null }): MenuPick[] {
  const fits = (d: MenuDish) => (allowed === 'any' ? true : d.methods.some((m) => allowed.includes(m)));
  const near = (d: MenuDish) => (place?.neighborhood && d.neighborhood === place.neighborhood ? 0 : place?.city && d.city === place.city ? 1 : 2);
  const sorted = dishes.filter((d) => fits(d) && d.name.trim()).sort((a, b) => near(a) - near(b) || b.acorns - a.acorns || b.createdAt - a.createdAt);
  const seen = new Set<string>();
  const out: MenuPick[] = [];
  for (const d of sorted) {
    const key = d.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: d.id, name: d.name.trim() });
  }
  return out;
}

// ------------------------------------------------------------------------------------------- line

export type AirLast = { templateId: string; menu: string | null };
export type AirLine = {
  templateId: string;
  text: string;
  action: AirActionKey;
  button: string;
  /** The dish the line names (recipe → its detail). null on fallback. */
  dish: MenuPick | null;
};

const fill = (s: string, placeholder: string, menu: string | null) => (menu == null ? s : s.split(placeholder).join(menu));

/**
 * One line for this grade and time slot. Rules (copy.rules): the template and the menu shown last time for the same
 * grade · slot are not picked again; no menu fitting allowedMethods (after that) → the grade's fallback line.
 * The menu = the top of `menus` (already ranked by rankMenus); the template = random among the rest of the slot's 3.
 */
export function chooseLine(copy: AirCopy, grade: AirGrade, slot: AirTimeSlot, menus: MenuPick[], last: AirLast | null, random: () => number = Math.random): AirLine {
  const g = copy.grades[grade];
  const lastMenu = last?.menu?.trim().toLowerCase() ?? null;
  const dish = menus.find((m) => m.name.trim().toLowerCase() !== lastMenu) ?? null;
  const pool = g.templates[slot].filter((tpl) => tpl.id !== last?.templateId);
  const tpl = dish && pool.length ? pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))] : g.fallback;
  const action = copy.actions[tpl.action];
  // A template that never names the menu (e.g. "이웃들이 오늘 만든 집밥 구경해 볼까요?") doesn't count as showing it.
  const names = tpl !== g.fallback && (tpl.text.includes(copy.placeholder) || action.usesMenu);
  const menu = names ? dish!.name : null;
  return {
    templateId: tpl.id,
    text: fill(tpl.text, copy.placeholder, menu),
    action: tpl.action,
    button: action.usesMenu ? fill(action.button, copy.placeholder, menu) : action.button,
    dish: menu ? dish : null,
  };
}

/** "{hours}" · "{time}" · "{value}" style fills for labels and states. */
export const format = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (all, k: string) => (k in vars ? String(vars[k]) : all));
