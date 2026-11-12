import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { Clock, CloudRain, MapPin, Search, SlidersHorizontal, X } from 'lucide-react-native';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Keyboard, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { cellsAround } from '../../lib/geohash';
import { getHere, useHere, type Here } from '../../lib/useHere';
import {
  fetchAreaQuestions, fetchNearby, fetchNearbyQuestions, fetchTodayTopDishes, searchSuggestions, setMeToo,
  type CardDish, type Question, type TopDish,
} from '../../services/community';
import { useTemp } from '../../lib/prefs';
import { saveLocationChoice } from '../../services/profile';
import { radius, space, useTheme, WEATHER_ICON } from '../../theme';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { Icon } from '../Icon';
import { MessageCircle } from '../icons/custom';
import { Text } from '../Text';
import { FilterChips, FilterSheet, hasFilters, NO_FILTERS, type SearchFilters } from './SearchFilters';
import { EmptyState, FoodGrid, ListCard, ListRow, QuestionCard, SearchField, useByline } from './Parts';

export type Area = 'all' | 'near' | 'area' | 'weather';
const RECENT_KEY = 'community.recentSearches';
/** "Our area" on Explore: 3–5 questions (fewer in your cell → filled from wider ranges). */
const AREA_QUESTIONS = 5;
/** Fewer than this in the chosen range → fill from wider ranges (district → city → same weather, newest). */
const AREA_MIN = 3;

const placeOf = (here: Here) => ({
  city: here.place?.city ?? here.forecast?.city ?? null,
  district: here.place?.district ?? null,
});

// ------------------------------------------------------------------------------------------------ data

/** Nearby dishes for an area filter + search term (same-weather dishes first). null while loading. */
export function useNearbyDishes(here: Here, area: Area, query: string, filters: SearchFilters = NO_FILTERS) {
  const f = here.forecast;
  const { city, district } = placeOf(here);
  const [dishes, setDishes] = useState<CardDish[] | null>(null);
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
      });
      // "best in <weather> first": same-weather dishes lead, then newest.
      setDishes(f?.mood ? [...list.filter((d) => d.mood === f.mood), ...list.filter((d) => d.mood !== f.mood)] : list);
    } catch {
      setDishes([]);
    }
  }, [here.status, here.coords, city, district, area, f?.mood, query, filters]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  return dishes;
}

/** Questions asked in my area cell, with optimistic "me too". `fill`: top up to AREA_MIN from wider ranges (Our area). */
export function useNearbyQuestions(here: Here, n: number, fill?: boolean) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const { city, district } = placeOf(here);
  useFocusEffect(
    useCallback(() => {
      if (!here.cell) return;
      const load = fill ? fetchAreaQuestions(here.cell, { district, city }, AREA_MIN, n) : fetchNearbyQuestions(here.cell, n);
      load.then(setQuestions).catch(() => setQuestions([]));
    }, [here.cell, n, fill, district, city]),
  );
  const meToo = async (q: Question) => {
    const on = !q.meTooByMe;
    setQuestions((l) => l.map((x) => (x.id === q.id ? { ...x, meTooByMe: on, meToo: x.meToo + (on ? 1 : -1) } : x)));
    try { await setMeToo(q.id, on); } catch { setQuestions((l) => l.map((x) => (x.id === q.id ? q : x))); }
  };
  return { questions, meToo };
}

// ------------------------------------------------------------------------------------------------ search (3.4)

/**
 * Search Field + 3.4 typing panel (suggestions · recent searches). While typing the panel replaces `children`.
 * `onSubmit` gets the trimmed term ('' = cleared).
 */
export function NearbySearch({ city, initial = '', onSubmit, filters, onFilters, children }: {
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
export function AreaChips({ here, area, onChange, withAll, tight }: { here: Here; area: Area; onChange: (a: Area) => void; withAll?: boolean; tight?: boolean }) {
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

/** Our area · Popular today — top 3 dish names shared nearby since midnight (district → city when 0–1). */
function TopToday({ here }: { here: Here }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const { city, district } = placeOf(here);
  const [top, setTop] = useState<{ items: TopDish[]; range: string | null } | null>(null);
  useFocusEffect(
    useCallback(() => {
      const cells = here.coords ? cellsAround(here.coords.latitude, here.coords.longitude, 5) : here.cell ? [here.cell] : [];
      fetchTodayTopDishes({ cells, district, city }).then(setTop).catch(() => setTop({ items: [], range: null }));
    }, [here.coords, here.cell, district, city]),
  );
  return (
    <View style={styles.block}>
      <View style={styles.blockHead}>
        <Text variant="Title/S" style={styles.flex} numberOfLines={1}>{t('community.area.topTitle')}</Text>
        {top?.range ? <Text variant="Caption" color="fg/muted" numberOfLines={1}>{t('community.area.basis', { place: top.range })}</Text> : null}
      </View>
      {top == null ? (
        <ActivityIndicator color={color('fg/muted')} style={styles.loadingS} />
      ) : top.items.length ? (
        <ListCard>
          {top.items.map((d, i) => (
            <ListRow
              key={d.dishId}
              last={i === top.items.length - 1}
              onPress={() => router.push(`/dish/${d.dishId}`)}
              leading={
                <View style={styles.rankLead}>
                  <Text variant="Title/S" color="fg/accent" style={styles.rank}>{i + 1}</Text>
                  <Image source={{ uri: d.photo }} style={[styles.thumb, { backgroundColor: color('bg/muted') }]} contentFit="cover" recyclingKey={d.dishId} />
                </View>
              }
              title={d.name}
              sub={t('community.area.posts', { count: d.count })}
            />
          ))}
        </ListCard>
      ) : (
        <Text variant="Body/S" color="fg/muted">{t('community.area.topEmpty')}</Text>
      )}
    </View>
  );
}

/**
 * Explore · "Our area" — Today's table in our area: header (district · weather temp) → Popular today (top 3) →
 * area questions (3–5, topped up from wider ranges) + Ask → 3 neighbours' dishes + See more
 * (app/nearby-feed). Location off → a card to turn it on. `onShown` gets the dish ids shown here (Explore
 * Together leaves them out).
 */
export function OurArea() {
  const { color } = useTheme();
  const { t } = useTranslation();
  const temp = useTemp();
  const { here, allow } = useHere();
  const f = here.forecast;
  const { city, district } = placeOf(here);
  const { questions, meToo } = useNearbyQuestions(here, AREA_QUESTIONS, true);
  const [busy, setBusy] = useState(false);

  const turnOn = async () => {
    setBusy(true);
    const ok = await allow();
    setBusy(false);
    if (ok) {
      const p = getHere().place;
      await saveLocationChoice({ city: p?.city, country: p?.countryCode ?? p?.country, locationEnabled: true }).catch(() => undefined);
    }
  };

  if (here.status === 'loading') return null;
  if (here.status === 'off') {
    return (
      <View style={[styles.section, styles.px]}>
        <View style={[styles.offCard, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
          <Icon icon={MapPin} size={22} color="fg/secondary" />
          <Text variant="Body/M" color="fg/secondary" style={styles.offText}>{t('community.area.locationOff')}</Text>
          <Button label={t('home.locationOff.allow')} size="M" onPress={turnOn} loading={busy} />
        </View>
      </View>
    );
  }

  const caption = [district ?? city, f ? `${t(`weather.${f.mood}`)} ${temp(f.tempC)}°` : null].filter(Boolean).join(' · ');

  return (
    <View style={styles.section}>
      {/* 1 · Header — Title/M + Caption */}
      <View style={styles.px}>
        <Text variant="Title/M" numberOfLines={1}>{t('community.area.title')}</Text>
        {caption ? <Text variant="Caption" color="fg/muted" numberOfLines={1}>{caption}</Text> : null}
      </View>

      <View style={[styles.px, styles.blocks]}>
        {/* 2 · Popular today */}
        <TopToday here={here} />
        {/* 3 · Area questions + Ask */}
        <View style={styles.block}>
          <Text variant="Title/S">{t('community.area.questionsTitle')}</Text>
          {questions.slice(0, AREA_QUESTIONS).map((q) => <QuestionCard key={q.id} q={q} rounded="2xl" onPress={() => router.push(`/question/${q.id}`)} onMeToo={() => meToo(q)} />)}
          <Button label={t('community.area.ask')} variant="Outline" size="M" icon={MessageCircle} onPress={() => router.push('/ask')} />
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
  section: { paddingTop: space[32], gap: space[6] },
  chipsTight: { paddingTop: 0 },
  // See all — Button · Outline · M, full width inside p20.
  offCard: { alignItems: 'center', gap: space[12], padding: space[20], borderRadius: radius['2xl'], borderWidth: 1 },
  offText: { textAlign: 'center' },
  // Today's table in our area — header, then blocks p20 · gap 24 (block: title → content, gap 10).
  blocks: { gap: space[24], paddingTop: space[16] },
  block: { gap: space[10] },
  blockHead: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  rankLead: { flexDirection: 'row', alignItems: 'center', gap: space[10] },
  rank: { width: space[16], textAlign: 'center' },
  thumb: { width: 48, height: 48, borderRadius: radius.md },
});
