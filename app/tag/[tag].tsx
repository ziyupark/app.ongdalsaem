import { router, useLocalSearchParams } from 'expo-router';
import { TrendingUp } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { CategoryRow, CollectionHero, InfoRow, MealSheet, tagCategories } from '../../src/components/community/CollectionParts';
import { EmptyState, FoodGrid } from '../../src/components/community/Parts';
import { TabBar, useTabBarScroll, type TabKey } from '../../src/components/TabBar';
import { Text } from '../../src/components/Text';
import { UnderlineTabs } from '../../src/components/UnderlineTabs';
import { displayTemp } from '../../src/lib/prefs';
import { useHere } from '../../src/lib/useHere';
import { fetchByTag, topTags, type CardDish } from '../../src/services/community';
import { space, useTheme, WEATHER_ICON, type WeatherMood } from '../../src/theme';

type Sort = 'latest' | 'popular' | 'weather';
/** Expanded TabBar height (12:182) — same bottom room as 4.1. */
const TAB_BAR_H = 110;

/**
 * 4.2 Tag · #Comfort (v2 718:11114) — photo hero + title card (overline · headline · band) → Latest / Popular / By weather
 * → info pill (my weather · count) + meal filter → round categories (co-used tags) → dish grid → TabBar.
 */
export default function TagScreen() {
  const { tag } = useLocalSearchParams<{ tag: string }>();
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const { here } = useHere();
  const bar = useTabBarScroll();
  const [sort, setSort] = useState<Sort>('latest');
  const [all, setAll] = useState<CardDish[] | null>(null);
  const [latest, setLatest] = useState<CardDish[] | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [meal, setMeal] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const key = String(tag ?? '').toLowerCase();
  const tagLabel = (k: string) => (i18n.exists(`share.moods.${k}`) ? t(`share.moods.${k}`) : k);
  const label = tagLabel(key);
  const myMood = here.forecast?.mood ?? null;

  useEffect(() => { fetchByTag(key, 'popular').then(setAll).catch(() => setAll([])); }, [key]);
  useEffect(() => {
    if (sort !== 'latest' || latest) return;
    fetchByTag(key, 'latest').then(setLatest).catch(() => setLatest([]));
  }, [sort, key, latest]);

  const topWeather = useMemo<WeatherMood | null>(() => {
    const m = new Map<WeatherMood, number>();
    for (const d of all ?? []) if (d.mood) m.set(d.mood, (m.get(d.mood) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }, [all]);

  const base = sort === 'latest' ? latest : sort === 'weather' ? (all ? all.filter((d) => myMood != null && d.mood === myMood) : null) : all;
  const list = base?.filter((d) => (!category || d.moods.includes(category)) && (!meal || d.meals.includes(meal))) ?? null;
  const categories = useMemo(() => tagCategories(all ?? [], tagLabel, key), [all, key, i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps
  const meals = all ? topTags(all, 'meals') : [];
  const tabs = [{ key: 'latest' as const, label: t('tag.latest') }, { key: 'popular' as const, label: t('tag.popular') }, { key: 'weather' as const, label: t('tag.byWeather') }];
  const sectionTitle = [tabs.find((x) => x.key === sort)?.label, category ? tagLabel(category) : null].filter(Boolean).join(' · ');

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => bar.onY(e.nativeEvent.contentOffset.y);
  const onTab = (k: TabKey) => router.replace(`/${k}`);

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
      <ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_H + space[24] }]}>
        <CollectionHero
          dishes={all ?? []}
          width={width}
          onOpen={(d) => router.push(`/dish/${d.id}`)}
          onBack={() => router.back()}
          overline={t('tag.overline', { tag: label })}
          title={i18n.exists(`tag.headlines.${key}`) ? t(`tag.headlines.${key}`) : `#${label}`}
          band={topWeather ? t('tag.mostIn', { weather: t(`weather.${topWeather}`).toLowerCase() }) : t('tag.count', { count: all?.length ?? 0 })}
        />

        <UnderlineTabs contentStyle={styles.tabRow} value={sort} onChange={setSort} items={tabs} />

        <InfoRow
          icon={myMood ? WEATHER_ICON[myMood] : undefined}
          weather={here.forecast ? t('tag.myWeather', { weather: t(`weather.${here.forecast.mood}`), temp: displayTemp(here.forecast.tempC) }) : null}
          count={t('tag.count', { count: all?.length ?? 0 })}
          onFilter={() => setSheet(true)}
          filtered={meal != null}
        />

        <CategoryRow items={categories} value={category} onChange={setCategory} />

        <View style={styles.section}>
          <Text variant="Overline" color="fg/muted" style={styles.px}>{sectionTitle}</Text>
          {list == null ? <ActivityIndicator color={color('fg/muted')} style={styles.loading} /> : list.length ? (
            <FoodGrid dishes={list} width={width} onOpen={(d) => router.push(`/dish/${d.id}`)} />
          ) : (
            <EmptyState icon={TrendingUp} title={t('tag.emptyTitle', { tag: label })} body={t('tag.emptyBody')} />
          )}
        </View>
      </ScrollView>
      <TabBar active="community" progress={bar.progress} onTab={onTab} onCreate={() => router.push('/share/pick')} />
      <MealSheet visible={sheet} onClose={() => setSheet(false)} meals={meals} value={meal} onChange={setMeal} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: space[20] },
  px: { paddingHorizontal: space[20] },
  tabRow: { gap: space[24], paddingHorizontal: space[20] },
  section: { gap: space[12] },
  loading: { marginTop: space[40] },
});
