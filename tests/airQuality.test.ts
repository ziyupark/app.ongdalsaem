// npm test — Node's own test runner (Node ≥ 22.18 strips the TypeScript types). Pure logic only: src/lib/airQuality.ts.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { AIR_GRADES, airGrade, barPosition, compareGrades, gradeAqi, gradePm10, gradePm25, staleHours, type AirCopy } from '../src/lib/airQuality.ts';

const COPY_DIR = join(import.meta.dirname, '..', 'src', 'copy');
const copies = readdirSync(COPY_DIR)
  .filter((f) => /^airquality-copy\..+\.json$/.test(f))
  .map((f) => ({ file: f, copy: JSON.parse(readFileSync(join(COPY_DIR, f), 'utf8')) as AirCopy & Record<string, unknown> }));

// ------------------------------------------------------------------------------------------- grade boundaries

test('PM10 boundaries (환경부): 30/31 · 80/81 · 150/151', () => {
  assert.equal(gradePm10(0), 'good');
  assert.equal(gradePm10(30), 'good');
  assert.equal(gradePm10(31), 'normal');
  assert.equal(gradePm10(80), 'normal');
  assert.equal(gradePm10(81), 'bad');
  assert.equal(gradePm10(150), 'bad');
  assert.equal(gradePm10(151), 'veryBad');
  assert.equal(gradePm10(600), 'veryBad');
});

test('PM2.5 boundaries (환경부): 15/16 · 35/36 · 75/76', () => {
  assert.equal(gradePm25(0), 'good');
  assert.equal(gradePm25(15), 'good');
  assert.equal(gradePm25(16), 'normal');
  assert.equal(gradePm25(35), 'normal');
  assert.equal(gradePm25(36), 'bad');
  assert.equal(gradePm25(75), 'bad');
  assert.equal(gradePm25(76), 'veryBad');
});

test('decimals are rounded the way the card shows them', () => {
  assert.equal(gradePm10(30.4), 'good');
  assert.equal(gradePm10(30.5), 'normal');
  assert.equal(gradePm25(15.49), 'good');
  assert.equal(gradePm25(15.5), 'normal');
});

test('AQI only: 50/51 · 100/101 · 200/201', () => {
  assert.equal(gradeAqi(50), 'good');
  assert.equal(gradeAqi(51), 'normal');
  assert.equal(gradeAqi(100), 'normal');
  assert.equal(gradeAqi(101), 'bad');
  assert.equal(gradeAqi(200), 'bad');
  assert.equal(gradeAqi(201), 'veryBad');
});

test('the worse of PM10 and PM2.5 wins; concentrations beat AQI; nothing usable → null', () => {
  assert.equal(airGrade({ pm10: 20, pm25: 40 }), 'bad');
  assert.equal(airGrade({ pm10: 160, pm25: 10 }), 'veryBad');
  assert.equal(airGrade({ pm10: 31, pm25: 15 }), 'normal');
  assert.equal(airGrade({ pm10: 30, pm25: 15 }), 'good');
  assert.equal(airGrade({ pm10: 20, aqi: 250 }), 'good');
  assert.equal(airGrade({ pm25: null, pm10: undefined, aqi: 120 }), 'bad');
  assert.equal(airGrade({ pm10: Number.NaN, pm25: -1 }), null);
  assert.equal(airGrade({}), null);
});

test('yesterday comparison by grade', () => {
  assert.equal(compareGrades('good', 'bad'), 'better');
  assert.equal(compareGrades('veryBad', 'normal'), 'worse');
  assert.equal(compareGrades('normal', 'normal'), 'same');
});

test('stale = more than 3 hours old', () => {
  const now = Date.UTC(2026, 10, 28, 12);
  assert.equal(staleHours(now - 3 * 3600_000, now), null);
  assert.equal(staleHours(now - 3 * 3600_000 - 1, now), 3);
  assert.equal(staleHours(now - 5.5 * 3600_000, now), 5);
});

test('bar marker: each grade owns a quarter, the worse pollutant wins, never outside 0–1', () => {
  assert.equal(barPosition({ pm10: 0, pm25: 0 }), 0);
  assert.equal(barPosition({ pm25: 15 }), 0.25);
  assert.equal(barPosition({ pm25: 16 }), 0.25);
  assert.equal(barPosition({ pm25: 35 }), 0.5);
  assert.equal(barPosition({ pm10: 80 }), 0.5);
  assert.equal(barPosition({ pm10: 151 }), 0.75);
  assert.equal(barPosition({ pm10: 999 }), 1);
  assert.equal(barPosition({ pm10: 20, pm25: 40 }), barPosition({ pm25: 40 }));
  assert.equal(barPosition({ aqi: 50 }), 0.25);
  assert.equal(barPosition({}), null);
  for (let v = 0; v <= 400; v++) {
    const p = barPosition({ pm10: v, pm25: v })!;
    assert.ok(p >= 0 && p <= 1, `pm ${v}`);
    // The marker lands in the quarter of the grade the card shows.
    const i = AIR_GRADES.indexOf(airGrade({ pm10: v, pm25: v })!);
    assert.ok(p >= i / 4 && p <= (i + 1) / 4, `pm ${v}: ${p} in quarter ${i}`);
  }
});

// ------------------------------------------------------------------------------------------- copy files

for (const { file, copy } of copies) {
  test(`${file}: every text the card shows is there`, () => {
    for (const g of AIR_GRADES) {
      assert.ok(copy.grades[g]?.label, `${g}.label`);
      assert.ok(copy.grades[g]?.status, `${g}.status`);
    }
    for (const k of ['better', 'worse', 'same'] as const) assert.ok(copy.compare[k], `compare.${k}`);
    for (const k of ['locationDenied', 'noData'] as const) assert.ok(copy.states[k].text && copy.states[k].button, `states.${k}`);
    assert.ok(copy.states.stale.text.includes('{hours}'), 'states.stale has {hours}');
    for (const k of ['title', 'pm10', 'pm25', 'loading'] as const) assert.ok(copy.labels[k], `labels.${k}`);
    assert.ok(copy.labels.value.includes('{value}'), 'labels.value has {value}');
    assert.ok(copy.labels.basedAt.includes('{time}'), 'labels.basedAt has {time}');
  });

  // The Korean file still carries the earlier menu templates (unused by the card): keep the particle rule on them.
  test(`${file}: no particle right after {menu}`, () => {
    const all = JSON.stringify(copy);
    assert.equal(/\{menu\}(으로|을|를|이|가|은|는|로)/.test(all), false);
  });
}
