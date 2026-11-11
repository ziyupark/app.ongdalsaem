// Generates src/lib/holidayDates.ts — the date of every "Holidays around the world" entry for FIRST..LAST.
// Run with `node scripts/build-holiday-dates.mjs` (Node with full ICU, the default build).
//
// Rules (docs/04-screens/04-community.md 4.1 Festive · the holiday sheet "옹달샘 · 세계의 명절 목록 초안"):
// - lunar dates: ICU's Korean (dangi) / Chinese calendars
// - solar terms (dongji, setsubun, chobok, nowruz, pongal): the Sun's apparent longitude (Meeus ch. 25, ~1 min)
// - moon-based (diwali, loy krathong, onam): new / full moon and the Moon's sidereal longitude (Meeus ch. 47, main
//   terms) — approximate, re-check against official calendars when adding years
// - Matariki: the dates fixed in New Zealand's Te Kāhui o Matariki Public Holiday Act 2022 (schedule)
// - hanami: Tokyo's average full bloom (1 April) — real bloom moves by about a week a year
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FIRST = 2026;
const LAST = 2035;

// ---- calendar helpers ----------------------------------------------------------------------------------------
const pad = (n) => String(n).padStart(2, '0');
const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const utc = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
const isoOf = (date) => date.toISOString().slice(0, 10);
const addDays = (date, n) => new Date(date.getTime() + n * 864e5);
const dow = (y, m, d) => utc(y, m, d).getUTCDay(); // 0 = Sunday
/** n-th weekday (0 = Sun) of a month; n = 1.. */
const nthWeekday = (y, m, wd, n) => { const first = dow(y, m, 1); return iso(y, m, 1 + ((wd - first + 7) % 7) + (n - 1) * 7); };

/** Gregorian Easter Sunday (anonymous algorithm). */
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return utc(y, month, day);
}

/** Gregorian date of lunar month/day in the given ICU calendar ('dangi' | 'chinese'), for the lunar year starting in y. */
function lunar(cal, y, month, day) {
  const fmt = new Intl.DateTimeFormat(`en-u-ca-${cal}`, { timeZone: 'UTC', month: 'numeric', day: 'numeric', year: 'numeric' });
  for (let t = utc(y, 1, 15); t < utc(y + 1, 1, 15); t = addDays(t, 1)) {
    const p = Object.fromEntries(fmt.formatToParts(t).map((x) => [x.type, x.value]));
    // ICU prints a leap month as e.g. "4bis"; only plain months count here.
    if (p.month === String(month) && p.day === String(day)) return isoOf(t);
  }
  throw new Error(`no ${cal} ${month}/${day} in ${y}`);
}

// ---- astronomy (Meeus) -----------------------------------------------------------------------------------------
const rad = (d) => (d * Math.PI) / 180;
const norm = (d) => ((d % 360) + 360) % 360;
const jdOf = (date) => date.getTime() / 864e5 + 2440587.5;
const dateOf = (jd) => new Date((jd - 2440587.5) * 864e5);

function sunLon(jd) {
  const T = (jd - 2451545) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = rad(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) + (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
  const om = rad(125.04 - 1934.136 * T);
  return norm(L0 + C - 0.00569 - 0.00478 * Math.sin(om));
}

function moonLon(jd) {
  const T = (jd - 2451545) / 36525;
  const Lp = 218.3164477 + 481267.88123421 * T;
  const D = rad(297.8501921 + 445267.1114034 * T);
  const M = rad(357.5291092 + 35999.0502909 * T);
  const Mp = rad(134.9633964 + 477198.8675055 * T);
  const F = rad(93.272095 + 483202.0175233 * T);
  const terms = [
    [6.288774, Mp], [1.274027, 2 * D - Mp], [0.658314, 2 * D], [0.213618, 2 * Mp], [-0.185116, M], [-0.114332, 2 * F],
    [0.058793, 2 * D - 2 * Mp], [0.057066, 2 * D - M - Mp], [0.053322, 2 * D + Mp], [0.045758, 2 * D - M], [-0.040923, M - Mp],
    [-0.03472, D], [-0.030383, M + Mp], [0.015327, 2 * D - 2 * F], [-0.012528, Mp + 2 * F], [0.01098, Mp - 2 * F],
    [0.010675, 4 * D - Mp], [0.010034, 3 * Mp], [0.008548, 4 * D - 2 * Mp], [-0.007888, 2 * D + M - Mp], [-0.006766, 2 * D + M],
    [-0.005163, D - Mp], [0.004987, D + M], [0.004036, 2 * D - M + Mp], [0.003994, 2 * D + 2 * Mp], [0.003861, 4 * D],
  ];
  return norm(Lp + terms.reduce((s, [a, x]) => s + a * Math.sin(x), 0));
}

/** Lahiri ayanamsa (deg), linear fit — good to a few arc-minutes this century. */
const ayanamsa = (jd) => 23.853 + ((jd - 2451545) / 365.25) * 0.013969;

/** First instant after jd0 where f(jd) (an angle) crosses `target`, scanning in `step` days. */
function crossing(f, target, jd0, step = 0.5, span = 400) {
  const diff = (jd) => ((f(jd) - target + 540) % 360) - 180;
  let a = jd0, da = diff(a);
  for (let b = jd0 + step; b < jd0 + span; b += step) {
    const db = diff(b);
    if (da < 0 && db >= 0 && db - da < 180) {
      for (let i = 0; i < 50; i++) { const m = (a + b) / 2; if (diff(m) < 0) a = m; else b = m; }
      return (a + b) / 2;
    }
    a = b; da = db;
  }
  throw new Error('no crossing');
}

/** Local calendar date (YYYY-MM-DD) of a JD in a UTC offset (hours). */
const localDate = (jd, off) => isoOf(dateOf(jd + off / 24));
const localHour = (jd, off) => { const d = dateOf(jd + off / 24); return d.getUTCHours() + d.getUTCMinutes() / 60; };
const solarTerm = (y, lon, fromMonth = 1) => crossing(sunLon, lon, jdOf(utc(y, fromMonth, 1)));
const elong = (jd) => norm(moonLon(jd) - sunLon(jd));
const newMoon = (jd0) => crossing(elong, 0, jd0, 0.25, 40);
const fullMoon = (jd0) => crossing(elong, 180, jd0, 0.25, 40);

// Sexagenary day stem: 0 = 甲 … 6 = 庚. Anchored on 2025-07-20 (초복, a 庚 day).
const stem = (date) => (((Math.round((date - utc(2025, 7, 20)) / 864e5) + 6) % 10) + 10) % 10;

// ---- rules -------------------------------------------------------------------------------------------------------
const fixed = (m, d) => (y) => iso(y, m, d);
const MATARIKI = { 2026: '07-10', 2027: '06-25', 2028: '07-14', 2029: '07-06', 2030: '06-21', 2031: '07-11', 2032: '07-02', 2033: '06-24', 2034: '07-07', 2035: '06-29' };

export const RULES = {
  // Lunar (Korea → dangi, China / Vietnam → chinese)
  seollal: (y) => lunar('dangi', y, 1, 1),
  lunar_new_year: (y) => lunar('chinese', y, 1, 1),
  tet: (y) => lunar('chinese', y, 1, 1),
  daeboreum: (y) => lunar('dangi', y, 1, 15),
  lantern: (y) => lunar('chinese', y, 1, 15),
  dano: (y) => lunar('dangi', y, 5, 5),
  duanwu: (y) => lunar('chinese', y, 5, 5),
  chuseok: (y) => lunar('dangi', y, 8, 15),
  mid_autumn: (y) => lunar('chinese', y, 8, 15),
  // Solar terms
  dongji: (y) => localDate(solarTerm(y, 270, 12), 9), // winter solstice, KST
  setsubun: (y) => isoOf(addDays(new Date(localDate(solarTerm(y, 315, 1), 9)), -1)), // day before 立春, JST
  chobok: (y) => { // third 庚 day counting from the summer solstice (KST)
    let d = new Date(localDate(solarTerm(y, 90, 6), 9));
    for (let n = 0; ; d = addDays(d, 1)) if (stem(d) === 6 && ++n === 3) return isoOf(d);
  },
  nowruz: (y) => { const jd = solarTerm(y, 0, 3); return localHour(jd, 3.5) < 12 ? localDate(jd, 3.5) : isoOf(addDays(new Date(localDate(jd, 3.5)), 1)); },
  pongal: (y) => { // Sun enters sidereal Capricorn (Makara Sankranti); after sunset → next day (IST)
    const jd = crossing((j) => norm(sunLon(j) - ayanamsa(j)), 270, jdOf(utc(y, 1, 1)));
    return localHour(jd, 5.5) < 18 ? localDate(jd, 5.5) : isoOf(addDays(new Date(localDate(jd, 5.5)), 1));
  },
  // Moon
  diwali: (y) => { // Kartika Amavasya: the new moon with the Sun in sidereal Libra (180°–210°); evening (Pradosh) rule in IST
    let jd = newMoon(jdOf(utc(y, 10, 1)));
    while (norm(sunLon(jd) - ayanamsa(jd)) < 180) jd = newMoon(jd + 2);
    return localHour(jd, 5.5) >= 18 ? localDate(jd, 5.5) : isoOf(addDays(new Date(localDate(jd, 5.5)), -1));
  },
  loy_krathong: (y) => { // full moon of the 12th Thai lunar month (November); a full moon before dawn belongs to the
    // previous evening, so the date is taken in Thai time shifted back 6 h.
    let jd = fullMoon(jdOf(utc(y, 10, 25)));
    if (localDate(jd, 1) < iso(y, 11, 1)) jd = fullMoon(jd + 2);
    return localDate(jd, 1);
  },
  onam: (y) => { // Thiruvonam (Moon in Shravana, 280°–293.33° sidereal, at 6:00 IST) in Chingam (Sun in sidereal Leo),
    // whose Atham (Moon in Hasta, 160°–173.33°) also falls in Chingam — otherwise the next Thiruvonam.
    const sunSid = (jd) => norm(sunLon(jd) - ayanamsa(jd));
    const moonAt = (d) => norm(moonLon(jdOf(d) + 0.5 / 24) - ayanamsa(jdOf(d) + 0.5 / 24)); // 06:00 IST = 00:30 UTC
    // Nakshatra [lo, lo + 13.33°) at sunrise of d — or wholly inside d (rose after and set before the next sunrise).
    const inNak = (d, lo) => {
      const a = moonAt(d), b = moonAt(addDays(d, 1)), hi = lo + 13.333;
      return (a >= lo && a < hi) || (a < lo && b >= hi && b - a < 30);
    };
    let first = null;
    for (let d = utc(y, 8, 10); d < utc(y, 9, 25); d = addDays(d, 1)) {
      const sun = sunSid(jdOf(d));
      if (!(sun >= 120 && sun < 150 && inNak(d, 280))) continue;
      first ??= d;
      let atham = null;
      for (let k = 8; k <= 12 && !atham; k++) { const a = addDays(d, -k); if (inNak(a, 160)) atham = a; }
      if (atham && sunSid(jdOf(atham) + 0.5 / 24) >= 118.5) return isoOf(d); // Atham on Chingam's eve counts (≈1 day)
    }
    // No later Thiruvonam left inside Chingam → the first one stands.
    if (first) return isoOf(first);
    throw new Error(`no onam ${y}`);
  },
  // Easter-based / weekday rules
  carnival: (y) => isoOf(addDays(easter(y), -47)),
  mardi_gras: (y) => isoOf(addDays(easter(y), -47)),
  midsummer: (y) => { for (let d = 19; d <= 25; d++) if (dow(y, 6, d) === 5) return iso(y, 6, d); },
  thanksgiving_ca: (y) => nthWeekday(y, 10, 1, 2),
  thanksgiving_us: (y) => nthWeekday(y, 11, 4, 4),
  oktoberfest: (y) => isoOf(addDays(new Date(nthWeekday(y, 10, 0, 1)), -15)), // Saturday 15 days before the first Sunday of October
  matariki: (y) => (MATARIKI[y] ? `${y}-${MATARIKI[y]}` : null),
  hanami: fixed(4, 1),
  // Fixed dates
  new_year: fixed(1, 1), oshogatsu: fixed(1, 1), valentine: fixed(2, 14), hinamatsuri: fixed(3, 3), samgyeopsal: fixed(3, 3),
  pi_day: fixed(3, 14), st_patrick: fixed(3, 17), songkran: fixed(4, 13), black_day: fixed(4, 14), anzac: fixed(4, 25),
  july4: fixed(7, 4), obon: fixed(8, 13), fiestas_patrias: fixed(9, 18), pasta_day: fixed(10, 25), halloween: fixed(10, 31),
  dia_muertos: fixed(11, 1), pepero: fixed(11, 11), christmas: fixed(12, 25), kwanzaa: fixed(12, 26), omisoka: fixed(12, 31),
  nye: fixed(12, 31),
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = {};
  for (const [k, rule] of Object.entries(RULES)) {
    out[k] = [];
    for (let y = FIRST; y <= LAST; y++) { const d = rule(y); if (d) out[k].push(d); }
  }
  const body = Object.entries(out).map(([k, ds]) => `  ${k}: [${ds.map((d) => `'${d}'`).join(', ')}],`).join('\n');
  const file = `// GENERATED by scripts/build-holiday-dates.mjs — do not edit by hand. Dates ${FIRST}–${LAST}, local to each holiday.
export const HOLIDAY_DATES: Record<string, readonly string[]> = {
${body}
};
`;
  writeFileSync(new URL('../src/lib/holidayDates.ts', import.meta.url), file);
  console.log(`Wrote ${Object.keys(out).length} holidays × ${FIRST}–${LAST}`);
}
