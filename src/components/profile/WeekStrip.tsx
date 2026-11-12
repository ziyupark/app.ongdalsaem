import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { dateKey, PLAN_MEALS, removePlan, useMealPlan, type PlanItem } from '../../lib/mealPlan';
import { useTemp } from '../../lib/prefs';
import { fetchDiaryMonth, type DiaryDay } from '../../services/foods';
import { radius, space, useTheme, WEATHER_ICON } from '../../theme';
import { Icon } from '../Icon';
import { Text } from '../Text';
import { DayPlanSheet, useDailyForecast } from './WeekPlan';

const DOT = 36;

/** First day of the week for a locale: 0 = Sunday, 1 = Monday … (Intl week info, else es / vi start on Monday). */
export function firstDayOfWeek(lang: string) {
  try {
    const loc = new Intl.Locale(lang) as Intl.Locale & { getWeekInfo?: () => { firstDay: number }; weekInfo?: { firstDay: number } };
    const info = loc.getWeekInfo?.() ?? loc.weekInfo;
    if (info?.firstDay) return info.firstDay % 7;
  } catch {
    // no Intl.Locale week info on this engine
  }
  return /^(es|vi)/.test(lang) ? 1 : 0;
}

/** 6.3 Diary · This week in one row — past days: weather + what I cooked; today and later: forecast + my meal plan. */
export function WeekStrip({ onMonth }: { onMonth: () => void }) {
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const temp = useTemp();
  const plan = useMealPlan();
  const forecast = useDailyForecast();
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [diary, setDiary] = useState<Map<string, DiaryDay>>(new Map());
  const months = useRef(new Map<string, DiaryDay[]>());

  const todayKey = dateKey(new Date());
  const fd = firstDayOfWeek(i18n.language);
  const dates = useMemo(() => {
    const now = new Date();
    const start = now.getDate() - ((now.getDay() - fd + 7) % 7) + offset * 7;
    return Array.from({ length: 7 }, (_, i) => new Date(now.getFullYear(), now.getMonth(), start + i));
  }, [fd, offset]);
  const startKey = dateKey(dates[0]);
  const byForecast = useMemo(() => new Map(forecast.map((f) => [f.date, f])), [forecast]);

  // What I cooked on the past days of this week — the month(s) it spans, cached while the tab is open.
  useEffect(() => {
    if (startKey >= todayKey) return;
    let alive = true;
    const need = [...new Set([dates[0], dates[6]].map((d) => `${d.getFullYear()}-${d.getMonth()}`))];
    Promise.all(need.map(async (k) => {
      const hit = months.current.get(k);
      if (hit) return hit;
      const [y, m] = k.split('-').map(Number);
      const list = await fetchDiaryMonth(y, m).catch(() => [] as DiaryDay[]);
      months.current.set(k, list);
      return list;
    })).then((lists) => alive && setDiary(new Map(lists.flat().map((d) => [d.date, d]))));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startKey, todayKey]);

  const label = (d: Date) => d.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' });
  const range = `${label(dates[0])} – ${label(dates[6])}`;

  const askRemove = (items: PlanItem[]) => Alert.alert(t('mealPlan.removeAsk'), items.map((p) => p.name).join(', '), [
    { text: t('common.cancel'), style: 'cancel' },
    ...items.map((p) => ({ text: t('mealPlan.remove', { name: p.name }), style: 'destructive' as const, onPress: () => removePlan(p.id) })),
  ]);

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <View style={styles.flex}>
          <Text variant="Title/M">{offset === 0 ? t('diary.thisWeek') : range}</Text>
          {offset === 0 ? <Text variant="Caption" color="fg/muted">{range}</Text> : null}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={t('diary.prevWeek')} onPress={() => setOffset((o) => o - 1)} hitSlop={space[8]}>
          <Icon icon={ChevronLeft} size={20} color="fg/muted" />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('diary.nextWeek')} onPress={() => setOffset((o) => o + 1)} hitSlop={space[8]}>
          <Icon icon={ChevronRight} size={20} color="fg/muted" />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onMonth} hitSlop={space[8]}>
          <Text variant="Body/S Strong" color="fg/accent">{t('diary.monthView')}</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        {dates.map((d) => {
          const key = dateKey(d);
          const isToday = key === todayKey;
          const past = key < todayKey;
          const cooked = past ? diary.get(key) : undefined;
          const f = past ? undefined : byForecast.get(key);
          const planned = past ? [] : PLAN_MEALS.map((m) => plan.find((p) => p.date === key && p.meal === m)).filter((p): p is PlanItem => !!p);
          const photo = past ? cooked?.cooked[0]?.photo : planned.find((p) => p.photo)?.photo;
          const mood = past ? cooked?.mood ?? (cooked?.cooked.length ? 'cloudy' : null) : f?.mood ?? null;

          const onPress = past
            ? (cooked?.cooked[0] ? () => router.push(`/dish/${cooked.cooked[0].id}`) : undefined)
            : () => setOpen(key);
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={past ? label(d) : t('mealPlan.planDay', { date: label(d) })}
              disabled={!onPress}
              onPress={onPress}
              onLongPress={planned.length ? () => askRemove(planned) : undefined}
              style={[styles.cell, { borderColor: isToday ? color('border/focus') : 'transparent' }]}
            >
              <Text variant="Caption" color={isToday ? 'fg/accent' : 'fg/muted'}>{d.toLocaleDateString(i18n.language, { weekday: 'narrow' })}</Text>
              <Text variant="Caption Strong" color={isToday ? 'fg/accent' : 'fg/default'}>{String(d.getDate())}</Text>
              <View style={styles.wx}>
                {mood ? <Icon icon={WEATHER_ICON[mood]} size={14} color="fg/secondary" /> : null}
                {f ? <Text variant="Caption" color="fg/secondary">{`${temp(f.hi)}°`}</Text> : null}
              </View>
              {photo ? (
                <Image source={{ uri: photo }} style={[styles.dot, { backgroundColor: color('bg/muted') }]} contentFit="cover" />
              ) : planned.length ? (
                <View style={[styles.dot, { backgroundColor: color('bg/accent-subtle') }]}>
                  <Text variant="Caption Strong" color="fg/accent">{planned[0].name.slice(0, 1)}</Text>
                </View>
              ) : past ? (
                <View style={styles.dot} />
              ) : (
                <View style={[styles.dot, styles.add, { borderColor: color('border/default') }]}>
                  <Icon icon={Plus} size={16} color="fg/muted" />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
      <DayPlanSheet date={open} forecast={open ? byForecast.get(open) ?? null : null} onClose={() => setOpen(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space[10] },
  head: { flexDirection: 'row', alignItems: 'center', gap: space[16] },
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: space[4] },
  cell: { flex: 1, alignItems: 'center', gap: space[4], paddingVertical: space[8], borderRadius: radius.lg, borderWidth: 2 },
  wx: { flexDirection: 'row', alignItems: 'center', gap: space[2], height: 16 },
  dot: { width: DOT, height: DOT, borderRadius: radius.full, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  add: { borderWidth: 1, borderStyle: 'dashed' },
});
