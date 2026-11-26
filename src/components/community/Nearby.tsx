import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTabFocusEffect } from '../TabBar';
import { Clock, CloudRain, MapPin, Search, SlidersHorizontal, X } from '../icons/ongdal';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Keyboard, Pressable, ScrollView, Share, StyleSheet, useWindowDimensions, View } from 'react-native';
import * as Linking from 'expo-linking';
import { timeAgo } from '../../lib/time';
import { postPlace } from '../../services/location';
import { useDietPrefs } from '../../lib/dietPrefs';
import { cellsAround } from '../../lib/geohash';
import { getHere, useHere, type Here } from '../../lib/useHere';
import { alertOpenSettings, locationBlocked } from '../../lib/permissions';
import {
  fetchAreaQuestions, fetchNearby, fetchNearbyQuestions, fetchTodayTopDishes, searchSuggestions, setMeToo,
  type CardDish, type Question, type TopDish, type TopScope,
} from '../../services/community';
import { saveLocationChoice } from '../../services/profile';
import { radius, space, useTheme, WEATHER_ICON } from '../../theme';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { Icon } from '../Icon';
import { MessageCircle, Share as ShareIcon } from '../icons/ongdal';
import { Text } from '../Text';
import { FilterChips, FilterSheet, hasFilters, NO_FILTERS, type SearchFilters } from './SearchFilters';
import { Avatar, EmptyState, FoodGrid, ListCard, MoreButton, QuestionCard, SearchField, SectionHeader, useByline, useMyId, type ReportTarget } from './Parts';

export type Area = 'all' | 'near' | 'area' | 'weather';
const RECENT_KEY = 'community.recentSearches';
/** "Our area" on Explore: 3–5 questions (fewer in your cell → filled from wider ranges). */
const AREA_QUESTIONS = 3;
/** Fewer than this in the chosen range → fill from wider ranges (district → city → same weather, newest). */
const AREA_MIN = 3;

const placeOf = (here: Here) => ({
  city: here.place?.city ?? here.forecast?.city ?? null,
  district: here.place?.district ?? null,
});

// ------------------------------------------------------------------------------------------------ data

/** Nearby dishes for an area filter + search term (same-weather dishes first). null while loading. */
function useNearbyDishes(here: Here, area: Area, query: string, filters: SearchFilters = NO_FILTERS) {
  const f = here.forecast;
  const { city, district } = placeOf(here);
  const [dishes, setDishes] = useState<CardDish[] | null>(null);
  const diet = useDietPrefs();
  const load = useCallback(async () => {
    if (here.status === 'loading') return;
    setDishes(null);
    try {
      const list = await fetchNearby({
        city,
        neighborhood: area === 'area' ? district : null,
        cells: area === 'near' && here.coords ? cellsAround(here.coords.latitude, here.coords.longitude) : null,
        mood: area === 'weather' ? f?.mood ?? null : null,
        query,
        maxMinutes: filters.maxMinutes,
        difficulty: filters.difficulty,
        ingredients: filters.ingredients,
        diet,
      });
      // "best in <weather> first": same-weather dishes lead, then newest.
      setDishes(f?.mood ? [...list.filter((d) => d.mood === f.mood), ...list.filter((d) => d.mood !== f.mood)] : list);
    } catch {
      setDishes([]);
    }
  }, [here.status, here.coords, city, district, area, f?.mood, query, filters, diet]);
  useTabFocusEffect(useCallback(() => { load(); }, [load]));
  return dishes;
}

/** Questions asked in my area cell, with optimistic "me too". `fill`: top up to AREA_MIN from wider ranges (Our area). */
function useNearbyQuestions(here: Here, n: number, fill?: boolean, reload = 0) {
  const [questions, setQuestions] = useState<Question[]>([]);
  // false until the first answer (or failure) — no cell (city mode) counts as answered: nothing to load.
  const [loaded, setLoaded] = useState(false);
  const { city, district } = placeOf(here);
  useTabFocusEffect(
    useCallback(() => {
      if (!here.cell) { setLoaded(true); return; }
      const load = fill ? fetchAreaQuestions(here.cell, { district, city }, AREA_MIN, n) : fetchNearbyQuestions(here.cell, n);
      load.then(setQuestions).catch(() => setQuestions([])).finally(() => setLoaded(true));
    }, [here.cell, n, fill, district, city, reload]),
  );
  const meToo = async (q: Question) => {
    const on = !q.meTooByMe;
    setQuestions((l) => l.map((x) => (x.id === q.id ? { ...x, meTooByMe: on, meToo: x.meToo + (on ? 1 : -1) } : x)));
    try { await setMeToo(q.id, on); } catch { setQuestions((l) => l.map((x) => (x.id === q.id ? q : x))); }
  };
  return { questions, meToo, loaded };
}

// ------------------------------------------------------------------------------------------------ search (3.4)

/**
 * Search Field + 3.4 typing panel (suggestions · recent searches). While typing the panel replaces `children`.
 * `onSubmit` gets the trimmed term ('' = cleared).
 */
function NearbySearch({ city, initial = '', onSubmit, filters, onFilters, children }: {
  city: string | null; initial?: string; onSubmit: (term: string) => void;
  /** Filter button beside the field (popup) + the selected filters as chips under it. */
  filters?: SearchFilters; onFilters?: (f: SearchFilters) => void;
  children?: ReactNode;
}) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const [query, setQuery] = useState(initial);
  const [focused, setFocused] = useState(false);
  const [suggest, setSuggest] = useState<{ name: string; n: number }[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY).then((v) => v && setRecent(JSON.parse(v))).catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!focused || query.trim().length < 2) return setSuggest([]);
    const h = setTimeout(() => searchSuggestions(query, city).then(setSuggest).catch(() => setSuggest([])), 250);
    return () => clearTimeout(h);
  }, [query, focused, city]);

  const run = (term: string) => {
    const v = term.trim();
    setQuery(v);
    setFocused(false);
    Keyboard.dismiss();
    onSubmit(v);
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
  const typing = focused && (query.length > 0 || recent.length > 0);

  return (
    <View>
      <View style={[styles.searchWrap, styles.searchRow]}>
        <View style={styles.flex}>
          <SearchField
            value={query}
            onChangeText={(v) => { setQuery(v); if (!v) onSubmit(''); }}
            placeholder={t('community.searchPlaceholder')}
            focused={focused}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmit={() => run(query)}
          />
        </View>
        {filters && onFilters ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('community.filterTitle')}
            onPress={() => { Keyboard.dismiss(); setFilterOpen(true); }}
            style={[styles.filterBtn, { backgroundColor: color(hasFilters(filters) ? 'bg/inverse' : 'bg/muted') }]}
          >
            <Icon icon={SlidersHorizontal} size={18} color={hasFilters(filters) ? 'fg/inverse' : 'fg/secondary'} />
          </Pressable>
        ) : null}
      </View>
      {filters && onFilters ? (
        <>
          {hasFilters(filters) ? <View style={styles.filterChips}><FilterChips filters={filters} onChange={onFilters} /></View> : null}
          <FilterSheet visible={filterOpen} initial={filters} onClose={() => setFilterOpen(false)} onApply={(f) => { setFilterOpen(false); onFilters(f); }} />
        </>
      ) : null}
      {typing ? (
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
        children
      )}
    </View>
  );
}

// ------------------------------------------------------------------------------------------------ area chips

/** Range chips: (All) · Within 1 km · <district> · Same weather — each only when it can apply. */
function AreaChips({ here, area, onChange, withAll, tight }: { here: Here; area: Area; onChange: (a: Area) => void; withAll?: boolean; tight?: boolean }) {
  const { t } = useTranslation();
  const { district } = placeOf(here);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, tight && styles.chipsTight]} keyboardShouldPersistTaps="handled">
      {withAll ? <Chip label={t('community.all')} selected={area === 'all'} onPress={() => onChange('all')} /> : null}
      {here.coords ? <Chip label={t('community.within1km')} selected={area === 'near'} onPress={() => onChange('near')} /> : null}
      {district ? <Chip label={district} selected={area === 'area'} onPress={() => onChange('area')} /> : null}
      {here.forecast ? <Chip label={t('community.sameWeather')} selected={area === 'weather'} onPress={() => onChange('weather')} /> : null}
    </ScrollView>
  );
}

// ------------------------------------------------------------------------------------------------ Our area (Explore)

/** Our area · Popular today — top 3 dish names nearby today, widened step by step until 3 (see fetchTodayTopDishes). */
/**
 * Popular today (4.1 1113:25935): SectionHeader (+ how far it widened as a badge) → 12 → up to 3 cards, gap 12.
 * Card 1219:15520 — bg/subtle, r2xl, px 16 · py 8, min 108 high: photo 80 r16 · [I ATE THIS · n pill → name · city · time]
 * · ⋯ (report / block, not on my own post). Ranked by "I ate this" (services/community fetchTodayTopDishes).
 */
function TopToday({ here, excludeId, reload, me, onMore }: { here: Here; excludeId: string | null | undefined; reload: number; me: string | null; onMore: (t: ReportTarget) => void }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const { city, district } = placeOf(here);
  const mood = here.forecast?.mood ?? null;
  const [top, setTop] = useState<{ items: TopDish[]; scope: TopScope } | null>(null);
  useTabFocusEffect(
    useCallback(() => {
      // Wait for Story of the day (undefined = still loading) so its post is never in this list.
      if (excludeId === undefined) return;
      const cells = here.coords ? cellsAround(here.coords.latitude, here.coords.longitude, 5) : here.cell ? [here.cell] : [];
      fetchTodayTopDishes({ cells, district, city, mood }, excludeId ? [excludeId] : []).then(setTop).catch(() => setTop({ items: [], scope: 'area' }));
    }, [here.coords, here.cell, district, city, mood, excludeId, reload]),
  );
  // Belt and braces: if the story changes on refocus while the old list is still up, its post is hidden at once too.
  const items = (top?.items ?? []).filter((d) => d.dishId !== excludeId);
  // Badge on the right = how far the list widened: my neighbourhood · district · city · "city · last 3 days" · "weather · recent".
  const badge = (() => {
    if (top == null) return undefined;
    switch (top.scope) {
      case 'district': return district ?? undefined;
      case 'city': return city ?? undefined;
      case 'city3d': return city ? `${city} · ${t('community.area.last3Days')}` : t('community.area.last3Days');
      case 'weather': return mood ? `${t(`weather.${mood}`)} · ${t('community.area.recent')}` : t('community.area.recent');
      default: return (district ?? city) ?? undefined;
    }
  })();
  return (
    <View style={styles.popular}>
      <SectionHeader title={t('community.area.topTitle')} badge={badge} />
      <View style={[styles.px, styles.popularList]}>
        {top == null ? (
          <ActivityIndicator color={color('fg/muted')} style={styles.loadingS} />
        ) : items.length ? (
          items.map((d) => (
            <Pressable key={d.dishId} accessibilityRole="button" accessibilityLabel={d.name} onPress={() => router.push(`/dish/${d.dishId}`)} style={[styles.popCard, { backgroundColor: color('bg/subtle') }]}>
              <Image source={{ uri: d.photo }} style={[styles.popPhoto, { backgroundColor: color('bg/muted') }]} contentFit="cover" recyclingKey={d.dishId} />
              <View style={styles.popText}>
                <View style={[styles.ate, { backgroundColor: color('overlay/scrim') }]}>
                  <Text variant="Overline" color="fg/on-photo" numberOfLines={1}>{t('dish.ateThis')}</Text>
                  <Text variant="Body/S Strong" color="fg/on-photo">・</Text>
                  <Text variant="Body/S Strong" color="fg/on-photo">{String(d.eaten)}</Text>
                </View>
                <View style={styles.popName}>
                  <Text variant="Body/M Strong" numberOfLines={1}>{d.name}</Text>
                  {/* City only (never the neighbourhood / dong), in my language when the post has it. */}
                  <Text variant="Caption" color="fg/muted" numberOfLines={1}>{[postPlace(d).city, timeAgo(d.createdAt, t)].filter(Boolean).join(' · ')}</Text>
                </View>
              </View>
              {d.creator.id !== me ? <MoreButton onPress={() => onMore({ kind: 'dish', id: d.dishId, owner: d.creator })} /> : null}
            </Pressable>
          ))
        ) : (
          <Text variant="Body/S" color="fg/muted">{t('community.area.topEmpty')}</Text>
        )}
      </View>
    </View>
  );
}

/**
 * Question Card on Explore (4.1 1113:25964) — bg/subtle, r2xl, p16, gap 16: avatar 40 · name (Body/S Strong) · "district ·
 * time" · ⋯ → question (Body/L fg/secondary) → photo (r12, when there is one) → answers (message-circle 24 + count) · share.
 * The place is the district / city the question was saved with — never a dong.
 */
function ExploreQuestionCard({ q, me, onMore }: { q: Question; me: string | null; onMore: (t: ReportTarget) => void }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const where = q.range ?? q.place;
  const share = () => {
    const link = Linking.createURL(`/question/${q.id}`);
    Share.share({ message: `${q.body} — ${link}`, url: link }).catch(() => undefined);
  };
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(`/question/${q.id}`)} style={[styles.qCard, { backgroundColor: color('bg/subtle') }]}>
      <View style={styles.qTop}>
        <Avatar url={q.author.avatarUrl} name={q.author.name} size={40} />
        <View style={styles.qWho}>
          <Text variant="Body/S Strong" numberOfLines={1}>{q.author.handle ?? q.author.name}</Text>
          <Text variant="Caption" color="fg/muted" numberOfLines={1}>{[where, timeAgo(q.createdAt, t)].filter(Boolean).join(' · ')}</Text>
        </View>
        {!q.mine && q.author.id !== me ? <MoreButton onPress={() => onMore({ kind: 'question', id: q.id, owner: q.author })} /> : null}
      </View>
      <Text variant="Body/L" color="fg/secondary">{q.body}</Text>
      {q.imageUrl ? <Image source={{ uri: q.imageUrl }} style={[styles.qPhoto, { backgroundColor: color('bg/muted') }]} contentFit="cover" /> : null}
      <View style={styles.qFoot}>
        <View style={styles.qCount} accessible accessibilityLabel={t('ask.answers', { count: q.answers })}>
          <Icon icon={MessageCircle} size={24} />
          <Text variant="Body/S Strong">{String(q.answers)}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={t('home.share')} hitSlop={space[8]} onPress={share}>
          <Icon icon={ShareIcon} size={24} />
        </Pressable>
      </View>
    </Pressable>
  );
}

/**
 * Explore · "Our area" — Popular today (top 3) → 38 → Neighbourhood questions (max 3, topped up from wider ranges; more
 * on the board, its chevron → app/questions) + Ask. Location off → a card to turn it on.
 */
export function OurArea({ excludeId, reload = 0, onMore }: {
  /** Story of the day's dish id — left out of Popular today. undefined while the story is loading; null = no story. */
  excludeId: string | null | undefined;
  /** Bump to load again (after blocking someone). */
  reload?: number;
  /** ⋯ on a card — the screen's report / block sheet (useReportMenu). */
  onMore: (t: ReportTarget) => void;
}) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const { here, allow } = useHere();
  const me = useMyId();
  const { questions, loaded } = useNearbyQuestions(here, AREA_QUESTIONS, true, reload);
  const [busy, setBusy] = useState(false);

  const turnOn = async () => {
    if (await locationBlocked()) return alertOpenSettings(t('home.locationOff.denied')); // iOS won't ask again
    setBusy(true);
    const ok = await allow();
    setBusy(false);
    if (!ok) return; // the user just said no to the system prompt — nothing more to show
    const p = getHere().place;
    await saveLocationChoice({ city: p?.city, country: p?.countryCode ?? p?.country, locationEnabled: true }).catch(() => undefined);
  };

  if (here.status === 'loading') return null;
  if (here.status === 'off') {
    return (
      <View style={styles.px}>
        <View style={[styles.offCard, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
          <Icon icon={MapPin} size={22} color="fg/secondary" />
          <Text variant="Body/M" color="fg/secondary" style={styles.offText}>{t('community.area.locationOff')}</Text>
          <Button label={t('home.locationOff.allow')} size="M" onPress={turnOn} loading={busy} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.area}>
      <TopToday here={here} excludeId={excludeId} reload={reload} me={me} onMore={onMore} />
      {/* Neighbourhood questions 1113:25960 — SectionHeader (›) → 16 → cards, gap 14 → Ask a question. */}
      <View style={styles.questions}>
        <SectionHeader title={t('community.area.questionsTitle')} onMore={() => router.push('/questions')} />
        <View style={[styles.px, styles.qList]}>
          {!loaded ? (
            <ActivityIndicator color={color('fg/muted')} style={styles.loadingS} />
          ) : questions.length ? (
            questions.slice(0, AREA_QUESTIONS).map((q) => <ExploreQuestionCard key={q.id} q={q} me={me} onMore={onMore} />)
          ) : (
            <Text variant="Body/S" color="fg/muted">{t('community.area.questionsEmpty')}</Text>
          )}
          <Button label={t('community.area.ask')} variant="Outline" size="M" icon={MessageCircle} onPress={() => router.push('/questions')} />
        </View>
      </View>
    </View>
  );
}

// ------------------------------------------------------------------------------------------------ full list (3.x)

/** The full Nearby list (3.1–3.6) — search, range chips (with All), ask bar + a question, Dish grid / empty states. */
export function NearbyFeed({ initialQuery = '', initialArea = 'all', initialFilters = NO_FILTERS }: { initialQuery?: string; initialArea?: Area; initialFilters?: SearchFilters }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const byline = useByline();
  const { here } = useHere();
  const f = here.forecast;
  const { city } = placeOf(here);
  const [area, setArea] = useState<Area>(initialArea);
  const [submitted, setSubmitted] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const dishes = useNearbyDishes(here, area, submitted, filters);
  const searching = !!submitted || hasFilters(filters);
  const { questions, meToo } = useNearbyQuestions(here, 3);
  const condition = f ? t(`weather.${f.mood}`).toLowerCase() : '';

  return (
    <NearbySearch city={city} initial={initialQuery} onSubmit={setSubmitted} filters={filters} onFilters={setFilters}>
      <AreaChips here={here} area={area} onChange={setArea} withAll />

      <View style={styles.body}>
        {f ? (
          <View style={styles.ctx}>
            <Icon icon={CloudRain} size={16} color="fg/accent" />
            <Text variant="Body/S Strong" color="fg/accent" numberOfLines={1}>
              {searching && dishes ? t('community.resultsCtx', { count: dishes.length, weather: condition }) : t('community.cookedNear')}
            </Text>
          </View>
        ) : null}

        {!searching ? (
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
      ) : searching ? (
        // 3.3 No results — offer weather / mood tags instead.
        <EmptyState size="L" icon={Search} title={submitted ? t('community.noResultsTitle', { q: submitted }) : t('community.noFilterResults')} body={t('community.noResultsBody')}>
          <View style={styles.wrap}>
            {f ? <Chip label={t(`weather.${f.mood}`)} onPress={() => { setSubmitted(''); setFilters(NO_FILTERS); setArea('weather'); }} /> : null}
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
    </NearbySearch>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  px: { paddingHorizontal: space[20] },
  searchWrap: { paddingTop: space[16], paddingHorizontal: space[20] },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  filterBtn: { width: 48, height: 48, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  filterChips: { paddingTop: space[10], paddingHorizontal: space[20] },
  typing: { paddingHorizontal: space[20], paddingTop: space[16], gap: space[10] },
  overline: { marginTop: space[6] },
  sugRow: { flexDirection: 'row', alignItems: 'center', gap: space[12], paddingHorizontal: space[16], paddingVertical: space[14] },
  chips: { gap: space[8], paddingHorizontal: space[20], paddingTop: space[16] },
  body: { paddingHorizontal: space[20], paddingTop: space[16], paddingBottom: space[12], gap: space[12] },
  ctx: { flexDirection: 'row', alignItems: 'center', gap: space[6] },
  qs: { gap: space[10] },
  askBar: { flexDirection: 'row', alignItems: 'center', gap: space[10], paddingHorizontal: space[14], paddingVertical: space[12], borderRadius: radius.lg, borderWidth: 1 },
  loading: { marginTop: space[40] },
  loadingS: { marginVertical: space[24] },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8], justifyContent: 'center', marginTop: space[8] },
  // Our area — same rhythm as Trending Bites (p32 · gap 6: title → chips).
  section: { paddingTop: space[42], gap: space[6] },
  chipsTight: { paddingTop: 0 },
  // See all — Button · Outline · M, full width inside p20.
  offCard: { alignItems: 'center', gap: space[12], padding: space[20], borderRadius: radius['2xl'], borderWidth: 1 },
  offText: { textAlign: 'center' },
  // Our area boxes (Popular today · questions) — one look: bg/subtle, no border, 2xl.
  areaCard: { borderRadius: radius['2xl'], borderWidth: 0 },
  // Our area content under each SectionHeader (cards · Ask), gap 10.
  block: { gap: space[10] },
  // Explore (4.1 1219:15437): Popular today → 38 → Neighbourhood questions.
  area: { gap: 38 },
  popular: { gap: space[12] },
  popularList: { gap: space[12] },
  // minHeight (not height) so larger text sizes grow the card instead of clipping it.
  popCard: { minHeight: 108, flexDirection: 'row', alignItems: 'center', gap: space[10], paddingHorizontal: space[16], paddingVertical: space[8], borderRadius: radius['2xl'] },
  popPhoto: { width: 80, height: 80, borderRadius: radius.lg },
  popText: { flex: 1, gap: 5, alignItems: 'flex-start' },
  ate: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.full, maxWidth: '100%' },
  popName: { alignSelf: 'stretch', paddingLeft: 9, gap: space[2] },
  questions: { gap: space[16] },
  qList: { gap: space[14] },
  qCard: { padding: space[16], gap: space[16], borderRadius: radius['2xl'] },
  qTop: { flexDirection: 'row', alignItems: 'center', gap: space[10] },
  qWho: { flex: 1, gap: 3 },
  // Figma 318×395 at 390 wide — kept as a ratio so it scales with the card on SE / Pro Max.
  qPhoto: { width: '100%', aspectRatio: 318 / 395, borderRadius: radius.md },
  qFoot: { flexDirection: 'row', alignItems: 'center', gap: space[12] },
  qCount: { flexDirection: 'row', alignItems: 'center', gap: space[6] },
});
