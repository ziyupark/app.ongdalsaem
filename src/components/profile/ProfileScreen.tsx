import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { NotebookPen, Utensils, type LucideIcon } from '../icons/ongdal';
import { Bookmark } from '../icons/ongdal';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, TextInput, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { AcornIcon } from '../AcornIcon';
import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { DishTile } from '../dish/DishTile';
import { DiaryView } from './DiaryView';
import { SavedView } from './SavedView';
import { WifiOff } from '../icons/ongdal';
import { Icon } from '../Icon';
import { goTab, TabBar, useTabBarScroll, useTabFocusEffect, type TabKey } from '../TabBar';
import { ScreenHeader, ScreenWash } from '../ScreenHeader';
import { Text } from '../Text';
import { UnderlineTabs } from '../UnderlineTabs';
import { cached } from '../../lib/cache';
import { useHere } from '../../lib/useHere';
import { useWashScroll } from '../../lib/useWashScroll';
import { displayTemp, usePrefs } from '../../lib/prefs';
import { fetchAcornTotal, fetchMyMarks, fetchProfileDishes, setAcorn, type DishSummary, type ProfileTab } from '../../services/foods';
import { getMyProfile, MAX_BIO, updateMyAvatar, updateMyBio, type MyProfile } from '../../services/profile';
import { myUserId, supabase } from '../../lib/supabase';
import { follow } from '../../services/activity';
import { startThread } from '../../services/messages';
import { moods, radius, space, text, useTheme, WEATHER_ICON, withAlpha, type WeatherMood } from '../../theme';

/** Grid 670:20275 — x20 · 2 columns · gap 16 · rows 20 apart. */
const GAP = 16;
const ROW_GAP = 20;
const { lineHeight: _lh, ...bioField } = text['Body/M'];
const TABS: ProfileTab[] = ['dishes', 'diary', 'saved'];
const OTHER_TABS: ProfileTab[] = ['dishes'];
const TAB_ICON: Record<ProfileTab, LucideIcon> = { dishes: Utensils, saved: Bookmark, diary: NotebookPen };

type Now = { mood: WeatherMood; tempC: number; hi: number; lo: number; until?: Date };

/**
 * 6.1 Profile · Dishes (Figma 657:16468) — Profile Header + 2-column Dish Tiles (670:20058). Saved / Diary share the grid.
 * `userId` (another cook, opened from a post, the community or messages): same layout — the wash, title and weather card
 * are always *my* weather and place; avatar, name, status, acorns and dishes are theirs, with Follow / Message instead of
 * editing. Their Saved and Diary stay private, so only Dishes is shown.
 */
export function ProfileScreen({ userId }: { userId?: string }) {
  const isMe = !userId;
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  usePrefs(); // re-render on °C / °F change
  const { width } = useWindowDimensions();
  const [me, setMe] = useState<MyProfile | null>(null);
  const [acorns, setAcorns] = useState<number | null>(null);
  // Weather + place = the shared reading (lib/useHere), identical to Home and Community.
  const { here } = useHere();
  const f = here.forecast;
  const now: Now | null = f ? { mood: f.mood, tempC: f.tempC, hi: f.hi, lo: f.lo, until: f.until } : null;
  const [tab, setTab] = useState<ProfileTab>('dishes');
  // `?tab=diary&focus=shopping` (7.1 "Added to shopping memo" toast) → open Diary and scroll down to the shopping memo.
  const params = useLocalSearchParams<{ tab?: string; focus?: string; at?: string }>();
  const listRef = useRef<FlatList<DishSummary>>(null);
  const focus = isMe && params.tab === 'diary' && params.focus === 'shopping' ? params.at ?? '1' : null;
  useEffect(() => {
    if (!isMe || params.tab !== 'diary') return;
    setTab('diary');
    if (!focus) return;
    const h = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 400);
    return () => clearTimeout(h);
  }, [isMe, params.tab, focus]);
  const tabs = isMe ? TABS : OTHER_TABS;
  const [following, setFollowing] = useState(false);
  const [lists, setLists] = useState<Partial<Record<ProfileTab, DishSummary[]>>>({});
  const bar = useTabBarScroll();
  const [offline, setOffline] = useState(false);
  const onOffline = useCallback((v: boolean) => setOffline(v), []);
  const tileW = (width - space[20] * 2 - GAP) / 2;

  const loadTab = useCallback(async (uid: string, which: ProfileTab) => {
    try {
      const { data: list, stale } = await cached(`profile.${uid}.${which}`, () => fetchProfileDishes(uid, which));
      setLists((prev) => ({ ...prev, [which]: list }));
      setOffline(stale);
    } catch {
      setOffline(true);
      setLists((prev) => ({ ...prev, [which]: prev[which] ?? [] }));
    }
  }, []);

  useTabFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const p = userId ? await loadOther(userId) : await getMyProfile().catch(() => null);
        if (!alive || !p) return;
        setMe(p);
        (userId ? OTHER_TABS : TABS).forEach((k) => loadTab(p.id, k));
        fetchAcornTotal(p.id).then((n) => alive && setAcorns(n)).catch(() => undefined);
      })();
      return () => { alive = false; };
    }, [loadTab, userId]),
  );

  // Mood wash scrolls away with the content and fades out (gone after ~300 pt).
  const wash = useWashScroll();
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    wash.onY(y);
    const { contentSize, layoutMeasurement } = e.nativeEvent;
    bar.onY(y, contentSize.height - layoutMeasurement.height);
  };

  const onTab = (k: TabKey) => (k === 'profile' ? listRef.current?.scrollToOffset({ offset: 0, animated: true }) : goTab(k));

  // Another cook: their public profile + whether I follow them. Opening yourself goes to the real Profile tab.
  const loadOther = async (id: string): Promise<MyProfile | null> => {
    const me = await myUserId();
    if (me === id) { goTab('profile'); return null; }
    const { data } = await supabase.from('profiles').select('id, display_name, username, avatar_url, city, bio').eq('id', id).maybeSingle();
    if (!data) { setMissing(true); return null; }
    if (me) {
      const { data: f } = await supabase.from('follows').select('followee_id').eq('follower_id', me).eq('followee_id', id).maybeSingle();
      setFollowing(!!f);
    }
    return { id: data.id, displayName: data.display_name || data.username, username: data.username, avatarUrl: data.avatar_url, city: data.city, bio: data.bio ?? null, locationEnabled: true };
  };
  const [missing, setMissing] = useState(false);
  const toggleFollow = async () => {
    if (!userId) return;
    const on = !following;
    setFollowing(on);
    try { await follow(userId, on); } catch { setFollowing(!on); }
  };
  const message = async () => {
    if (!userId) return;
    try {
      const thread = await startThread(userId);
      router.push(`/messages/${thread}`);
    } catch (e) {
      const code = (e as { code?: string }).code;
      Alert.alert(t(code === 'restricted' ? 'messages.restricted' : code === 'blocked' ? 'messages.blocked' : 'messages.sendFailed'));
    }
  };

  // Own profile: tap the avatar to change the photo, tap the status line to edit it.
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [bioOpen, setBioOpen] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [bioSaving, setBioSaving] = useState(false);
  const pickAvatar = async () => {
    if (avatarBusy) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert(t('profile.photoPermission'));
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.9 });
    if (r.canceled || !r.assets[0]) return;
    setAvatarBusy(true);
    try {
      const url = await updateMyAvatar(r.assets[0].uri);
      setMe((p) => (p ? { ...p, avatarUrl: url } : p));
    } catch {
      Alert.alert(t('settings.saveFailed'));
    } finally {
      setAvatarBusy(false);
    }
  };
  const openBio = () => { setBioDraft(me?.bio ?? ''); setBioOpen(true); };
  const saveBio = async () => {
    if (bioSaving) return;
    setBioSaving(true);
    try {
      const bio = await updateMyBio(bioDraft);
      setMe((p) => (p ? { ...p, bio } : p));
      setBioOpen(false);
    } catch {
      Alert.alert(t('settings.saveFailed'));
    } finally {
      setBioSaving(false);
    }
  };

  const data = lists[tab];

  // Acorns on the dish tiles: which ones I gave (my marks) + my changes since load, so counts move at once.
  const [given, setGiven] = useState<Set<string>>(new Set());
  const [acornDelta, setAcornDelta] = useState<Record<string, number>>({});
  const dishIds = (lists.dishes ?? []).map((d) => d.id).join(',');
  useEffect(() => {
    if (!dishIds) return;
    let alive = true;
    fetchMyMarks(dishIds.split(',')).then((m) => { if (alive) { setGiven(m.given); setAcornDelta({}); } }).catch(() => undefined);
    return () => { alive = false; };
  }, [dishIds]);
  const toggleAcorn = (id: string) => {
    const on = !given.has(id);
    const step = on ? 1 : -1;
    const apply = (sign: number) => {
      setGiven((s) => { const n = new Set(s); if (on === sign > 0) n.add(id); else n.delete(id); return n; });
      setAcornDelta((d) => ({ ...d, [id]: (d[id] ?? 0) + step * sign }));
      if (isMe) setAcorns((n) => (n == null ? n : n + step * sign)); // my total counts acorns on my own dishes
    };
    apply(1);
    setAcorn(id, on).catch(() => apply(-1));
  };
  const dishesCount = lists.dishes?.length;

  const nowDetail = now
    ? `${t('home.hiLo', { hi: displayTemp(now.hi), lo: displayTemp(now.lo) })}${now.until ? t('home.until', { time: now.until.toLocaleTimeString(i18n.language, { hour: 'numeric' }) }) : ''}`
    : t('home.retry');

  // 6.1 Profile 657:16468 — ScreenHeader (shared with Home · Community · Timer) → [card → 12 → tabs] → 20 → grid.
  const header = (
    <>
    <ScreenHeader right={isMe ? 'settings' : 'none'} onBack={isMe ? undefined : () => (router.canGoBack() ? router.back() : router.replace('/community'))} />
    <View style={styles.header}>
      {/* Frame 10 — card → 12 → tabs. */}
      <View style={styles.cardGroup}>
      <View style={[styles.card, { borderColor: color('bg/subtle') }]}>
        <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: color('glass/surface'), opacity: 0.88 }]} />
        <View style={styles.nowRow}>
          <Text variant="Numeric/XL" style={styles.tabular}>{now ? `${displayTemp(now.tempC)}°` : '--°'}</Text>
          <View style={styles.nowText}>
            <Text variant="Title/M" numberOfLines={1}>{now ? t(`home.condition.${now.mood}`) : t('home.noWeather')}</Text>
            <Text variant="Body/S" color="fg/muted" numberOfLines={1}>{nowDetail}</Text>
          </View>
          {/* Mood orb — same rule as the Home Weather Card: the mood's top colour at 35 %. */}
          <View style={[styles.orb, { backgroundColor: withAlpha(now ? moods[now.mood].top : color('bg/muted'), 0.35) }]}>
            <Icon icon={WEATHER_ICON[now?.mood ?? 'overcast']} size={28} color={now ? 'fg/default' : 'fg/muted'} />
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: color('border/default') }]} />
        <View style={styles.idRow}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('profile.changePhoto')} onPress={pickAvatar} disabled={!me || !isMe}>
            <View style={[styles.avatar, { backgroundColor: color('bg/accent-subtle'), borderColor: color('static/white') }]}>
              {me?.avatarUrl ? <Image source={{ uri: me.avatarUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} /> : (
                <Text variant="Display/M" color="fg/accent">{(me?.displayName ?? '').slice(0, 1).toUpperCase()}</Text>
              )}
              {avatarBusy ? <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: color('overlay/scrim') }]}><ActivityIndicator color={color('static/white')} /></View> : null}
            </View>
          </Pressable>
          <View style={styles.name}>
            <View style={styles.nameText}>
              <Text variant="Display/M" numberOfLines={1}>{me?.displayName ?? ' '}</Text>
              {me?.username ? <Text variant="Body/S" color="fg/muted">{`@${me.username}`}</Text> : null}
            </View>
            <View style={[styles.acorns, { backgroundColor: color('bg/muted') }]}>
              <AcornIcon size={16} filled />
              <Text variant="Caption Strong">{t('profile.totalAcorns', { count: acorns ?? 0 })}</Text>
            </View>
          </View>
        </View>
        {isMe ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t('profile.editStatus')} onPress={openBio} disabled={!me} style={styles.bioRow}>
            {me?.bio ? <Text variant="Body/S" color="fg/secondary" style={styles.flex1}>{me.bio}</Text> : (
              <Text variant="Body/S" color="fg/muted" style={styles.flex1}>{t('profile.addStatus')}</Text>
            )}
          </Pressable>
        ) : me?.bio ? (
          <Text variant="Body/S" color="fg/secondary">{me.bio}</Text>
        ) : null}
        {isMe || !me ? null : (
          <View style={styles.btns}>
            <View style={styles.flex1}><Button label={t(following ? 'cook.following' : 'cook.follow')} variant={following ? 'Secondary' : 'Primary'} size="M" onPress={toggleFollow} /></View>
            <View style={styles.flex1}><Button label={t('cook.message')} variant="Outline" size="M" onPress={message} /></View>
          </View>
        )}
      </View>
      {/* My profile: icon tabs (the dish count is on the chip above). Other cooks keep the "Dishes N" label. */}
      <UnderlineTabs
        style={styles.tabs}
        contentStyle={styles.tabRow}
        value={tab}
        onChange={setTab}
        items={tabs.map((k) => ({
          key: k,
          label: k === 'dishes' && dishesCount != null ? t('profile.tabs.dishesCount', { n: dishesCount }) : t(`profile.tabs.${k}`),
          icon: isMe ? TAB_ICON[k] : undefined,
        }))}
      />
      </View>
      {offline ? (
        <View style={[styles.offline, { backgroundColor: color('bg/inverse') }]}>
          <Icon icon={WifiOff} size={18} color="fg/inverse" />
          <Text variant="Body/S Strong" color="fg/inverse" style={styles.flex1}>{t('profile.offline')}</Text>
        </View>
      ) : null}
    </View>
    </>
  );

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
      <ScreenWash scrollStyle={wash.style} />
      <FlatList
        ref={listRef}
        data={tab === 'dishes' ? data ?? [] : []}
        extraData={[given, acornDelta]} // re-render tiles when an acorn is given / taken back
        keyExtractor={(d) => d.id}
        numColumns={2}
        ListHeaderComponent={header}
        columnWrapperStyle={{ gap: GAP, paddingHorizontal: space[20], marginBottom: ROW_GAP }}
        contentContainerStyle={styles.grid}
        onScroll={onScroll}
        scrollEventThrottle={16}
        ListFooterComponent={tab === 'saved' ? <SavedView onOffline={onOffline} /> : tab === 'diary' ? <DiaryView onOffline={onOffline} focus={focus} /> : undefined}
        ListEmptyComponent={tab !== 'dishes' ? undefined : 
          data == null ? <ActivityIndicator color={color('fg/muted')} style={styles.loading} /> : (
            <View style={styles.empty}>
              <Text variant="Body/M" color="fg/secondary" style={styles.centerText}>{isMe ? t(`profile.empty.${tab}`) : missing ? t('cook.missing') : t('cook.noDishes')}</Text>
              {isMe ? <Button label={t('profile.shareFirst')} variant="Outline" size="M" onPress={() => router.push('/share/pick')} /> : null}
            </View>
          )
        }
        renderItem={({ item }) => (
          <DishTile
            dish={item}
            width={tileW}
            onPress={() => router.push(`/dish/${item.id}`)}
            given={given.has(item.id)}
            acorns={item.acorns + (acornDelta[item.id] ?? 0)}
            onAcorn={() => toggleAcorn(item.id)}
          />
        )}
      />
      <BottomSheet visible={bioOpen} onClose={() => setBioOpen(false)} title={t('profile.statusTitle')}>
        <View style={[styles.bioField, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
          <TextInput
            value={bioDraft}
            onChangeText={(v) => setBioDraft(v.slice(0, MAX_BIO))}
            placeholder={t('profile.statusPlaceholder')}
            placeholderTextColor={color('fg/muted')}
            maxLength={MAX_BIO}
            multiline
            autoFocus
            style={[bioField, styles.bioInput, { color: color('fg/default') }]}
          />
          <Text variant="Caption" color="fg/muted" style={styles.count}>{`${bioDraft.length}/${MAX_BIO}`}</Text>
        </View>
        <Button label={t('common.save')} size="L" onPress={saveBio} loading={bioSaving} />
      </BottomSheet>
      <TabBar active={isMe ? 'profile' : 'community'} progress={bar.progress} onTab={(k) => (isMe ? onTab(k) : goTab(k))} onCreate={() => router.push('/share/pick')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // Body under ScreenHeader: p20 · gap 13 · 8 between the tabs and the first Dish Tiles (Figma 16, tightened on request).
  header: { paddingHorizontal: space[20], paddingBottom: space[8], gap: 13 },
  cardGroup: { gap: space[12] },
  center: { alignItems: 'center', justifyContent: 'center' },
  bioRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space[8] },
  btns: { flexDirection: 'row', gap: space[10] },
  bioField: { borderRadius: radius.lg, borderWidth: 1, paddingHorizontal: space[16], paddingTop: space[12], paddingBottom: space[8], gap: space[4] },
  bioInput: { minHeight: 72, textAlignVertical: 'top', padding: 0 },
  count: { alignSelf: 'flex-end' },
  card: { borderRadius: radius['2xl'], borderWidth: 1, paddingHorizontal: space[20], paddingVertical: 18, gap: space[14], overflow: 'hidden' },
  nowRow: { flexDirection: 'row', alignItems: 'center', gap: space[14] },
  nowText: { flex: 1, gap: space[2] },
  orb: { width: 56, height: 56, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: space[16] },
  avatar: { width: 88, height: 88, borderRadius: radius.full, borderWidth: 1.2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1, minWidth: 97, gap: 11, justifyContent: 'center', opacity: 0.8 },
  nameText: { gap: space[6] },
  acorns: { flexDirection: 'row', alignItems: 'center', gap: space[2], paddingHorizontal: space[8], paddingVertical: space[6], borderRadius: radius.full, alignSelf: 'flex-start' },
  // Full screen width (cancels the header's p20) so the hairline runs edge to edge; tabs keep their x (20 + 20).
  tabs: { marginHorizontal: -space[20] },
  tabRow: { gap: 28, paddingHorizontal: space[40] },
  offline: { flexDirection: 'row', alignItems: 'center', gap: space[10], paddingHorizontal: space[16], paddingVertical: space[12], borderRadius: radius.full }, // Inline Banner · Neutral
  flex1: { flex: 1 },
  grid: { paddingBottom: 96 + space[24] },
  loading: { marginTop: space[40] },
  empty: { alignItems: 'center', gap: space[16], paddingTop: space[40], paddingHorizontal: space[40] },
  centerText: { textAlign: 'center' },
});
