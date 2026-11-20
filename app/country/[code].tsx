import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { MapPin } from '../../src/components/icons/ongdal';
import { useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, Share, StyleSheet, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { CategoryRow, CollectionTop, InfoRow, MealSheet, tagCategories } from '../../src/components/community/CollectionParts';
import { countryName, EmptyState, FoodGrid } from '../../src/components/community/Parts';
import { ScreenWash, useScreenInk } from '../../src/components/ScreenHeader';
import { goTab, TabBar, useTabBarScroll, type TabKey } from '../../src/components/TabBar';
import { Text } from '../../src/components/Text';
import { UnderlineTabs } from '../../src/components/UnderlineTabs';
import { displayTemp } from '../../src/lib/prefs';
import { useWashScroll } from '../../src/lib/useWashScroll';
import { fetchByCountry, topTags, type CardDish } from '../../src/services/community';
import { fetchCurrentWeather, type CurrentWeather } from '../../src/services/weather';
import { space, useTheme, WEATHER_ICON } from '../../src/theme';

/** Expanded TabBar height (12:182) — same bottom room as 4.1. */
const TAB_BAR_H = 110;
const ALL = '*';

/**
 * 4.3 Country · Japan (v2 826:15002) — mood wash · TopBar Overlay (back · share) → #Country (Display/XL, always English) →
 * headline (Display/M) over a carousel of 400-high photo cards → All + top 3 cities → info pill (city weather · count) +
 * meal filter → round categories (signature tags) → grid, same-weather dishes first → TabBar.
 */
export default function CountryScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bar = useTabBarScroll();
  const wash = useWashScroll();
  const titleInk = useScreenInk(0.36);
  const headInk = useScreenInk(0.5);
  const cc = String(code ?? '').toUpperCase();
  const name = countryName(cc, i18n.language);
  const [all, setAll] = useState<CardDish[] | null>(null);
  const [city, setCity] = useState<string>(ALL);
  const [category, setCategory] = useState<string | null>(null);
  const [meal, setMeal] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [weather, setWeather] = useState<Record<string, CurrentWeather | null>>({});
  const tagLabel = (k: string) => (i18n.exists(`share.moods.${k}`) ? t(`share.moods.${k}`) : k);

  useEffect(() => { fetchByCountry(cc, 'popular').then(setAll).catch(() => setAll([])); }, [cc]);

  // Tabs = All + the three cities that share the most here.
  const cities = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of all ?? []) if (d.city) m.set(d.city, (m.get(d.city) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c);
  }, [all]);
  // Weather for the chosen city (All → the top city), read once per city.
  const place = city === ALL ? cities[0] ?? null : city;
  useEffect(() => {
    if (!place || place in weather) return;
    fetchCurrentWeather({ city: place }).then((w) => setWeather((m) => ({ ...m, [place]: w }))).catch(() => setWeather((m) => ({ ...m, [place]: null })));
  }, [place, weather]);
  const now = place ? weather[place] ?? null : null;

  const scope = useMemo(() => (all ? (city === ALL ? all : all.filter((d) => d.city === city)) : null), [all, city]);
  const categories = useMemo(() => tagCategories(scope ?? [], tagLabel), [scope, i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps
  const meals = scope ? topTags(scope, 'meals') : [];
  // Same weather as the city now goes first (stable: popularity order kept inside each group).
  const list = scope
    ? scope
        .filter((d) => (!category || d.moods.includes(category)) && (!meal || d.meals.includes(meal)))
        .map((d, i) => ({ d, i, same: now != null && d.mood === now.mood }))
        .sort((a, b) => Number(b.same) - Number(a.same) || a.i - b.i)
        .map((x) => x.d)
    : null;

  const tabs = [{ key: ALL, label: t('country.all') }, ...cities.map((c) => ({ key: c, label: c }))];
  const sectionTitle = [city === ALL ? t('country.all') : city, category ? tagLabel(category) : null].filter(Boolean).join(' · ');
  const weatherText = now && place ? { city: place, weather: t(`weather.${now.mood}`), temp: displayTemp(now.tempC) } : null;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    bar.onY(e.nativeEvent.contentOffset.y);
    wash.onY(e.nativeEvent.contentOffset.y);
  };
  const shareCountry = () => {
    const link = Linking.createURL(`/country/${cc}`);
    Share.share({ message: `#${name} — ${link}`, url: link }).catch(() => undefined);
  };
  const onTab = (k: TabKey) => goTab(k);
  const pickCity = (c: string) => { setCity(c); setCategory(null); setMeal(null); };

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
      <ScreenWash wash={wash} local />
      <ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: TAB_BAR_H + space[24] }}>
        <CollectionTop
          dishes={all}
          width={width}
          onOpen={(d) => router.push(`/dish/${d.id}`)}
          onBack={() => router.back()}
          onShare={shareCountry}
          title={`#${countryName(cc, 'en')}`}
          titleLabel={`#${name}`}
          headline={now ? t(`country.headline.${now.mood}`, { defaultValue: t('country.headlineFallback', { name }) }) : t('country.headlineFallback', { name })}
          titleInk={titleInk?.strong}
          headInk={headInk?.strong}
        />

        {/* Block · Tabs — p12 top: All + top 3 cities. */}
        <View style={styles.tabs}>
          <UnderlineTabs contentStyle={styles.tabRow} value={city} onChange={pickCity} items={tabs} />
        </View>

        {/* Group — p18 top · gap 18: info row → categories. */}
        <View style={styles.filters}>
        <InfoRow
          icon={now ? WEATHER_ICON[now.mood] : undefined}
          weather={weatherText ? t('country.cityWeather', weatherText) : null}
          count={t('country.dishes', { count: scope?.length ?? 0 })}
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
            <EmptyState icon={MapPin} title={t('country.emptyTitle', { name })} body={t('tag.emptyBody')} />
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
