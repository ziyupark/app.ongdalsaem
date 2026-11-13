import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Plus } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { FlagTag, FoodGrid, ViralBadge } from '../../src/components/community/Parts';
import { Icon } from '../../src/components/Icon';
import { MessageCircle } from '../../src/components/icons/custom';
import { TabBar, useTabBarScroll, type TabKey } from '../../src/components/TabBar';
import { Text } from '../../src/components/Text';
import { resetShareDraft, updateShareDraft } from '../../src/lib/shareDraft';
import { fetchPostsByName, findViral, type CardDish, type ViralItem } from '../../src/services/community';
import { radius, space, useTheme } from '../../src/theme';

/** Expanded TabBar height (12:182). */
const TAB_BAR_H = 110;
const PAGE = 20;

/**
 * 4.7 Viral · Detail (804:12054) — TopBar · Inline (back · Title/L · + share) → header (flag · Display/M name → badge →
 * Body/M note) → Overline post count → 2-column Dish Tiles, 20 at a time → TabBar.
 * 4.7b empty (804:12272) — no posts with that name: orb · Title/M · Body/S · Kick "Share the first post" (name filled in).
 */
export default function ViralScreen() {
  const { name: raw } = useLocalSearchParams<{ name: string }>();
  const name = String(raw ?? '').trim();
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const bar = useTabBarScroll();
  const [item, setItem] = useState<ViralItem | null>(null);
  const [posts, setPosts] = useState<CardDish[] | null>(null);
  const [total, setTotal] = useState(0);
  const [more, setMore] = useState(false);
  const loading = useRef(false);

  useEffect(() => {
    if (!name) return;
    findViral(name).then(setItem).catch(() => undefined);
    fetchPostsByName(name, 0, PAGE)
      .then((r) => { setPosts(r.items); setTotal(r.total); })
      .catch(() => setPosts([]));
  }, [name]);

  const loadMore = useCallback(async () => {
    if (loading.current || !posts || posts.length >= total) return;
    loading.current = true;
    setMore(true);
    try {
      const r = await fetchPostsByName(name, posts.length, PAGE);
      setPosts((p) => [...(p ?? []), ...r.items.filter((d) => !(p ?? []).some((x) => x.id === d.id))]);
      setTotal(r.total);
    } catch { /* keep what we have */ } finally {
      loading.current = false;
      setMore(false);
    }
  }, [name, posts, total]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    bar.onY(contentOffset.y);
    if (contentOffset.y + layoutMeasurement.height > contentSize.height - 400) loadMore();
  };
  const onTab = (k: TabKey) => router.replace(`/${k}`);
  const share = () => {
    resetShareDraft();
    updateShareDraft({ name });
    router.push('/share/pick');
  };

  const country = item?.country ?? null;
  const note = item?.note || (item?.kind === 'rising' && item.posts ? t('viral.risingNote', { count: item.posts }) : t('viral.noteFallback'));
  const empty = posts != null && posts.length === 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: color('bg/default') }]}>
      {/* TopBar · Inline — back 40 · Title/L · + share this dish (Plus 24 in 44×44). */}
      <View style={styles.bar}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={space[4]} onPress={() => router.back()} style={styles.btn}>
          <Icon icon={ChevronLeft} size={22} />
        </Pressable>
        <Text variant="Title/L" numberOfLines={1} style={styles.title}>{t('community.viralBites')}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={t('viral.shareThis')} onPress={share} style={styles.add}>
          <Icon icon={Plus} size={24} color="fg/default" />
        </Pressable>
      </View>

      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[{ paddingBottom: TAB_BAR_H + space[24] }, empty && styles.grow]}
      >
        {/* Block · Viral header — p12 20 20 · gap 8: flag · name → badge → note. */}
        <View style={styles.header}>
          <View style={styles.nameRow}>
            {country ? <FlagTag code={country} /> : null}
            <Text variant="Display/M" numberOfLines={2} style={styles.flexShrink}>{name}</Text>
          </View>
          {item ? <View style={styles.badgeRow}><ViralBadge item={item} /></View> : null}
          <Text variant="Body/M" color="fg/secondary">{note}</Text>
        </View>

        {posts == null ? (
          <ActivityIndicator color={color('fg/muted')} style={styles.loading} />
        ) : empty ? (
          // 4.7b — orb 64 bg/subtle · icon 28 fg/muted → 16 → Title/M → 6 → Body/S → 24 → Kick M.
          <View style={styles.empty}>
            <View style={[styles.orb, { backgroundColor: color('bg/subtle') }]}>
              <Icon icon={MessageCircle} size={28} color="fg/muted" />
            </View>
            <Text variant="Title/M" style={[styles.center, styles.emptyTitle]}>{t('viral.emptyTitle')}</Text>
            <Text variant="Body/S" color="fg/secondary" style={[styles.center, styles.emptyBody]}>{t('viral.emptyBody')}</Text>
            <Button label={t('viral.firstPost')} variant="Kick" size="M" icon={Plus} onPress={share} />
          </View>
        ) : (
          // Block · Posts — gap 12: Overline count → 2-column Dish Tiles.
          <View style={styles.section}>
            <Text variant="Overline" color="fg/muted" style={styles.px}>{t('viral.postCount', { count: total })}</Text>
            <FoodGrid dishes={posts} width={width} onOpen={(d) => router.push(`/dish/${d.id}`)} />
            {more ? <ActivityIndicator color={color('fg/muted')} style={styles.more} /> : null}
          </View>
        )}
      </ScrollView>
      <TabBar active="community" progress={bar.progress} onTab={onTab} onCreate={() => router.push('/share/pick')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bar: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space[12] },
  btn: { width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  add: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  title: { flexShrink: 1 },
  grow: { flexGrow: 1 },
  header: { paddingHorizontal: space[20], paddingTop: space[12], paddingBottom: space[20], gap: space[8] },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  badgeRow: { flexDirection: 'row' },
  flexShrink: { flexShrink: 1 },
  px: { paddingHorizontal: space[20] },
  section: { gap: space[12] },
  loading: { marginTop: space[40] },
  more: { marginVertical: space[16] },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space[24] },
  orb: { width: 64, height: 64, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  emptyTitle: { marginTop: space[16] },
  emptyBody: { marginTop: space[6], marginBottom: space[24] },
});
