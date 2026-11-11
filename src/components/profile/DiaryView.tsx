import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { fetchDiaryMonth, type DiaryDay } from '../../services/foods';
import { radius, space, useTheme, WEATHER_ICON, type WeatherMood } from '../../theme';
import { Icon } from '../Icon';
import { Text } from '../Text';

const RAINY: WeatherMood[] = ['drizzle', 'rain', 'heavy-rain', 'shower', 'thunder'];
const SNOWY: WeatherMood[] = ['sleet', 'flurries', 'snow', 'heavy-snow'];
const pad = (n: number) => String(n).padStart(2, '0');

/** 6.3 Profile · Diary (Figma 20:1110) — month calendar with the weather of each day I cooked or ate · monthly summary · that day's list. */
export function DiaryView({ onOffline }: { onOffline?: (off: boolean) => void }) {
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [days, setDays] = useState<DiaryDay[] | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const cw = (useWindowDimensions().width - space[20] * 2 - space[4] * 6) / 7;

  useEffect(() => {
    let alive = true;
    setDays(null);
    setPicked(null);
    fetchDiaryMonth(ym.y, ym.m)
      .then((d) => { if (alive) { setDays(d); onOffline?.(false); } })
      .catch(() => { if (alive) { setDays([]); onOffline?.(true); } });
    return () => { alive = false; };
  }, [ym, onOffline]);

  const byDate = useMemo(() => new Map((days ?? []).map((d) => [d.date, d])), [days]);
  const first = new Date(ym.y, ym.m, 1);
  const total = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(first.getDay()).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2026, 10, 1 + i).toLocaleDateString(i18n.language, { weekday: 'narrow' }));
  const monthName = first.toLocaleDateString(i18n.language, { month: 'long' });
  const title = first.toLocaleDateString(i18n.language, { year: 'numeric', month: 'long' });

  const cooked = (days ?? []).reduce((n, d) => n + d.cooked.length, 0);
  const rainy = (days ?? []).reduce((n, d) => n + d.cooked.filter((c) => c.mood && RAINY.includes(c.mood)).length, 0);
  const snowy = (days ?? []).reduce((n, d) => n + d.cooked.filter((c) => c.mood && SNOWY.includes(c.mood)).length, 0);
  const moodCount = new Map<WeatherMood, number>();
  (days ?? []).forEach((d) => d.cooked.forEach((c) => c.mood && moodCount.set(c.mood, (moodCount.get(c.mood) ?? 0) + 1)));
  const top = [...moodCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const sel = picked ? byDate.get(picked) : undefined;

  const go = (delta: number) => setYm(({ y, m }) => { const d = new Date(y, m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const isFuture = ym.y > now.getFullYear() || (ym.y === now.getFullYear() && ym.m >= now.getMonth());

  return (
    <View style={styles.root}>
      <View style={styles.monthHead}>
        <Text variant="Title/M" style={styles.flex}>{title}</Text>
        <View style={styles.arrows}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('diary.prev')} onPress={() => go(-1)} hitSlop={space[8]}><Icon icon={ChevronLeft} size={20} color="fg/muted" /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={t('diary.next')} onPress={() => go(1)} disabled={isFuture} hitSlop={space[8]} style={isFuture && { opacity: 0.3 }}><Icon icon={ChevronRight} size={20} color="fg/muted" /></Pressable>
        </View>
      </View>
      {/* calendar — 7 × Diary Day (47×46, r12), gap 4 · rows 6. Logged = photo + overlay/scrim-soft + weather 14. */}
      <View style={styles.grid}>
        {weekdays.map((w, i) => <View key={`w${i}`} style={[styles.dow, { width: cw }]}><Text variant="Caption Strong" color="fg/muted">{w}</Text></View>)}
        {cells.map((d, i) => {
          if (d == null) return <View key={`e${i}`} style={[styles.cell, { width: cw }]} />;
          const k = `${ym.y}-${pad(ym.m + 1)}-${pad(d)}`;
          const info = byDate.get(k);
          const on = picked === k;
          const photo = info ? info.cooked[0]?.photo ?? info.ate.find((a) => a.photo)?.photo ?? null : null;
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
      {days == null ? <ActivityIndicator color={color('fg/muted')} /> : (
        // card — bg/accent-subtle, r24, padding 16, gap 12: weather icon 16 · Body/S Strong (accent) / Body/S.
        <View style={[styles.summary, { backgroundColor: color('bg/accent-subtle') }]}>
          <View style={styles.summaryHead}>
            <Icon icon={WEATHER_ICON[top ?? 'cloudy']} size={16} color="fg/accent" />
            <Text variant="Body/S Strong" color="fg/accent">{top ? t('diary.mostly', { month: monthName, mood: t(`home.titleMood.${top}`).toLowerCase() }) : t('diary.quiet', { month: monthName })}</Text>
          </View>
          <Text variant="Body/S">
            {cooked === 0 ? t('diary.none') : rainy ? t('diary.cookedRain', { count: cooked, rainy }) : snowy ? t('diary.cookedSnow', { count: cooked, snowy }) : t('diary.cooked', { count: cooked })}
          </Text>
        </View>
      )}
      {sel ? (
        <View style={styles.list}>
          {sel.cooked.map((c) => (
            <Pressable key={c.id} onPress={() => router.push(`/dish/${c.id}`)} style={styles.item}>
              <Image source={{ uri: c.photo }} style={[styles.thumb, { backgroundColor: color('bg/muted') }]} contentFit="cover" />
              <View style={styles.flex}><Text variant="Body/M Strong" numberOfLines={1}>{c.name}</Text><Text variant="Caption" color="fg/muted">{t('diary.youCooked')}</Text></View>
            </Pressable>
          ))}
          {sel.ate.map((a) => (
            <Pressable key={a.id} disabled={!a.foodId} onPress={() => a.foodId && router.push(`/dish/${a.foodId}`)} style={styles.item}>
              {a.photo ? <Image source={{ uri: a.photo }} style={[styles.thumb, { backgroundColor: color('bg/muted') }]} contentFit="cover" /> : <View style={[styles.thumb, { backgroundColor: color('bg/muted') }]} />}
              <View style={styles.flex}><Text variant="Body/M Strong" numberOfLines={1}>{a.name}</Text><Text variant="Caption" color="fg/muted">{t('diary.youAte')}</Text></View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
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
  summary: { gap: space[12], padding: space[16], borderRadius: radius.xl },
  summaryHead: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  list: { gap: space[10] },
  item: { flexDirection: 'row', alignItems: 'center', gap: space[12] },
  thumb: { width: 48, height: 48, borderRadius: radius.sm },
});
