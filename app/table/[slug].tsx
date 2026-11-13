import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { BookOpen, ChevronLeft, ChevronRight, Plus, Users } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet } from '../../src/components/BottomSheet';
import { Button } from '../../src/components/Button';
import { EmptyState, Faces, FoodGrid } from '../../src/components/community/Parts';
import { GlassIconButton } from '../../src/components/GlassIconButton';
import { Icon } from '../../src/components/Icon';
import { Text } from '../../src/components/Text';
import { Toast } from '../../src/components/Toast';
import { fetchTable, fetchTableFaces, fetchTablePosts, postToTable, setTableJoined, type CardDish, type Table } from '../../src/services/community';
import { fetchProfileDishes, type DishSummary, type Person } from '../../src/services/foods';
import { getMyProfile } from '../../src/services/profile';
import { elevation, radius, space, useTheme, withAlpha } from '../../src/theme';

const HERO = 240;
const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n));

/** 4.8 Table · #SoloMeals (467:11159) · 4.8b Joined — cover hero · members + Join · rules · dishes (2 columns). */
export default function TableScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [table, setTable] = useState<Table | null | undefined>(undefined);
  const [posts, setPosts] = useState<CardDish[] | null>(null);
  const [faces, setFaces] = useState<Person[]>([]);
  const [rules, setRules] = useState(false);
  const [joinedToast, setJoinedToast] = useState(false);
  const [picker, setPicker] = useState<DishSummary[] | null>(null);
  const ink = color('static/ink');

  const load = useCallback(async () => {
    const tb = await fetchTable(slug).catch(() => null);
    setTable(tb);
    if (!tb) return;
    fetchTablePosts(tb.id).then(setPosts).catch(() => setPosts([]));
    fetchTableFaces(tb.id).then(setFaces).catch(() => undefined);
  }, [slug]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = async () => {
    if (!table) return;
    const on = !table.joined;
    setTable({ ...table, joined: on, members: table.members + (on ? 1 : -1) });
    try { await setTableJoined(table.id, on); setJoinedToast(on); } catch { setTable(table); }
  };

  const openPicker = async () => {
    const me = await getMyProfile().catch(() => null);
    if (!me) return;
    const mine = await fetchProfileDishes(me.id, 'dishes').catch(() => []);
    const already = new Set((posts ?? []).map((p) => p.id));
    setPicker(mine.filter((d) => !already.has(d.id)));
  };
  const post = async (d: DishSummary) => {
    if (!table) return;
    setPicker(null);
    try { await postToTable(table.id, d.id); load(); } catch { Alert.alert(t('settings.saveFailed')); }
  };

  if (table === undefined) return <View style={[styles.center, { backgroundColor: color('bg/default') }]}><ActivityIndicator color={color('fg/muted')} /></View>;
  if (table === null) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + space[8], backgroundColor: color('bg/default') }]}>
        <View style={styles.px}><GlassIconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} /></View>
        <EmptyState icon={Users} title={t('tables.missing')} />
      </View>
    );
  }

  const cover = table.coverUrl ?? posts?.[0]?.photo ?? null;
  return (
    <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={[styles.hero, { height: HERO, backgroundColor: color('bg/inverse') }]}>
          {cover ? <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
          <LinearGradient colors={[withAlpha(ink, 0.35), withAlpha(ink, 0.1), withAlpha(ink, 0.78)]} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
          <View style={styles.heroText}>
            <Text variant="Display/M" color="fg/on-photo" numberOfLines={1}>{table.name}</Text>
            {table.description ? <Text variant="Body/M" color="fg/on-photo-secondary">{table.description}</Text> : null}
          </View>
        </View>

        <View style={styles.members}>
          <Faces people={faces} size={28} />
          <View style={styles.flex}>
            <Text variant="Body/S Strong">{t('tables.members', { n: compact(table.members) })}</Text>
            <Text variant="Caption" color="fg/muted" numberOfLines={1}>{[t('tables.postsToday', { n: table.postsToday }), t('tables.hostedBy', { name: table.hostedBy ?? 'ongdalsaem' })].join(' · ')}</Text>
          </View>
          <Button label={t(table.joined ? 'tables.joined' : 'tables.join')} size="M" variant={table.joined ? 'Secondary' : 'Primary'} onPress={toggle} />
        </View>

        {table.rules ? (
          <Pressable accessibilityRole="button" onPress={() => setRules((v) => !v)} style={[styles.rules, { backgroundColor: color('bg/subtle') }]}>
            <Icon icon={BookOpen} size={20} />
            <Text variant="Body/S" color="fg/secondary" numberOfLines={rules ? undefined : 2} style={styles.flex}>{t('tables.rules', { rules: table.rules })}</Text>
            <Icon icon={ChevronRight} size={18} />
          </Pressable>
        ) : null}

        <View style={styles.gridTop} />
        {posts == null ? <ActivityIndicator color={color('fg/muted')} style={styles.loading} /> : posts.length ? (
          <FoodGrid dishes={posts} width={width} byline={(d) => [table.name.replace('#', ''), d.meals[0] ? t(`share.meals.${d.meals[0]}`, { defaultValue: d.meals[0] }) : null].filter(Boolean).join(' · ')} onOpen={(d) => router.push(`/dish/${d.id}`)} />
        ) : (
          <EmptyState icon={Users} title={t('tables.noPosts')} body={t(table.joined ? 'tables.noPostsJoined' : 'tables.noPostsBody')} />
        )}
      </ScrollView>

      <View style={[styles.back, { top: insets.top + space[6] }]}>
        <GlassIconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
      </View>
      {table.joined ? (
        // 4.8b — "Post to table" (CreateFAB · kick 56).
        <Pressable accessibilityRole="button" accessibilityLabel={t('tables.postHere')} onPress={openPicker} style={[styles.fab, elevation['Elevation/3 Float'], { bottom: Math.max(insets.bottom, space[20]) + space[12], backgroundColor: color('bg/kick'), borderColor: color('border/default') }]}>
          <Icon icon={Plus} size={24} color="fg/on-primary" />
        </Pressable>
      ) : null}
      <Toast visible={joinedToast} message={t('tables.joinedToast', { name: table.name })} action={t('dish.undo')} onAction={() => { setJoinedToast(false); toggle(); }} onHide={() => setJoinedToast(false)} bottom={Math.max(insets.bottom, space[20]) + 56 + space[24]} />
      <BottomSheet visible={picker != null} onClose={() => setPicker(null)} title={t('tables.pickDish')} maxHeightRatio={0.7}>
        {picker?.length ? picker.map((d) => (
          <Pressable key={d.id} accessibilityRole="button" onPress={() => post(d)} style={styles.pickRow}>
            <Image source={{ uri: d.photo }} style={[styles.pickThumb, { backgroundColor: color('bg/muted') }]} contentFit="cover" />
            <Text variant="Body/M" style={styles.flex} numberOfLines={1}>{d.name}</Text>
          </Pressable>
        )) : <Text variant="Body/S" color="fg/muted">{t('tables.noDishesToPost')}</Text>}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  px: { paddingHorizontal: space[20] },
  hero: { justifyContent: 'space-between' },
  heroText: { position: 'absolute', left: space[20], right: space[20], bottom: space[20], gap: space[6] },
  back: { position: 'absolute', left: space[20] },
  fab: { position: 'absolute', right: space[20], width: 56, height: 56, borderRadius: radius.full, borderWidth: 0.22, alignItems: 'center', justifyContent: 'center' },
  members: { flexDirection: 'row', alignItems: 'center', gap: space[12], paddingHorizontal: space[20], paddingTop: space[16] },
  rules: { flexDirection: 'row', alignItems: 'center', gap: space[10], marginHorizontal: space[20], marginTop: space[16], paddingHorizontal: space[14], paddingVertical: space[12], borderRadius: radius.lg },
  gridTop: { height: space[20] },
  loading: { marginTop: space[40] },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: space[12], paddingVertical: space[6] },
  pickThumb: { width: 48, height: 48, borderRadius: radius.md },
});
