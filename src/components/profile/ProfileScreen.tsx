import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, TextInput, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { AcornIcon } from '../AcornIcon';
import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { DishTile } from '../dish/DishTile';
import { ReportSheet } from '../dish/ReportSheet';
import { DiaryView } from './DiaryView';
import { SavedView } from './SavedView';
import { InlineBanner } from '../InlineBanner';
import { LoadError } from '../LoadError';
import { goTab, TabBar, useTabBarScroll, useTabFocusEffect, type TabKey } from '../TabBar';
import { ScreenHeader, ScreenWash } from '../ScreenHeader';
import { Text } from '../Text';
import { WeatherIcon3D } from '../WeatherIcon3D';
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
import { isObjectionable, reportUser } from '../../services/moderation';
import { radius, space, text, useTheme, type Weather3DKey, type WeatherMood, FONT_SCALE_MAX } from '../../theme';

/** Grid 670:20275 — x20 · 2 columns · gap 16 · rows 20 apart. */
const GAP = 16;
const ROW_GAP = 20;
const { lineHeight: _lh, ...bioField } = text['Body/M'];
// Block · Tabs 1233:12327 tab order.
const TABS: ProfileTab[] = ['dishes', 'diary', 'saved'];
const OTHER_TABS: ProfileTab[] = ['dishes'];

type Now = { mood: WeatherMood; icon?: Weather3DKey; tempC: number; hi: number; lo: number; until?: Date };

/**
 * 6.1 Profile · Dishes (Figma 657:16468) — Profile Header + 2-column Dish Tiles (670:20058). Diary / Saved share the grid.
 * `userId` (another cook, opened from a post, the community or messages): same layout — the wash, title and weather card
 * are always *my* weather and place; avatar, name, status, acorns and dishes are theirs, with Follow / Message instead of
 * editing. Their Diary and Saved stay private, so only Dishes is shown.
 */
/**
 * `showFollow` / `showMessage` (another cook only, default on): the Follow · Message buttons under the bio
 * (Weather Card 1233:14208 — Row 87 → 12 → bio → 14 → buttons). Both off = the plain card (Profile Header 126:4345).
 */
export function ProfileScreen({ userId, showFollow = true, showMessage = true }: { userId?: string; showFollow?: boolean; showMessage?: boolean }) {
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
  const now: Now | null = f ? { mood: f.mood, icon: f.icon, tempC: f.tempC, hi: f.hi, lo: f.lo, until: f.until } : null;
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

  // The profile itself didn't load (offline / server error) and nothing is on screen yet → Try again.
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useTabFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        let p: MyProfile | null;
        try {
          p = userId ? await loadOther(userId) : await getMyProfile();
        } catch {
          if (alive) setFailed(true);
          return;
        }
        if (!alive || !p) return;
        setFailed(false);
        setMe(p);
        (userId ? OTHER_TABS : TABS).forEach((k) => loadTab(p.id, k));
        fetchAcornTotal(p.id).then((n) => alive && setAcorns(n)).catch(() => undefined);
      })();
      return () => { alive = false; };
    }, [loadTab, userId, attempt]),
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
    const { data, error } = await supabase.from('profiles').select('id, display_name, username, avatar_url, city, bio').eq('id', id).maybeSingle();
    if (error) throw error; // network / server — not "this cook doesn't exist"
    if (!data) { setMissing(true); return null; }
    if (me) {
      const { data: f } = await supabase.from('follows').select('followee_id').eq('follower_id', me).eq('followee_id', id).maybeSingle();
      setFollowing(!!f);
    }
    return { id: data.id, displayName: data.username || data.display_name, username: data.username, avatarUrl: data.avatar_url, city: data.city, bio: data.bio ?? null, locationEnabled: true };
  };
  const [missing, setMissing] = useState(false);
  // 7.3 Report / block a cook (their name, @handle, photo or status line) — the same sheet as a dish report.
  const [reportOpen, setReportOpen] = useState(false);
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
    } catch (e) {
      Alert.alert(isObjectionable(e) ? t('moderation.objectionable') : t('settings.saveFailed'));
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

  // Same Now row as the Home Weather Card: "H 14° · L 9°" on one line, "until 9 PM" on the next.
  const nowDetail = now ? t('home.hiLo', { hi: displayTemp(now.hi), lo: displayTemp(now.lo) }) : t('home.retry');
  const nowUntil = now?.until ? t('home.untilLine', { time: now.until.toLocaleTimeString(i18n.language, { hour: 'numeric' }) }) : undefined;

  const actions = !isMe && !!me && (showFollow || showMessage);
  // 6.1 Profile Header 126:4345 — ScreenHeader (gap 22) → [card → 22 → Block · Tabs (py 9, hairline)] → 8 → grid.
  const header = (
    <>
    <ScreenHeader withWeather profile right={isMe ? 'settings' : userId && !missing ? 'more' : 'none'} onMore={() => setReportOpen(true)} onBack={isMe ? undefined : () => (router.canGoBack() ? router.back() : router.replace('/community'))} />
    <View style={styles.header}>
      {/* Frame 10 — card → 22 → tabs. */}
      <View style={styles.cardGroup}>
      <View style={[styles.card, { borderColor: color('bg/subtle') }]}>
        {/* Weather card 614:13895 — glass/surface fill only (no blur, no shadow). */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: color('glass/surface') }]} />
        {/* Now 1094:24025 — same as the Home Weather Card: temp (padding 0 8 2 8) · 4 · condition → 6 → H/L · until (gap 2) · 14 · 3D icon 64. */}
        <View style={styles.nowRow}>
          <View style={styles.nowMain}>
            <View style={styles.tempBox}>
              <Text variant="XXL 80" style={styles.tabular}>{now ? `${displayTemp(now.tempC)}°` : '--°'}</Text>
            </View>
            <View style={styles.nowText}>
              <Text variant="Title/M" numberOfLines={1}>{now ? t(`home.condition.${now.mood}`) : t('home.noWeather')}</Text>
              <View style={styles.details}>
                <Text variant="Body/S" color="fg/muted" numberOfLines={1}>{nowDetail}</Text>
                {nowUntil ? <Text variant="Body/S" color="fg/muted" numberOfLines={1}>{nowUntil}</Text> : null}
              </View>
            </View>
          </View>
          <WeatherIcon3D mood={now?.mood} icon={now?.icon} size={64} />
        </View>
        <View style={[styles.divider, { backgroundColor: color('border/default') }]} />
        {/* Buttons on (1233:14208): [Row 87 → 12 → bio] → 14 → buttons. Off (126:4345): Row → 14 → bio. */}
        <View style={actions ? styles.idGroup : styles.idGroupPlain}>
        <View style={[styles.idRow, actions && styles.idRowActions]}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('profile.changePhoto')} onPress={pickAvatar} disabled={!me || !isMe}>
            <View style={[styles.avatar, { backgroundColor: color('bg/accent-subtle'), borderColor: color('bg/subtle') }]}>
              {me?.avatarUrl ? <Image source={{ uri: me.avatarUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} /> : (
                <Text variant="Display/M" color="fg/accent">{(me?.username ?? me?.displayName ?? '').slice(0, 1).toUpperCase()}</Text>
              )}
              {avatarBusy ? <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: color('overlay/scrim') }]}><ActivityIndicator color={color('static/white')} /></View> : null}
            </View>
          </Pressable>
          <View style={styles.name}>
            {/* 614:13917 — username only (no @), Display/M (display name line removed). */}
            <Text variant="Display/M" numberOfLines={1}>{me?.username ?? me?.displayName ?? ' '}</Text>
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
        </View>
        {actions ? (
          <View style={styles.btns}>
            {/* Frame 42 1233:14202 — 32-high buttons, gap 6.6, radius 9.6: Follow = bg/kick + white (Following = bg/muted), Message = bg/muted + fg/muted. */}
            {showFollow ? (
              <Pressable accessibilityRole="button" accessibilityState={{ selected: following }} onPress={toggleFollow} style={({ pressed }) => [styles.btn, { backgroundColor: color(following ? 'bg/muted' : 'bg/kick') }, pressed && styles.pressed]}>
                <Text variant="Button/M" color={following ? 'fg/default' : 'static/white'} numberOfLines={1}>{t(following ? 'cook.following' : 'cook.follow')}</Text>
              </Pressable>
            ) : null}
            {showMessage ? (
              <Pressable accessibilityRole="button" onPress={message} style={({ pressed }) => [styles.btn, { backgroundColor: color('bg/muted') }, pressed && styles.pressed]}>
                <Text variant="Button/M" color="fg/muted" numberOfLines={1}>{t('cook.message')}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
      {/* Block · Tabs 1233:12327: "Dishes 48" · "Diary" · "Saved" (Title/M, fg/default · fg/muted). Another cook's = Dishes only. */}
      <UnderlineTabs
        style={styles.tabs}
        contentStyle={styles.tabRow}
        labelVariant="Title/M"
        value={tab}
        onChange={setTab}
        items={tabs.map((k) => ({
          key: k,
          label: k === 'dishes' && dishesCount != null ? t('profile.tabs.dishesCount', { n: dishesCount }) : t(`profile.tabs.${k}`),
        }))}
      />
      </View>
      {offline ? (
        <InlineBanner text={t('profile.offline')} />
      ) : null}
    </View>
    </>
  );

  return (
    // Own profile (tab): transparent over the global WeatherBackdrop. Another cook's (pushed): opaque, its own still wash.
    <View style={[styles.root, userId ? { backgroundColor: color('bg/default') } : null]}>
      <ScreenWash wash={wash} local={!!userId} />
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
          data == null && failed && !me ? <LoadError onRetry={() => { setFailed(false); setAttempt((n) => n + 1); }} />
          : data == null ? <ActivityIndicator color={color('fg/muted')} style={styles.loading} /> : (
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
      {userId ? (
        <ReportSheet
          visible={reportOpen}
          ownerId={userId}
          ownerName={me?.username ?? me?.displayName ?? ''}
          title={t('report.userTitle')}
          onClose={() => setReportOpen(false)}
          onBlocked={() => (router.canGoBack() ? router.back() : router.replace('/community'))}
          onReport={(reason) => reportUser(userId, reason)}
        />
      ) : null}
      <BottomSheet visible={bioOpen} onClose={() => setBioOpen(false)} title={t('profile.statusTitle')}>
        <View style={[styles.bioField, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
          <TextInput maxFontSizeMultiplier={FONT_SCALE_MAX}
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
  // Body under ScreenHeader (profile: title → 22 → card). Block · Tabs 1233:13801 = py 9 (pb under the hairline), then 8 → the grid.
  header: { paddingHorizontal: space[20], paddingBottom: 9 + space[8], gap: 13 },
  // card → 22 → tabs (the tabs block's top padding).
  cardGroup: { gap: 22 },
  center: { alignItems: 'center', justifyContent: 'center' },
  bioRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space[8] },
  btns: { flexDirection: 'row', gap: 6.6 },
  btn: { flex: 1, height: 32, borderRadius: 9.6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space[10] },
  idGroup: { gap: space[12] },
  idGroupPlain: { gap: space[14] },
  // Row 1233:14187 — 87 high when the buttons follow (the 105 name box is centred in it).
  pressed: { opacity: 0.85 },
  bioField: { borderRadius: radius.lg, borderWidth: 1, paddingHorizontal: space[16], paddingTop: space[12], paddingBottom: space[8], gap: space[4] },
  bioInput: { minHeight: 72, textAlignVertical: 'top', padding: 0 },
  count: { alignSelf: 'flex-end' },
  // Weather card 614:13895 — padding 18 20, gap 14.
  card: { borderRadius: radius['2xl'], borderWidth: 1, paddingHorizontal: space[20], paddingVertical: 18, gap: space[14], overflow: 'hidden' },
  nowRow: { flexDirection: 'row', alignItems: 'center', gap: space[14] },
  nowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space[4] },
  tempBox: { paddingHorizontal: space[8], paddingBottom: space[2], alignItems: 'center', justifyContent: 'center' },
  nowText: { flex: 1, gap: space[6] },
  details: { gap: space[2] },
  divider: { height: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
  // Row 614:13914 — avatar 88 (1.2 white border) · 16 · name (105 tall).
  idRow: { flexDirection: 'row', alignItems: 'center', gap: space[16] },
  idRowActions: { height: 87 },
  avatar: { width: 88, height: 88, borderRadius: radius.full, borderWidth: 1.2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  // name 614:13916 — fixed 105 tall, centred, gap 11, 80 % opacity.
  name: { flex: 1, minWidth: 97, height: 105, gap: 11, justifyContent: 'center', opacity: 0.8 },
  acorns: { flexDirection: 'row', alignItems: 'center', gap: space[2], paddingHorizontal: space[8], paddingVertical: space[6], borderRadius: radius.full, alignSelf: 'flex-start' },
  // Block · Tabs 1233:13801 — inside the header's p20 (hairline 350 wide, border/default 30 %), pt 9; Tabs gap 16.
  tabs: { paddingTop: 9 },
  tabRow: { gap: space[16] },
  flex1: { flex: 1 },
  grid: { paddingBottom: 96 + space[24] },
  loading: { marginTop: space[40] },
  empty: { alignItems: 'center', gap: space[16], paddingTop: space[40], paddingHorizontal: space[40] },
  centerText: { textAlign: 'center' },
});
