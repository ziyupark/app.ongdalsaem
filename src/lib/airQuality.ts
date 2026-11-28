// Air quality → grade (docs/05-behavior.md §6.11). Pure logic, no React Native imports, so tests/airQuality.test.ts
// runs it in plain Node. All words come from src/copy/airquality-copy.<lang>.json.

export const AIR_GRADES = ['good', 'normal', 'bad', 'veryBad'] as const;
export type AirGrade = (typeof AIR_GRADES)[number];
export type AirCompare = 'better' | 'worse' | 'same';

/** What the card reads from src/copy/airquality-copy.<lang>.json (the Korean file also keeps older, unused sections). */
export type AirCopy = {
  version: number;
  grades: Record<AirGrade, { label: string; status: string }>;
  compare: Record<AirCompare, string>;
  states: Record<'locationDenied' | 'noData' | 'stale', { text: string; button: string | null }>;
  labels: Record<'title' | 'pm10' | 'pm25' | 'value' | 'basedAt' | 'loading', string>;
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

/** Yesterday at this time vs now, by grade. */
export function compareGrades(now: AirGrade, yesterday: AirGrade): AirCompare {
  const d = AIR_GRADES.indexOf(now) - AIR_GRADES.indexOf(yesterday);
  return d < 0 ? 'better' : d > 0 ? 'worse' : 'same';
}

/**
 * Where the marker sits on the gradient bar, 0–1. Each grade owns a quarter (good 0–¼ · normal ¼–½ · bad ½–¾ ·
 * very bad ¾–1); inside it the value moves linearly (very bad tops out at twice its lower bound). The worse of PM10 and
 * PM2.5 wins, as for the grade; AQI only when there are no concentrations.
 */
const SCALE = { pm10: [0, 30, 80, 150, 300], pm25: [0, 15, 35, 75, 150], aqi: [0, 50, 100, 200, 400] } as const;
function along(v: number, s: readonly number[]) {
  const n = Math.round(v);
  for (let i = 0; i < 4; i++) {
    const lo = i === 0 ? s[0] : s[i] + 1;
    if (n <= s[i + 1] || i === 3) return Math.min(1, (i + Math.max(0, Math.min(1, (n - lo) / (s[i + 1] - lo)))) / 4);
  }
  return 1;
}
export function barPosition(r: { pm10?: number | null; pm25?: number | null; aqi?: number | null }): number | null {
  const p = [valid(r.pm10) ? along(r.pm10, SCALE.pm10) : null, valid(r.pm25) ? along(r.pm25, SCALE.pm25) : null].filter((x): x is number => x != null);
  if (p.length) return Math.max(...p);
  return valid(r.aqi) ? along(r.aqi, SCALE.aqi) : null;
}

/** Whole hours since the reading when it is more than 3 hours old, else null. */
export const STALE_AFTER_MS = 3 * 3600_000;
export function staleHours(observedAt: number, now: number): number | null {
  const age = now - observedAt;
  return age > STALE_AFTER_MS ? Math.floor(age / 3600_000) : null;
}

/** "{hours}" · "{time}" · "{value}" style fills for labels and states. */
export const format = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (all, k: string) => (k in vars ? String(vars[k]) : all));
