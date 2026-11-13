import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Send, Cookie, Moon, Plus, Star, Sun, type LucideIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Chip } from '../src/components/Chip';
import {
  Avatar, FoodRow, FollowButton, PhotoCard, SectionHeader, FlagTag,
} from '../src/components/community/Parts';
import { ChallengesTab } from '../src/components/community/ChallengesTab';
import { OurArea } from '../src/components/community/Nearby';
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
import { CUSTOM_MOOD_ICON, MOOD_TAGS } from '../src/lib/tags';
import { timeAgo } from '../src/lib/time';
import { follow } from '../src/services/activity';
import { hasUnreadMessages } from '../src/services/messages';
import {
  fetchFolloweeIds, fetchFollowingFeed, fetchGlobal, fetchMyDishesSince, fetchNeighborPlates, fetchStoryOfTheDay, fetchSuggestedPlates,
  fetchViralBites, localDate, localMidnight, timeLeft, topTags, type CardDish, type Challenge, type FollowingItem, type ViralItem,
} from '../src/services/community';
import { EmptySeat, Plate, PlateGrid, PlateTable, type PlateItem } from '../src/components/community/PlateTable';
import { fetchMyMarks, setAcorn, setSaved } from '../src/services/foods';
import { cellsAround } from '../src/lib/geohash';
import { useHere } from '../src/lib/useHere';
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

/**
 * Tab hero title (Story of the day · Neighbors' Table) — Display/M fg/default (Fraunces like the header weather title),
 * always English; screen readers get the local string.
 */
function HeroTitle({ k }: { k: string }) {
  const { t, i18n } = useTranslation();
  const en = useMemo(() => i18n.getFixedT('en'), [i18n]);
  return <Text variant="Display/M" accessibilityRole="header" accessibilityLabel={t(k)} numberOfLines={1}>{en(k)}</Text>;
}

function Global() {
  const { t, i18n } = useTranslation();
  const [dishes, setDishes] = useState<CardDish[] | null>(null);
  const [viral, setViral] = useState<ViralItem[]>([]);
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

  useFocusEffect(
    useCallback(() => {
      fetchViralBites().then(setViral).catch(() => undefined);
      fetchStoryOfTheDay().then(async (d) => {
        setStory(d);
        setStoryReady(true);
        if (!d) return;
        setStoryAcorn({ id: d.id, given: false, delta: 0 });
        const marks = await fetchMyMarks([d.id]).catch(() => null);
        if (marks) setStoryAcorn({ id: d.id, given: marks.given.has(d.id), delta: 0 });
      }).catch(() => { setStory(null); setStoryReady(true); });
      fetchGlobal(null).then(async (l) => {
        setDishes(l);
        const marks = await fetchMyMarks(l.map((d) => d.id)).catch(() => null);
        if (marks) setSavedIds((s) => new Set([...s, ...marks.saved]));
      }).catch(() => setDishes([]));
    }, []),
  );
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

  // Explore: Story of the day → Our area → Trending Bites → Holidays around the world → Trending tags.
  return (
    <View>
      {/* Group 88:3081 — p22 20 0 · gap 6: SectionHeader → Story Card 350×400. */}
      {story ? (
        <View style={[styles.sectionS, styles.px, styles.storyTop]}>
          <HeroTitle k="community.story" />
          <PhotoCard photo={story.photo} width={0} height={400} label={story.name} onPress={() => router.push(`/dish/${story.id}`)} style={styles.story}>
            <View style={styles.storyFoot}>
              <View style={styles.storyBody}>
                <View style={[styles.flex, styles.storyText]}>
                  {/* Dish name (Statement, 2 lines) → description (Body/M, 2 lines) → byline. */}
                  <Text variant="Statement" color="fg/on-photo" numberOfLines={2}>{story.name}</Text>
                  {story.description ? <Text variant="Body/M" color="fg/on-photo-secondary" numberOfLines={2}>{story.description}</Text> : null}
                  <Text variant="Body/S" color="fg/on-photo-secondary" numberOfLines={1}>{[story.creator.name, story.city, timeAgo(story.createdAt, t)].filter(Boolean).join(' · ')}</Text>
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

      {/* Our area — today's table: popular today · questions + Ask (or turn location on). */}
      <OurArea excludeId={storyReady ? story?.id ?? null : undefined} />

      {/* Viral Bites 88:3078 — p42 · gap 6: header → Country Cards 280×180, gap 12. Editor picks first, then rising dishes. */}
      {viral.length ? (
        <View style={styles.sectionS}>
          <SectionHeader title={t('community.viralBites')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {viral.map((v) => (
              <PhotoCard key={v.key} photo={v.photo!} width={280} height={180} label={v.name} onPress={() => router.push({ pathname: '/viral/[name]', params: { name: v.name } })} style={styles.countryCard} scrim="bottom">
                {/* Country Card: p14 18, content at the bottom (gap 10): Display/M name → tags; Flag Tag · Viral badge pinned at 18, 12. */}
                <View style={styles.countryFlag}>
                  {v.country ? <FlagTag code={v.country} /> : null}
                  <ViralBadge item={v} />
                </View>
                <Text variant="Display/M" color="fg/on-photo" numberOfLines={1}>{v.name}</Text>
                <View style={styles.tagRow}>
                  {v.cover?.mood && v.cover.tempC != null ? <WeatherTag mood={v.cover.mood} tempC={v.cover.tempC} condition={t(`weather.${v.cover.mood}`)} /> : <View />}
                  {v.cover ? <AcornTag count={v.cover.acorns} /> : null}
                </View>
              </PhotoCard>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Group · Festive 398:9710 — p42 · gap 6: title · more (→ all holidays), then 168×196 Festive Cards, gap 12. */}
      <View style={styles.sectionS}>
        <SectionHeader title={t('community.festiveTitle')} onMore={() => router.push('/holidays')} moreLabel={t('community.allHolidays')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
          {festive.map((h) => <FestiveCard key={h.key} h={h} />)}
        </ScrollView>
      </View>

      {/* Trending tags 435:366 — p42 · gap 9: header → chips → 2 Food Cards (rows inset p4, gap 12). */}
      {tags.length ? (
        <View style={styles.sectionM}>
          <SectionHeader title={t('community.trendingTags')} onMore={tag ? () => router.push(`/tag/${tag}`) : undefined} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsTight}>
            {tags.map((k) => <Chip key={k} label={tagLabel(k)} icon={MOOD_TAGS.find((m) => m.key === k)?.icon ?? CUSTOM_MOOD_ICON} selected={tag === k} onPress={() => setTag(k)} />)}
          </ScrollView>
          <View style={styles.rows}>{tagged.map(row)}</View>
        </View>
      ) : null}

    </View>
  );
}

/** Viral badge (4.1 / 4.7) — pill p4 10 · radius full · Caption Strong fg/inverse: rising = bg/kick, editor pick = bg/inverse. */
export function ViralBadge({ item }: { item: Pick<ViralItem, 'kind' | 'growth'> }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const rising = item.kind === 'rising';
  return (
    <View style={[styles.viralBadge, { backgroundColor: color(rising ? 'bg/kick' : 'bg/inverse') }]}>
      <Text variant="Caption Strong" color="fg/inverse" numberOfLines={1}>
        {rising ? t('viral.rising', { n: (item.growth ?? 0).toLocaleString() }) : t('viral.editor')}
      </Text>
    </View>
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

/** Days of neighbours' plates (③): today and the two days before. */
const NEIGHBOR_DAYS = 3;

/**
 * 4.4 Community · Table (Figma 730:11217) — "Neighbors' Table" title, then one table per local day (today · yesterday ·
 * then the date). Each table: ① my seat (today: my dish or an empty dashed plate → share flow) → ② dishes of the cooks
 * I follow → ③ neighbours I don't follow yet (area cell → neighbouring cells → district, max 9, each with "+ Follow";
 * following one moves their plates to ② at once). 4.4b (732:11288) — no follows and no neighbours: popular cooks to follow.
 */
function Following() {
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const { here } = useHere();
  const [feed, setFeed] = useState<FollowingItem[] | null>(null);
  const [mine, setMine] = useState<CardDish[]>([]);
  const [followees, setFollowees] = useState<number | null>(null);
  const [neighbors, setNeighbors] = useState<CardDish[]>([]);
  const [suggest, setSuggest] = useState<CardDish[]>([]);
  // Cooks followed on this screen (neighbour plates → ②, suggested cooks' button state) until the next load.
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Set<string>>(new Set());

  const district = here.place?.district ?? null;
  const city = here.place?.city ?? null;
  const load = useCallback(async () => {
    if (here.status === 'loading') return;
    try {
      const since = localMidnight();
      since.setDate(since.getDate() - 1);
      const [list, ids, my] = await Promise.all([fetchFollowingFeed('people'), fetchFolloweeIds(), fetchMyDishesSince(since)]);
      const from = localMidnight();
      from.setDate(from.getDate() - (NEIGHBOR_DAYS - 1));
      const cells = here.coords ? cellsAround(here.coords.latitude, here.coords.longitude, 5) : [];
      const near = await fetchNeighborPlates({ cell: here.cell, cells, district, city }, from, ids).catch(() => [] as CardDish[]);
      setFeed(list);
      setMine(my);
      setFollowees(ids.length);
      setNeighbors(near);
      setFollowed(new Set());
      if (!ids.length && !near.length) fetchSuggestedPlates(3).then(setSuggest).catch(() => undefined);
    } catch {
      setFeed((f) => f ?? []);
      setFollowees((n) => n ?? 0);
    }
  }, [here.status, here.coords, here.cell, district, city]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const day = (d: Date) => d.toLocaleDateString(i18n.language, { weekday: 'long', month: 'short', day: 'numeric' });

  // Group by local date: today always first, yesterday when you posted then, then every day with followed or neighbour plates.
  // ② = followed cooks (+ neighbours followed just now, newest first) · ③ = the other neighbours.
  const tables = useMemo(() => {
    if (!feed) return [];
    const now = new Date();
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const today = localDate(now);
    const yesterday = localDate(y);
    const byDay = new Map<string, { date: Date; follows: CardDish[]; near: CardDish[] }>([[today, { date: now, follows: [], near: [] }]]);
    if (mine.some((m) => localDate(m.createdAt) === yesterday)) byDay.set(yesterday, { date: y, follows: [], near: [] });
    const at = (d: CardDish) => {
      const k = localDate(d.createdAt);
      if (!byDay.has(k)) byDay.set(k, { date: d.createdAt, follows: [], near: [] });
      return byDay.get(k)!;
    };
    const inFeed = new Set(feed.map((d) => d.id));
    for (const d of feed) at(d).follows.push(d);
    for (const d of neighbors) {
      if (inFeed.has(d.id)) continue;
      if (followed.has(d.creator.id)) at(d).follows.push(d);
      else at(d).near.push(d);
    }
    for (const v of byDay.values()) v.follows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return [...byDay.entries()]
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([key, v]) => ({ key, ...v, kind: key === today ? 'today' : key === yesterday ? 'yesterday' : 'older', mine: mine.find((m) => localDate(m.createdAt) === key) ?? null }));
  }, [feed, mine, neighbors, followed]);

  const toggleFollow = async (id: string) => {
    const on = !followed.has(id);
    setFollowed((s) => { const n = new Set(s); if (on) n.add(id); else n.delete(id); return n; });
    try { await follow(id, on); } catch { setFollowed((s) => { const n = new Set(s); if (on) n.delete(id); else n.add(id); return n; }); }
  };

  if (feed == null) return <ActivityIndicator color={color('fg/muted')} style={styles.loading} />;

  const anyNeighbors = neighbors.length > 0;
  const plate = (d: CardDish, onFollow?: () => void) => (
    <Plate key={d.id} item={toPlate(d)} onPress={() => router.push(`/dish/${d.id}`)} onCook={() => router.push(`/cook/${d.creator.id}`)}
      onFollow={onFollow} followLabel={onFollow ? t('cook.follow') : undefined} />
  );

  return (
    <View>
      {/* Title — same place and style as Story of the day on Explore. */}
      <View style={[styles.px, styles.storyTop]}>
        <HeroTitle k="following.title" />
      </View>
      <View style={styles.tables}>
      {tables.map((tb) => {
        const seat = tb.mine ? (
          <Plate key="mine" item={toPlate(tb.mine, t('following.mySeat'))} tone="mine" onPress={() => router.push(`/dish/${tb.mine!.id}`)} onCook={() => router.push(`/cook/${tb.mine!.creator.id}`)} />
        ) : tb.kind === 'today' ? (
          <EmptySeat key="mine" label={t('following.placeMine')} onPress={() => router.push('/share/pick')} />
        ) : null;
        const plates = [
          ...(seat ? [seat] : []),
          ...tb.follows.map((d) => plate(d)),
          ...tb.near.map((d) => plate(d, () => toggleFollow(d.creator.id))),
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
            {tb.kind === 'today' && followees === 0 && !anyNeighbors && suggest.length ? (
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
    </View>
  );
}

const styles = StyleSheet.create({
  gone: { display: 'none' },
  // Following · Tables 730:11394 — p6 20 24 under the title (title → first table = Story's title → card gap 6) · gap 24.
  tables: { paddingHorizontal: space[20], paddingTop: space[6], paddingBottom: space[24], gap: space[24] },
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
  // 4.1 groups: p42 top; header → content gap 6 (Story · Trending Bites · Festive) / 9 → 8 token (Trending tags).
  sectionS: { paddingTop: space[42], gap: space[6] },
  sectionM: { paddingTop: space[42], gap: space[8] },
  carousel: { gap: space[12], paddingHorizontal: space[20] },
  countryCard: { paddingHorizontal: 18, paddingVertical: space[14], justifyContent: 'flex-end', gap: space[10] },
  countryFlag: { position: 'absolute', left: 18, top: space[12], right: 18, flexDirection: 'row', alignItems: 'center', gap: space[8] },
  viralBadge: { flexShrink: 1, paddingHorizontal: space[10], paddingVertical: space[4], borderRadius: radius.full },
  tagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rows: { paddingHorizontal: space[20], paddingTop: space[4], gap: space[12] },
  storyTop: { paddingTop: space[42] - space[20] },
  story: { width: '100%', padding: space[24], justifyContent: 'flex-end' },
  storyFoot: { gap: space[16] },
  storyBody: { flexDirection: 'row', alignItems: 'flex-end', gap: space[16] },
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
