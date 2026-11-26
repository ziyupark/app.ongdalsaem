import { router, useLocalSearchParams } from 'expo-router';
import { TrendingUp } from '../../src/components/icons/ongdal';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryRow, CollectionTop, type Category } from '../../src/components/community/CollectionParts';
import { EmptyState, FoodGrid } from '../../src/components/community/Parts';
import { LoadError } from '../../src/components/LoadError';
import { ScreenWash, useScreenInk } from '../../src/components/ScreenHeader';
import { goTab, TabBar, useTabBarScroll, type TabKey } from '../../src/components/TabBar';
import { Text } from '../../src/components/Text';
import { useWashScroll } from '../../src/lib/useWashScroll';
import { fetchByHoliday, type CardDish } from '../../src/services/community';
import { space, useTheme } from '../../src/theme';

/** Expanded TabBar height (12:182) — same bottom room as 4.1. */
const TAB_BAR_H = 110;
const HERO = 3;

/** "Songpyeon, jeon, galbi-jjim" / "トックク、チヂミ" → the separate foods. */
const splitFoods = (s: string) => s.split(/\s*[,、，]\s*/).map((x) => x.trim()).filter(Boolean);
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ');

/**
 * 4.3 Special days around the world (1219:16713) — one holiday: mood wash · TopBar Overlay (back) → #Holiday (Display/XL,
 * always English) → Group p22 · gap 16: "Special days around the world" (Display/M) over 400-high photo cards (the
 * holiday's most-acorned dishes) → 18 → round categories = **the foods eaten on that day** (community.holidays.<key>.food;
 * photo = the newest dish with that food in its name; tap filters, tap again clears) → 32 → "LATEST · {food}" → dish grid.
 * 4.1 Special days › → 4.3-1 (app/holidays, all holidays) → a Festive Card → this screen. Cards on 4.1 open it directly.
 */
export default function HolidayScreen() {
  const { key: raw } = useLocalSearchParams<{ key: string }>();
  const key = String(raw ?? '').toLowerCase();
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const en = useMemo(() => i18n.getFixedT('en'), [i18n]);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bar = useTabBarScroll();
  const wash = useWashScroll();
  const titleInk = useScreenInk(0.36);
  const headInk = useScreenInk(0.5);
  const known = i18n.exists(`community.holidays.${key}.name`);
  const name = known ? t(`community.holidays.${key}.name`) : key;
  const enName = known ? en(`community.holidays.${key}.name`) : key;

  // Foods in my language for the labels; the English names too, so dishes written in either are found.
  const foods = useMemo(() => {
    if (!known) return [] as { key: string; label: string; terms: string[] }[];
    const mine = splitFoods(t(`community.holidays.${key}.food`));
    const english = splitFoods(en(`community.holidays.${key}.food`));
    const same = mine.length === english.length;
    return (same ? mine : english).map((label, i) => ({
      key: norm(english[i] ?? label),
      label: label.charAt(0).toUpperCase() + label.slice(1),
      terms: [...new Set([label, english[i]].filter(Boolean).map(norm))] as string[],
    }));
  }, [key, known, i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps

  const [dishes, setDishes] = useState<CardDish[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [food, setFood] = useState<string | null>(null);
  useEffect(() => {
    if (!key) return;
    setFailed(false);
    fetchByHoliday(key, foods.flatMap((f) => f.terms)).then(setDishes).catch(() => setFailed(true));
  }, [key, foods, attempt]);

  const matches = (d: CardDish, f: { terms: string[] }) => { const n = norm(d.name); return f.terms.some((x) => n.includes(x)); };
  const categories: Category[] = foods.map((f) => ({ key: f.key, label: f.label, photo: dishes?.find((d) => matches(d, f))?.photo ?? '' }));
  const picked = foods.find((f) => f.key === food) ?? null;
  const list = dishes?.filter((d) => !picked || matches(d, picked)) ?? null;
  const hero = useMemo(() => (dishes ? [...dishes].sort((a, b) => b.acorns - a.acorns).slice(0, HERO) : null), [dishes]);
  const sectionTitle = [t('tag.latest'), picked?.label].filter(Boolean).join(' · ');

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    bar.onY(e.nativeEvent.contentOffset.y);
    wash.onY(e.nativeEvent.contentOffset.y);
  };
  const onTab = (k: TabKey) => goTab(k);

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
      <ScreenWash wash={wash} local />
      <ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: TAB_BAR_H + space[24] }}>
        <CollectionTop
          dishes={failed ? [] : hero}
          width={width}
          onOpen={(d) => router.push(`/dish/${d.id}`)}
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/community'))}
          title={`#${enName.replace(/\s+/g, '')}`}
          titleLabel={`#${name}`}
          headline={t('community.festiveTitle')}
          headGap={space[16]}
          titleInk={titleInk?.strong}
          headInk={headInk?.strong}
        />

        {/* Group · Our area 1219:16754 — p18 top: the day's foods. */}
        <View style={styles.filters}>
          <CategoryRow items={categories} value={food} onChange={setFood} />
        </View>

        <View style={styles.section}>
          <Text variant="Overline" color="fg/muted" style={styles.px}>{sectionTitle}</Text>
          {failed && list == null ? <LoadError onRetry={() => { setDishes(null); setAttempt((n) => n + 1); }} /> : list == null ? <ActivityIndicator color={color('fg/muted')} style={styles.loading} /> : list.length ? (
            <FoodGrid dishes={list} width={width} onOpen={(d) => router.push(`/dish/${d.id}`)} />
          ) : (
            <EmptyState icon={TrendingUp} title={t('tag.emptyTitle', { tag: picked?.label ?? name })} body={t('tag.emptyBody')} />
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
