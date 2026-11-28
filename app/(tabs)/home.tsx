import { router } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useWashScroll } from '../../src/lib/useWashScroll';
import { syncPush } from '../../src/lib/push';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader, ScreenWash } from '../../src/components/ScreenHeader';
import { goTab, TabBar, useTabBarScroll, useTabFocusEffect } from '../../src/components/TabBar';
import { LocationCard } from '../../src/components/home/Cards';
import { AirQualityCard } from '../../src/components/home/AirQualityCard';
import { airCopyFor } from '../../src/copy';
import { airGrade, allowedMethodKeys, rankMenus, timeSlotAt, type AirLine } from '../../src/lib/airQuality';
import { useAir } from '../../src/lib/useAir';
import { useAirLine } from '../../src/lib/useAirLine';
import { FeedLoader } from '../../src/components/home/FeedLoader';
import { FeedPost, type FeedPostData } from '../../src/components/home/FeedPost';
import { HomeSkeleton } from '../../src/components/home/HomeSkeleton';
import { WeatherCard, type SlotView } from '../../src/components/home/WeatherCard';
import { Toast } from '../../src/components/Toast';
import { LoadError } from '../../src/components/LoadError';
import { mealTimeline, type Meal } from '../../src/lib/meals';
import { resetShareDraft, updateShareDraft } from '../../src/lib/shareDraft';
import { fetchPool, pickForSlot, sameGroup, type Ctx, type PoolDish } from '../../src/services/recommend';
import { resetOnboardingForDev, signOut } from '../../src/services/auth';
import { fetchFeed, fetchMyMarks, setAcorn, setSaved } from '../../src/services/foods';
import { timeAgo } from '../../src/lib/time';
import { displayTemp, usePrefs } from '../../src/lib/prefs';
import { getHere, placeLabel, useHere } from '../../src/lib/useHere';
import { postPlaceLine } from '../../src/services/location';
import { alertOpenSettings, locationBlocked } from '../../src/lib/permissions';
import { saveLocationChoice } from '../../src/services/profile';
import { tempAt, type Forecast } from '../../src/services/weather';
import { space } from '../../src/theme';

type HomeState =
  | { kind: 'loading' }
  | { kind: 'ready'; forecast: Forecast | null; place: string; city?: string; district?: string }
  | { kind: 'location-off'; city: string };

const DEFAULT_CITY = 'Seoul';

/** Empty slot → 8.1 with that meal ticked in 8.2 (Late ≈ dinner, Dawn ≈ breakfast). */
const shareTag = (m: Meal) => (m === 'late' ? 'dinner' : m === 'dawn' ? 'breakfast' : m);

/** 2.1 Home · 2.7 Loading · 2.5 Location off — docs/04-screens/02-home.md. Dishes come from services/recommend (§6.1–6.2). */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const bar = useTabBarScroll();
  usePrefs(); // re-render on °C / °F change
  const [realPosts, setRealPosts] = useState<FeedPostData[]>([]);
  const [pool, setPool] = useState<PoolDish[]>([]);
  // The pool answered at least once (or failed) — the air quality line waits for it (at most a few seconds).
  const [poolReady, setPoolReady] = useState(false);
  // Feed (and the picks pool) failed — offline / server error. With no posts on screen, the feed shows Try again.
  const [feedFailed, setFeedFailed] = useState(false);
  const [feedAttempt, setFeedAttempt] = useState(0);
  useTabFocusEffect(useCallback(() => {
    fetchPool().then(setPool).catch((e) => console.warn('[home] pool', e)).finally(() => setPoolReady(true));
  }, [feedAttempt]));
  useTabFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        try {
          const dishes = (await fetchFeed(60)).filter((d) => d.mood && d.tempC != null);
          const marks = await fetchMyMarks(dishes.map((d) => d.id));
          if (!alive) return;
          setFeedFailed(false);
          setRealPosts(dishes.map((d) => {
            const given = marks.given.has(d.id);
            return {
              id: d.id,
              name: d.creator.handle ?? d.creator.name,
              meta: [d.placeName ?? postPlaceLine(d), timeAgo(d.createdAt, t)].filter(Boolean).join(' · '),
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
          if (alive) setFeedFailed(true);
        }
      })();
      return () => { alive = false; };
    }, [t, feedAttempt]),
  );
  // New picks (§6.1): dishes already shown this session are skipped until the list runs out.
  const [seen, setSeen] = useState<Set<string>>(() => new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [allowing, setAllowing] = useState(false);

  // Weather + place come from the shared reading (lib/useHere) — the same one Profile and Community show.
  const { here, allow, reload } = useHere();
  // Skeleton never flashes for less than 600 ms (2.7).
  // Already read (coming back from another tab): no skeleton.
  const [minShown, setMinShown] = useState(() => getHere().status !== 'loading');
  useEffect(() => { const h = setTimeout(() => setMinShown(true), 600); return () => clearTimeout(h); }, []);
  const state: HomeState =
    here.status === 'loading' || !minShown
      ? { kind: 'loading' }
      : here.status === 'ready' || here.place?.city
        ? { kind: 'ready', forecast: here.forecast, place: placeLabel(here.place) || here.forecast?.city || '', city: here.place?.city ?? here.forecast?.city, district: here.place?.district }
        : { kind: 'location-off', city: DEFAULT_CITY };
  const load = reload;

  const allowLocation = async () => {
    if (await locationBlocked()) return alertOpenSettings(t('home.locationOff.denied')); // iOS won't ask again
    setAllowing(true);
    const ok = await allow();
    setAllowing(false);
    if (!ok) return; // the user just said no to the system prompt — nothing more to show
    const p = getHere().place;
    await saveLocationChoice({ city: p?.city, country: p?.countryCode ?? p?.country, locationEnabled: true }).catch(() => undefined);
  };

  // Mood wash scrolls away with the content and fades out (gone after ~300 pt).
  const wash = useWashScroll();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  // 9.4 Today's pick push: the first Home visit is where we ask for notification permission (iOS asks only once).
  useEffect(() => { syncPush({ ask: true }); }, []);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    wash.onY(y);
    const { contentSize, layoutMeasurement } = e.nativeEvent;
    bar.onY(y, contentSize.height - layoutMeasurement.height);
  };

  const now = useMemo(() => new Date(), [state]);
  const ready = state.kind === 'ready' ? state : null;
  const f = ready?.forecast ?? null;

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

  // Air quality card (§6.11): grade from PM10 / PM2.5 → a line from src/copy for this grade · time slot, with the most
  // popular dish nearby whose cooking methods fit the grade. Copy = Korean only for now, in every app language.
  const { copy: airCopy, lang: airLang } = airCopyFor(i18n.language);
  const { air, retry: retryAir } = useAir(here);
  const grade = air.status === 'ready' ? airGrade(air.reading) : null;
  const airSlot = timeSlotAt(now, airCopy.timeSlots);
  const menus = useMemo(
    () => (grade
      ? rankMenus(pool.map((d) => ({ id: d.id, name: d.name, methods: d.methods, acorns: d.acorns, neighborhood: d.neighborhood, city: d.city, createdAt: +d.createdAt })), allowedMethodKeys(airCopy, grade), place)
      : []),
    [pool, grade, airCopy, ready?.city, ready?.district], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const airLine = useAirLine(airCopy, grade, airSlot, menus, poolReady);
  const onAirAction = (l: AirLine) => {
    switch (l.action) {
      case 'recipe':
        if (l.dish) router.push(`/dish/${l.dish.id}`);
        else router.push({ pathname: '/tag/[tag]', params: { tag: 'method:simmer' } });
        return;
      case 'shopping': goTab('profile', { tab: 'diary', focus: 'shopping', at: String(Date.now()) }); return;
      case 'pantry': goTab('profile', { tab: 'diary', focus: 'pantry', at: String(Date.now()) }); return;
      case 'neighbors': router.push({ pathname: '/nearby-feed', params: { area: 'near' } }); return;
      case 'byMethod': router.push({ pathname: '/tag/[tag]', params: { tag: 'method:simmer' } }); return;
    }
  };

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
      { text: 'Weather mood preview', onPress: () => router.push('/dev/weather') },
      { text: 'Run onboarding again', onPress: async () => { await resetOnboardingForDev(); router.replace('/'); } },
      { text: 'Sign out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/'); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // Weather Card 136:4716: "H 14° · L 8°" on one line, "until 9 PM" on the next.
  const detail = f ? t('home.hiLo', { hi: displayTemp(f.hi), lo: displayTemp(f.lo) }) : t('home.retry');
  const until = f?.until ? t('home.untilLine', { time: f.until.toLocaleTimeString(i18n.language, { hour: 'numeric' }) }) : undefined;

  // Block · feed 123:3261 — padding-top 24, no gap (each Feed Post ends with its own 18). Under the Weather card (2.1); under the location card when location is off.
  const feed = (
    <View style={styles.feed}>
      {feedFailed && !posts.length ? <LoadError onRetry={() => { setFeedFailed(false); setFeedAttempt((n) => n + 1); }} /> : null}
      {posts.map((p) => (
        <HomePost key={p.id} post={p} />
      ))}
      {posts.length >= 20 ? <FeedLoader /> : null}
      <View style={{ height: 96 }} />
    </View>
  );

  // Transparent root: the global WeatherBackdrop (bg/default + wash + weather motion) shows through.
  return (
    <View style={styles.root}>
      <ScreenWash wash={wash} />

      <ScrollView
        ref={scroll}
        onScroll={onScroll}
        scrollEventThrottle={16}
        scrollEnabled={state.kind !== 'loading'}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader right="notifications" onLogoLongPress={devMenu} withWeather />
        {state.kind === 'loading' ? (
          <View>
            <HomeSkeleton />
          </View>
        ) : state.kind === 'location-off' ? (
          <View>
            <View style={styles.px}>
              <LocationCard onChooseCity={() => router.push('/settings/city')} onAllowLocation={allowLocation} busy={allowing} />
            </View>
            {feed}
          </View>
        ) : (
          <View>
            <View style={styles.px}>
              <WeatherCard
                tempC={f?.tempC}
                mood={f?.mood}
                icon={f?.icon}
                condition={f ? t(`home.condition.${f.mood}`) : t('home.noWeather')}
                detail={detail}
                until={until}
                slots={slots}
                picksHead={t('home.picksHead')}
                onRefresh={refreshPicks}
                onSlotPress={(s) => onSlot(slots.indexOf(s))}
              />
              <View style={styles.airGap} />
              <AirQualityCard
                copy={airCopy}
                lang={airLang}
                air={air}
                line={airLine}
                onAllowLocation={allowLocation}
                allowing={allowing}
                onRetry={retryAir}
                onAction={onAirAction}
              />
            </View>
            {feed}
          </View>
        )}
      </ScrollView>

      <Toast visible={!!toast} message={toast ?? ''} onHide={() => setToast(null)} bottom={insets.bottom + 96} />
      <TabBar active="home" progress={bar.progress} onTab={(k) => (k === 'home' ? scroll.current?.scrollTo({ y: 0, animated: true }) : goTab(k))} onCreate={() => router.push('/share/pick')} />
    </View>
  );
}

/** A feed post with its handlers built from the post itself, so Home re-renders (toast, weather…) skip unchanged posts. */
const HomePost = memo(function HomePost({ post: p }: { post: FeedPostData }) {
  return (
    <FeedPost
      post={p}
      onOpen={() => router.push(`/dish/${p.id}`)}
      onAuthor={p.authorId ? () => router.push(`/cook/${p.authorId}`) : undefined}
      onComments={() => router.push(`/dish/${p.id}?comments=1`)}
      onAcorn={(on) => setAcorn(p.id, on)}
      onSave={(on) => setSaved(p.id, on)}
    />
  );
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  // Body under ScreenHeader (withWeather: its 18 bottom = title → Weather card).
  px: { paddingHorizontal: space[20] },
  // Weather card → 12 → Air quality card.
  airGap: { height: space[12] },
  // Block · feed 123:3261: padding-top 24, no gap — posts are spaced by their own 18 bottom padding.
  feed: { paddingTop: space[24] },
});
