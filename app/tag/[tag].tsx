import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { TrendingUp } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, Share, StyleSheet, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryRow, CollectionTop, InfoRow, MealSheet, tagCategories } from '../../src/components/community/CollectionParts';
import { EmptyState, FoodGrid } from '../../src/components/community/Parts';
import { ScreenWash, useScreenInk } from '../../src/components/ScreenHeader';
import { goTab, TabBar, useTabBarScroll, type TabKey } from '../../src/components/TabBar';
import { Text } from '../../src/components/Text';
import { UnderlineTabs } from '../../src/components/UnderlineTabs';
import { displayTemp } from '../../src/lib/prefs';
import { useHere } from '../../src/lib/useHere';
import { useWashScroll } from '../../src/lib/useWashScroll';
import { fetchByTag, topTags, type CardDish } from '../../src/services/community';
import { space, useTheme, WEATHER_ICON } from '../../src/theme';

type Sort = 'latest' | 'popular' | 'weather';
/** Expanded TabBar height (12:182) — same bottom room as 4.1. */
const TAB_BAR_H = 110;

/**
 * 4.2 Tag · #Comfort (v2 826:14271) — mood wash · TopBar Overlay (back · share) → #Tag (Display/XL, always English) →
 * headline (Display/M) over a carousel of 400-high photo cards (gap 6) → Latest / Popular / By weather → info pill
 * (my weather · count) + meal filter → round categories (co-used tags) → Overline → dish grid → TabBar.
 */
export default function TagScreen() {
  const { tag } = useLocalSearchParams<{ tag: string }>();
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { here } = useHere();
  const bar = useTabBarScroll();
  const wash = useWashScroll();
  const titleInk = useScreenInk(0.36);
  const headInk = useScreenInk(0.5);
  const en = useMemo(() => i18n.getFixedT('en'), [i18n]);
  const [sort, setSort] = useState<Sort>('latest');
  const [all, setAll] = useState<CardDish[] | null>(null);
  const [latest, setLatest] = useState<CardDish[] | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [meal, setMeal] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const key = String(tag ?? '').toLowerCase();
  const tagLabel = (k: string) => (i18n.exists(`share.moods.${k}`) ? t(`share.moods.${k}`) : k);
  const label = tagLabel(key);
  // The big #Tag title always shows the English name (like the tab titles); screen readers get the local one.
  const enLabel = i18n.exists(`share.moods.${key}`) ? en(`share.moods.${key}`) : key;
  const headline = i18n.exists(`tag.headlines.${key}`) ? t(`tag.headlines.${key}`) : t('tag.overline', { tag: label });
  const myMood = here.forecast?.mood ?? null;

  useEffect(() => { fetchByTag(key, 'popular').then(setAll).catch(() => setAll([])); }, [key]);
  useEffect(() => {
    if (sort !== 'latest' || latest) return;
    fetchByTag(key, 'latest').then(setLatest).catch(() => setLatest([]));
  }, [sort, key, latest]);

  const base = sort === 'latest' ? latest : sort === 'weather' ? (all ? all.filter((d) => myMood != null && d.mood === myMood) : null) : all;
  const list = base?.filter((d) => (!category || d.moods.includes(category)) && (!meal || d.meals.includes(meal))) ?? null;
  const categories = useMemo(() => tagCategories(all ?? [], tagLabel, key), [all, key, i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps
  const meals = all ? topTags(all, 'meals') : [];
  const tabs = [{ key: 'latest' as const, label: t('tag.latest') }, { key: 'popular' as const, label: t('tag.popular') }, { key: 'weather' as const, label: t('tag.byWeather') }];
  const sectionTitle = [tabs.find((x) => x.key === sort)?.label, category ? tagLabel(category) : null].filter(Boolean).join(' · ');

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    bar.onY(e.nativeEvent.contentOffset.y);
    wash.onY(e.nativeEvent.contentOffset.y);
  };
  const onTab = (k: TabKey) => goTab(k);
  const shareTag = () => {
    const link = Linking.createURL(`/tag/${encodeURIComponent(key)}`);
    Share.share({ message: `#${label} — ${link}`, url: link }).catch(() => undefined);
  };

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
      <ScreenWash scrollStyle={wash.style} />
      <ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={[{ paddingTop: insets.top, paddingBottom: TAB_BAR_H + space[24] }]}>
        <CollectionTop
          dishes={all}
          width={width}
          onOpen={(d) => router.push(`/dish/${d.id}`)}
          onBack={() => router.back()}
          onShare={shareTag}
          title={`#${enLabel}`}
          titleLabel={`#${label}`}
          headline={headline}
          titleInk={titleInk?.strong}
          headInk={headInk?.strong}
        />

        {/* Block · Tabs — p12 top. */}
        <View style={styles.tabs}>
          <UnderlineTabs contentStyle={styles.tabRow} value={sort} onChange={setSort} items={tabs} />
        </View>

        {/* Group — p18 top · gap 18: info row → categories. */}
        <View style={styles.filters}>
        <InfoRow
          icon={myMood ? WEATHER_ICON[myMood] : undefined}
          weather={here.forecast ? t('tag.myWeather', { weather: t(`weather.${here.forecast.mood}`), temp: displayTemp(here.forecast.tempC) }) : null}
          count={t('tag.count', { count: all?.length ?? 0 })}
          onFilter={() => setSheet(true)}
          filtered={meal != null}
        />

        <CategoryRow items={categories} value={category} onChange={setCategory} />
        </View>

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
  tabs: { paddingTop: space[12] },
  filters: { paddingTop: space[16] + space[2], gap: space[16] + space[2] },
  px: { paddingHorizontal: space[20] },
  tabRow: { gap: space[24], paddingHorizontal: space[20] },
  section: { paddingTop: space[32], gap: space[12] },
  loading: { marginTop: space[40] },
});
