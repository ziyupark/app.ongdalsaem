import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, withTiming } from 'react-native-reanimated';
import { fetchDiaryMonth, type DiaryDay } from '../../services/foods';
import { radius, space, useTheme, WEATHER_ICON, type WeatherMood } from '../../theme';
import { Icon } from '../Icon';
import { Text } from '../Text';
import { FridgeList } from './FridgeList';
import { firstDayOfWeek, WeekStrip } from './WeekStrip';

const RAINY: WeatherMood[] = ['drizzle', 'rain', 'heavy-rain', 'shower', 'thunder'];
const SNOWY: WeatherMood[] = ['sleet', 'flurries', 'snow', 'heavy-snow'];
const pad = (n: number) => String(n).padStart(2, '0');
const CARD_MAX = 360;

/** Card entrance (same as the timer popup): fade in while growing slightly (0.94 → 1). */
const popIn = () => {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ scale: 0.94 }] },
    animations: { opacity: withTiming(1, { duration: 200 }), transform: [{ scale: withTiming(1, { duration: 200 }) }] },
  };
};

/** 6.3 Profile · Diary — this week in one row · this month in one line · fridge / freezer / shopping memo (+ what I can cook). The month calendar opens as a popup. */
export function DiaryView({ onOffline }: { onOffline?: (off: boolean) => void }) {
  const { t, i18n } = useTranslation();
  const [days, setDays] = useState<DiaryDay[] | null>(null);
  const [month, setMonth] = useState(false);
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  useEffect(() => {
    let alive = true;
    fetchDiaryMonth(y, m)
      .then((d) => { if (alive) { setDays(d); onOffline?.(false); } })
      .catch(() => { if (alive) { setDays([]); onOffline?.(true); } });
    return () => { alive = false; };
  }, [y, m, onOffline]);

  const monthName = new Date(y, m, 1).toLocaleDateString(i18n.language, { month: 'long' });
  const cooked = (days ?? []).reduce((n, d) => n + d.cooked.length, 0);
  const rainy = (days ?? []).reduce((n, d) => n + d.cooked.filter((c) => c.mood && RAINY.includes(c.mood)).length, 0);
  const snowy = (days ?? []).reduce((n, d) => n + d.cooked.filter((c) => c.mood && SNOWY.includes(c.mood)).length, 0);
  const moodCount = new Map<WeatherMood, number>();
  (days ?? []).forEach((d) => d.cooked.forEach((c) => c.mood && moodCount.set(c.mood, (moodCount.get(c.mood) ?? 0) + 1)));
  const top = [...moodCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const head = top ? t('diary.mostly', { month: monthName, mood: t(`home.titleMood.${top}`).toLowerCase() }) : t('diary.quiet', { month: monthName });
  const body = cooked === 0 ? null : rainy ? t('diary.cookedRain', { count: cooked, rainy }) : snowy ? t('diary.cookedSnow', { count: cooked, snowy }) : t('diary.cooked', { count: cooked });

  return (
    <View style={styles.root}>
      <WeekStrip onMonth={() => setMonth(true)} />
      {days == null ? null : (
        <View style={styles.summary}>
          <Icon icon={WEATHER_ICON[top ?? 'cloudy']} size={16} color="fg/accent" />
          <Text variant="Body/S" style={styles.flex}>{body ? `${head} · ${body}` : head}</Text>
        </View>
      )}
      <FridgeList />
      <MonthPopup visible={month} onClose={() => setMonth(false)} />
    </View>
  );
}

/** Month view popup (timer popup style) — month calendar of the days I cooked · tap a day → its list → dish. */
function MonthPopup({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [days, setDays] = useState<DiaryDay[] | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const cw = (Math.min(useWindowDimensions().width - space[20] * 2, CARD_MAX) - space[20] * 2 - space[4] * 6) / 7;

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    setDays(null);
    setPicked(null);
    fetchDiaryMonth(ym.y, ym.m).then((d) => alive && setDays(d)).catch(() => alive && setDays([]));
    return () => { alive = false; };
  }, [ym, visible]);

  const byDate = useMemo(() => new Map((days ?? []).map((d) => [d.date, d])), [days]);
  const fd = firstDayOfWeek(i18n.language);
  const first = new Date(ym.y, ym.m, 1);
  const total = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array((first.getDay() - fd + 7) % 7).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  // 2026-11-01 is a Sunday.
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2026, 10, 1 + fd + i).toLocaleDateString(i18n.language, { weekday: 'narrow' }));
  const title = first.toLocaleDateString(i18n.language, { year: 'numeric', month: 'long' });
  const sel = picked ? byDate.get(picked) : undefined;

  const go = (delta: number) => setYm(({ y, m }) => { const d = new Date(y, m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const isFuture = ym.y > now.getFullYear() || (ym.y === now.getFullYear() && ym.m >= now.getMonth());
  const close = () => { onClose(); setYm({ y: now.getFullYear(), m: now.getMonth() }); };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      {visible ? (
        <>
          <Animated.View entering={FadeIn.duration(200)} style={[StyleSheet.absoluteFill, { backgroundColor: color('overlay/scrim') }]}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} style={StyleSheet.absoluteFill} onPress={close} />
          </Animated.View>
          <View style={styles.center} pointerEvents="box-none">
            <Animated.View entering={popIn} style={[styles.card, { backgroundColor: color('bg/default') }]}>
              <ScrollView bounces={false} showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.body}>
                <View style={styles.monthHead}>
                  <Text variant="Title/M" style={styles.flex}>{title}</Text>
                  <View style={styles.arrows}>
                    <Pressable accessibilityRole="button" accessibilityLabel={t('diary.prev')} onPress={() => go(-1)} hitSlop={space[8]}><Icon icon={ChevronLeft} size={20} color="fg/muted" /></Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel={t('diary.next')} onPress={() => go(1)} disabled={isFuture} hitSlop={space[8]} style={isFuture && { opacity: 0.3 }}><Icon icon={ChevronRight} size={20} color="fg/muted" /></Pressable>
                  </View>
                </View>
                {/* calendar — 7 × Diary Day (r12), gap 4. Logged = photo + overlay/scrim-soft + weather 14. */}
                <View style={styles.grid}>
                  {weekdays.map((w, i) => <View key={`w${i}`} style={[styles.dow, { width: cw }]}><Text variant="Caption Strong" color="fg/muted">{w}</Text></View>)}
                  {cells.map((d, i) => {
                    if (d == null) return <View key={`e${i}`} style={[styles.cell, { width: cw }]} />;
                    const k = `${ym.y}-${pad(ym.m + 1)}-${pad(d)}`;
                    const info = byDate.get(k);
                    const on = picked === k;
                    const photo = info?.cooked[0]?.photo ?? null;
                    return (
                      <Pressable key={k} accessibilityRole="button" accessibilityLabel={String(d)} disabled={!info} onPress={() => setPicked(on ? null : k)} style={[styles.cell, { width: cw }, on && { borderWidth: 2, borderColor: color('border/focus') }]}>
                        {photo ? (
                          <>
                            <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" />
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: color('overlay/scrim-soft') }]} />
                          </>
                        ) : info ? <View style={[StyleSheet.absoluteFill, { backgroundColor: color('bg/muted') }]} /> : null}
                        <Text variant="Caption Strong" color={photo ? 'fg/on-photo' : 'fg/secondary'}>{String(d)}</Text>
                        {info ? <Icon icon={WEATHER_ICON[info.mood ?? 'cloudy']} size={14} color={photo ? 'fg/on-photo' : 'fg/secondary'} /> : null}
                      </Pressable>
                    );
                  })}
                </View>
                {days == null ? <ActivityIndicator color={color('fg/muted')} /> : null}
                {sel ? (
                  <View style={styles.list}>
                    {sel.cooked.map((c) => (
                      <Pressable key={c.id} onPress={() => { close(); router.push(`/dish/${c.id}`); }} style={styles.item}>
                        <Image source={{ uri: c.photo }} style={[styles.thumb, { backgroundColor: color('bg/muted') }]} contentFit="cover" />
                        <View style={styles.flex}><Text variant="Body/M Strong" numberOfLines={1}>{c.name}</Text><Text variant="Caption" color="fg/muted">{t('diary.youCooked')}</Text></View>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </ScrollView>
            </Animated.View>
          </View>
        </>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: space[20], paddingTop: space[12], gap: space[12] },
  monthHead: { flexDirection: 'row', alignItems: 'center', height: 28 },
  arrows: { flexDirection: 'row', gap: space[16] },
  flex: { flex: 1, gap: space[2] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space[4], rowGap: space[6] },
  dow: { width: 47, height: 18, alignItems: 'center', justifyContent: 'center' },
  cell: { width: 47, height: 46, borderRadius: radius.md, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  center: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'center', alignItems: 'center', padding: space[20] },
  card: { width: '100%', maxWidth: CARD_MAX, flexShrink: 1, borderRadius: radius.xl, overflow: 'hidden' },
  scroll: { flexGrow: 0 },
  body: { padding: space[20], gap: space[12] },
  list: { gap: space[10] },
  item: { flexDirection: 'row', alignItems: 'center', gap: space[12] },
  thumb: { width: 48, height: 48, borderRadius: radius.sm },
});
