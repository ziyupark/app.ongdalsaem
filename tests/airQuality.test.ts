// npm test — Node's own test runner (Node ≥ 22.18 strips the TypeScript types). Pure logic only: src/lib/airQuality.ts.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  AIR_GRADES, airGrade, allowedMethodKeys, chooseLine, compareGrades, gradeAqi, gradePm10, gradePm25, rankMenus, staleHours, timeSlotAt,
  type AirCopy, type AirLast, type AirTimeSlot, type MenuDish,
} from '../src/lib/airQuality.ts';

const COPY_DIR = join(import.meta.dirname, '..', 'src', 'copy');
const copies = readdirSync(COPY_DIR)
  .filter((f) => /^airquality-copy\..+\.json$/.test(f))
  .map((f) => ({ file: f, copy: JSON.parse(readFileSync(join(COPY_DIR, f), 'utf8')) as AirCopy }));
const ko = copies.find((c) => c.file === 'airquality-copy.ko.json')!.copy;
const SLOTS: AirTimeSlot[] = ['morning', 'lunch', 'dinner', 'night'];

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

test('time slots: from inclusive, to exclusive, night wraps midnight', () => {
  const at = (h: number, m = 0) => new Date(2026, 10, 28, h, m);
  assert.equal(timeSlotAt(at(4, 59), ko.timeSlots), 'night');
  assert.equal(timeSlotAt(at(5), ko.timeSlots), 'morning');
  assert.equal(timeSlotAt(at(9, 59), ko.timeSlots), 'morning');
  assert.equal(timeSlotAt(at(10), ko.timeSlots), 'lunch');
  assert.equal(timeSlotAt(at(16), ko.timeSlots), 'dinner');
  assert.equal(timeSlotAt(at(21), ko.timeSlots), 'night');
  assert.equal(timeSlotAt(at(0), ko.timeSlots), 'night');
});

// ------------------------------------------------------------------------------------------- copy file

const JOSA_AFTER_MENU = /\{menu\}(으로|을|를|이|가|은|는|로)/;

for (const { file, copy } of copies) {
  test(`${file}: no particle right after {menu} (templates · fallbacks · buttons)`, () => {
    const texts: { id: string; text: string }[] = [];
    for (const g of AIR_GRADES) {
      for (const s of SLOTS) for (const tpl of copy.grades[g].templates[s]) texts.push(tpl);
      texts.push(copy.grades[g].fallback);
    }
    for (const [k, a] of Object.entries(copy.actions)) texts.push({ id: `action.${k}`, text: a.button });
    const bad = texts.filter((x) => JOSA_AFTER_MENU.test(x.text)).map((x) => `${x.id}: ${x.text}`);
    assert.deepEqual(bad, []);
    assert.ok(texts.length >= 4 * 13, 'every template was checked');
  });

  test(`${file}: structure — 3 templates per grade · slot, known actions, unique ids, methods resolve`, () => {
    const ids = new Set<string>();
    for (const g of AIR_GRADES) {
      const grade = copy.grades[g];
      for (const s of SLOTS) {
        assert.equal(grade.templates[s].length, 3, `${g}.${s}`);
        for (const tpl of grade.templates[s]) {
          assert.ok(tpl.action in copy.actions, tpl.id);
          assert.ok(!ids.has(tpl.id), `duplicate ${tpl.id}`);
          ids.add(tpl.id);
        }
      }
      // The fallback is used when there is no menu, so it must never need one.
      assert.ok(!grade.fallback.text.includes(copy.placeholder), `${g} fallback names no menu`);
      assert.ok(!copy.actions[grade.fallback.action].usesMenu, `${g} fallback button names no menu`);
      const keys = allowedMethodKeys(copy, g);
      if (keys !== 'any') assert.equal(keys.length, grade.allowedMethods.length, `${g}: every allowedMethods label is in methods`);
    }
  });
}

// ------------------------------------------------------------------------------------------- choosing a line

const dish = (id: string, name: string, methods: string[], extra: Partial<MenuDish> = {}): MenuDish => ({
  id, name, methods, acorns: 0, neighborhood: null, city: null, createdAt: 0, ...extra,
});

test('menus: only allowed methods, my neighborhood first, then acorns; one per name', () => {
  const list = [
    dish('a', '김치찌개', ['simmer'], { acorns: 50, city: 'Seoul' }),
    dish('b', '삼겹살', ['grill'], { acorns: 999 }),
    dish('c', '된장찌개', ['simmer'], { acorns: 3, neighborhood: 'Mapo-gu', city: 'Seoul' }),
    dish('d', '계란찜', ['steam'], { acorns: 10 }),
    dish('e', '김치찌개', ['simmer'], { acorns: 1 }),
    dish('f', '샐러드', [], { acorns: 70 }),
  ];
  const picks = rankMenus(list, allowedMethodKeys(ko, 'bad'), { city: 'Seoul', neighborhood: 'Mapo-gu' });
  assert.deepEqual(picks.map((p) => p.id), ['c', 'a', 'd']);
  assert.deepEqual(rankMenus(list, allowedMethodKeys(ko, 'normal')).map((p) => p.name), ['삼겹살', '샐러드', '김치찌개', '계란찜', '된장찌개']);
});

test('no fitting menu → the grade fallback, for every grade and slot', () => {
  for (const g of AIR_GRADES) {
    for (const s of SLOTS) {
      const line = chooseLine(ko, g, s, [], null);
      assert.equal(line.templateId, ko.grades[g].fallback.id);
      assert.equal(line.text, ko.grades[g].fallback.text);
      assert.equal(line.dish, null);
      assert.ok(!line.text.includes('{menu}') && !line.button.includes('{menu}'));
    }
  }
  // Bad air but only grilled dishes → nothing allowed → fallback.
  const menus = rankMenus([dish('b', '삼겹살', ['grill'])], allowedMethodKeys(ko, 'bad'));
  assert.equal(chooseLine(ko, 'bad', 'dinner', menus, null).templateId, 'bad_fallback');
});

test('the only menu was shown last time → fallback instead of repeating it', () => {
  const line = chooseLine(ko, 'good', 'lunch', [{ id: 'x', name: '부추전' }], { templateId: 'good_lunch_1', menu: '부추전' });
  assert.equal(line.templateId, 'good_fallback');
});

test('{menu} is filled with the top menu and the recipe button names it', () => {
  const line = chooseLine(ko, 'bad', 'night', [{ id: 'x', name: '어묵탕' }], null, () => 0);
  assert.equal(line.templateId, 'bad_night_1');
  assert.equal(line.text, '창문은 닫아 두고, 오늘 밤은 따끈한 어묵탕 어때요?');
  assert.equal(line.button, '어묵탕 레시피');
  assert.deepEqual(line.dish, { id: 'x', name: '어묵탕' });
});

test('the same template and the same menu never come twice in a row', () => {
  const menus = [{ id: '1', name: '된장찌개' }, { id: '2', name: '계란찜' }, { id: '3', name: '수육' }];
  let seed = 7;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (const g of AIR_GRADES) {
    for (const s of SLOTS) {
      let last: AirLast | null = null;
      for (let i = 0; i < 200; i++) {
        const line = chooseLine(ko, g, s, menus, last, random);
        if (last) {
          assert.notEqual(line.templateId, last.templateId, `${g}.${s} #${i}`);
          if (line.dish && last.menu) assert.notEqual(line.dish.name, last.menu, `${g}.${s} #${i} menu`);
        }
        assert.ok(!line.text.includes('{menu}'), line.templateId);
        last = { templateId: line.templateId, menu: line.dish?.name ?? null };
      }
    }
  }
});

test('a template that never names the menu does not count it as shown', () => {
  // normal_dinner_3 = "무난한 저녁이에요. 이웃들이 오늘 만든 집밥 구경해 볼까요?" (neighbors, no {menu})
  const line = chooseLine(ko, 'normal', 'dinner', [{ id: '1', name: '카레' }], { templateId: 'normal_dinner_1', menu: null }, () => 0.99);
  assert.equal(line.templateId, 'normal_dinner_3');
  assert.equal(line.dish, null);
  assert.equal(line.button, ko.actions.neighbors.button);
});
