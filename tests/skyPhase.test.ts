// npm test — day / sunset / night (src/lib/skyPhase.ts) and the 12 backgrounds (src/theme/mood.ts).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { nextSkyChange, skyPhaseAt } from '../src/lib/skyPhase.ts';
import { BACKDROPS, backdropKey, MOOD_FAMILY, WEATHER_MOODS } from '../src/theme/mood.ts';

const H = 3600_000;
const at = (h: number, m = 0, day = 28) => new Date(2026, 10, day, h, m).getTime();
// Sunrise 07:10 · sunset 17:20 (late November).
const sun = { sunrise: at(7, 10), sunset: at(17, 20) };

test('bands: sunset ±1 h around sunrise and sunset, day between, night outside', () => {
  assert.equal(skyPhaseAt(at(6, 9), sun), 'night');
  assert.equal(skyPhaseAt(at(6, 10), sun), 'sunset');
  assert.equal(skyPhaseAt(at(7, 10), sun), 'sunset');
  assert.equal(skyPhaseAt(at(8, 10), sun), 'sunset');
  assert.equal(skyPhaseAt(at(8, 11), sun), 'day');
  assert.equal(skyPhaseAt(at(12), sun), 'day');
  assert.equal(skyPhaseAt(at(16, 19), sun), 'day');
  assert.equal(skyPhaseAt(at(16, 20), sun), 'sunset');
  assert.equal(skyPhaseAt(at(18, 20), sun), 'sunset');
  assert.equal(skyPhaseAt(at(18, 21), sun), 'night');
  assert.equal(skyPhaseAt(at(23, 59), sun), 'night');
  assert.equal(skyPhaseAt(at(0, 30), sun), 'night');
});

test('no sun times → 06:00 / 18:00', () => {
  assert.equal(skyPhaseAt(at(4, 59), null), 'night');
  assert.equal(skyPhaseAt(at(5), null), 'sunset');
  assert.equal(skyPhaseAt(at(7), null), 'sunset');
  assert.equal(skyPhaseAt(at(7, 1), null), 'day');
  assert.equal(skyPhaseAt(at(16, 59), null), 'day');
  assert.equal(skyPhaseAt(at(17), null), 'sunset');
  assert.equal(skyPhaseAt(at(19), null), 'sunset');
  assert.equal(skyPhaseAt(at(19, 1), null), 'night');
  assert.equal(skyPhaseAt(at(12), { sunrise: null, sunset: at(17) }), 'day'); // half missing → fallback
});

test("a reading from yesterday still uses today's sun times", () => {
  const old = { sunrise: at(7, 10, 27), sunset: at(17, 20, 27) };
  assert.equal(skyPhaseAt(at(12), old), 'day');
  assert.equal(skyPhaseAt(at(17, 30), old), 'sunset');
  assert.equal(skyPhaseAt(at(21), old), 'night');
});

test('next change = the next band edge', () => {
  assert.equal(nextSkyChange(at(12), sun), at(16, 20));
  assert.equal(nextSkyChange(at(16, 30), sun), at(18, 20) + 1);
  assert.equal(nextSkyChange(at(21), sun), at(6, 10, 29));
  assert.equal(nextSkyChange(at(2), sun), at(6, 10));
  for (let t = at(0); t < at(0, 0, 29); t += 7 * 60_000) {
    const next = nextSkyChange(t, sun);
    assert.ok(next > t && next - t <= 24 * H, `${new Date(t).toTimeString()}`);
    assert.equal(skyPhaseAt(next - 60_000, sun), skyPhaseAt(t, sun), `no change before ${new Date(next).toTimeString()}`);
  }
});

test('every mood has a family and every family × phase has a background', () => {
  for (const m of WEATHER_MOODS) {
    assert.ok(MOOD_FAMILY[m], m);
    for (const p of ['day', 'sunset', 'night'] as const) assert.ok(BACKDROPS[backdropKey(m, p)], `${m} ${p}`);
  }
  assert.equal(Object.keys(BACKDROPS).length, 12);
  assert.equal(backdropKey('clear', 'day'), 'sunny_day');
  assert.equal(backdropKey('heavy-rain', 'night'), 'rain_night');
});
