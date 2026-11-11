import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Bell } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useWashScroll } from '../src/lib/useWashScroll';
import { syncPush } from '../src/lib/push';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from '../src/components/IconButton';
import { Logo } from '../src/components/Logo';
import { MoodGradient } from '../src/components/MoodGradient';
import { WeatherFx } from '../src/components/WeatherFx';
import { TabBar, useTabBarScroll } from '../src/components/TabBar';
import { Text } from '../src/components/Text';
import { LocationCard, NearbyCard, PickCard, StoryCard } from '../src/components/home/Cards';
import { FeedLoader } from '../src/components/home/FeedLoader';
import { FeedPost, type FeedPostData } from '../src/components/home/FeedPost';
import { HomeSkeleton } from '../src/components/home/HomeSkeleton';
import { WeatherCard, type SlotView } from '../src/components/home/WeatherCard';
import { Toast } from '../src/components/Toast';
import { dayPart, mealAt, mealTimeline, type Meal } from '../src/lib/meals';
import { resetShareDraft, updateShareDraft } from '../src/lib/shareDraft';
import { fetchPool, pickForSlot, pickToday, sameGroup, type Ctx, type PoolDish } from '../src/services/recommend';
import { resetOnboardingForDev, signOut } from '../src/services/auth';
import { fetchFeed, fetchMyMarks, setAcorn, setSaved } from '../src/services/foods';
import { hasUnread } from '../src/services/activity';
import { timeAgo } from '../src/lib/time';
import { displayTemp, usePrefs } from '../src/lib/prefs';
import { getHere, placeLabel, useHere } from '../src/lib/useHere';
import { saveLocationChoice } from '../src/services/profile';
import { tempAt, type Forecast } from '../src/services/weather';
import { space, useTheme, type WeatherMood } from '../src/theme';
import { bwOn, useWashInk } from '../src/theme/washInk';

type HomeState =
  | { kind: 'loading' }
  | { kind: 'ready'; forecast: Forecast | null; place: string; city?: string; district?: string }
  | { kind: 'location-off'; city: string };

const DEFAULT_CITY = 'Seoul';
/** Mood wash before the weather is known (2.6 evening tone falls back to overcast). */
const FALLBACK_MOOD: WeatherMood = 'overcast';

/** Empty slot → 8.1 with that meal ticked in 8.2 (Late ≈ dinner, Dawn ≈ breakfast). */
const shareTag = (m: Meal) => (m === 'late' ? 'dinner' : m === 'dawn' ? 'breakfast' : m);

/** 2.1 Home · 2.7 Loading · 2.5 Location off — docs/04-screens/02-home.md. Dishes come from services/recommend (§6.1–6.2). */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { color, scheme } = useTheme();
  const { t, i18n } = useTranslation();
  const bar = useTabBarScroll();
  usePrefs(); // re-render on °C / °F change
  const [unread, setUnread] = useState(false);
  useFocusEffect(useCallback(() => { hasUnread().then(setUnread).catch(() => undefined); }, []));
  const [realPosts, setRealPosts] = useState<FeedPostData[]>([]);
  const [pool, setPool] = useState<PoolDish[]>([]);
  // My user id — Today's pick leaves out my own dishes.
  const [myId, setMyId] = useState<string | null>(null);
  useEffect(() => { supabase.auth.getSession().then(({ data }) => setMyId(data.session?.user.id ?? null)); }, []);
  useFocusEffect(useCallback(() => { fetchPool().then(setPool).catch((e) => console.warn('[home] pool', e)); }, []));
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        try {
          const dishes = (await fetchFeed(60)).filter((d) => d.mood && d.tempC != null);
          const marks = await fetchMyMarks(dishes.map((d) => d.id));
          if (!alive) return;
          setRealPosts(dishes.map((d) => {
            const given = marks.given.has(d.id);
            return {
              id: d.id,
              name: d.creator.handle ?? d.creator.name,
              meta: [d.placeName ?? [d.neighborhood, d.city].filter(Boolean).join(', '), timeAgo(d.createdAt, t)].filter(Boolean).join(' · '),
              avatar: d.creator.avatarUrl ? { uri: d.creator.avatarUrl } : undefined,
              photo: { uri: d.photo },
              photoCount: d.photos.length,
              authorId: d.creator.id,
              weather: d.mood!,
              tempC: d.tempC!,
              acorns: d.acorns - (given ? 1 : 0),
              comments: d.comments,
              caption: d.description || d.name,
              given,
              saved: marks.saved.has(d.id),
            };
          }));
        } catch (e) {
          console.warn('[home] feed', e);
        }
      })();
      return () => { alive = false; };
    }, [t]),
  );
  // New picks (§6.1): dishes already shown this session are skipped until the list runs out.
  const [seen, setSeen] = useState<Set<string>>(() => new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [allowing, setAllowing] = useState(false);

  // Weather + place come from the shared reading (lib/useHere) — the same one Profile and Community show.
  const { here, allow, reload } = useHere();
  // Skeleton never flashes for less than 600 ms (2.7).
  const [minShown, setMinShown] = useState(false);
  useEffect(() => { const h = setTimeout(() => setMinShown(true), 600); return () => clearTimeout(h); }, []);
  const state: HomeState =
    here.status === 'loading' || !minShown
      ? { kind: 'loading' }
      : here.status === 'ready' || here.place?.city
        ? { kind: 'ready', forecast: here.forecast, place: placeLabel(here.place) || here.forecast?.city || '', city: here.place?.city ?? here.forecast?.city, district: here.place?.district }
        : { kind: 'location-off', city: DEFAULT_CITY };
  const load = reload;

  const allowLocation = async () => {
    setAllowing(true);
    const ok = await allow();
    setAllowing(false);
    if (ok) {
      const p = getHere().place;
      await saveLocationChoice({ city: p?.city, country: p?.countryCode ?? p?.country, locationEnabled: true }).catch(() => undefined);
    }
  };

  // Mood wash scrolls away with the content and fades out (gone after ~300 pt).
  const wash = useWashScroll();
  // 9.4 Today's pick push: the first Home visit is where we ask for notification permission (iOS asks only once).
  useEffect(() => { syncPush({ ask: true }); }, []);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    wash.onY(y);
    bar.onY(y);
  };

  const now = useMemo(() => new Date(), [state]);
  const ready = state.kind === 'ready' ? state : null;
  const f = ready?.forecast ?? null;
  const washMood: WeatherMood = f?.mood ?? FALLBACK_MOOD;
  // Header over the 420 wash at 85 %: logo ≈ 12 %, overline ≈ 26 %, title ≈ 33 % down.
  const washOn = state.kind !== 'location-off';
  const logoInk = useWashInk(washOn ? washMood : null, 0.12, 0.85);
  const overInk = useWashInk(washOn ? washMood : null, 0.26, 0.85);
  const titleInk = useWashInk(washOn ? washMood : null, 0.33, 0.85);
  const dateLabel = now.toLocaleDateString(i18n.language, { weekday: 'short', month: 'short', day: 'numeric' });

  const place = ready ? { city: ready.city, neighborhood: ready.district } : state.kind === 'location-off' ? { city: state.city } : undefined;
  const timeline = useMemo(() => mealTimeline(now), [now]);
  const slotCtx = (at: Date, isNow: boolean): Ctx => {
    if (!f) return { place };
    const mood = isNow ? f.mood : f.points.length ? f.points.reduce((b, p) => (Math.abs(+p.at - +at) < Math.abs(+b.at - +at) ? p : b)).mood : f.mood;
    return { mood, tempC: isNow ? f.tempC : tempAt(f, at), place };
  };
  /** Each slot takes the best dish not already used by an earlier slot or shown before (§6.1 steps 1–4). */
  const pickSlots = (exclude: Set<string>) => {
    const used = new Set(exclude);
    return timeline.map((s) => {
      const d = pickForSlot(pool, s.meal, slotCtx(s.at, s.isNow), used);
      if (d) used.add(d.id);
      return d;
    });
  };
  const slotDishes = useMemo(() => pickSlots(seen), [pool, timeline, f, seen, ready?.city, ready?.district]);
  const slots: SlotView[] = timeline.map((s, i) => {
    const c = slotCtx(s.at, s.isNow);
    return { meal: s.meal, isNow: s.isNow, tempC: c.tempC ?? undefined, mood: c.mood ?? undefined, photo: slotDishes[i] ? { uri: slotDishes[i]!.photo } : null };
  });
  const refreshPicks = () => {
    if (!f) { load(); return; }
    const next = new Set(seen);
    slotDishes.forEach((d) => d && next.add(d.id));
    const fresh = pickSlots(next);
    if (fresh.some(Boolean) || !slotDishes.some(Boolean)) setSeen(next);
    else { setSeen(new Set()); setToast(t('home.picksExhausted')); }
    fetchPool().then(setPool).catch(() => undefined);
  };
  const onSlot = (i: number) => {
    const d = slotDishes[i];
    if (d) { router.push(`/dish/${d.id}`); return; }
    resetShareDraft();
    updateShareDraft({ meals: [shareTag(timeline[i].meal)] });
    router.push('/share/pick');
  };

  // §6.2 Today's pick — today's weather family within ±1 °C (else the closest temperature), then meal · place · acorns · freshness (the mood prompt was removed in 2.1 19:191).
  const pick = useMemo(
    () => pickToday(pool, { ...(f ? { mood: f.mood, tempC: f.tempC } : {}), place, meal: mealAt(now), excludeCreator: myId }),
    [pool, myId, f, now, ready?.city, ready?.district, state.kind === 'location-off' ? state.city : ''],
  );
  // Today's pick acorn: whether I gave one (from my marks) + my change since load, so the count moves at once.
  const [pickAcorn, setPickAcorn] = useState<{ id: string | null; given: boolean; delta: number }>({ id: null, given: false, delta: 0 });
  useEffect(() => {
    if (!pick) return;
    let alive = true;
    setPickAcorn({ id: pick.id, given: false, delta: 0 });
    fetchMyMarks([pick.id]).then((m) => alive && setPickAcorn({ id: pick.id, given: m.given.has(pick.id), delta: 0 })).catch(() => undefined);
    return () => { alive = false; };
  }, [pick?.id]);
  const pickMark = pickAcorn.id === pick?.id ? pickAcorn : { given: false, delta: 0 };
  const togglePickAcorn = () => {
    if (!pick) return;
    const on = !pickMark.given;
    const step = on ? 1 : -1;
    setPickAcorn((a) => ({ ...a, given: on, delta: a.delta + step }));
    setAcorn(pick.id, on).catch(() => setPickAcorn((a) => ({ ...a, given: !on, delta: a.delta - step })));
  };
  const pickByline = pick ? [pick.creator.name, [pick.neighborhood, pick.city].filter(Boolean).join(', '), timeAgo(pick.createdAt, t)].filter(Boolean).join(' · ') : '';
  const pickInitial = (pick?.creator.name ?? '?').slice(0, 1).toUpperCase();

  // Feed (Block · feed 123:3261 — no title / chips): posts from today's weather. Same weather family only
  // (rain · snow · clear · grey); closest first — same weather → nearer temperature → newer. Without weather: newest.
  const posts = (() => {
    if (!f) return realPosts;
    const same = realPosts.filter((p) => sameGroup(p.weather, f.mood));
    const rank = (p: FeedPostData) => (p.weather === f.mood ? 0 : 1) * 100 + Math.min(99, Math.abs(p.tempC - f.tempC));
    return same.map((p, i) => ({ p, i })).sort((x, y) => rank(x.p) - rank(y.p) || x.i - y.i).map(({ p }) => p);
  })();

  const devMenu = () => {
    if (!__DEV__) return;
    Alert.alert('Dev', undefined, [
      { text: 'Run onboarding again', onPress: async () => { await resetOnboardingForDev(); router.replace('/'); } },
      { text: 'Sign out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/'); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const header = (
    <View style={styles.header}>
      <Pressable onLongPress={devMenu} delayLongPress={600} accessible={false}>
        <Logo lockup="Compact" tone={logoInk?.light ? 'light' : 'ink'} />
      </Pressable>
      <IconButton icon={Bell} accessibilityLabel={t('home.notifications')} dot={unread} onPress={() => router.push('/notifications')} />
    </View>
  );

  const titleA = ready ? `${t(`home.titleMood.${washMood}`)} ` : '';
  const titleB = ready ? t(`home.dayPart.${dayPart(now)}`) : '';
  const detail = f
    ? `${t('home.hiLo', { hi: displayTemp(f.hi), lo: displayTemp(f.lo) })}${f.until ? t('home.until', { time: f.until.toLocaleTimeString(i18n.language, { hour: 'numeric' }) }) : ''}`
    : t('home.retry');

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
      <StatusBar style={washOn && logoInk ? logoInk.bar : scheme === 'dark' ? 'light' : 'dark'} />
      {state.kind !== 'location-off' ? (
        <Animated.View entering={FadeIn.duration(200)} style={[styles.wash, wash.style]} pointerEvents="none">
          <MoodGradient mood={washMood} opacity={0.85} />
          <WeatherFx mood={washMood} />
        </Animated.View>
      ) : null}

      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        scrollEnabled={state.kind !== 'loading'}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top }}
      >
        {state.kind === 'loading' ? (
          <HomeSkeleton />
        ) : state.kind === 'location-off' ? (
          <Animated.View entering={FadeIn.duration(200)}>
            {header}
            <View style={styles.titleBlock}>
              <Text variant="Overline" color="fg/muted">{t('home.locationOff.overline', { city: state.city })}</Text>
              <Text variant="Display/XL" accessibilityRole="header">
                {t('home.locationOff.titleA')}
                <Text variant="Display/XL" color="fg/disabled">{t('home.locationOff.titleB')}</Text>
              </Text>
              <LocationCard onChooseCity={() => router.push('/settings/city')} onAllowLocation={allowLocation} busy={allowing} />
            </View>
            <View style={styles.pickBlock}>
              {pick ? (
                <PickCard
                  photo={{ uri: pick.photo }}
                  title={pick.name}
                  byline={pickByline}
                  mood={pick.mood ?? FALLBACK_MOOD}
                  tempC={pick.tempC ?? 0}
                  acorns={pick.acorns + pickMark.delta}
                  given={pickMark.given}
                  onAcorn={togglePickAcorn}
                  onPress={() => router.push(`/dish/${pick.id}`)}
                />
              ) : null}
            </View>
            <View style={{ height: 110 }} />
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(250)}>
            {header}
            <View style={styles.titleBlock}>
              <Text variant="Overline" color={overInk?.bw ?? bwOn(color('bg/default'))}>{ready?.place ? `${dateLabel} · ${ready.place}` : dateLabel}</Text>
              <Text variant="Display/XL" accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit color={titleInk?.strong ?? 'fg/default'}>
                {titleA}
                <Text variant="Display/XL" color={titleInk?.disabled ?? 'fg/disabled'}>{titleB}</Text>
              </Text>
              <WeatherCard
                tempC={f?.tempC}
                mood={f?.mood}
                condition={f ? t(`home.condition.${f.mood}`) : t('home.noWeather')}
                detail={detail}
                slots={slots}
                picksHead={t('home.picksHead')}
                onRefresh={refreshPicks}
                onSlotPress={(s) => onSlot(slots.indexOf(s))}
              />
            </View>
            <View style={styles.pickBlock}>
              {pick ? (
                <>
                  <StoryCard
                    title={t('home.todaysPick')}
                    statement={pick.name}
                    photo={{ uri: pick.photo }}
                    cookAvatar={pick.creator.avatarUrl ? { uri: pick.creator.avatarUrl } : undefined}
                    cookInitial={pickInitial}
                    mood={pick.mood ?? f?.mood ?? FALLBACK_MOOD}
                    tempC={pick.tempC ?? f?.tempC ?? 0}
                    acorns={pick.acorns + pickMark.delta}
                    given={pickMark.given}
                    onAcorn={togglePickAcorn}
                    onPress={() => router.push(`/dish/${pick.id}`)}
                  />
                  <NearbyCard photo={{ uri: pick.photo }} title={t('home.similarBites')} meta={t('home.similarBitesMeta')} onPress={() => router.push({ pathname: '/nearby', params: { dish: pick.name, photo: pick.photo } })} />
                </>
              ) : null}
            </View>
            <View style={styles.feed}>
              {posts.map((p) => (
                <FeedPost
                  key={p.id}
                  post={p}
                  onOpen={() => router.push(`/dish/${p.id}`)}
                  onAuthor={p.authorId ? () => router.push(`/cook/${p.authorId}`) : undefined}
                  onComments={() => router.push(`/dish/${p.id}?comments=1`)}
                  onAcorn={(on) => setAcorn(p.id, on)}
                  onSave={(on) => setSaved(p.id, on)}
                />
              ))}
              {posts.length >= 20 ? <FeedLoader /> : null}
              <View style={{ height: 96 }} />
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <Toast visible={!!toast} message={toast ?? ''} onHide={() => setToast(null)} bottom={insets.bottom + 96} />
      <TabBar active="home" progress={bar.progress} onTab={(k) => { if (k === 'profile') router.replace('/profile'); if (k === 'timer') router.replace('/timer'); if (k === 'community') router.replace('/community'); }} onCreate={() => router.push('/share/pick')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  wash: { position: 'absolute', left: 0, right: 0, top: 0, height: 420 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space[20] },
  titleBlock: { paddingTop: space[20], paddingHorizontal: space[20], gap: space[12] },
  pickBlock: { paddingTop: space[16], paddingHorizontal: space[20], gap: space[16] },
  // Block · feed: padding-top 40, gap 24 between Feed Posts (each also keeps its own 24 bottom padding).
  feed: { paddingTop: space[40], gap: space[24] },
});
