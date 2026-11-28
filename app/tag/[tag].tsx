import { router, useLocalSearchParams } from 'expo-router';
import { TrendingUp } from '../../src/components/icons/ongdal';
import { type ComponentRef, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryRow, CollectionTop, tagCategories } from '../../src/components/community/CollectionParts';
import { EmptyState, FoodGrid } from '../../src/components/community/Parts';
import { LoadError } from '../../src/components/LoadError';
import { ScreenWash, useScreenInk } from '../../src/components/ScreenHeader';
import { goTab, TabBar, useTabBarScroll, type TabKey } from '../../src/components/TabBar';
import { Text } from '../../src/components/Text';
import { useWashScroll } from '../../src/lib/useWashScroll';
import { fetchByMethod, fetchByTag, type CardDish } from '../../src/services/community';
import { space, useTheme } from '../../src/theme';

/** Expanded TabBar height (12:182) — same bottom room as 4.1. */
const TAB_BAR_H = 110;

/**
 * 4.2 Tag · #Comfort (v2 826:14271) — mood wash · TopBar Overlay (back only) → #Tag (Display/XL, always English) →
 * Group p22 · gap 16: headline (Display/M) over a carousel of 400-high photo cards (the tag's most popular, gap 6) →
 * 18 → round categories (co-used tags; tap filters the grid, tap again clears) → 32 → Overline "LATEST · {category}" →
 * 12 → dish grid (newest first) → TabBar. No sort tabs, info pill or meal filter (not in the design).
 */
export default function TagScreen() {
  const { tag } = useLocalSearchParams<{ tag: string }>();
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bar = useTabBarScroll();
  const wash = useWashScroll();
  const titleInk = useScreenInk(0.36);
  const headInk = useScreenInk(0.5);
  const en = useMemo(() => i18n.getFixedT('en'), [i18n]);
  const [all, setAll] = useState<CardDish[] | null>(null);
  const [latest, setLatest] = useState<CardDish[] | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const key = String(tag ?? '').toLowerCase();
  // `method:<key>` = dishes cooked that way (foods.cooking_methods) instead of a mood tag — Home air quality card.
  const method = key.startsWith('method:') ? key.slice('method:'.length) : null;
  const fetchList = (sort: 'popular' | 'latest') => (method ? fetchByMethod(method, sort) : fetchByTag(key, sort));
  const tagLabel = (k: string) => (i18n.exists(`share.moods.${k}`) ? t(`share.moods.${k}`) : k);
  const label = method ? t(`cookingMethod.${method}`) : tagLabel(key);
  // The big #Tag title always shows the English name (like the tab titles); screen readers get the local one.
  const enLabel = method ? en(`cookingMethod.${method}`) : i18n.exists(`share.moods.${key}`) ? en(`share.moods.${key}`) : key;
  const headline = i18n.exists(`tag.headlines.${key}`) ? t(`tag.headlines.${key}`) : t('tag.overline', { tag: label });

  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { fetchList('popular').then(setAll).catch(() => setFailed(true)); }, [key, attempt]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchList('latest').then(setLatest).catch(() => setFailed(true)); }, [key, attempt]); // eslint-disable-line react-hooks/exhaustive-deps
  const retry = () => { setFailed(false); setAttempt((n) => n + 1); };

  const list = latest?.filter((d) => !category || d.moods.includes(category)) ?? null;
  const categories = useMemo(() => tagCategories(all ?? [], tagLabel, method ? '' : key), [all, key, i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps
  const sectionTitle = [t('tag.latest'), category ? tagLabel(category) : null].filter(Boolean).join(' · ');

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    bar.onY(e.nativeEvent.contentOffset.y);
    wash.onY(e.nativeEvent.contentOffset.y);
  };
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const onTab = (k: TabKey) => (k === 'community' && bar.scrolled() ? scroll.current?.scrollTo({ y: 0, animated: true }) : goTab(k));

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
      <ScreenWash wash={wash} local />
      <ScrollView ref={scroll} onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={[{ paddingTop: insets.top, paddingBottom: TAB_BAR_H + space[24] }]}>
        <CollectionTop
          dishes={all}
          width={width}
          onOpen={(d) => router.push(`/dish/${d.id}`)}
          onBack={() => router.back()}
          headGap={space[16]}
          title={`#${enLabel}`}
          titleLabel={`#${label}`}
          headline={headline}
          titleInk={titleInk?.strong}
          headInk={headInk?.strong}
        />

        {/* Group · Our area 826:14291 — p18 top: round categories. */}
        <View style={styles.filters}>
          <CategoryRow items={categories} value={category} onChange={setCategory} />
        </View>

        <View style={styles.section}>
          <Text variant="Overline" color="fg/muted" style={styles.px}>{sectionTitle}</Text>
          {failed && list == null ? <LoadError onRetry={retry} /> : list == null ? <ActivityIndicator color={color('fg/muted')} style={styles.loading} /> : list.length ? (
            <FoodGrid dishes={list} width={width} onOpen={(d) => router.push(`/dish/${d.id}`)} />
          ) : (
            <EmptyState icon={TrendingUp} title={t('tag.emptyTitle', { tag: label })} body={t('tag.emptyBody')} />
          )}
        </View>
      </ScrollView>
      <TabBar active="community" progress={bar.progress} onTab={onTab} onCreate={() => router.push('/share/pick')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  filters: { paddingTop: space[16] + space[2] },
  px: { paddingHorizontal: space[20] },
  section: { paddingTop: space[32], gap: space[12] },
  loading: { marginTop: space[40] },
});
