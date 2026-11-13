import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { Users } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, ListCard, ListRow, SearchField } from '../src/components/community/Parts';
import { Button } from '../src/components/Button';
import { TabBar } from '../src/components/TabBar';
import { Text } from '../src/components/Text';
import { TopBar } from '../src/components/TopBar';
import { fetchMyTables, fetchTables, setTableJoined, type Table } from '../src/services/community';
import { radius, space, useTheme } from '../src/theme';

const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 1 : 1).replace(/\.0$/, '')}k` : String(n));

/** 4.7 Tables · Browse (467:9855) · 4.4c No tables yet — search · Your tables · Popular tables with Join / Joined. */
export default function Tables() {
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [term, setTerm] = useState('');
  const [focused, setFocused] = useState(false);
  const [mine, setMine] = useState<Table[]>([]);
  const [popular, setPopular] = useState<Table[] | null>(null);

  useFocusEffect(useCallback(() => { fetchMyTables().then(setMine).catch(() => undefined); }, []));
  useEffect(() => {
    const h = setTimeout(() => fetchTables(term).then(setPopular).catch(() => setPopular([])), term ? 250 : 0);
    return () => clearTimeout(h);
  }, [term]);

  const toggle = async (tb: Table) => {
    const on = !tb.joined;
    const patch = (l: Table[] | null) => l?.map((x) => (x.id === tb.id ? { ...x, joined: on, members: x.members + (on ? 1 : -1) } : x)) ?? l;
    setPopular(patch);
    setMine((l) => (on ? [{ ...tb, joined: true }, ...l] : l.filter((x) => x.id !== tb.id)));
    try { await setTableJoined(tb.id, on); } catch { setPopular((l) => l?.map((x) => (x.id === tb.id ? tb : x)) ?? l); fetchMyTables().then(setMine).catch(() => undefined); }
  };

  const cover = (tb: Table, size: number, r: number) => (
    <View style={[styles.cover, { width: size, height: size, borderRadius: r, backgroundColor: color('bg/muted') }]}>
      {tb.coverUrl ? <Image source={{ uri: tb.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Text variant="Title/S" color="fg/secondary">#</Text>}
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: color('bg/default') }]}>
      <TopBar title={t('tables.title')} onBack={() => router.back()} backLabel={t('common.back')} />
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: 120 }]} keyboardShouldPersistTaps="handled">
        <Text variant="Body/S" color="fg/secondary">{t('tables.intro')}</Text>
        <SearchField value={term} onChangeText={setTerm} placeholder={t('tables.search')} focused={focused} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />

        {mine.length && !term ? (
          <View style={styles.group}>
            <Text variant="Overline" color="fg/muted">{t('tables.yours', { n: mine.length })}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mineRow}>
              {mine.map((tb) => (
                <Pressable key={tb.id} accessibilityRole="button" onPress={() => router.push(`/table/${tb.slug}`)} style={[styles.mine, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
                  {cover(tb, 40, 12)}
                  <View style={[styles.flex, styles.mineText]}>
                    <Text variant="Body/S Strong" numberOfLines={1}>{tb.name}</Text>
                    <Text variant="Caption" color={tb.postsToday ? 'fg/accent' : 'fg/muted'}>{t('tables.newToday', { n: tb.postsToday })}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.group}>
        <Text variant="Overline" color="fg/muted">{term ? t('tables.results') : t('tables.popular')}</Text>
        {popular == null ? <ActivityIndicator color={color('fg/muted')} style={styles.loading} /> : popular.length ? (
          <ListCard>
            {popular.map((tb, i) => (
              <ListRow
                key={tb.id}
                last={i === popular.length - 1}
                leading={cover(tb, 56, 16)}
                title={
                  <View style={styles.rowText}>
                    <Text variant="Title/S" numberOfLines={1}>{tb.name}</Text>
                    {tb.description ? <Text variant="Caption" color="fg/secondary" numberOfLines={1}>{tb.description}</Text> : null}
                    <Text variant="Caption" color="fg/muted" numberOfLines={1}>{t('tables.stats', { members: compact(tb.members), posts: tb.postsToday })}</Text>
                  </View>
                }
                onPress={() => router.push(`/table/${tb.slug}`)}
                trailing={
                  <Button label={t(tb.joined ? 'tables.joined' : 'tables.join')} size="S" variant={tb.joined ? 'Secondary' : 'Outline'} onPress={() => toggle(tb)} />
                }
              />
            ))}
          </ListCard>
        ) : (
          // 4.4c No tables yet
          <EmptyState icon={Users} title={t(term ? 'tables.noMatch' : 'tables.emptyTitle')} body={t('tables.emptyBody')} />
        )}
        </View>
      </ScrollView>
      <TabBar active="community" onTab={(k) => router.replace(k === 'home' ? '/home' : k === 'timer' ? '/timer' : k === 'profile' ? '/profile' : '/community')} onCreate={() => router.push('/share/pick')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  body: { paddingHorizontal: space[20], paddingTop: space[12], gap: space[24] },
  group: { gap: space[10] },
  mineText: { gap: space[2] },
  rowText: { gap: space[2] },
  mineRow: { gap: space[10] },
  mine: { width: 170, flexDirection: 'row', alignItems: 'center', gap: space[10], paddingVertical: space[10], paddingLeft: space[10], paddingRight: space[14], borderRadius: radius.lg, borderWidth: 1 },
  cover: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  loading: { marginTop: space[40] },
});
