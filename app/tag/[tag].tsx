import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { TrendingUp } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip } from '../../src/components/Chip';
import { countryName, EmptyState, FoodGrid, Tabs, useByline } from '../../src/components/community/Parts';
import { Icon } from '../../src/components/Icon';
import { Text } from '../../src/components/Text';
import { TopBar } from '../../src/components/TopBar';
import { useHere } from '../../src/lib/useHere';
import { countries, fetchByTag, type CardDish } from '../../src/services/community';
import { gradients, radius, space, useTheme, type WeatherMood } from '../../src/theme';

type Sort = 'popular' | 'latest' | 'near';

/** 4.2 Tag · #Comfort (182:5020) — accent hero (headline · count · weather it's shared in) → countries → Popular / Latest / Near me grid. */
export default function TagScreen() {
  const { tag } = useLocalSearchParams<{ tag: string }>();
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const byline = useByline();
  const { here } = useHere();
  const [sort, setSort] = useState<Sort>('popular');
  const [all, setAll] = useState<CardDish[] | null>(null);
  const [list, setList] = useState<CardDish[] | null>(null);
  const key = String(tag ?? '').toLowerCase();
  const label = i18n.exists(`share.moods.${key}`) ? t(`share.moods.${key}`) : key;

  useEffect(() => { fetchByTag(key, 'popular').then(setAll).catch(() => setAll([])); }, [key]);
  useEffect(() => {
    if (sort === 'popular') return setList(all);
    setList(null);
    const city = sort === 'near' ? here.place?.city ?? null : null;
    if (sort === 'near' && !city) return setList([]);
    fetchByTag(key, 'latest', city).then(setList).catch(() => setList([]));
  }, [sort, key, all, here.place?.city]);

  const topWeather = useMemo<WeatherMood | null>(() => {
    const m = new Map<WeatherMood, number>();
    for (const d of all ?? []) if (d.mood) m.set(d.mood, (m.get(d.mood) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }, [all]);
  const where = all ? countries(all) : [];
  const ember = gradients['Gradient/Ember'];

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: color('bg/default') }]}>
      <TopBar title={`#${label}`} onBack={() => router.back()} backLabel={t('common.back')} />
      <ScrollView contentContainerStyle={{ paddingTop: space[12], gap: space[16], paddingBottom: insets.bottom + space[24] }}>
        <View style={styles.px}>
          <View style={styles.hero}>
            <LinearGradient colors={[ember[0].color, ember[1].color]} style={StyleSheet.absoluteFill} />
            <Icon icon={TrendingUp} size={14} color="fg/on-photo" />
            <Text variant="Display/M" color="fg/on-photo">{i18n.exists(`tag.headlines.${key}`) ? t(`tag.headlines.${key}`) : `#${label}`}</Text>
            <Text variant="Body/S" color="fg/on-photo">
              {[t('tag.count', { count: all?.length ?? 0 }), topWeather ? t('tag.mostIn', { weather: t(`weather.${topWeather}`).toLowerCase() }) : null].filter(Boolean).join(' · ')}
            </Text>
          </View>
        </View>

        {where.length ? (
          <View style={styles.section}>
            <Text variant="Overline" color="fg/muted" style={styles.px}>{t('tag.cookedIn', { count: where.length })}</Text>
            <View style={styles.wrap}>
              {where.slice(0, 5).map((c) => <Chip key={c} label={`#${countryName(c, i18n.language)}`} onPress={() => router.push(`/country/${c}`)} />)}
              {where.length > 5 ? <Chip label={`+${where.length - 5}`} static /> : null}
            </View>
          </View>
        ) : null}

        <Tabs
          style={styles.tabs}
          value={sort}
          onChange={setSort}
          items={[{ key: 'popular', label: t('tag.popular') }, { key: 'latest', label: t('tag.latest') }, { key: 'near', label: t('tag.nearMe') }]}
        />
        {list == null ? <ActivityIndicator color={color('fg/muted')} style={styles.loading} /> : list.length ? (
          <FoodGrid dishes={list} width={width} byline={(d) => byline(d)} onOpen={(d) => router.push(`/dish/${d.id}`)} />
        ) : (
          <EmptyState icon={TrendingUp} title={t('tag.emptyTitle', { tag: label })} body={t('tag.emptyBody')} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  px: { paddingHorizontal: space[20] },
  hero: { borderRadius: radius.xl, overflow: 'hidden', padding: space[20], gap: space[8] },
  section: { gap: space[8] },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space[6], paddingHorizontal: space[20] },
  tabs: {},
  gridTop: { height: space[16] },
  loading: { marginTop: space[40] },
});
