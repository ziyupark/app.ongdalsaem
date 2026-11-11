import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Bell, Clock, Send, CloudRain, Cookie, Moon, Plus, Search, Star, Sun, Users, Utensils, X, type LucideIcon } from 'lucide-react-native';
import { MessageCircle } from '../src/components/icons/custom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Keyboard, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { Chip } from '../src/components/Chip';
import {
  Avatar, CookTile, EmptyState, FoodGrid, FoodRow, FollowButton, ListCard, PhotoCard, QuestionCard, SearchField, SectionHeader, Tabs, WeatherNow, FlagTag, useByline,
} from '../src/components/community/Parts';
import { FeedPost } from '../src/components/home/FeedPost';
import { ChallengesTab } from '../src/components/community/ChallengesTab';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { upcomingFestive } from '../src/lib/holidays';
import { Icon } from '../src/components/Icon';
import { MoodGradient } from '../src/components/MoodGradient';
import { WeatherFx } from '../src/components/WeatherFx';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useWashScroll } from '../src/lib/useWashScroll';
import { useWashInk } from '../src/theme/washInk';
import { AcornTag, WeatherTag } from '../src/components/PhotoTags';
import { TabBar, useTabBarScroll, type TabKey } from '../src/components/TabBar';
import { Text } from '../src/components/Text';
import { CUSTOM_MOOD_ICON, LANDSCAPES, MOOD_TAGS } from '../src/lib/tags';
import { timeAgo } from '../src/lib/time';
import { cellsAround } from '../src/lib/geohash';
import { useHere } from '../src/lib/useHere';
import { follow } from '../src/services/activity';
import {
  fetchChallenges, fetchCooksInWeather, fetchFollowingFeed, fetchGlobal, fetchMyTables, fetchNearby, fetchNearbyQuestions, fetchStoryOfTheDay,
  fetchTrendingByCountry, searchSuggestions, setMeToo, timeLeft, topTags, type CardDish, type Challenge, type CookCard, type FollowingItem, type Question, type Table,
} from '../src/services/community';
import { fetchMyMarks, setAcorn, setSaved } from '../src/services/foods';
import { radius, space, useTheme, WEATHER_ICON, type WeatherMood } from '../src/theme';

type Seg = 'global' | 'nearby' | 'following' | 'challenges';
type Area = 'all' | 'near' | 'area' | 'weather';
const RECENT_KEY = 'community.recentSearches';

/**
 * Community (Figma 3.1 Nearby 19:663 · 3.2 empty · 3.3 no results · 3.4 typing · 3.5 results · 3.6 area · 4.1 Global 19:818 ·
 * 4.4 Following 183:5713 · 4.4b empty). TopBar Large "Community" + bell → Tabs → content.
 */
export default function Community() {
  const params = useLocalSearchParams<{ tab?: Seg }>();
  const { color, scheme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [seg, setSegState] = useState<Seg>(params.tab ?? 'global');
  const [visited, setVisited] = useState<Set<Seg>>(() => new Set([params.tab ?? 'global']));
  const setSeg = (k: Seg) => {
    setVisited((v) => (v.has(k) ? v : new Set(v).add(k)));
    setSegState(k);
  };
  const bar = useTabBarScroll();
  const { here } = useHere();
  const mood = here.forecast?.mood ?? null;
  // Mood wash — exactly Home's / Profile's: same weather, 420 tall at 85 %, overcast until the weather is known,
  // none when location is off; it scrolls away with the content and fades out (~300 pt). Every tab.
  const washOn = here.status === 'ready' || !!here.place?.city;
  const washMood: WeatherMood = mood ?? 'overcast';
  const wash = useWashScroll();
  // Header text over the wash: title ≈ 20 % down the 420 wash, tabs ≈ 35 %.
  const titleInk = useWashInk(washOn ? washMood : null, 0.2, 0.85);
  const tabInk = useWashInk(washOn ? washMood : null, 0.35, 0.85);

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
      <StatusBar style={titleInk?.bar ?? (scheme === 'dark' ? 'light' : 'dark')} />
      {washOn ? (
        <Animated.View entering={FadeIn.duration(200)} pointerEvents="none" style={[styles.wash, wash.style]}>
          <MoodGradient mood={washMood} opacity={0.85} />
          <WeatherFx mood={washMood} />
        </Animated.View>
      ) : null}
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 110 + space[24] }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <Text variant="Display/L" color={titleInk?.strong ?? 'fg/default'}>{t('community.title')}</Text>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('notifications.title')} hitSlop={space[8]} onPress={() => router.push('/notifications')}>
              <Icon icon={Bell} size={24} color={titleInk?.strong ?? 'fg/default'} />
            </Pressable>
          </View>
        </View>
        {/* Block · Tabs 330:7325 — no fill: the mood wash runs behind the title and the tabs. */}
        <View>
          <Tabs
            ink={tabInk}
            style={styles.tabs}
            value={seg}
            onChange={setSeg}
            items={[
              { key: 'global', label: t('community.global') },
              { key: 'nearby', label: t('community.nearby') },
              { key: 'following', label: t('community.following') },
              { key: 'challenges', label: t('community.challengesTab') },
            ]}
          />
          <View style={[styles.rule, { backgroundColor: tabInk?.rule ?? color('border/default') }]} />
        </View>
        {/* Tabs stay mounted once opened — switching only swaps what's under the tabs (no reload, data and images kept). */}
        {visited.has('global') ? <View style={seg === 'global' ? null : styles.gone}><Global /></View> : null}
        {visited.has('nearby') ? <View style={seg === 'nearby' ? null : styles.gone}><Nearby here={here} /></View> : null}
        {visited.has('following') ? <View style={seg === 'following' ? null : styles.gone}><Following mood={mood} tempC={here.forecast?.tempC ?? null} /></View> : null}
        {visited.has('challenges') ? <View style={seg === 'challenges' ? null : styles.gone}><ChallengesTab /></View> : null}
      </ScrollView>
      <TabBar active="community" progress={bar.progress} onTab={onTab} onCreate={() => router.push('/share/pick')} />
    </View>
  );
}

// ------------------------------------------------------------------------------------------------ Nearby (3.x)

function Nearby({ here }: { here: ReturnType<typeof useHere>['here'] }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const byline = useByline();
  const f = here.forecast;
  const city = here.place?.city ?? f?.city ?? null;
  const district = here.place?.district ?? null;
  const [area, setArea] = useState<Area>('all');
  const [dishes, setDishes] = useState<CardDish[] | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [focused, setFocused] = useState(false);
  const [suggest, setSuggest] = useState<{ name: string; n: number }[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY).then((v) => v && setRecent(JSON.parse(v))).catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    if (here.status === 'loading') return;
    setDishes(null);
    try {
      const list = await fetchNearby({
        city,
        neighborhood: area === 'area' ? district : null,
        cells: area === 'near' && here.coords ? cellsAround(here.coords.latitude, here.coords.longitude) : null,
        mood: area === 'weather' ? f?.mood ?? null : null,
        query: submitted,
      });
      // "best in <weather> first": same-weather dishes lead, then newest.
      setDishes(f?.mood ? [...list.filter((d) => d.mood === f.mood), ...list.filter((d) => d.mood !== f.mood)] : list);
    } catch {
      setDishes([]);
    }
  }, [here.status, here.coords, city, district, area, f?.mood, submitted]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useFocusEffect(
    useCallback(() => {
      if (!here.cell) return;
      fetchNearbyQuestions(here.cell, 3).then(setQuestions).catch(() => setQuestions([]));
    }, [here.cell]),
  );

  useEffect(() => {
    if (!focused || query.trim().length < 2) return setSuggest([]);
    const h = setTimeout(() => searchSuggestions(query, city).then(setSuggest).catch(() => setSuggest([])), 250);
    return () => clearTimeout(h);
  }, [query, focused, city]);

  const run = (term: string) => {
    const v = term.trim();
    setQuery(v);
    setSubmitted(v);
    setFocused(false);
    Keyboard.dismiss();
    if (!v) return;
    const next = [v, ...recent.filter((r) => r !== v)].slice(0, 6);
    setRecent(next);
    AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next)).catch(() => undefined);
  };
  const forget = (v: string) => {
    const next = recent.filter((r) => r !== v);
    setRecent(next);
    AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next)).catch(() => undefined);
  };

  const meToo = async (q: Question) => {
    const on = !q.meTooByMe;
    setQuestions((l) => l.map((x) => (x.id === q.id ? { ...x, meTooByMe: on, meToo: x.meToo + (on ? 1 : -1) } : x)));
    try { await setMeToo(q.id, on); } catch { setQuestions((l) => l.map((x) => (x.id === q.id ? q : x))); }
  };

  const placeLabel = [district, city].filter(Boolean).join(', ');
  const typing = focused && (query.length > 0 || recent.length > 0);
  const condition = f ? t(`weather.${f.mood}`).toLowerCase() : '';

  return (
    <View>
      <View style={styles.nowWrap}>
        <WeatherNow mood={f?.mood ?? null} tempC={f?.tempC ?? null} place={placeLabel ? t('community.rightNow', { place: placeLabel }) : t('community.noPlace')} hi={f?.hi} lo={f?.lo} />
      </View>
      <View style={styles.searchWrap}>
        <SearchField
          value={query}
          onChangeText={(v) => { setQuery(v); if (!v) setSubmitted(''); }}
          placeholder={t('community.searchPlaceholder')}
          focused={focused}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmit={() => run(query)}
        />
      </View>

      {typing ? (
        // 3.4 Search · Typing
        <View style={styles.typing}>
          {suggest.length ? (
            <>
              <Text variant="Overline" color="fg/muted" style={styles.overline}>{t('community.suggestions')}</Text>
              <ListCard>
                {suggest.map((s, i) => (
                  <Pressable key={s.name} accessibilityRole="button" onPress={() => run(s.name)} style={[styles.sugRow, i < suggest.length - 1 && { borderBottomWidth: 1, borderBottomColor: color('border/default') }]}>
                    <Icon icon={Search} size={18} color="fg/secondary" />
                    <Text variant="Body/M" style={styles.flex} numberOfLines={1}>
                      {(() => {
                        // 3.4 — the typed part in Body/M Strong.
                        const at = s.name.toLowerCase().indexOf(query.trim().toLowerCase());
                        if (at < 0 || !query.trim()) return s.name;
                        const end = at + query.trim().length;
                        return <>{s.name.slice(0, at)}<Text variant="Body/M Strong">{s.name.slice(at, end)}</Text>{s.name.slice(end)}</>;
                      })()}
                    </Text>
                    <Text variant="Caption" color="fg/muted">{t('community.nearYou', { n: s.n })}</Text>
                  </Pressable>
                ))}
              </ListCard>
            </>
          ) : null}
          {recent.length ? (
            <>
              <Text variant="Overline" color="fg/muted" style={styles.overline}>{t('community.recent')}</Text>
              <ListCard>
                {recent.map((r, i) => (
                  <Pressable key={r} accessibilityRole="button" onPress={() => run(r)} style={[styles.sugRow, i < recent.length - 1 && { borderBottomWidth: 1, borderBottomColor: color('border/default') }]}>
                    <Icon icon={Clock} size={18} color="fg/secondary" />
                    <Text variant="Body/M" style={styles.flex} numberOfLines={1}>{r}</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel={t('common.clear')} hitSlop={space[8]} onPress={() => forget(r)}>
                      <Icon icon={X} size={18} color="fg/secondary" />
                    </Pressable>
                  </Pressable>
                ))}
              </ListCard>
            </>
          ) : null}
          <Text variant="Caption" color="fg/muted">{t('community.searchHint')}</Text>
        </View>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
            <Chip label={t('community.all')} selected={area === 'all'} onPress={() => setArea('all')} />
            {here.coords ? <Chip label={t('community.within1km')} selected={area === 'near'} onPress={() => setArea('near')} /> : null}
            {district ? <Chip label={district} selected={area === 'area'} onPress={() => setArea('area')} /> : null}
            {f ? <Chip label={t('community.sameWeather')} selected={area === 'weather'} onPress={() => setArea('weather')} /> : null}
          </ScrollView>

          <View style={styles.body}>
            {f ? (
              <View style={styles.ctx}>
                <Icon icon={CloudRain} size={16} color="fg/accent" />
                <Text variant="Body/S Strong" color="fg/accent" numberOfLines={1}>
                  {submitted && dishes ? t('community.resultsCtx', { count: dishes.length, weather: condition }) : t('community.cookedNear')}
                </Text>
              </View>
            ) : null}

            {!submitted ? (
              <View style={styles.qs}>
                <Pressable accessibilityRole="button" onPress={() => router.push('/ask')} style={[styles.askBar, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
                  <Icon icon={MessageCircle} size={20} color="fg/secondary" />
                  <Text variant="Body/S" color="fg/muted">{t('community.askPlaceholder')}</Text>
                </Pressable>
                {questions.slice(0, 1).map((q) => <QuestionCard key={q.id} q={q} onPress={() => router.push(`/question/${q.id}`)} onMeToo={() => meToo(q)} />)}
              </View>
            ) : null}
          </View>

          {dishes == null ? (
            <ActivityIndicator color={color('fg/muted')} style={styles.loading} />
          ) : dishes.length ? (
            <FoodGrid dishes={dishes} width={width} byline={(d) => byline(d)} onOpen={(d) => router.push(`/dish/${d.id}`)} />
          ) : submitted ? (
            // 3.3 No results — offer weather / mood tags instead.
            <EmptyState size="L" icon={Search} title={t('community.noResultsTitle', { q: submitted })} body={t('community.noResultsBody')}>
              <View style={styles.wrap}>
                {f ? <Chip label={t(`weather.${f.mood}`)} onPress={() => { setQuery(''); setSubmitted(''); setArea('weather'); }} /> : null}
                {['cozy', 'comforting', 'spicy'].map((m) => <Chip key={m} label={`#${m}`} onPress={() => router.push(`/tag/${m}`)} />)}
              </View>
            </EmptyState>
          ) : (
            // 3.2 Nearby is empty
            <EmptyState
              size="L"
              icon={f ? WEATHER_ICON[f.mood] : CloudRain}
              title={t('community.emptyTitle', { weather: condition || t('community.weatherFallback') })}
              body={t('community.emptyBody', { place: city ?? t('community.yourArea') })}
            >
              <Button label={t('profile.shareFirst')} size="M" onPress={() => router.push('/share/pick')} />
            </EmptyState>
          )}
        </>
      )}
    </View>
  );
}

// ------------------------------------------------------------------------------------------------ Global (4.1)

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
  const festive = useMemo(() => upcomingFestive(), []);

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

  // 4.1 Community · Global (19:818): Story of the day → Trending Bites → Holidays around the world → Trending tags → Explore Together.
  return (
    <View>
      {/* Group 88:3081 — p32 20 0 · gap 6: SectionHeader → Story Card 350×400. */}
      {story ? (
        <View style={[styles.sectionL, styles.px]}>
          <SectionHeader title={t('community.story')} />
          <PhotoCard photo={story.photo} width={0} height={400} label={story.name} onPress={() => router.push(`/dish/${story.id}`)} style={styles.story}>
            <Text variant="Title/L" color="fg/on-photo" numberOfLines={1}>{t('community.storyTitle', { dish: story.name, name: story.creator.name })}</Text>
            <View style={styles.storyFoot}>
              <View style={styles.storyBody}>
                <View style={[styles.flex, { gap: space[8] }]}>
                  <Text variant="Statement" color="fg/on-photo" numberOfLines={3}>{story.description}</Text>
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

      {/* Trending Bites 88:3078 — Country Cards 280×180, gap 12. */}
      {countries.length ? (
        <View style={styles.sectionL}>
          <SectionHeader title={t('community.trendingBites')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {countries.map((d) => (
              <PhotoCard key={d.id} photo={d.photo} width={280} height={180} label={d.name} onPress={() => router.push(`/country/${d.country}`)} style={styles.countryCard}>
                <View style={styles.countryTop}>{d.country ? <FlagTag code={d.country} /> : null}</View>
                <View style={styles.countryBottom}>
                  <Text variant="Display/M" color="fg/on-photo" numberOfLines={1}>{d.name}</Text>
                  <View style={styles.tagRow}>
                    {d.mood && d.tempC != null ? <WeatherTag mood={d.mood} tempC={d.tempC} condition={t(`weather.${d.mood}`)} /> : <View />}
                    <AcornTag count={d.acorns} />
                  </View>
                </View>
              </PhotoCard>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Group · Festive 398:9710 — 168×196 cards, radius 24, p16: badge · date · name · dish over the holiday's food photo. */}
      <View style={styles.sectionL}>
        <SectionHeader eyebrow={t('community.festiveEyebrow')} title={t('community.festiveTitle')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
          {festive.map((h) => {
            const days = Math.round((h.at.getTime() - new Date().setHours(0, 0, 0, 0)) / 864e5);
            const date = h.at.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' }).toUpperCase();
            return (
              <Pressable key={h.key} accessibilityRole="button" onPress={() => router.push(`/tag/${h.tag}`)} style={styles.festive}>
                {h.image ? <Image source={h.image} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} /> : <MoodGradient mood={h.mood} style={StyleSheet.absoluteFill} />}
                <LinearGradient colors={['transparent', color('overlay/scrim-strong')]} locations={[0.35, 1]} style={StyleSheet.absoluteFill} />
                <View style={[styles.badge, { backgroundColor: color('glass/surface') }]}><Icon icon={h.icon} size={18} /></View>
                <View style={styles.flex} />
                <Text variant="Overline" color="fg/on-photo-secondary">{days <= 1 ? `${date} · ${t(days === 0 ? 'community.today' : 'community.tomorrow').toUpperCase()}` : date}</Text>
                <Text variant="Title/M" color="fg/on-photo">{t(`community.holidays.${h.key}.name`)}</Text>
                <Text variant="Caption" numberOfLines={1} color="fg/on-photo-secondary">{t(`community.holidays.${h.key}.food`)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Trending tags 435:366 — chips → 2 Food Cards. */}
      {tags.length ? (
        <View style={styles.sectionL}>
          <SectionHeader title={t('community.trendingTags')} action={tag ? t('dish.seeAll') : undefined} onAction={() => tag && router.push(`/tag/${tag}`)} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsTight}>
            {tags.map((k) => <Chip key={k} label={tagLabel(k)} icon={MOOD_TAGS.find((m) => m.key === k)?.icon ?? CUSTOM_MOOD_ICON} selected={tag === k} onPress={() => setTag(k)} />)}
          </ScrollView>
          <View style={styles.rows}>{tagged.map(row)}</View>
        </View>
      ) : null}

      {/* Explore Together 676:20621 — All · landscape chips → Food Cards of that landscape. */}
      <View style={styles.sectionL}>
        <SectionHeader title={t('community.exploreTogether')} action={!showAll && (explore?.length ?? 0) > 4 ? t('dish.seeAll') : undefined} onAction={() => setShowAll(true)} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsTight}>
          <Chip label={t('community.all')} selected={!scape} onPress={() => setScape(null)} />
          {LANDSCAPES.map((l) => <Chip key={l.key} label={t(`landscape.${l.key}`)} selected={scape === l.key} onPress={() => setScape(l.key)} />)}
        </ScrollView>
        {explore == null ? <ActivityIndicator color={color('fg/muted')} style={styles.loading} /> : explore.length ? (
          <View style={styles.rows}>{explore.slice(0, showAll ? 20 : 4).map(row)}</View>
        ) : (
          <View style={styles.px}><Text variant="Body/S" color="fg/muted">{t('community.emptyBody')}</Text></View>
        )}
      </View>
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

// ------------------------------------------------------------------------------------------------ Following (4.4)

function Following({ mood, tempC }: { mood: WeatherMood | null; tempC: number | null }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const [only, setOnly] = useState<'all' | 'people' | 'tables'>('all');
  const [feed, setFeed] = useState<FollowingItem[] | null>(null);
  const [marks, setMarks] = useState<{ given: Set<string>; saved: Set<string> }>({ given: new Set(), saved: new Set() });
  const [tables, setTables] = useState<Table[]>([]);
  const [cooks, setCooks] = useState<CookCard[]>([]);

  const load = useCallback(async () => {
    setFeed(null);
    try {
      const [list, mine] = await Promise.all([fetchFollowingFeed(only), fetchMyTables()]);
      setTables(mine);
      setFeed(list);
      fetchMyMarks(list.map((d) => d.id)).then(setMarks).catch(() => undefined);
    } catch {
      setFeed([]);
    }
  }, [only]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { fetchCooksInWeather(mood, tempC, 8).then((l) => setCooks(l.filter((c) => !c.following))).catch(() => undefined); }, [mood, tempC]);

  const toggleFollow = async (c: CookCard) => {
    const on = !c.following;
    setCooks((l) => l.map((x) => (x.id === c.id ? { ...x, following: on } : x)));
    try { await follow(c.id, on); } catch { setCooks((l) => l.map((x) => (x.id === c.id ? c : x))); }
  };

  const suggested = cooks.length ? (
    <View style={styles.suggestBlock}>
      <SectionHeader title={t('community.suggested')} action={t('dish.seeAll')} onAction={() => router.push('/cooks-weather')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cookRow}>
        {cooks.map((c) => <CookTile key={c.id} cook={c} sub={c.city ?? ''} onPress={() => router.push(`/cook/${c.id}`)} onFollow={() => toggleFollow(c)} />)}
      </ScrollView>
    </View>
  ) : null;

  return (
    <View>
      <View style={styles.followHead}>
        <View style={styles.followTitle}><SectionHeader title={t('community.followingTitle')} /></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableRow}>
          {tables.map((tb) => (
            <Pressable key={tb.id} accessibilityRole="button" onPress={() => router.push(`/table/${tb.slug}`)} style={[styles.tableChip, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
              <Avatar url={tb.coverUrl} name={tb.name.replace('#', '')} size={24} />
              <Text variant="Caption Strong">{tb.name}</Text>
            </Pressable>
          ))}
          <Pressable accessibilityRole="button" onPress={() => router.push('/tables')} style={[styles.browse, { borderColor: color('border/strong') }]}>
            <Icon icon={Plus} size={16} color="fg/secondary" />
            <Text variant="Caption Strong" color="fg/secondary">{t('community.browseTables')}</Text>
          </Pressable>
        </ScrollView>
        <View style={styles.filterRow}>
          <Chip label={t('community.all')} selected={only === 'all'} onPress={() => setOnly('all')} />
          <Chip label={t('community.people')} selected={only === 'people'} onPress={() => setOnly('people')} />
          <Chip label={t('community.tables')} selected={only === 'tables'} onPress={() => setOnly('tables')} />
        </View>
      </View>

      {feed == null ? (
        <ActivityIndicator color={color('fg/muted')} style={styles.loading} />
      ) : feed.length ? (
        <>
          {feed.map((d) => (
            <View key={d.id}>
              {d.fromTable ? (
                <View style={styles.fromTable}>
                  <Icon icon={Utensils} size={14} color="fg/muted" />
                  <Text variant="Caption Strong" color="fg/muted">{t('community.fromTable', { name: d.fromTable })}</Text>
                </View>
              ) : null}
              <FeedPost
                post={{
                  id: d.id, name: d.creator.handle ?? d.creator.name,
                  meta: [d.neighborhood ?? d.city, timeAgo(d.createdAt, t)].filter(Boolean).join(' · '),
                  avatar: d.creator.avatarUrl ? { uri: d.creator.avatarUrl } : undefined, photo: { uri: d.photo }, photoCount: d.photoCount,
                  weather: d.mood ?? 'overcast', tempC: d.tempC ?? 0, acorns: d.acorns - (marks.given.has(d.id) ? 1 : 0), comments: d.comments, caption: d.description || d.name,
                  given: marks.given.has(d.id), saved: marks.saved.has(d.id), authorId: d.creator.id,
                }}
                onAuthor={() => router.push(`/cook/${d.creator.id}`)}
                onOpen={() => router.push(`/dish/${d.id}`)}
                onComments={() => router.push(`/dish/${d.id}?comments=1`)}
                onAcorn={(on) => setAcorn(d.id, on)}
                onSave={(on) => setSaved(d.id, on)}
              />
            </View>
          ))}
          {suggested}
        </>
      ) : (
        // 4.4b Following is empty
        <>
          <EmptyState icon={Users} title={t('community.followEmptyTitle')} body={t('community.followEmptyBody')}>
            <View style={styles.wrap}>
              <Button label={t('community.findCooks')} size="M" onPress={() => router.push('/cooks-weather')} />
              <Button label={t('community.browseTables')} size="M" variant="Outline" onPress={() => router.push('/tables')} />
            </View>
          </EmptyState>
          {suggested}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  gone: { display: 'none' },
  root: { flex: 1 },
  flex: { flex: 1 },
  px: { paddingHorizontal: space[20] },
  wash: { position: 'absolute', left: 0, right: 0, top: 0, height: 420 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space[20], paddingVertical: space[12] },
  tabs: { paddingTop: space[12] },
  rule: { height: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space[16] },
  dot: { position: 'absolute', right: -2, top: -2, width: 8, height: 8, borderRadius: 4 },
  nowWrap: { paddingTop: space[12], paddingBottom: space[4], paddingHorizontal: space[20] },
  searchWrap: { paddingTop: space[10], paddingHorizontal: space[20] },
  typing: { paddingHorizontal: space[20], paddingTop: space[16], gap: space[10] },
  overline: { marginTop: space[6] },
  sugRow: { flexDirection: 'row', alignItems: 'center', gap: space[12], paddingHorizontal: space[16], paddingVertical: space[14] },
  chips: { gap: space[8], paddingHorizontal: space[20], paddingTop: space[16] },
  chipsTop: { paddingTop: space[16] },
  chipsTight: { flexDirection: 'row', gap: space[8], paddingHorizontal: space[20] },
  body: { paddingHorizontal: space[20], paddingTop: space[16], paddingBottom: space[12], gap: space[12] },
  ctx: { flexDirection: 'row', alignItems: 'center', gap: space[6] },
  qs: { gap: space[10] },
  askBar: { flexDirection: 'row', alignItems: 'center', gap: space[10], paddingHorizontal: space[14], paddingVertical: space[12], borderRadius: radius.lg, borderWidth: 1 },
  loading: { marginTop: space[40] },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8], justifyContent: 'center', marginTop: space[8] },
  section: { paddingTop: space[24], gap: space[12] },
  sectionL: { paddingTop: space[32], gap: space[12] },
  carousel: { gap: space[12], paddingHorizontal: space[20] },
  countryCard: { paddingHorizontal: 18, paddingVertical: space[14], justifyContent: 'space-between' },
  countryTop: { flexDirection: 'row' },
  countryBottom: { gap: space[10] },
  tagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rows: { paddingHorizontal: space[20], paddingTop: space[4], gap: space[12] },
  festive: { width: 168, height: 196, borderRadius: radius.xl, overflow: 'hidden', padding: space[16], gap: space[6] },
  badge: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  story: { width: '100%', padding: space[24], justifyContent: 'space-between' },
  storyFoot: { gap: space[16] },
  storyBody: { flexDirection: 'row', alignItems: 'flex-end', gap: space[16] },
  challenge: { width: 220, height: 252, borderRadius: radius.xl, overflow: 'hidden', padding: space[16] },
  challengeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeLeft: { flexDirection: 'row', alignItems: 'center', gap: space[6], paddingHorizontal: space[10], paddingVertical: space[4], borderRadius: radius.full },
  live: { width: 6, height: 6, borderRadius: 3 },
  challengeDesc: { marginTop: space[6] },
  challengeFoot: { flexDirection: 'row', alignItems: 'center', gap: space[8], marginTop: space[14], height: 36 },
  plus: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  followHead: { paddingTop: space[24] },
  followTitle: { paddingBottom: space[12] },
  tableRow: { gap: space[8], paddingHorizontal: space[20], paddingBottom: space[16] },
  tableChip: { flexDirection: 'row', alignItems: 'center', gap: space[8], paddingLeft: space[6], paddingRight: space[12], paddingVertical: space[6], borderRadius: radius.full, borderWidth: 1 },
  browse: { flexDirection: 'row', alignItems: 'center', gap: space[6], paddingLeft: space[10], paddingRight: space[12], paddingVertical: space[6], borderRadius: radius.full, borderWidth: 1 },
  filterRow: { flexDirection: 'row', gap: space[8], paddingHorizontal: space[20], paddingBottom: space[16] },
  fromTable: { flexDirection: 'row', alignItems: 'center', gap: space[6], paddingHorizontal: space[20], paddingBottom: space[8] },
  suggestBlock: { paddingTop: space[8], gap: space[12] },
  cookRow: { gap: space[10], paddingHorizontal: space[20] },
  suggest: { width: 128, alignItems: 'center', gap: space[4], padding: space[12], borderRadius: radius.xl, borderWidth: 1 },
});
