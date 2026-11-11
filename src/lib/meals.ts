// Meal windows & timeline — docs/05-behavior.md §6.1 (local time).
export type Meal = 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'late' | 'dawn';

/** [start hour, end hour) in order through the day. */
export const MEAL_WINDOWS: { meal: Meal; start: number; end: number }[] = [
  { meal: 'dawn', start: 0, end: 6 },
  { meal: 'breakfast', start: 6, end: 11 },
  { meal: 'lunch', start: 11, end: 14 },
  { meal: 'snack', start: 14, end: 17 },
  { meal: 'dinner', start: 17, end: 21 },
  { meal: 'late', start: 21, end: 24 },
];

export function mealAt(date: Date): Meal {
  const h = date.getHours();
  return MEAL_WINDOWS.find((w) => h >= w.start && h < w.end)!.meal;
}

export type TimelineSlot = { meal: Meal; isNow: boolean; at: Date };

/** [previous meal, Now, next, after next] — each with the time its forecast is read at (window middle; Now = now). */
export function mealTimeline(now = new Date()): TimelineSlot[] {
  const i = MEAL_WINDOWS.findIndex((w) => w.meal === mealAt(now));
  const pick = (offset: number): TimelineSlot => {
    const idx = (i + offset + MEAL_WINDOWS.length) % MEAL_WINDOWS.length;
    const w = MEAL_WINDOWS[idx];
    const at = new Date(now);
    const dayShift = i + offset < 0 ? -1 : i + offset >= MEAL_WINDOWS.length ? 1 : 0;
    at.setDate(at.getDate() + dayShift);
    at.setHours(Math.floor((w.start + w.end) / 2), 0, 0, 0);
    return { meal: w.meal, isNow: offset === 0, at: offset === 0 ? now : at };
  };
  return [pick(-1), pick(0), pick(1), pick(2)];
}

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';
export function dayPart(date: Date): DayPart {
  const h = date.getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}
