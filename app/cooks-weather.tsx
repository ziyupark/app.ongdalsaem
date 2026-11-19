import { router } from 'expo-router';
import { Users } from '../src/components/icons/ongdal';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CookRow, EmptyState, ListCard } from '../src/components/community/Parts';
import { Text } from '../src/components/Text';
import { TopBar } from '../src/components/TopBar';
import { displayTemp } from '../src/lib/prefs';
import { useHere } from '../src/lib/useHere';
import { follow } from '../src/services/activity';
import { fetchCooksInWeather, type CookCard } from '../src/services/community';
import { space, useTheme } from '../src/theme';

/** 4.6 Cooks in your weather (352:8601) — closest weather first, then acorns. Follow / Following toggles in place. */
export default function CooksInWeather() {
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { here } = useHere();
  const [cooks, setCooks] = useState<CookCard[] | null>(null);
  const f = here.forecast;

  useEffect(() => {
    if (here.status === 'loading') return;
    fetchCooksInWeather(f?.mood ?? null, f?.tempC ?? null, 30).then(setCooks).catch(() => setCooks([]));
  }, [here.status, f?.mood, f?.tempC]);

  const toggle = async (c: CookCard) => {
    const on = !c.following;
    setCooks((l) => l?.map((x) => (x.id === c.id ? { ...x, following: on } : x)) ?? l);
    try { await follow(c.id, on); } catch { setCooks((l) => l?.map((x) => (x.id === c.id ? c : x)) ?? l); }
  };

  const place = here.place?.district ?? here.place?.city ?? '';
  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: color('bg/default') }]}>
      <TopBar title={t('cooksWeather.title')} onBack={() => router.back()} backLabel={t('common.back')} />
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + space[24] }]}>
        <Text variant="Body/S" color="fg/secondary">
          {f ? t('cooksWeather.intro', { weather: t(`weather.${f.mood}`).toLowerCase(), temp: displayTemp(f.tempC), place }) : t('cooksWeather.introNoWeather')}
        </Text>
        {cooks == null ? <ActivityIndicator color={color('fg/muted')} style={styles.loading} /> : cooks.length ? (
          <ListCard>
            {cooks.map((c, i) => <CookRow key={c.id} cook={c} last={i === cooks.length - 1} onPress={() => router.push(`/cook/${c.id}`)} onFollow={() => toggle(c)} />)}
          </ListCard>
        ) : (
          <EmptyState icon={Users} title={t('cooksWeather.emptyTitle')} body={t('cooksWeather.emptyBody')} />
        )}
        {cooks?.length ? <Text variant="Caption" color="fg/muted">{t('cooksWeather.footnote')}</Text> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { paddingHorizontal: space[20], paddingTop: space[12], gap: space[16] },
  loading: { marginTop: space[40] },
});
