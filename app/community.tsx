import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ChevronRight, Send, Cookie, Moon, Plus, Star, Sun, type LucideIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Chip } from '../src/components/Chip';
import {
  Avatar, FoodRow, FollowButton, PhotoCard, SectionHeader, FlagTag,
} from '../src/components/community/Parts';
import { ChallengesTab } from '../src/components/community/ChallengesTab';
import { NearbySearch, OurArea } from '../src/components/community/Nearby';
import { filtersToParams, hasFilters, NO_FILTERS, type SearchFilters } from '../src/components/community/SearchFilters';
import { useHere } from '../src/lib/useHere';
import { upcomingFestive } from '../src/lib/holidays';
import { FestiveCard } from '../src/components/community/FestiveCard';
import { Icon } from '../src/components/Icon';
import { MoodGradient } from '../src/components/MoodGradient';
import { ScreenHeader, ScreenWash, useScreenInk } from '../src/components/ScreenHeader';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useWashScroll } from '../src/lib/useWashScroll';
import { AcornTag, WeatherTag } from '../src/components/PhotoTags';
import { TabBar, useTabBarScroll, type TabKey } from '../src/components/TabBar';
import { UnderlineTabs } from '../src/components/UnderlineTabs';
import { Text } from '../src/components/Text';
import { CUSTOM_MOOD_ICON, LANDSCAPES, MOOD_TAGS } from '../src/lib/tags';
import { timeAgo } from '../src/lib/time';
import { follow } from '../src/services/activity';
import { hasUnreadMessages } from '../src/services/messages';
import {
  fetchFolloweeIds, fetchFollowingFeed, fetchGlobal, fetchMyDishesSince, fetchStoryOfTheDay, fetchSuggestedPlates,
  fetchTrendingByCountry, localDate, localMidnight, timeLeft, topTags, type CardDish, type Challenge, type FollowingItem,
} from '../src/services/community';
import { EmptySeat, Plate, PlateGrid, PlateTable, type PlateItem } from '../src/components/community/PlateTable';
import { fetchMyMarks, setSaved } from '../src/services/foods';
import { radius, space, useTheme } from '../src/theme';

/** Holidays shown in the 4.1 carousel (nearest first); the more button lists them all. */
const FESTIVE_CAROUSEL = 8;

type Seg = 'global' | 'following' | 'challenges';

/**
 * Community (Figma 3.1 Nearby 19:663 · 3.2 empty · 3.3 no results · 3.4 typing · 3.5 results · 3.6 area · 4.1 Global 19:818 ·
 * 4.4 Following 183:5713 · 4.4b empty). ScreenHeader (bell) → Tabs → content.
 */
export default function Community() {
  const params = useLocalSearchParams<{ tab?: Seg }>();
  const { color } = useTheme();
  const { t } = useTranslation();
  const [seg, setSegState] = useState<Seg>(params.tab ?? 'global');
  const [visited, setVisited] = useState<Set<Seg>>(() => new Set([params.tab ?? 'global']));
  const setSeg = (k: Seg) => {
    setVisited((v) => (v.has(k) ? v : new Set(v).add(k)));
    setSegState(k);
  };
  const bar = useTabBarScroll();
  // Header + mood wash = the shared ScreenHeader / ScreenWash (same as Home · Timer · Profile); it scrolls away with
  // the content and fades out (~300 pt). Tabs sit ≈ 55 % down the 420 wash, under the header.
  const wash = useWashScroll();
  const tabInk = useScreenInk(0.55);
  const [unreadDm, setUnreadDm] = useState(false);
  useFocusEffect(useCallback(() => { hasUnreadMessages().then(setUnreadDm); }, []));

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    wash.onY(y);
    bar.onY(y);
  };

  const onTab = (k: TabKey) => {
    if (k === 'home') router.replace('/home');
    if (k === 'timer') router.replace('/timer');
    if (k === 'profile') router.replace('/profile');
  };

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
      <ScreenWash scrollStyle={wash.style} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 + space[24] }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader right="notifications" />
        <Animated.View entering={FadeIn.duration(150)}>
        {/* Block · Tabs 330:7325 — no fill: the mood wash runs behind the title and the tabs. */}
        <View>
          <UnderlineTabs
            ink={tabInk}
            contentStyle={styles.tabRow}
            value={seg}
            onChange={setSeg}
            items={[
              { key: 'global', label: t('community.explore') },
              { key: 'following', label: t('community.following') },
              { key: 'challenges', label: t('community.challengesTab') },
            ]}
          />
        </View>
        {/* Tabs stay mounted once opened — switching only swaps what's under the tabs (no reload, data and images kept). */}
        {visited.has('global') ? <View style={seg === 'global' ? null : styles.gone}><Global /></View> : null}
        {visited.has('following') ? <View style={seg === 'following' ? null : styles.gone}><Following /></View> : null}
        {visited.has('challenges') ? <View style={seg === 'challenges' ? null : styles.gone}><ChallengesTab /></View> : null}
        </Animated.View>
      </ScrollView>
      <TabBar active="community" progress={bar.progress} onTab={onTab} onCreate={() => router.push('/share/pick')} />
    </View>
  );
}

// ------------------------------------------------------------------------------------------------ Explore (4.1 Global + Nearby)

function Global() {
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const [dishes, setDishes] = useState<CardDish[] | null>(null);
  const [scape, setScape] = useState<string | null>(null);
  const [explore, setExplore] = useState<CardDish[] | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [countries, setCountries] = useState<CardDish[]>([]);
  const [story, setStory] = useState<CardDish | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [saved, setSavedIds] = useState<Set<string>>(new Set());
  const together = explore;
  const { here } = useHere();
  const city = here.place?.city ?? here.forecast?.city ?? null;
  // Search filters (popup beside the field) — carried into the search results.
  const [filters, setFilters] = useState<SearchFilters>(NO_FILTERS);

  useFocusEffect(
    useCallback(() => {
      fetchTrendingByCountry().then(setCountries).catch(() => undefined);
      fetchStoryOfTheDay().then(setStory).catch(() => undefined);
      fetchGlobal(null).then(async (l) => {
        setDishes(l);
        const marks = await fetchMyMarks(l.map((d) => d.id)).catch(() => null);
        if (marks) setSavedIds((s) => new Set([...s, ...marks.saved]));
      }).catch(() => setDishes([]));
    }, []),
  );
  // Explore Together — the landscape chips filter only this section (All = everything, newest first).
  useEffect(() => {
    setExplore(null);
    setShowAll(false);
    fetchGlobal(scape).then(async (l) => {
      setExplore(l);
      const marks = await fetchMyMarks(l.map((d) => d.id)).catch(() => null);
      if (marks) setSavedIds((s) => new Set([...s, ...marks.saved]));
    }).catch(() => setExplore([]));
  }, [scape]);

  const tags = useMemo(() => (dishes ? topTags(dishes, 'moods', 6) : []), [dishes]);
  useEffect(() => { if (tags.length && (!tag || !tags.includes(tag))) setTag(tags[0]); }, [tags, tag]);
  const tagged = (dishes ?? []).filter((d) => tag && d.moods.includes(tag)).slice(0, 2);
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
      byline={[d.creator.handle ?? d.creator.name, d.city, timeAgo(d.createdAt, t)].filter(Boolean).join(' · ')}
      saved={saved.has(d.id)}
      onSave={() => toggleSave(d.id)}
      onPress={() => router.push(`/dish/${d.id}`)}
    />
  );

  // Explore: Search (+ filters) → Story of the day → Our area → Trending Bites → Holidays around the world → Trending tags → Explore Together.
  // A search opens the full nearby list (app/nearby-feed) with that term and the filters; while typing, the 3.4 panel replaces the sections.
  return (
    <NearbySearch
      city={city}
      filters={filters}
      onFilters={setFilters}
      onSubmit={(q) => { if (q || hasFilters(filters)) router.push({ pathname: '/nearby-feed', params: { ...(q ? { q } : {}), ...filtersToParams(filters) } }); }}
    >
      {/* Group 88:3081 — p32 20 0 · gap 6: SectionHeader → Story Card 350×400. */}
      {story ? (
        <View style={[styles.sectionS, styles.px]}>
          <SectionHeader title={t('community.story')} />
          <PhotoCard photo={story.photo} width={0} height={400} label={story.name} onPress={() => router.push(`/dish/${story.id}`)} style={styles.story}>
            {/* Top: title (Title/L, 1 line) · chevron-right 20, gap 8. */}
            <View style={styles.storyTop}>
              <Text variant="Title/L" color="fg/on-photo" numberOfLines={1} style={styles.flex}>{t('community.storyTitle', { dish: story.name, name: story.creator.name })}</Text>
              <Icon icon={ChevronRight} size={20} color="fg/on-photo" />
            </View>
            <View style={styles.storyFoot}>
              <View style={styles.storyBody}>
                <View style={[styles.flex, styles.storyText]}>
                  {story.description ? <Text variant="Statement" color="fg/on-photo" numberOfLines={3}>{story.description}</Text> : null}
                  <Text variant="Body/S" color="fg/on-photo-secondary" numberOfLines={1}>{[story.creator.name, story.city, timeAgo(story.createdAt, t)].filter(Boolean).join(' · ')}</Text>
                </View>
                <Avatar url={story.creator.avatarUrl} name={story.creator.name} size={40} />
              </View>
              <View style={styles.tagRow}>
                {story.mood && story.tempC != null ? <WeatherTag mood={story.mood} tempC={story.tempC} condition={t(`weather.${story.mood}`)} /> : <View />}
                <AcornTag count={story.acorns} />
              </View>
            </View>
          </PhotoCard>
        </View>
      ) : null}

      {/* Our area — today's table: popular today · questions + Ask (or turn location on). */}
      <OurArea />

      {/* Trending Bites 88:3078 — p32 · gap 6: header → Country Cards 280×180, gap 12. */}
      {countries.length ? (
        <View style={styles.sectionS}>
          <SectionHeader title={t('community.trendingBites')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {countries.map((d) => (
              <PhotoCard key={d.id} photo={d.photo} width={280} height={180} label={d.name} onPress={() => router.push(`/country/${d.country}`)} style={styles.countryCard} scrim="bottom">
                {/* Country Card: p14 18, content at the bottom (gap 10): Display/M name → tags; Flag Tag pinned at 18, 12. */}
                {d.country ? <View style={styles.countryFlag}><FlagTag code={d.country} /></View> : null}
                <Text variant="Display/M" color="fg/on-photo" numberOfLines={1}>{d.name}</Text>
                <View style={styles.tagRow}>
                  {d.mood && d.tempC != null ? <WeatherTag mood={d.mood} tempC={d.tempC} condition={t(`weather.${d.mood}`)} /> : <View />}
                  <AcornTag count={d.acorns} />
                </View>
              </PhotoCard>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Group · Festive 398:9710 — p32 · gap 6: eyebrow · title · more (→ all holidays), then 168×196 Festive Cards, gap 12. */}
      <View style={styles.sectionS}>
        <SectionHeader eyebrow={t('community.festiveEyebrow')} title={t('community.festiveTitle')} onMore={() => router.push('/holidays')} moreLabel={t('community.allHolidays')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
          {festive.map((h) => <FestiveCard key={h.key} h={h} />)}
        </ScrollView>
      </View>

      {/* Trending tags 435:366 — p32 · gap 9: header → chips → 2 Food Cards (rows inset p4, gap 12). */}
      {tags.length ? (
        <View style={styles.sectionM}>
          <SectionHeader title={t('community.trendingTags')} action={tag ? t('dish.seeAll') : undefined} onAction={() => tag && router.push(`/tag/${tag}`)} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsTight}>
            {tags.map((k) => <Chip key={k} label={tagLabel(k)} icon={MOOD_TAGS.find((m) => m.key === k)?.icon ?? CUSTOM_MOOD_ICON} selected={tag === k} onPress={() => setTag(k)} />)}
          </ScrollView>
          <View style={styles.rows}>{tagged.map(row)}</View>
        </View>
      ) : null}

      {/* Explore Together 676:20621 — p32 · gap 9: All · landscape chips → Food Cards of that landscape. */}
      <View style={styles.sectionM}>
        <SectionHeader title={t('community.exploreTogether')} action={!showAll && (together?.length ?? 0) > 4 ? t('dish.seeAll') : undefined} onAction={() => setShowAll(true)} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsTight}>
          <Chip label={t('community.all')} selected={!scape} onPress={() => setScape(null)} />
          {LANDSCAPES.map((l) => <Chip key={l.key} label={t(`landscape.${l.key}`)} selected={scape === l.key} onPress={() => setScape(l.key)} />)}
        </ScrollView>
        {together == null ? <ActivityIndicator color={color('fg/muted')} style={styles.loading} /> : together.length ? (
          <View style={styles.rows}>{together.slice(0, showAll ? 20 : 4).map(row)}</View>
        ) : (
          <View style={styles.px}><Text variant="Body/S" color="fg/muted">{t('community.emptyBody')}</Text></View>
        )}
      </View>
    </NearbySearch>
  );
}

export function ChallengeCard({ c }: { c: Challenge }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const left = c.phase === 'soon'
    ? t('challenge.starts', { day: c.startsAt.toLocaleDateString(undefined, { weekday: 'short' }) })
    : t('challenge.left', { time: timeLeft(c.endsAt) });
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={c.title} onPress={() => router.push(`/challenge/${c.slug}`)} style={styles.challenge}>
      <MoodGradient mood={c.phase === 'soon' ? 'clear' : 'rain'} style={StyleSheet.absoluteFill} />
      <View style={styles.challengeTop}>
        {c.country ? <FlagTag code={c.country} /> : <View />}
        <View style={[styles.timeLeft, { backgroundColor: color('bg/subtle') }]}>
          {c.phase === 'running' && c.endsAt.getTime() - Date.now() < 3 * 864e5 ? <View style={[styles.live, { backgroundColor: color('fg/accent') }]} /> : null}
          <Text variant="Caption Strong">{left}</Text>
        </View>
      </View>
      <View style={styles.flex} />
      <Text variant="Title/L" numberOfLines={2}>{c.title}</Text>
      {c.description ? <Text variant="Body/S" color="fg/secondary" numberOfLines={2} style={styles.challengeDesc}>{c.description}</Text> : null}
      <View style={styles.challengeFoot}>
        <Text variant="Caption Strong" style={styles.flex}>{t('challenge.cooking', { n: c.participants.toLocaleString() })}</Text>
        <View style={[styles.plus, { backgroundColor: color('bg/primary') }]}>
          <Icon icon={Plus} size={18} color="fg/on-primary" />
        </View>
      </View>
    </Pressable>
  );
}

// ------------------------------------------------------------------------------------------------ Table (4.4)

/** Plates per day before "See more" (3 rows × 3). */
const TABLE_PLATES = 9;

const toPlate = (d: CardDish, label = d.name): PlateItem => ({
  id: d.id, photo: d.photo, label, cook: { id: d.creator.id, name: d.creator.handle ?? d.creator.name, avatarUrl: d.creator.avatarUrl },
});

/**
 * 4.4 Community · Table (Figma 730:11217) — dishes of the cooks you follow, one table per local day (today · yesterday ·
 * then the date). First seat on today's table is yours: your dish of today, or an empty dashed plate → share flow.
 * 4.4b (732:11288) — you follow nobody yet: your seat + three popular cooks' plates with Follow.
 */
function Following() {
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const [feed, setFeed] = useState<FollowingItem[] | null>(null);
  const [mine, setMine] = useState<CardDish[]>([]);
  const [followees, setFollowees] = useState<number | null>(null);
  const [suggest, setSuggest] = useState<CardDish[]>([]);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const since = localMidnight();
      since.setDate(since.getDate() - 1);
      const [list, ids, my] = await Promise.all([fetchFollowingFeed('people'), fetchFolloweeIds(), fetchMyDishesSince(since)]);
      setFeed(list);
      setMine(my);
      setFollowees(ids.length);
      if (!ids.length) fetchSuggestedPlates(3).then(setSuggest).catch(() => undefined);
    } catch {
      setFeed((f) => f ?? []);
      setFollowees((n) => n ?? 0);
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const day = (d: Date) => d.toLocaleDateString(i18n.language, { weekday: 'long', month: 'short', day: 'numeric' });

  // Group by local date: today always first, yesterday when you posted then, then every day a followed cook posted.
  const tables = useMemo(() => {
    if (!feed) return [];
    const now = new Date();
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const today = localDate(now);
    const yesterday = localDate(y);
    const byDay = new Map<string, { date: Date; dishes: CardDish[] }>([[today, { date: now, dishes: [] }]]);
    if (mine.some((m) => localDate(m.createdAt) === yesterday)) byDay.set(yesterday, { date: y, dishes: [] });
    for (const d of feed) {
      const k = localDate(d.createdAt);
      if (!byDay.has(k)) byDay.set(k, { date: d.createdAt, dishes: [] });
      byDay.get(k)!.dishes.push(d);
    }
    return [...byDay.entries()]
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([key, v]) => ({ key, ...v, kind: key === today ? 'today' : key === yesterday ? 'yesterday' : 'older', mine: mine.find((m) => localDate(m.createdAt) === key) ?? null }));
  }, [feed, mine]);

  const toggleFollow = async (id: string) => {
    const on = !followed.has(id);
    setFollowed((s) => { const n = new Set(s); if (on) n.add(id); else n.delete(id); return n; });
    try { await follow(id, on); } catch { setFollowed((s) => { const n = new Set(s); if (on) n.delete(id); else n.add(id); return n; }); }
  };

  if (feed == null) return <ActivityIndicator color={color('fg/muted')} style={styles.loading} />;

  return (
    <View style={styles.tables}>
      {tables.map((tb) => {
        const seat = tb.mine ? (
          <Plate key="mine" item={toPlate(tb.mine, t('following.mySeat'))} tone="mine" onPress={() => router.push(`/dish/${tb.mine!.id}`)} onCook={() => router.push(`/cook/${tb.mine!.creator.id}`)} />
        ) : tb.kind === 'today' ? (
          <EmptySeat key="mine" label={t('following.placeMine')} onPress={() => router.push('/share/pick')} />
        ) : null;
        const plates = [
          ...(seat ? [seat] : []),
          ...tb.dishes.map((d) => <Plate key={d.id} item={toPlate(d)} onPress={() => router.push(`/dish/${d.id}`)} onCook={() => router.push(`/cook/${d.creator.id}`)} />),
        ];
        const all = open.has(tb.key);
        const title = tb.kind === 'today' ? t('following.todayTable') : tb.kind === 'yesterday' ? t('following.yesterdayTable') : day(tb.date);
        return (
          <PlateTable
            key={tb.key}
            title={title}
            subtitle={tb.kind === 'older' ? undefined : day(tb.date)}
            moreLabel={t('following.seeMore')}
            onMore={!all && plates.length > TABLE_PLATES ? () => setOpen((s) => new Set(s).add(tb.key)) : undefined}
          >
            <PlateGrid>{all ? plates : plates.slice(0, TABLE_PLATES)}</PlateGrid>
            {tb.kind === 'today' && followees === 0 && suggest.length ? (
              <>
                <View style={styles.suggestHead}>
                  <Text variant="Title/S">{t('following.suggest')}</Text>
                  <Text variant="Caption" color="fg/secondary">{t('following.suggestBody')}</Text>
                </View>
                <PlateGrid>
                  {suggest.map((d) => (
                    <Plate key={d.id} item={toPlate(d, d.creator.handle ?? d.creator.name)} tone="cook" onPress={() => router.push(`/dish/${d.id}`)} onCook={() => router.push(`/cook/${d.creator.id}`)}>
                      <FollowButton following={followed.has(d.creator.id)} onPress={() => toggleFollow(d.creator.id)} />
                    </Plate>
                  ))}
                </PlateGrid>
              </>
            ) : null}
          </PlateTable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  gone: { display: 'none' },
  // Following · Tables 730:11394 — p24 20 · gap 24; suggest header gap 4.
  tables: { paddingHorizontal: space[20], paddingVertical: space[24], gap: space[24] },
  suggestHead: { gap: space[4] },
  root: { flex: 1 },
  flex: { flex: 1 },
  px: { paddingHorizontal: space[20] },
  tabRow: { gap: space[24], paddingHorizontal: space[20] },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space[16] },
  dot: { position: 'absolute', right: -2, top: -2, width: 8, height: 8, borderRadius: 4 },
  chipsTop: { paddingTop: space[16] },
  chipsTight: { flexDirection: 'row', gap: space[8], paddingHorizontal: space[20] },
  loading: { marginTop: space[40] },
  section: { paddingTop: space[24], gap: space[12] },
  // 4.1 groups: p32 top; header → content gap 6 (Story · Trending Bites · Festive) / 9 → 8 token (Trending tags · Explore).
  sectionS: { paddingTop: space[32], gap: space[6] },
  sectionM: { paddingTop: space[32], gap: space[8] },
  carousel: { gap: space[12], paddingHorizontal: space[20] },
  countryCard: { paddingHorizontal: 18, paddingVertical: space[14], justifyContent: 'flex-end', gap: space[10] },
  countryFlag: { position: 'absolute', left: 18, top: space[12] },
  tagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rows: { paddingHorizontal: space[20], paddingTop: space[4], gap: space[12] },
  story: { width: '100%', padding: space[24], justifyContent: 'space-between' },
  storyFoot: { gap: space[16] },
  storyBody: { flexDirection: 'row', alignItems: 'flex-end', gap: space[16] },
  storyTop: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  storyText: { gap: space[8] },
  challenge: { width: 220, height: 252, borderRadius: radius.xl, overflow: 'hidden', padding: space[16] },
  challengeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeLeft: { flexDirection: 'row', alignItems: 'center', gap: space[6], paddingHorizontal: space[10], paddingVertical: space[4], borderRadius: radius.full },
  live: { width: 6, height: 6, borderRadius: 3 },
  challengeDesc: { marginTop: space[6] },
  challengeFoot: { flexDirection: 'row', alignItems: 'center', gap: space[8], marginTop: space[14], height: 36 },
  plus: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  suggest: { width: 128, alignItems: 'center', gap: space[4], padding: space[12], borderRadius: radius.xl, borderWidth: 1 },
});
