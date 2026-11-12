import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { ChevronLeft, EllipsisVertical, Plus, Search } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { Chip } from '../src/components/Chip';
import { SearchField } from '../src/components/community/Parts';
import { ReportSheet } from '../src/components/dish/ReportSheet';
import { Icon } from '../src/components/Icon';
import { MessageCircle } from '../src/components/icons/custom';
import { FAB_SIZE, TabBar, useTabBarScroll, type TabKey } from '../src/components/TabBar';
import { Text } from '../src/components/Text';
import { useTemp } from '../src/lib/prefs';
import { timeAgo } from '../src/lib/time';
import { useHere } from '../src/lib/useHere';
import {
  deleteQuestion, fetchQuestionsPage, QUESTION_CATEGORIES, reportQuestion,
  type Question, type QuestionCategory, type QuestionCursor,
} from '../src/services/community';
import { blockUser } from '../src/services/moderation';
import { radius, space, useTheme, WEATHER_ICON } from '../src/theme';

const PAGE = 20;
/** Bottom of the floating "+ Ask" (Kick M): 16 above the 110 tab-bar area. */
const TAB_AREA = 110;

/** "Title\nrest" → title (first line) · preview (the rest on one line). */
const split = (body: string) => {
  const [first, ...rest] = body.trim().split(/\n+/);
  return { title: first, preview: rest.join(' ').trim() };
};

/**
 * 4.5 Questions · List (Figma 778:11783) · 4.5b Empty (778:11961).
 * Top bar (back · Title/L · search) → category chips + 1px border/default → rows (px 20, 1px border/default between)
 * → floating "+ Ask" (Kick M) above the TabBar. Your area first, then wider ranges; 20 at a time.
 */
export default function Questions() {
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const temp = useTemp();
  const { here } = useHere();
  const bar = useTabBarScroll();
  const [category, setCategory] = useState<QuestionCategory | null>(null);
  const [searching, setSearching] = useState(false);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Question[] | null>(null);
  const [next, setNext] = useState<QuestionCursor | null>(null);
  const [more, setMore] = useState(false);
  const [reporting, setReporting] = useState<Question | null>(null);
  const run = useRef(0);

  const at = { geohash: here.cell, district: here.place?.district ?? null, city: here.place?.city ?? here.forecast?.city ?? null };
  const ready = here.status !== 'loading';

  const load = useCallback(async () => {
    if (!ready) return;
    const id = ++run.current;
    setItems(null);
    setNext(null);
    try {
      const page = await fetchQuestionsPage(at, { category, query }, null, PAGE);
      if (id !== run.current) return;
      setItems(page.items);
      setNext(page.next);
    } catch {
      if (id === run.current) setItems([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, at.geohash, at.district, at.city, category, query]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const loadMore = async () => {
    if (!next || more || !items) return;
    const id = run.current;
    setMore(true);
    try {
      const page = await fetchQuestionsPage(at, { category, query }, next, PAGE);
      if (id !== run.current) return;
      setItems((l) => [...(l ?? []), ...page.items]);
      setNext(page.next);
    } catch {
      // keep what we have; the next scroll to the end tries again
    } finally {
      setMore(false);
    }
  };

  const onTab = (k: TabKey) => {
    if (k === 'home') router.replace('/home');
    if (k === 'community') router.replace('/community');
    if (k === 'timer') router.replace('/timer');
    if (k === 'profile') router.replace('/profile');
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => bar.onY(e.nativeEvent.contentOffset.y);

  const menu = (q: Question) => {
    const cancel = { text: t('common.cancel'), style: 'cancel' as const };
    if (q.mine) {
      Alert.alert(t('ask.questionTitle'), undefined, [
        cancel,
        { text: t('post.edit'), onPress: () => router.push({ pathname: '/ask', params: { id: q.id } }) },
        {
          text: t('dish.delete'), style: 'destructive', onPress: async () => {
            try { await deleteQuestion(q.id); setItems((l) => (l ?? []).filter((x) => x.id !== q.id)); } catch { Alert.alert(t('settings.saveFailed')); }
          },
        },
      ]);
      return;
    }
    const name = q.author.handle ?? q.author.name;
    Alert.alert(name, undefined, [
      cancel,
      { text: t('report.send'), onPress: () => setReporting(q) },
      {
        text: t('report.block'), style: 'destructive', onPress: () => Alert.alert(t('report.blockTitle', { name }), t('report.blockBody'), [
          cancel,
          {
            text: t('report.block'), style: 'destructive', onPress: async () => {
              try { await blockUser(q.author.id); setItems((l) => (l ?? []).filter((x) => x.author.id !== q.author.id)); } catch { Alert.alert(t('report.failed')); }
            },
          },
        ]),
      },
    ]);
  };

  const row = ({ item: q }: { item: Question }) => {
    const { title, preview } = split(q.body);
    const meta = [q.range ?? q.place, timeAgo(q.createdAt, t), t('questions.answers', { count: q.answers })].filter(Boolean).join(' · ');
    return (
      <Pressable accessibilityRole="button" onPress={() => router.push(`/question/${q.id}`)} style={styles.row}>
        <View style={styles.top}>
          <View style={[styles.tag, { backgroundColor: color('bg/subtle') }]}>
            <Text variant="Caption" color="fg/secondary">{t(`ask.categories.${q.category}`)}</Text>
          </View>
          <View style={styles.flex} />
          <Pressable accessibilityRole="button" accessibilityLabel={t('home.more')} hitSlop={space[10]} onPress={() => menu(q)}>
            <Icon icon={EllipsisVertical} size={20} color="fg/muted" />
          </Pressable>
        </View>
        <View style={styles.body}>
          <View style={[styles.flex, styles.text]}>
            <Text variant="Title/S" numberOfLines={2}>{title}</Text>
            {preview ? <Text variant="Body/S" color="fg/secondary" numberOfLines={1}>{preview}</Text> : null}
          </View>
          {q.imageUrl ? <Image source={{ uri: q.imageUrl }} style={styles.photo} contentFit="cover" /> : null}
        </View>
        <View style={styles.meta}>
          <Text variant="Caption" color="fg/muted" numberOfLines={1} style={styles.shrink}>{q.mood ? `${meta} ·` : meta}</Text>
          {q.mood ? (
            <>
              <Icon icon={WEATHER_ICON[q.mood]} size={14} color="fg/muted" />
              <Text variant="Caption" color="fg/muted">{[t(`weather.${q.mood}`), q.tempC != null ? `${temp(q.tempC)}°` : null].filter(Boolean).join(' ')}</Text>
            </>
          ) : null}
        </View>
      </Pressable>
    );
  };

  const empty = items != null && items.length === 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: color('bg/default') }]}>
      {/* TopBar · Inline — back 40 · Title/L · search 40. */}
      <View style={styles.bar}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={space[4]} onPress={() => router.back()} style={styles.btn}>
          <Icon icon={ChevronLeft} size={22} />
        </Pressable>
        <Text variant="Title/L" numberOfLines={1}>{t('community.area.questionsTitle')}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('questions.search')}
          accessibilityState={{ selected: searching }}
          hitSlop={space[4]}
          onPress={() => {
            if (searching && query) setQuery('');
            setDraft('');
            setSearching((s) => !s);
          }}
          style={styles.btn}
        >
          <Icon icon={Search} size={22} />
        </Pressable>
      </View>
      {searching ? (
        <View style={styles.search}>
          <SearchField
            value={draft}
            onChangeText={(v) => { setDraft(v); if (!v) setQuery(''); }}
            onSubmit={() => setQuery(draft.trim())}
            placeholder={t('questions.search')}
            autoFocus
          />
        </View>
      ) : null}

      {/* Category chips — p 8 20 12 · gap 8, then 1px border/default. */}
      <View style={[styles.chipsBlock, { borderBottomColor: color('border/default') }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label={t('community.all')} selected={!category} onPress={() => setCategory(null)} />
          {QUESTION_CATEGORIES.map((c) => <Chip key={c} label={t(`ask.categories.${c}`)} selected={category === c} onPress={() => setCategory(c)} />)}
        </ScrollView>
      </View>

      {items == null ? (
        <ActivityIndicator color={color('fg/muted')} style={styles.loading} />
      ) : empty ? (
        // 4.5b — orb 64 bg/subtle · icon 28 fg/muted → 16 → Title/M → 6 → Body/S → 24 → Kick M.
        <View style={[styles.empty, { paddingBottom: TAB_AREA }]}>
          <View style={[styles.orb, { backgroundColor: color('bg/subtle') }]}>
            <Icon icon={MessageCircle} size={28} color="fg/muted" />
          </View>
          <Text variant="Title/M" style={[styles.center, styles.emptyTitle]}>{t('questions.emptyTitle')}</Text>
          <Text variant="Body/S" color="fg/secondary" style={[styles.center, styles.emptyBody]}>{t('questions.emptyBody')}</Text>
          <Button label={t('community.area.ask')} variant="Kick" size="M" icon={Plus} onPress={() => router.push('/ask')} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(q) => q.id}
          renderItem={row}
          ItemSeparatorComponent={() => <View style={[styles.divider, { backgroundColor: color('border/default') }]} />}
          contentContainerStyle={[styles.list, { paddingBottom: TAB_AREA + 46 + space[32] }]}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          onScroll={onScroll}
          scrollEventThrottle={16}
          ListFooterComponent={more ? <ActivityIndicator color={color('fg/muted')} style={styles.more} /> : undefined}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {items?.length ? (
        <View style={[styles.fab, { bottom: TAB_AREA + space[16] }]}>
          <Button label={t('community.area.ask')} variant="Kick" size="M" icon={Plus} onPress={() => router.push('/ask')} />
        </View>
      ) : null}
      <TabBar active="community" progress={bar.progress} onTab={onTab} onCreate={() => router.push('/share/pick')} />
      <ReportSheet
        visible={!!reporting}
        title={t('questions.reportTitle')}
        ownerId={reporting?.author.id ?? ''}
        ownerName={reporting?.author.handle ?? reporting?.author.name ?? ''}
        onClose={() => setReporting(null)}
        onBlocked={() => { const who = reporting?.author.id; setReporting(null); setItems((l) => (l ?? []).filter((x) => x.author.id !== who)); }}
        onReport={(reason) => reportQuestion(reporting!.id, reporting!.author.id, reason)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  shrink: { flexShrink: 1 },
  center: { textAlign: 'center' },
  bar: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space[12] },
  btn: { width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  search: { paddingHorizontal: space[20], paddingBottom: space[8] },
  chipsBlock: { borderBottomWidth: 1 },
  chips: { flexDirection: 'row', gap: space[8], paddingHorizontal: space[20], paddingTop: space[8], paddingBottom: space[12] },
  loading: { marginTop: space[40] },
  more: { marginVertical: space[16] },
  list: { paddingHorizontal: space[20] },
  divider: { height: 1 },
  row: { paddingVertical: space[16], gap: space[8] },
  top: { flexDirection: 'row', alignItems: 'center' },
  tag: { paddingHorizontal: space[8], paddingVertical: space[2], borderRadius: radius.full },
  body: { flexDirection: 'row', alignItems: 'center', gap: space[12] }, // text (≤ 2 + 1 lines) centred on the photo
  text: { gap: space[4] },
  photo: { width: FAB_SIZE, height: FAB_SIZE, borderRadius: radius.md }, // = expanded Create FAB
  meta: { flexDirection: 'row', alignItems: 'center', gap: space[4] },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space[24] },
  orb: { width: 64, height: 64, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { marginTop: space[16] },
  emptyBody: { marginTop: space[6], marginBottom: space[24] },
  fab: { position: 'absolute', right: space[20] },
});
