// Holidays around the world (4.1 Festive tables) + food-challenge themes (4.10 Challenges) — one illustration per theme.
import { Cookie, Heart, Moon, Sparkles, Star, Sun, TreePine, type LucideIcon } from 'lucide-react-native';
import type { WeatherMood } from '../theme';

export type ThemeKey = 'chuseok' | 'halloween' | 'christmas' | 'seollal' | 'valentine' | 'diwali' | 'forest';

/** Illustrations (assets/holidays). Diwali has none yet — it falls back to its mood wash. */
export const THEME_IMAGE: Partial<Record<ThemeKey, number>> = {
  chuseok: require('../../assets/holidays/chuseok.jpg'),
  halloween: require('../../assets/holidays/halloween.jpg'),
  christmas: require('../../assets/holidays/christmas.jpg'),
  seollal: require('../../assets/holidays/seollal.jpg'),
  valentine: require('../../assets/holidays/valentine.jpg'),
  forest: require('../../assets/holidays/forest.jpg'),
};

/** Holiday food photos for 4.1 Holidays around the world (Figma 697:11053) — separate from the challenge illustrations above. */
export const FESTIVE_PHOTO: Record<Exclude<ThemeKey, 'forest'>, number> = {
  chuseok: require('../../assets/holidays/food/chuseok.jpg'),
  halloween: require('../../assets/holidays/food/halloween.jpg'),
  christmas: require('../../assets/holidays/food/christmas.jpg'),
  seollal: require('../../assets/holidays/food/seollal.jpg'),
  valentine: require('../../assets/holidays/food/valentine.jpg'),
  diwali: require('../../assets/holidays/food/diwali.jpg'),
};

/** Mood wash behind a theme (fallback when there is no illustration, and the tint for text over it). */
export const THEME_MOOD: Record<ThemeKey, WeatherMood> = {
  chuseok: 'clear-night', halloween: 'clear-night', christmas: 'snow', seollal: 'clear', valentine: 'clear', diwali: 'heat', forest: 'cloudy',
};

export const themeImage = (k: string | null | undefined) => (k && k in THEME_IMAGE ? THEME_IMAGE[k as ThemeKey] : THEME_IMAGE.forest);

type Festive = { key: Exclude<ThemeKey, 'forest'>; tag: string; icon: LucideIcon; date: (y: number) => Date };

const lunar = (table: Record<number, Date>, fallback: (y: number) => Date) => (y: number) => table[y] ?? fallback(y);

// Fixed-date holidays + this/next lunar ones.
export const FESTIVE: Festive[] = [
  { key: 'halloween', tag: 'halloween', icon: Cookie, date: (y) => new Date(y, 9, 31) },
  { key: 'christmas', tag: 'christmas', icon: Star, date: (y) => new Date(y, 11, 25) },
  { key: 'valentine', tag: 'valentine', icon: Heart, date: (y) => new Date(y, 1, 14) },
  { key: 'seollal', tag: 'seollal', icon: Sun, date: lunar({ 2026: new Date(2026, 1, 17), 2027: new Date(2027, 1, 6), 2028: new Date(2028, 0, 26) }, (y) => new Date(y, 1, 1)) },
  { key: 'chuseok', tag: 'chuseok', icon: Moon, date: lunar({ 2026: new Date(2026, 8, 25), 2027: new Date(2027, 8, 15), 2028: new Date(2028, 9, 3) }, (y) => new Date(y, 8, 20)) },
  { key: 'diwali', tag: 'diwali', icon: Sparkles, date: lunar({ 2026: new Date(2026, 10, 8), 2027: new Date(2027, 9, 29), 2028: new Date(2028, 9, 17) }, (y) => new Date(y, 9, 25)) },
];

export const THEME_ICON: Record<ThemeKey, LucideIcon> = { ...Object.fromEntries(FESTIVE.map((f) => [f.key, f.icon])), forest: TreePine } as Record<ThemeKey, LucideIcon>;

/**
 * Holidays around the world (4.1): every holiday with its food photo, by its next date (today counts), soonest
 * first — one calendar for everyone, never re-ordered by the viewer's country.
 */
export function upcomingFestive(now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return FESTIVE.map((h) => {
    let d = h.date(now.getFullYear());
    if (d.getTime() < today) d = h.date(now.getFullYear() + 1);
    return { ...h, mood: THEME_MOOD[h.key], image: FESTIVE_PHOTO[h.key], at: d };
  }).sort((a, b) => a.at.getTime() - b.at.getTime());
}
