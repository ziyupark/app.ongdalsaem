import { AlertTriangle, Minus, Plus, ShoppingCart, Timer } from '../icons/ongdal';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Pressable, StyleSheet, View } from 'react-native';
import { allergensIn } from '../../lib/allergens';
import { useDietPrefs } from '../../lib/dietPrefs';
import { useFridge } from '../../lib/fridge';
import { findIngredient, hasIngredients } from '../../lib/ingredientMatch';
import { scaleIngredient } from '../../lib/scaleIngredient';
import { addShopping, useShopping } from '../../lib/shopping';
import { isPresetMeal, isPresetMood, mealIcon, moodIcon, temperatureIcon, temperatureTag } from '../../lib/tags';
import type { Ingredient, Step } from '../../services/foods';
import { radius, space, useTheme, WEATHER_ICON, type WeatherMood } from '../../theme';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { Text } from '../Text';

type Pic = number | { uri: string };

export type DishViewData = {
  /** The post's id — 7.1 only (enables "Add to shopping list"); the 8.3 preview has none. */
  id?: string;
  photos: Pic[];
  name: string;
  mood: WeatherMood | null;
  tempC: number | null;
  acorns: number;
  comments: number;
  authorName: string;
  authorAvatar: Pic | null;
  meta: string;
  caption: string;
  meals: string[];
  moods: string[];
  ingredients: Ingredient[];
  steps: Step[];
  calories: number | null;
  /** "Serves 2 · 20 min · Easy" line above Ingredients — only the values that are set. */
  servings?: number | null;
  cookMinutes?: number | null;
  difficulty?: 'easy' | 'medium' | 'hard' | null;
};

const SERVINGS_MIN = 1;
const SERVINGS_MAX = 10;

/** Weather · temperature · mood · meal chips shown under the caption. */
export function useDishTags(dish: DishViewData) {
  const { t } = useTranslation();
  const tags: { key: string; label: string; icon: ReturnType<typeof mealIcon> }[] = [];
  if (dish.mood) tags.push({ key: `w-${dish.mood}`, label: t(`home.titleMood.${dish.mood}`), icon: WEATHER_ICON[dish.mood] });
  if (dish.tempC != null) {
    const tt = temperatureTag(dish.tempC);
    tags.push({ key: `t-${tt}`, label: t(`dish.temperature.${tt}`), icon: temperatureIcon(tt) });
  }
  dish.moods.forEach((m) => tags.push({ key: `m-${m}`, label: isPresetMood(m) ? t(`share.moods.${m}`) : m, icon: moodIcon(m) }));
  dish.meals.forEach((m) => tags.push({ key: `l-${m}`, label: isPresetMeal(m) ? t(`share.meals.${m}`) : m, icon: mealIcon(m) }));
  return tags;
}

/** Divider → Ingredients → Steps (with timer buttons) → Calories. Shared by 7.1 and 8.3. */
export function DishRecipe({ dish, onStartTimer, onAddedToShopping }: { dish: DishViewData; onStartTimer?: (stepIndex: number) => void; onAddedToShopping?: (n: number) => void }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  // Servings stepper (screen only, never saved): ingredient amounts are rescaled from the recipe's servings.
  const base = dish.servings ?? null;
  const [servings, setServings] = useState(base ?? 0);
  useEffect(() => { setServings(base ?? 0); }, [base]);
  // Pick ingredients one by one → shopping memo (7.1 only). A picked row that's in my fridge says which zone; already in the memo = "added", locked.
  const fridge = useFridge();
  const shopping = useShopping();
  const fridgeZone = useMemo(() => { const names = fridge.map((f) => f.name); return dish.ingredients.map((ing) => fridge[findIngredient(ing.name, names)]?.zone ?? null); }, [fridge, dish.ingredients]);
  const inShopping = useMemo(() => { const names = shopping.map((s) => s.name); return dish.ingredients.map((ing) => hasIngredients([ing.name], names)); }, [shopping, dish.ingredients]);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  useEffect(() => { setPicked(new Set()); }, [dish.id]);
  const chosen = [...picked].filter((i) => !inShopping[i]);
  const toggle = (i: number) => setPicked((p) => { const n = new Set(p); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  const amountOf = (amount: string) => (base != null ? scaleIngredient(amount, base, servings) : amount);
  const addToShopping = async () => {
    if (!chosen.length) return;
    await addShopping(chosen.map((i) => ({ name: dish.ingredients[i].name, amount: amountOf(dish.ingredients[i].amount) })), dish.id);
    setPicked(new Set());
    onAddedToShopping?.(chosen.length);
  };
  // 7.1 allergy warning — my allergens found in the dish name or ingredients.
  const { allergies } = useDietPrefs();
  const warn = dish.id && allergies.length ? allergensIn([dish.name, ...dish.ingredients.map((i) => i.name)], allergies) : [];
  const hasRecipe = dish.ingredients.length > 0 || dish.steps.length > 0 || dish.calories != null;
  const facts = [
    dish.servings != null ? t('dish.serves', { n: dish.servings }) : null,
    dish.cookMinutes != null ? t(dish.cookMinutes >= 60 ? 'dish.minutesPlus' : 'dish.minutes', { n: Math.min(dish.cookMinutes, 60) }) : null,
    dish.difficulty ? t(`dish.difficulty${dish.difficulty[0].toUpperCase()}${dish.difficulty.slice(1)}`) : null,
  ].filter(Boolean).join(' · ');
  return (
    <>
        {hasRecipe ? (
          <>
            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: color('border/default') }]} />
            </View>
            {warn.length ? (
              <View style={[styles.section, styles.warnRow]}>
                <View style={[styles.warn, { backgroundColor: color('bg/destructive-subtle') }]}>
                  <Icon icon={AlertTriangle} size={14} color="fg/destructive" />
                  <Text variant="Caption Strong" color="fg/destructive">{t('dish.allergyWarning', { items: warn.map((a) => t(`diet.allergens.${a}`)).join(', ') })}</Text>
                </View>
              </View>
            ) : null}
            {dish.ingredients.length ? (
              <View style={styles.section}>
                {facts ? <Text variant="Body/S" color="fg/secondary">{facts}</Text> : null}
                <View style={styles.ingHead}>
                  <Text variant="Title/L" style={styles.flex}>{t('dish.ingredients')}</Text>
                  {base != null ? (
                    <View style={[styles.servings, { borderColor: color('border/default') }]}>
                      <Pressable accessibilityRole="button" accessibilityLabel={t('share.fewerServings')} disabled={servings <= SERVINGS_MIN} onPress={() => setServings((n) => Math.max(SERVINGS_MIN, n - 1))} hitSlop={space[8]}>
                        <Icon icon={Minus} size={16} color={servings <= SERVINGS_MIN ? 'fg/disabled' : 'fg/default'} />
                      </Pressable>
                      <Text variant="Body/S Strong">{t('dish.serves', { n: servings })}</Text>
                      <Pressable accessibilityRole="button" accessibilityLabel={t('share.moreServings')} disabled={servings >= SERVINGS_MAX} onPress={() => setServings((n) => Math.min(SERVINGS_MAX, n + 1))} hitSlop={space[8]}>
                        <Icon icon={Plus} size={16} color={servings >= SERVINGS_MAX ? 'fg/disabled' : 'fg/default'} />
                      </Pressable>
                    </View>
                  ) : null}
                </View>
                <View>
                  {dish.ingredients.map((ing, i) => {
                    const rowStyle = [styles.ingredient, { borderBottomColor: color('border/default') }];
                    if (!dish.id) {
                      return (
                        <View key={`${ing.name}-${i}`} style={rowStyle}>
                          <Text variant="Body/M" style={styles.flex}>{ing.name}</Text>
                          <Text variant="Body/M Strong" color="fg/secondary">{amountOf(ing.amount)}</Text>
                        </View>
                      );
                    }
                    const locked = inShopping[i];
                    const on = !locked && picked.has(i);
                    const zone = on ? fridgeZone[i] : null;
                    return (
                      <Pressable
                        key={`${ing.name}-${i}`}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: on, disabled: locked }}
                        accessibilityLabel={ing.name}
                        disabled={locked}
                        onPress={() => toggle(i)}
                        style={[rowStyle, styles.pickable]}
                      >
                        {on ? <Animated.View entering={FadeIn.duration(120)} exiting={FadeOut.duration(120)} style={[styles.picked, { backgroundColor: color('bg/accent-subtle') }]} /> : null}
                        <Text variant="Body/M" color={locked ? 'fg/muted' : 'fg/default'} style={styles.flex}>{ing.name}</Text>
                        {locked ? (
                          <View style={[styles.badge, { backgroundColor: color('bg/muted') }]}>
                            <Text variant="Caption Strong" color="fg/muted">{t('dish.inShopping')}</Text>
                          </View>
                        ) : zone ? (
                          <Animated.View entering={FadeIn.duration(120)} exiting={FadeOut.duration(120)}>
                            <Text variant="Caption Strong" color="fg/accent">{t(zone === 'freezer' ? 'dish.inFreezerZone' : 'dish.inFridgeZone')}</Text>
                          </Animated.View>
                        ) : null}
                        <Text variant="Body/M Strong" color="fg/secondary">{amountOf(ing.amount)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                {dish.id ? (
                  <View style={styles.shop}>
                    <Button
                      label={t('dish.addToShopping')}
                      badge={chosen.length}
                      icon={ShoppingCart}
                      variant="Outline"
                      size="M"
                      disabled={chosen.length === 0}
                      onPress={addToShopping}
                    />
                  </View>
                ) : null}
              </View>
            ) : null}
            {dish.steps.length ? (
              <View style={[styles.section, styles.steps, dish.ingredients.length ? styles.gap32 : null]}>
                <Text variant="Title/L">{t('dish.steps')}</Text>
                {dish.steps.map((s, i) => (
                  <View key={i} style={styles.step}>
                    <View style={[styles.stepNo, { backgroundColor: color('bg/accent-subtle') }]}>
                      <Text variant="Caption Strong" color="fg/accent">{String(i + 1)}</Text>
                    </View>
                    <View style={styles.stepText}>
                      <Text variant="Body/M">{s.text}</Text>
                      {s.timerSec ? (
                        <Pressable accessibilityRole="button" disabled={!onStartTimer} onPress={() => onStartTimer?.(i)} style={({ pressed }) => [styles.timerBtn, { backgroundColor: color('bg/muted') }, pressed && { opacity: 0.85 }]}>
                          <Icon icon={Timer} size={16} />
                          <Text variant="Button/M" style={styles.flex}>{t('dish.startTimer', { time: `${Math.floor(s.timerSec / 60)}:${String(s.timerSec % 60).padStart(2, '0')}` })}</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
            {dish.calories != null ? (
              <View style={[styles.section, styles.gap32]}>
                <View style={[styles.details, { borderColor: color('border/default') }]}>
                  <View style={styles.cal}>
                    <Text variant="Overline" color="fg/muted">{t('dish.caloriesTotal')}</Text>
                    <Text variant="Body/M Strong">{t('dish.kcal', { n: dish.calories })}</Text>
                  </View>
                  <Text variant="Caption" color="fg/muted" style={styles.calNote}>{t('dish.caloriesNote')}</Text>
                </View>
              </View>
            ) : null}
          </>
        ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  dividerRow: { paddingHorizontal: space[20], paddingVertical: 28 },
  divider: { height: 1 },
  section: { paddingHorizontal: space[20], gap: space[8] },
  steps: { gap: space[14] },
  gap32: { marginTop: space[32] },
  warnRow: { paddingBottom: space[16] },
  warn: { flexDirection: 'row', alignItems: 'center', gap: space[6], alignSelf: 'flex-start', paddingHorizontal: space[10], paddingVertical: space[4], borderRadius: radius.full },
  shop: { paddingTop: space[12], gap: space[6] },
  pickable: { alignItems: 'center' },
  // Picked row: bg/accent-subtle under the row, reaching a little past its text so the row's inner spacing stays.
  picked: { position: 'absolute', top: 0, bottom: 0, left: -space[8], right: -space[8], borderRadius: 1 },
  badge: { paddingHorizontal: space[8], paddingVertical: space[2], borderRadius: radius.full },
  ingHead: { flexDirection: 'row', alignItems: 'center', gap: space[12] },
  servings: { height: 36, flexDirection: 'row', alignItems: 'center', gap: space[12], paddingHorizontal: space[12], borderRadius: radius.full, borderWidth: 1 },
  ingredient: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: space[8], borderBottomWidth: 1, gap: space[12] },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: space[14] },
  stepNo: { width: 28, height: 28, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  stepText: { flex: 1, gap: space[10] },
  timerBtn: { height: 34, flexDirection: 'row', alignItems: 'center', gap: space[8], paddingHorizontal: space[14], borderRadius: radius.full },
  details: { flexDirection: 'row', alignItems: 'center', paddingVertical: space[14], borderTopWidth: 1, borderBottomWidth: 1, gap: space[12] },
  cal: { gap: space[4] },
  calNote: { flex: 1, textAlign: 'right' },
});
