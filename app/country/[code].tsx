import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Clock, MapPin, Utensils } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip } from '../../src/components/Chip';
import { countryName, EmptyState, FoodGrid, Tabs, useByline } from '../../src/components/community/Parts';
import { Icon } from '../../src/components/Icon';
import { Text } from '../../src/components/Text';
import { TopBar } from '../../src/components/TopBar';
import { displayTemp } from '../../src/lib/prefs';
import { fetchByCountry, topTags, type CardDish } from '../../src/services/community';
import { fetchCurrentWeather, type CurrentWeather } from '../../src/services/weather';
import { gradients, radius, space, useTheme, WEATHER_ICON } from '../../src/theme';

type Sort = 'popular' | 'latest' | 'weather';

/** 4.3 Country · Japan (182:5165) — hero · local time / weather / on tables · signature tags · Popular / Latest / Same weather. */
export default function CountryScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const byline = useByline();
  const cc = String(code ?? '').toUpperCase();
  const name = countryName(cc, i18n.language);
  const [sort, setSort] = useState<Sort>('popular');
  const [all, setAll] = useState<CardDish[] | null>(null);
  const [list, setList] = useState<CardDish[] | null>(null);
  const [now, setNow] = useState<CurrentWeather | null>(null);
  const [clock, setClock] = useState<string | null>(null);

  useEffect(() => { fetchByCountry(cc, 'popular').then(setAll).catch(() => setAll([])); }, [cc]);

  // Weather + local time for the city that shares the most here.
  const city = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of all ?? []) if (d.city) m.set(d.city, (m.get(d.city) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }, [all]);
  useEffect(() => {
    if (!city) return;
    fetchCurrentWeather({ city }).then((w) => {
      setNow(w);
      const tz = w?.timezoneOffset;
      if (tz != null) {
        const d = new Date(Date.now() + (tz + new Date().getTimezoneOffset() * 60) * 1000);
        setClock(d.toLocaleTimeString(i18n.language, { hour: 'numeric', minute: '2-digit' }));
      }
    }).catch(() => undefined);
  }, [city, i18n.language]);

  useEffect(() => {
    if (sort === 'popular') return setList(all);
    setList(null);
    fetchByCountry(cc, 'latest', sort === 'weather' ? now?.mood ?? null : null).then(setList).catch(() => setList([]));
  }, [sort, cc, all, now?.mood]);

  const meals = all ? topTags(all, 'meals', 1) : [];
  const signature = all ? topTags(all, 'moods', 5) : [];
  const ember = gradients['Gradient/Ember'];

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: color('bg/default') }]}>
      <TopBar title={name} onBack={() => router.back()} backLabel={t('common.back')} />
      <ScrollView contentContainerStyle={{ paddingTop: space[12], gap: space[16], paddingBottom: insets.bottom + space[24] }}>
        <View style={styles.px}>
          <View style={styles.hero}>
            <LinearGradient colors={[ember[0].color, ember[1].color]} style={StyleSheet.absoluteFill} />
            <Icon icon={MapPin} size={14} color="fg/on-photo" />
            <Text variant="Display/M" color="fg/on-photo">{now ? t(`country.headline.${now.mood}`, { defaultValue: t('country.headlineFallback', { name }) }) : t('country.headlineFallback', { name })}</Text>
            <Text variant="Body/S" color="fg/on-photo">
              {[now ? `${displayTemp(now.tempC)}° ${t(`weather.${now.mood}`).toLowerCase()}` : null, t('country.dishes', { count: all?.length ?? 0 })].filter(Boolean).join(' · ')}
            </Text>
          </View>
        </View>

        <View style={styles.tiles}>
          <Tile icon={Clock} label={t('country.now', { city: city ?? name })} value={clock ?? '—'} />
          <Tile icon={now ? WEATHER_ICON[now.mood] : WEATHER_ICON.overcast} label={t('country.weather')} value={now ? `${displayTemp(now.tempC)}° ${t(`weather.${now.mood}`).toLowerCase()}` : '—'} />
          <Tile icon={Utensils} label={t('country.onTables')} value={meals[0] ? t(`share.meals.${meals[0]}`, { defaultValue: meals[0] }) : '—'} />
        </View>

        {signature.length ? (
          <View style={styles.section}>
            <Text variant="Overline" color="fg/muted" style={styles.px}>{t('country.signature')}</Text>
            <View style={styles.wrap}>
              {signature.map((s) => <Chip key={s} label={`#${i18n.exists(`share.moods.${s}`) ? t(`share.moods.${s}`) : s}`} onPress={() => router.push(`/tag/${s}`)} />)}
            </View>
          </View>
        ) : null}

        <Tabs
          style={styles.tabs}
          value={sort}
          onChange={setSort}
          items={[{ key: 'popular', label: t('tag.popular') }, { key: 'latest', label: t('tag.latest') }, { key: 'weather', label: t('community.sameWeather') }]}
        />
        {list == null ? <ActivityIndicator color={color('fg/muted')} style={styles.loading} /> : list.length ? (
          <FoodGrid dishes={list} width={width} byline={(d) => byline(d, true)} onOpen={(d) => router.push(`/dish/${d.id}`)} />
        ) : (
          <EmptyState icon={MapPin} title={t('country.emptyTitle', { name })} body={t('tag.emptyBody')} />
        )}
      </ScrollView>
    </View>
  );
}

function Tile({ icon, label, value }: { icon: Parameters<typeof Icon>[0]['icon']; label: string; value: string }) {
  const { color } = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: color('bg/subtle') }]}>
      <View style={styles.tileHead}>
        <Icon icon={icon} size={14} />
        <Text variant="Caption" color="fg/muted" numberOfLines={1} style={styles.flex}>{label}</Text>
      </View>
      <Text variant="Body/M Strong" numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  px: { paddingHorizontal: space[20] },
  hero: { borderRadius: radius.xl, overflow: 'hidden', padding: space[20], gap: space[8] },
  tiles: { flexDirection: 'row', gap: space[8], paddingHorizontal: space[20] },
  tile: { flex: 1, borderRadius: radius.lg, padding: space[12], gap: space[4] },
  tileHead: { flexDirection: 'row', alignItems: 'center', gap: space[6] },
  section: { gap: space[8] },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space[6], paddingHorizontal: space[20] },
  tabs: {},
  gridTop: { height: space[16] },
  loading: { marginTop: space[40] },
});
