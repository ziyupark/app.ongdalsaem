import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Chip } from '../../src/components/Chip';
import {
  Avatar, FoodRow, PhotoCard, SectionHeader, MoreButton, useMyId, useReportMenu,
} from '../../src/components/community/Parts';
import { LoadError } from '../../src/components/LoadError';
import { ChallengesTab } from '../../src/components/community/ChallengesTab';
import { OurArea } from '../../src/components/community/Nearby';
import { upcomingFestive } from '../../src/lib/holidays';
import { FestiveCard } from '../../src/components/community/FestiveCard';
import { ScreenHeader, ScreenWash, useScreenInk } from '../../src/components/ScreenHeader';
import Animated, {
  scrollTo, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useReducedMotion, useSharedValue, type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useWashScroll } from '../../src/lib/useWashScroll';
import { AcornTag, WeatherTag } from '../../src/components/PhotoTags';
import { goTab, TabBar, useTabBarScroll, useTabFocusEffect, type TabKey } from '../../src/components/TabBar';
import { UnderlineTabs } from '../../src/components/UnderlineTabs';
import { Text } from '../../src/components/Text';
import { CUSTOM_MOOD_ICON, MOOD_TAGS } from '../../src/lib/tags';
import { timeAgo } from '../../src/lib/time';
import {
  fetchGlobal, fetchMyDishesSince, fetchNeighborPlates, fetchStoryOfTheDay,
  localDate, localMidnight, topTags, type CardDish,
} from '../../src/services/community';
import { Plate, PlateGrid, PlateTable, type PlateItem } from '../../src/components/community/PlateTable';
import { fetchMyMarks, setAcorn, setSaved } from '../../src/services/foods';
import { cellsAround } from '../../src/lib/geohash';
import { useHere } from '../../src/lib/useHere';
import { space, useTheme } from '../../src/theme';
import { postPlace } from '../../src/services/location';

/** Holidays shown in the 4.1 carousel (nearest first); the more button lists them all. */
const FESTIVE_CAROUSEL = 8;

type Seg = 'global' | 'following' | 'challenges';

const SEGS: Seg[] = ['global', 'following', 'challenges'];

/**
 * Community (Figma 3.1 Nearby 19:663 · 3.2 empty · 3.3 no results · 3.4 typing · 3.5 results · 3.6 area · 4.1 Global 19:818 ·
 * 4.4 Following 183:5713 · 4.4b empty). ScreenHeader (bell) → Tabs → content.
 *
 * Tabs = a horizontal pager under the (fixed) header + tab row: swipe or tap to slide between pages, the underline follows
 * the swipe. One vertical scroll for everything (the header scrolls away as before); each page still keeps its own
 * scroll position — once the tab row has scrolled off, a page comes back where it was left (X / YouTube). Pages that are
 * off to the side are shifted so they already sit at that position while they slide in, and on landing the outer scroll
 * jumps to it in the same frame. With the header in view, all pages share the scroll (they show their top).
 */
export default function Community() {
  // tab=challenges from the share flow / 4.10c (at = a fresh value each time); focus=join scrolls to the Join button.
  const params = useLocalSearchParams<{ tab?: Seg; at?: string; focus?: string }>();
  const { color } = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const reduce = useReducedMotion();
  const first = SEGS.includes(params.tab as Seg) ? (params.tab as Seg) : 'global';
  const [seg, setSegState] = useState<Seg>(first);
  const segRef = useRef(seg);
  const [visited, setVisited] = useState<Set<Seg>>(() => new Set([first]));
  const visit = useCallback((ks: Seg[]) => setVisited((v) => (ks.every((k) => v.has(k)) ? v : new Set([...v, ...ks]))), []);
  const bar = useTabBarScroll();
  // Header + mood wash = the shared ScreenHeader / ScreenWash (same as Home · Timer · Profile); it scrolls away with
  // the content and fades out (~300 pt). Tabs sit ≈ 55 % down the 420 wash, under the header.
  const wash = useWashScroll();
  const tabInk = useScreenInk(0.55);

  // ---- pager state (UI thread)
  const outer = useAnimatedRef<Animated.ScrollView>();
  const pager = useAnimatedRef<Animated.ScrollView>();
  const sy = useSharedValue(0); // outer scroll y
  const top = useSharedValue(0); // where the pages start in the outer scroll content
  const active = useSharedValue(SEGS.indexOf(first)); // settled page
  const pos = useSharedValue(SEGS.indexOf(first)); // pager position in pages (fractional mid-swipe) — drives the underline
  const saved = useSharedValue<number[]>([0, 0, 0]); // each page's own scroll below the pages' top
  const dragging = useSharedValue(false);
  const pageW = useSharedValue(width);
  useEffect(() => { pageW.value = width; }, [width, pageW]);
  // Pages' top in the outer content = wrapper's y (after the header) + the pager's y in it (after the tab row).
  const wrapY = useRef(0);
  const pagerY = useRef(0);
  const topY = useRef(0);
  const placeTop = () => {
    topY.current = wrapY.current + pagerY.current;
    top.value = topY.current;
  };
  const opened = useRef(false);
  // Idle: the pager is as tall as the current page. Sliding: as tall as the tallest (room for every page's position).
  const [heights, setHeights] = useState<number[]>([0, 0, 0]);
  const [moving, setMoving] = useState(false);
  const onHeight = useCallback((i: number, h: number) => setHeights((hs) => (hs[i] === h ? hs : hs.map((v, k) => (k === i ? h : v)))), []);

  // Re-open a tab when navigated back here with ?tab=…; ?focus=join brings the Challenges Join button into view.
  const joinY = useRef<number | null>(null);
  const wantJoin = useRef(false);
  const toJoin = useCallback(() => {
    if (!wantJoin.current || joinY.current == null || segRef.current !== 'challenges') return;
    wantJoin.current = false;
    outer.current?.scrollTo({ y: Math.max(0, topY.current + joinY.current - space[42] * 3), animated: true });
  }, [outer]);

  // JS side of a page landing (called from the UI thread).
  const settled = useRef<(j: number, y: number) => void>(() => undefined);
  settled.current = (j: number, y: number) => {
    segRef.current = SEGS[j];
    setSegState(SEGS[j]);
    setMoving(false);
    bar.sync(y);
    toJoin();
  };
  const onSettled = useCallback((j: number, y: number) => settled.current(j, y), []);
  const onDragStart = useCallback(() => {
    setMoving(true);
    const i = SEGS.indexOf(segRef.current);
    visit(SEGS.filter((_, k) => Math.abs(k - i) === 1)); // mount the neighbours a swipe can reveal
  }, [visit]);
  const onY = useRef<(y: number, maxY: number) => void>(() => undefined);
  onY.current = (y: number, maxY: number) => { wash.onY(y); bar.onY(y, maxY); };
  const onOuterY = useCallback((y: number, maxY: number) => onY.current(y, maxY), []);

  /** Page j has landed: remember the old page's scroll, jump the outer scroll to the new page's (same frame as the shift reset). */
  const settle = (j: number) => {
    'worklet';
    const i = active.value;
    if (j === i || j < 0 || j >= SEGS.length) return;
    const P = top.value;
    const y = sy.value;
    let ny = y;
    let s = saved.value.slice();
    if (y > P) {
      s[i] = y - P;
      ny = P + s[j];
    } else {
      s = s.map(() => 0); // header in view → every page shows its top
    }
    saved.value = s;
    active.value = j;
    if (ny !== y) {
      sy.value = ny;
      scrollTo(outer, 0, ny, false);
    }
    scheduleOnRN(onSettled, j, ny);
  };

  const onOuterScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      sy.value = e.contentOffset.y;
      scheduleOnRN(onOuterY, e.contentOffset.y, e.contentSize.height - e.layoutMeasurement.height);
    },
  });
  const onPagerScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      const w = pageW.value;
      if (!w) return;
      const p = e.contentOffset.x / w;
      pos.value = p;
      const j = Math.round(p);
      // Programmatic slides (tab tap) and drags that end without momentum land here.
      if (!dragging.value && Math.abs(p - j) < 0.002) settle(j);
    },
    onBeginDrag: () => {
      dragging.value = true;
      scheduleOnRN(onDragStart);
    },
    onEndDrag: () => { dragging.value = false; },
    onMomentumEnd: (e) => {
      const w = pageW.value;
      if (w) settle(Math.round(e.contentOffset.x / w));
    },
  });

  /** Tab tap / ?tab= — slide to the page (Reduce Motion or `instant`: jump). */
  const goTo = useCallback((k: Seg, instant = false) => {
    if (k === segRef.current) return;
    visit([k]);
    setMoving(true);
    // Next frame: the pager has grown to its sliding height before the landing moves the outer scroll.
    requestAnimationFrame(() => pager.current?.scrollTo({ x: SEGS.indexOf(k) * width, animated: !(instant || reduce) }));
  }, [visit, pager, width, reduce]);

  useEffect(() => {
    if (params.tab && SEGS.includes(params.tab)) goTo(params.tab, true);
    if (params.focus === 'join') {
      wantJoin.current = true;
      // Already on Challenges (laid out) → scroll once this frame settles; otherwise the landing / onJoinY does it.
      requestAnimationFrame(toJoin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.tab, params.at, params.focus]);
  const onJoinY = useCallback((y: number) => {
    joinY.current = y;
    toJoin();
  }, [toJoin]);

  const onTab = (k: TabKey) => (k === 'community' ? outer.current?.scrollTo({ y: 0, animated: true }) : goTab(k));

  const idx = SEGS.indexOf(seg);
  // Pager height (0 = not measured yet → natural). Each page is clipped to it, so the pager never scrolls vertically.
  const pagerH = (moving ? Math.max(...heights) : heights[idx]) || undefined;
  const page = (k: Seg) => {
    if (!visited.has(k)) return null;
    if (k === 'global') return <Global />;
    if (k === 'following') return <Following />;
    return <ChallengesTab onJoinY={onJoinY} />;
  };

  // Transparent root: the global WeatherBackdrop (bg/default + wash + weather motion) shows through.
  return (
    <View style={styles.root}>
      <ScreenWash wash={wash} />
      <Animated.ScrollView
        ref={outer}
        contentContainerStyle={{ paddingBottom: 110 }}
        onScroll={onOuterScroll}
        scrollEventThrottle={16}
      >
        <ScreenHeader right="notifications" />
        <Animated.View onLayout={(e) => { wrapY.current = e.nativeEvent.layout.y; placeTop(); }}>
        {/* Block · Tabs 330:7325 — no fill: the mood wash runs behind the title and the tabs. */}
        <View>
          {/* Block · Tabs 1238:16782 — pt 14 (header pb 12 + 2) → tabs 43 → hairline. */}
          <UnderlineTabs
            style={styles.tabsBlock}
            ink={tabInk}
            contentStyle={styles.tabRow}
            labelVariant="Title/M"
            value={seg}
            onChange={(k) => goTo(k)}
            progress={pos}
            items={[
              { key: 'global', label: t('community.explore') },
              { key: 'following', label: t('community.following') },
              { key: 'challenges', label: t('community.challengesTab') },
            ]}
          />
        </View>
        {/* Pages stay mounted once opened — switching keeps their data, images and scroll position. */}
        <Animated.ScrollView
          ref={pager}
          horizontal
          pagingEnabled
          disableIntervalMomentum
          decelerationRate="fast"
          bounces={false}
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: SEGS.indexOf(first) * width, y: 0 }}
          onLayout={(e) => {
            pagerY.current = e.nativeEvent.layout.y;
            placeTop();
            // Opened on ?tab=… — contentOffset isn't applied everywhere (Android); put the pager on that page once.
            if (!opened.current) {
              opened.current = true;
              const i = SEGS.indexOf(first);
              if (i > 0) pager.current?.scrollTo({ x: i * width, animated: false });
            }
          }}
          onScroll={onPagerScroll}
          scrollEventThrottle={16}
          alwaysBounceVertical={false}
          directionalLockEnabled
          style={{ height: pagerH }}
          contentContainerStyle={styles.pagerRow}
        >
          {SEGS.map((k, i) => (
            <Page key={k} index={i} width={width} height={pagerH} sy={sy} top={top} active={active} saved={saved} onHeight={onHeight}>
              {page(k)}
            </Page>
          ))}
        </Animated.ScrollView>
        </Animated.View>
      </Animated.ScrollView>
      <TabBar active="community" progress={bar.progress} onTab={onTab} onCreate={() => router.push('/share/pick')} />
    </View>
  );
}

/**
 * One pager page. The current page is laid out as is; the others are shifted so that, when the tab row has scrolled
 * off, they show their own remembered scroll (they slide in already in place).
 */
function Page({ index, width, height, sy, top, active, saved, onHeight, children }: {
  index: number; width: number; height: number | undefined; sy: SharedValue<number>; top: SharedValue<number>; active: SharedValue<number>;
  saved: SharedValue<number[]>; onHeight: (i: number, h: number) => void; children: ReactNode;
}) {
  const shift = useAnimatedStyle(() => {
    const inner = Math.max(0, sy.value - top.value);
    const want = index === active.value ? inner : sy.value > top.value ? saved.value[index] : 0;
    return { transform: [{ translateY: inner - want }] };
  });
  return (
    <View style={[styles.page, { width, height }]}>
      <Animated.View style={shift} onLayout={(e) => onHeight(index, e.nativeEvent.layout.height)}>
        {children}
      </Animated.View>
    </View>
  );
}

// ------------------------------------------------------------------------------------------------ Explore (4.1 Global + Nearby)

/**
 * Tab hero title (Story of the day · Neighbors' Table) — Display/M fg/default (Fraunces like the header weather title),
 * always English; screen readers get the local string.
 */
function HeroTitle({ k, variant = 'Display/M' }: { k: string; variant?: 'Display/M' | 'Title/L' }) {
  const { t, i18n } = useTranslation();
  const en = useMemo(() => i18n.getFixedT('en'), [i18n]);
  return <Text variant={variant} accessibilityRole="header" accessibilityLabel={t(k)} numberOfLines={1}>{en(k)}</Text>;
}

function Global() {
  const { t, i18n } = useTranslation();
  const [dishes, setDishes] = useState<CardDish[] | null>(null);
  const [story, setStory] = useState<CardDish | null>(null);
  // Story of the day fetched (or failed) — Popular today waits for it so the two never show the same post.
  const [storyReady, setStoryReady] = useState(false);
  // My acorn on the Story of the day: given (filled) + count change since the last load.
  const [storyAcorn, setStoryAcorn] = useState<{ id: string | null; given: boolean; delta: number }>({ id: null, given: false, delta: 0 });
  const [tag, setTag] = useState<string | null>(null);
  const [saved, setSavedIds] = useState<Set<string>>(new Set());

  const storyMark = storyAcorn.id === story?.id ? storyAcorn : { given: false, delta: 0 };
  const toggleStoryAcorn = () => {
    if (!story) return;
    const id = story.id;
    const on = !storyMark.given;
    const step = on ? 1 : -1;
    setStoryAcorn({ id, given: on, delta: storyMark.delta + step });
    setAcorn(id, on).catch(() => setStoryAcorn((a) => (a.id === id ? { ...a, given: !on, delta: a.delta - step } : a)));
  };

  // Popular dishes (and Trending tags) failed to load — offline / server error. A banner with Try again, not empty sections.
  const [failed, setFailed] = useState(false);
  // Bumped after blocking someone: Our area (Popular today · questions) loads again too.
  const [reload, setReload] = useState(0);
  const me = useMyId();
  // Story of the day = today's pick for my weather (mood + temp ±1). Waits for the forecast (cached one counts).
  const { here } = useHere();
  const wxReady = here.status !== 'loading' || !!here.forecast;
  const wxMood = here.forecast?.mood ?? null;
  const wxTemp = here.forecast?.tempC ?? null;
  const load = useCallback(() => {
      if (!wxReady) return;
      fetchStoryOfTheDay(wxMood && wxTemp != null ? { mood: wxMood, tempC: wxTemp } : null).then(async (d) => {
        setStory(d);
        setStoryReady(true);
        if (!d) return;
        setStoryAcorn({ id: d.id, given: false, delta: 0 });
        const marks = await fetchMyMarks([d.id]).catch(() => null);
        if (marks) setStoryAcorn({ id: d.id, given: marks.given.has(d.id), delta: 0 });
      }).catch(() => { setStory(null); setStoryReady(true); });
      return fetchGlobal(null).then(async (l) => {
        setDishes(l);
        setFailed(false);
        const marks = await fetchMyMarks(l.map((d) => d.id)).catch(() => null);
        if (marks) setSavedIds((s) => new Set([...s, ...marks.saved]));
      }).catch(() => setFailed(true));
  }, [wxReady, wxMood, wxTemp]);
  useTabFocusEffect(useCallback(() => { load(); }, [load]));
  // ⋯ → report / block (7.3). Blocking reloads every section — RLS then leaves that cook out of all of them.
  const report = useReportMenu(() => { setReload((n) => n + 1); load(); });
  const tags = useMemo(() => (dishes ? topTags(dishes, 'moods', 6) : []), [dishes]);
  useEffect(() => { if (tags.length && (!tag || !tags.includes(tag))) setTag(tags[0]); }, [tags, tag]);
  const tagged = (dishes ?? []).filter((d) => tag && d.moods.includes(tag)).slice(0, 3);
  const tagLabel = (k: string) => (i18n.exists(`share.moods.${k}`) ? t(`share.moods.${k}`) : k);
  // The carousel shows the nearest few; the more button opens every holiday (app/holidays.tsx).
  const festive = useMemo(() => upcomingFestive().slice(0, FESTIVE_CAROUSEL), []);

  const toggleSave = async (id: string) => {
    const on = !saved.has(id);
    setSavedIds((s) => { const n = new Set(s); if (on) n.add(id); else n.delete(id); return n; });
    try { await setSaved(id, on); } catch { setSavedIds((s) => { const n = new Set(s); if (on) n.delete(id); else n.add(id); return n; }); }
  };
  const row = (d: CardDish) => (
    <FoodRow
      key={d.id}
      dish={d}
      eyebrow={[d.meals[0] ? t(`share.meals.${d.meals[0]}`, { defaultValue: d.meals[0] }) : null, d.tempC != null ? `${d.tempC}°` : null].filter(Boolean).join(' · ')}
      byline={[d.creator.handle ?? d.creator.name, postPlace(d).city, timeAgo(d.createdAt, t)].filter(Boolean).join(' · ')}
      saved={saved.has(d.id)}
      onSave={() => toggleSave(d.id)}
      onPress={() => router.push(`/dish/${d.id}`)}
      onMore={d.creator.id !== me ? () => report.open({ kind: 'dish', id: d.id, owner: d.creator }) : undefined}
    />
  );

  // Explore (4.1 1113:25908 · 1219:15437 — py 28, sections 38 apart): Story of the day → Popular today → Neighbourhood
  // questions → Trending tags → Special days around the world.
  return (
    <View style={styles.explore}>
      {failed && !dishes ? <LoadError onRetry={load} /> : null}
      {/* Group 1113:25926 — px 20 · gap 16: title → Story Card 350×420. */}
      {story ? (
        <View style={[styles.px, styles.storyGroup]}>
          <HeroTitle k="community.story" />
          <PhotoCard photo={story.photo} width={0} height={420} label={story.name} onPress={() => router.push(`/dish/${story.id}`)} style={styles.story}>
            {story.creator.id !== me ? (
              <View style={styles.storyMore}>
                <MoreButton color="fg/on-photo" onPress={() => report.open({ kind: 'dish', id: story.id, owner: story.creator })} />
              </View>
            ) : null}
            <View style={styles.storyFoot}>
              <View style={styles.storyBody}>
                <View style={[styles.flex, styles.storyText]}>
                  {/* Dish name (Statement, 2 lines) → description (Body/M, 2 lines) → byline. */}
                  <Text variant="Statement" color="fg/on-photo" numberOfLines={2}>{story.name}</Text>
                  {story.description ? <Text variant="Body/M" color="fg/on-photo-secondary" numberOfLines={2}>{story.description}</Text> : null}
                  <Text variant="Body/S" color="fg/on-photo-secondary" numberOfLines={1}>{[story.creator.name, postPlace(story).city, timeAgo(story.createdAt, t)].filter(Boolean).join(' · ')}</Text>
                </View>
                <Avatar url={story.creator.avatarUrl} name={story.creator.name} size={40} />
              </View>
              <View style={styles.tagRow}>
                {story.mood && story.tempC != null ? <WeatherTag mood={story.mood} tempC={story.tempC} condition={t(`weather.${story.mood}`)} /> : <View />}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('home.acorns', { count: story.acorns + storyMark.delta })}
                  accessibilityState={{ selected: storyMark.given }}
                  hitSlop={space[8]}
                  onPress={toggleStoryAcorn}
                >
                  <AcornTag count={story.acorns + storyMark.delta} given={storyMark.given} />
                </Pressable>
              </View>
            </View>
          </PhotoCard>
        </View>
      ) : null}

      {/* Our area — Popular today · Neighbourhood questions + Ask (or turn location on). */}
      <OurArea excludeId={storyReady ? story?.id ?? null : undefined} reload={reload} onMore={report.open} />

      {/* Group · Trending tags 1113:25982 — gap 16: header → chips → up to 3 Food Cards (rows inset p4, gap 12). */}
      {tags.length ? (
        <View style={styles.group16}>
          <SectionHeader title={t('community.trendingTags')} moreColor="fg/default" onMore={tag ? () => router.push(`/tag/${tag}`) : undefined} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsTight}>
            {tags.map((k) => <Chip key={k} label={tagLabel(k)} icon={MOOD_TAGS.find((m) => m.key === k)?.icon ?? CUSTOM_MOOD_ICON} selected={tag === k} onPress={() => setTag(k)} />)}
          </ScrollView>
          <View style={styles.rows}>{tagged.map(row)}</View>
        </View>
      ) : null}

      {/* Group · Festive 1113:25999 — gap 16: title · chevron 24 (→ all holidays), then 168×196 Festive Cards, gap 12. */}
      <View style={styles.group16}>
        <SectionHeader title={t('community.festiveTitle')} moreColor="fg/default" moreSize={24} onMore={() => router.push('/holidays')} moreLabel={t('community.allHolidays')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
          {festive.map((h) => <FestiveCard key={h.key} h={h} />)}
        </ScrollView>
      </View>
      {report.sheet}
    </View>
  );
}

// ------------------------------------------------------------------------------------------------ Table (4.4)

/** Plates before "See more": today 3 rows × 3, earlier days 2 rows × 3. */
const TODAY_PLATES = 9;
const PAST_PLATES = 6;

const toPlate = (d: CardDish, label = d.name): PlateItem => ({
  id: d.id, photo: d.photo, label, cook: { id: d.creator.id, name: d.creator.handle ?? d.creator.name, avatarUrl: d.creator.avatarUrl },
});

/** Days on the table: today and the 13 days before (2 weeks). */
const TABLE_DAYS = 14;

/**
 * 4.4 Community · Table (Figma 730:11217) — "Neighbors' Table" title, then one table per local day over the last 2 weeks
 * (today always · then days with plates: yesterday · the date). Each table = my posts that day first as "My seat"
 * (1233:11754) — no empty "Place your dish" seat — then neighbours' posts (area cell → neighbouring cells → district), in the order they were posted. No follow buttons.
 */
function Following() {
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const { here } = useHere();
  const [mine, setMine] = useState<CardDish[] | null>(null);
  const [neighbors, setNeighbors] = useState<CardDish[]>([]);
  const [open, setOpen] = useState<Set<string>>(new Set());

  const district = here.place?.district ?? null;
  const city = here.place?.city ?? null;
  const load = useCallback(async () => {
    if (here.status === 'loading') return;
    const from = localMidnight();
    from.setDate(from.getDate() - (TABLE_DAYS - 1));
    const cells = here.coords ? cellsAround(here.coords.latitude, here.coords.longitude, 5) : [];
    const [my, near] = await Promise.all([
      fetchMyDishesSince(from).catch(() => [] as CardDish[]),
      fetchNeighborPlates({ cell: here.cell, cells, district, city }, from).catch(() => [] as CardDish[]),
    ]);
    setMine(my);
    setNeighbors(near);
  }, [here.status, here.coords, here.cell, district, city]);
  useTabFocusEffect(useCallback(() => { load(); }, [load]));

  const day = (d: Date) => d.toLocaleDateString(i18n.language, { weekday: 'long', month: 'short', day: 'numeric' });

  // Group by local date: today always first, then every day with plates, newest day first; plates oldest post first.
  const tables = useMemo(() => {
    if (!mine) return [];
    const now = new Date();
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const today = localDate(now);
    const yesterday = localDate(y);
    const byDay = new Map<string, { date: Date; mine: CardDish[]; plates: CardDish[] }>([[today, { date: now, mine: [], plates: [] }]]);
    const seen = new Set<string>();
    const myIds = new Set(mine.map((d) => d.id));
    for (const d of [...mine, ...neighbors]) {
      if (seen.has(d.id)) continue;
      seen.add(d.id);
      const k = localDate(d.createdAt);
      if (!byDay.has(k)) byDay.set(k, { date: d.createdAt, mine: [], plates: [] });
      byDay.get(k)![myIds.has(d.id) ? 'mine' : 'plates'].push(d);
    }
    const byTime = (a: CardDish, b: CardDish) => a.createdAt.getTime() - b.createdAt.getTime();
    for (const v of byDay.values()) { v.mine.sort(byTime); v.plates.sort(byTime); }
    return [...byDay.entries()]
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([key, v]) => ({ key, ...v, kind: key === today ? 'today' : key === yesterday ? 'yesterday' : 'older' }));
  }, [mine, neighbors]);

  if (mine == null) return <ActivityIndicator color={color('fg/muted')} style={styles.loading} />;

  return (
    <View>
      {/* Group · Title 813:12215 — pt 22 · px 20 · pb 3, Title/L "Neighbors' Table". */}
      <View style={[styles.px, styles.storyTop]}>
        <HeroTitle k="following.title" variant="Title/L" />
      </View>
      <View style={styles.tables}>
      {tables.map((tb) => {
        const seat = tb.mine.map((d) => (
          <Plate key={d.id} mine item={toPlate(d, t('following.mySeat'))} onPress={() => router.push(`/dish/${d.id}`)} onCook={() => router.push(`/cook/${d.creator.id}`)} />
        ));
        const plates = [...seat, ...tb.plates.map((d) => (
          <Plate key={d.id} item={toPlate(d)} onPress={() => router.push(`/dish/${d.id}`)} onCook={() => router.push(`/cook/${d.creator.id}`)} />
        ))];
        const max = tb.kind === 'today' ? TODAY_PLATES : PAST_PLATES;
        const all = open.has(tb.key);
        const title = tb.kind === 'today' ? t('following.todayTable') : tb.kind === 'yesterday' ? t('following.yesterdayTable') : day(tb.date);
        return (
          <PlateTable
            key={tb.key}
            title={title}
            subtitle={tb.kind === 'older' ? undefined : day(tb.date)}
            moreLabel={t('following.seeMore')}
            onMore={!all && plates.length > max ? () => setOpen((s) => new Set(s).add(tb.key)) : undefined}
          >
            {plates.length ? <PlateGrid>{all ? plates : plates.slice(0, max)}</PlateGrid> : null}
          </PlateTable>
        );
      })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Pages side by side, each as tall as its own content (the pager's height is set from the current page).
  pagerRow: { alignItems: 'flex-start' },
  page: { overflow: 'hidden' },
  // Following · Tables 730:11394 — p6 20 24 under the title (title → first table = Story's title → card gap 6) · gap 24.
  // Group 1010:20672 — title (pb 3) → 6 → Following · Tables 730:11394 (pt 6, p 20, pb 24, gap 24): title → first table 15.
  tables: { paddingHorizontal: space[20], paddingTop: 3 + space[6] + space[6], paddingBottom: space[24], gap: space[24] },
  root: { flex: 1 },
  flex: { flex: 1 },
  px: { paddingHorizontal: space[20] },
  tabsBlock: { paddingTop: 2 },
  // Tabs 1113:25921 — gap 16, pl 20.
  tabRow: { gap: space[16], paddingHorizontal: space[20] },
  chipsTight: { flexDirection: 'row', gap: space[8], paddingHorizontal: space[20] },
  loading: { marginTop: space[40] },
  // 4.1 groups: p42 top; header → content gap 6 (Story · Trending Bites · Festive) / 9 → 8 token (Trending tags).
  carousel: { gap: space[12], paddingHorizontal: space[20] },
  tagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rows: { paddingHorizontal: space[20], paddingTop: space[4], gap: space[12] },
  storyTop: { paddingTop: space[42] - space[20] },
  // Frame 48 (4.1 1238:16768) — pt 21 · pb 28, sections 38 apart; then the 110 tab bar spacer.
  explore: { paddingTop: 21, paddingBottom: 28, gap: 38 },
  storyGroup: { gap: space[16] },
  group16: { gap: space[16] },
  // ⋯ on the photo, top right (the card's p24 corner).
  storyMore: { position: 'absolute', top: space[24], right: space[24] },
  story: { width: '100%', padding: space[24], justifyContent: 'flex-end' },
  storyFoot: { gap: space[16] },
  storyBody: { flexDirection: 'row', alignItems: 'flex-end', gap: space[16] },
  storyText: { gap: space[8] },
});
