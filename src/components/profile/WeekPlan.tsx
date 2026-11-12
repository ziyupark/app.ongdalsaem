import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useDietPrefs } from '../../lib/dietPrefs';
import { dateKey, PLAN_MEALS, removePlan, setPlan, useMealPlan, type PlanMeal } from '../../lib/mealPlan';
import { useHere } from '../../lib/useHere';
import { fetchSavedDishes, type DishSummary } from '../../services/foods';
import { fetchPool, pickToday, type PoolDish } from '../../services/recommend';
import { fetchDailyForecast, type DailyForecast } from '../../services/weather';
import { radius, space, useTheme, WEATHER_ICON } from '../../theme';
import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { DishTile } from '../dish/DishTile';
import { Icon } from '../Icon';
import { Text } from '../Text';

const DAYS = 7;
const TILE_W = 112;
const PICKS = 3;

/** Today and the next 6 days (local dates). */
export function weekDates() {
  const now = new Date();
  return Array.from({ length: DAYS }, (_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + i));
}

/** Day forecasts for where I am (device location, else my city). Empty while loading or without a forecast. */
export function useDailyForecast() {
  const { here } = useHere();
  const where = here.coords ?? (here.forecast?.city ? { city: here.forecast.city } : here.place?.city ? { city: here.place.city } : null);
  const whereKey = where ? ('city' in where ? where.city : `${where.latitude.toFixed(2)},${where.longitude.toFixed(2)}`) : '';
  const [days, setDays] = useState<DailyForecast[]>([]);
  useEffect(() => {
    if (!where) return;
    let alive = true;
    fetchDailyForecast(where).then((d) => alive && setDays(d)).catch(() => undefined);
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whereKey]);
  return days;
}

/** One day: what's planned (remove) · lunch / dinner · 3 picks for that day's forecast (Today's pick logic) · my saved dishes. */
export function DayPlanSheet({ date, forecast, onClose }: { date: string | null; forecast: DailyForecast | null; onClose: () => void }) {
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const plan = useMealPlan();
  const diet = useDietPrefs();
  const { here } = useHere();
  const [meal, setMeal] = useState<PlanMeal>('dinner');
  const [pool, setPool] = useState<PoolDish[] | null>(null);
  const [saved, setSaved] = useState<DishSummary[] | null>(null);

  useEffect(() => {
    if (!date) return;
    // Start on the first meal with nothing planned yet.
    const planned = plan.filter((p) => p.date === date).map((p) => p.meal);
    setMeal(PLAN_MEALS.find((m) => !planned.includes(m)) ?? 'dinner');
    if (!pool) fetchPool().then(setPool).catch(() => setPool([]));
    if (!saved) fetchSavedDishes().then(setSaved).catch(() => setSaved([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const picks = useMemo(() => {
    if (!pool) return null;
    const out: PoolDish[] = [];
    let rest = pool;
    const place = { city: here.place?.city ?? here.forecast?.city ?? null, neighborhood: here.place?.district ?? null };
    for (let i = 0; i < PICKS; i++) {
      const p = pickToday(rest, { ...(forecast ? { mood: forecast.mood, tempC: forecast.hi } : {}), place, meal, diet });
      if (!p) break;
      out.push(p);
      rest = rest.filter((d) => d.id !== p.id && d.name.trim().toLowerCase() !== p.name.trim().toLowerCase());
    }
    return out;
  }, [pool, forecast, meal, diet, here.place?.city, here.place?.district, here.forecast?.city]);

  if (!date) return null;
  const day = new Date(`${date}T12:00:00`);
  const title = day.toLocaleDateString(i18n.language, { weekday: 'long', month: 'long', day: 'numeric' });
  const planned = PLAN_MEALS.map((m) => plan.find((p) => p.date === date && p.meal === m)).filter(Boolean);
  const choose = (d: DishSummary) => { setPlan(date, meal, { foodId: d.id, name: d.name, photo: d.photo }); };

  const tiles = (list: DishSummary[]) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tiles}>
      {list.map((d) => <DishTile key={d.id} dish={d} width={TILE_W} onPress={() => choose(d)} />)}
    </ScrollView>
  );

  return (
    <BottomSheet visible onClose={onClose} title={title} maxHeightRatio={0.85}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheet}>
        {planned.length ? (
          <View style={[styles.box, { backgroundColor: color('bg/default'), borderColor: color('border/default') }]}>
            {planned.map((p, i) => (
              <View key={p!.id} style={[styles.planRow, i < planned.length - 1 && { borderBottomWidth: 1, borderBottomColor: color('border/default') }]}>
                <Text variant="Caption Strong" color="fg/muted" style={styles.mealCol}>{t(`mealPlan.meals.${p!.meal}`)}</Text>
                <Pressable accessibilityRole="link" disabled={!p!.foodId} onPress={() => { onClose(); router.push(`/dish/${p!.foodId}`); }} style={styles.flex}>
                  <Text variant="Body/M Strong" numberOfLines={1}>{p!.name}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={t('mealPlan.remove', { name: p!.name })} hitSlop={space[10]} onPress={() => removePlan(p!.id)}>
                  <Icon icon={X} size={18} color="fg/secondary" />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.group}>
          <Text variant="Overline" color="fg/muted">{t('mealPlan.planFor')}</Text>
          <View style={styles.wrap}>
            {PLAN_MEALS.map((m) => <Chip key={m} label={t(`mealPlan.meals.${m}`)} selected={meal === m} onPress={() => setMeal(m)} />)}
          </View>
        </View>

        <View style={styles.group}>
          <View style={styles.head}>
            <Text variant="Body/M Strong" style={styles.flex}>
              {forecast ? t('mealPlan.forWeather', { weather: t(`weather.${forecast.mood}`) }) : t('mealPlan.suggested')}
            </Text>
            {forecast ? <Icon icon={WEATHER_ICON[forecast.mood]} size={18} color="fg/secondary" /> : null}
          </View>
          {picks == null ? <ActivityIndicator color={color('fg/muted')} /> : picks.length ? tiles(picks) : <Text variant="Body/S" color="fg/muted">{t('mealPlan.noPicks')}</Text>}
        </View>

        <View style={styles.group}>
          <Text variant="Body/M Strong">{t('mealPlan.fromSaved')}</Text>
          {saved == null ? <ActivityIndicator color={color('fg/muted')} /> : saved.length ? tiles(saved) : <Text variant="Body/S" color="fg/muted">{t('mealPlan.noSaved')}</Text>}
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

/** 7.1 More → Add to meal plan: pick a day (this week) and lunch / dinner. */
export function AddToPlanSheet({ dish, visible, onClose, onAdded }: { dish: { id: string; name: string; photo: string }; visible: boolean; onClose: () => void; onAdded: () => void }) {
  const { t, i18n } = useTranslation();
  const dates = useMemo(weekDates, []);
  const [date, setDate] = useState(dateKey(dates[0]));
  const [meal, setMeal] = useState<PlanMeal>('dinner');
  useEffect(() => { if (visible) { setDate(dateKey(dates[0])); setMeal('dinner'); } }, [visible, dates]);
  const add = async () => {
    await setPlan(date, meal, { foodId: dish.id, name: dish.name, photo: dish.photo });
    onAdded();
  };
  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('mealPlan.addTitle')}>
      <View style={styles.group}>
        <Text variant="Overline" color="fg/muted">{t('mealPlan.day')}</Text>
        <View style={styles.wrap}>
          {dates.map((d, i) => {
            const key = dateKey(d);
            const label = i === 0 ? t('mealPlan.today') : d.toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric' });
            return <Chip key={key} label={label} selected={date === key} onPress={() => setDate(key)} />;
          })}
        </View>
      </View>
      <View style={styles.group}>
        <Text variant="Overline" color="fg/muted">{t('mealPlan.planFor')}</Text>
        <View style={styles.wrap}>
          {PLAN_MEALS.map((m) => <Chip key={m} label={t(`mealPlan.meals.${m}`)} selected={meal === m} onPress={() => setMeal(m)} />)}
        </View>
      </View>
      <Button label={t('mealPlan.add')} onPress={add} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: { gap: space[20], paddingBottom: space[8] },
  box: { borderRadius: radius.lg, borderWidth: 1, paddingHorizontal: space[14] },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: space[10], minHeight: 48 },
  mealCol: { width: 56 },
  group: { gap: space[10] },
  head: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8] },
  tiles: { gap: space[12] },
  flex: { flex: 1 },
});
