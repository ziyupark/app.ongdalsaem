// Dish tags offered in 8.2 Details (Figma 23:1540) — keys are stored in foods.meal_type / foods.mood_tags.
import {
  Clock, Coffee, Cookie, CookingPot, Fish, Home, Leaf, Moon, Soup, Sparkles, Star, ThermometerSnowflake, ThermometerSun,
  Users, Utensils, Zap, type LucideIcon,
  Building2, Mountain, TreePine, Waves, Wheat, Droplets,
} from '../components/icons/ongdal';
import { mealAt } from './meals';

export const MEAL_TAGS = [
  { key: 'breakfast', icon: Coffee },
  { key: 'lunch', icon: Utensils },
  { key: 'dinner', icon: CookingPot },
  { key: 'snack', icon: Cookie },
  { key: 'vegan', icon: Leaf },
  { key: 'seafood', icon: Fish },
] as const satisfies readonly { key: string; icon: LucideIcon }[];
export type MealTag = (typeof MEAL_TAGS)[number]['key'];

export const MOOD_TAGS = [
  { key: 'cozy', icon: Coffee },
  { key: 'calm', icon: Leaf },
  { key: 'fresh', icon: Sparkles },
  { key: 'energized', icon: Zap },
  { key: 'comforting', icon: Home },
  { key: 'nostalgic', icon: Clock },
  { key: 'celebrating', icon: Star },
  { key: 'lazy', icon: Moon },
  { key: 'together', icon: Users },
  { key: 'hearty', icon: Soup },
] as const satisfies readonly { key: string; icon: LucideIcon }[];
export type MoodTag = (typeof MOOD_TAGS)[number]['key'];

/** Where the dish was eaten / cooked (4.1 Global landscape chips) — stored in foods.landscape. */
export const LANDSCAPES = [
  { key: 'forest', icon: TreePine },
  { key: 'sea', icon: Waves },
  { key: 'lake', icon: Droplets },
  { key: 'mountain', icon: Mountain },
  { key: 'countryside', icon: Wheat },
  { key: 'city', icon: Building2 },
] as const satisfies readonly { key: string; icon: LucideIcon }[];
export type Landscape = (typeof LANDSCAPES)[number]['key'];

/** Onboarding taste step — preset tags people can like (same keys as dishes' mood_tags / meal_type). */
export const TASTE_TAGS = [
  ...MOOD_TAGS.map((m) => ({ ...m, group: 'moods' as const })),
  ...MEAL_TAGS.filter((m) => m.key === 'vegan' || m.key === 'seafood' || m.key === 'snack').map((m) => ({ ...m, group: 'meals' as const })),
];

/** Custom moods ("Add your own") use the sparkles icon (Chip · Custom). */
export const CUSTOM_MOOD_ICON = Sparkles;
export const MAX_MOODS = 3;
export const MAX_CUSTOM_MOOD_LENGTH = 20;

const MEAL_ICON = Object.fromEntries(MEAL_TAGS.map((m) => [m.key, m.icon])) as Record<string, LucideIcon>;
const MOOD_ICON = Object.fromEntries(MOOD_TAGS.map((m) => [m.key, m.icon])) as Record<string, LucideIcon>;

export const isPresetMood = (key: string) => key in MOOD_ICON;
export const isPresetMeal = (key: string) => key in MEAL_ICON;
export const mealIcon = (key: string) => MEAL_ICON[key] ?? Utensils;
export const moodIcon = (key: string) => MOOD_ICON[key] ?? CUSTOM_MOOD_ICON;

/** Meal chip pre-selected from the photo's time (late → dinner, dawn → breakfast). */
export function mealTagFor(date: Date): MealTag {
  const m = mealAt(date);
  if (m === 'late') return 'dinner';
  if (m === 'dawn') return 'breakfast';
  return m;
}

export type TemperatureTag = 'cold' | 'cool' | 'mild' | 'warm' | 'hot';
/** Feel-of-the-air tag shown on 7.1 (Rainy · Cool · …). */
export function temperatureTag(tempC: number): TemperatureTag {
  if (tempC <= 5) return 'cold';
  if (tempC <= 15) return 'cool';
  if (tempC <= 22) return 'mild';
  if (tempC <= 28) return 'warm';
  return 'hot';
}
export const temperatureIcon = (tag: TemperatureTag): LucideIcon => (tag === 'cold' || tag === 'cool' ? ThermometerSnowflake : ThermometerSun);
