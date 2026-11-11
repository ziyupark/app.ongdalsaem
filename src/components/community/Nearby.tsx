import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { Clock, CloudRain, MapPin, Search, X } from 'lucide-react-native';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Keyboard, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { cellsAround } from '../../lib/geohash';
import { getHere, useHere, type Here } from '../../lib/useHere';
import { fetchNearby, fetchNearbyQuestions, searchSuggestions, setMeToo, type CardDish, type Question } from '../../services/community';
import { saveLocationChoice } from '../../services/profile';
import { radius, space, useTheme, WEATHER_ICON } from '../../theme';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { DishTile } from '../dish/DishTile';
import { Icon } from '../Icon';
import { MessageCircle } from '../icons/custom';
import { Text } from '../Text';
import { EmptyState, FoodGrid, ListCard, QuestionCard, SectionHeader, SearchField, useByline } from './Parts';

export type Area = 'all' | 'near' | 'area' | 'weather';
const RECENT_KEY = 'community.recentSearches';
/** "Our area" on Explore: up to 6 dishes, 2 questions. */
const AREA_DISHES = 6;
const AREA_QUESTIONS = 2;

const placeOf = (here: Here) => ({
  city: here.place?.city ?? here.forecast?.city ?? null,
  district: here.place?.district ?? null,
});

// ------------------------------------------------------------------------------------------------ data

/** Nearby dishes for an area filter + search term (same-weather dishes first). null while loading. */
export function useNearbyDishes(here: Here, area: Area, query: string) {
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
      });
      // "best in <weather> first": same-weather dishes lead, then newest.
      setDishes(f?.mood ? [...list.filter((d) => d.mood === f.mood), ...list.filter((d) => d.mood !== f.mood)] : list);
    } catch {
      setDishes([]);
    }
  }, [here.status, here.coords, city, district, area, f?.mood, query]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  return dishes;
}

/** Questions asked in my area cell, with optimistic "me too". */
export function useNearbyQuestions(here: Here, n: number) {
  const [questions, setQuestions] = useState<Question[]>([]);
  useFocusEffect(
    useCallback(() => {
      if (!here.cell) return;
      fetchNearbyQuestions(here.cell, n).then(setQuestions).catch(() => setQuestions([]));
    }, [here.cell, n]),
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
export function NearbySearch({ city, initial = '', onSubmit, children }: { city: string | null; initial?: string; onSubmit: (term: string) => void; children?: ReactNode }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const [query, setQuery] = useState(initial);
  const [focused, setFocused] = useState(false);
  const [suggest, setSuggest] = useState<{ name: string; n: number }[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

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
      <View style={styles.searchWrap}>
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

/** First range that applies here (Our area has no "All"). */
const firstArea = (here: Here): Area => (here.coords ? 'near' : here.place?.district ? 'area' : here.forecast ? 'weather' : 'all');

// ------------------------------------------------------------------------------------------------ Our area (Explore)

/**
 * Explore · "Our area": range chips → up to 6 nearby dishes (horizontal Dish Tiles) → up to 2 nearby questions →
 * See all (app/nearby-feed). Location off → a card to turn it on. `onShown` gets the dish ids shown here (Explore
 * Together leaves them out).
 */
export function OurArea({ onShown }: { onShown?: (ids: string[]) => void }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { here, allow } = useHere();
  const [area, setArea] = useState<Area>(() => firstArea(here));
  // The reading can arrive after mount (or location can be turned on): move off a range that no longer applies.
  useEffect(() => {
    const ok = (area === 'near' && here.coords) || (area === 'area' && here.place?.district) || (area === 'weather' && here.forecast);
    if (!ok) setArea(firstArea(here));
  }, [here, area]);
  const dishes = useNearbyDishes(here, area, '');
  const { questions, meToo } = useNearbyQuestions(here, AREA_QUESTIONS);
  const shown = (dishes ?? []).slice(0, AREA_DISHES);
  const ids = shown.map((d) => d.id).join(',');
  useEffect(() => { onShown?.(ids ? ids.split(',') : []); }, [ids]); // eslint-disable-line react-hooks/exhaustive-deps
  const [busy, setBusy] = useState(false);
  const tileW = (width - space[20] * 2 - space[16]) / 2;

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
          <Text variant="Body/M" color="fg/secondary" style={styles.offText}>{t('community.turnOnLocation')}</Text>
          <Button label={t('home.locationOff.allow')} size="M" onPress={turnOn} loading={busy} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <SectionHeader title={t('community.ourArea')} />
      <AreaChips here={here} area={area} onChange={setArea} tight />
      {dishes == null ? (
        <ActivityIndicator color={color('fg/muted')} style={styles.loadingS} />
      ) : shown.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tiles}>
          {shown.map((d) => <DishTile key={d.id} dish={d} width={tileW} rounded="2xl" onPress={() => router.push(`/dish/${d.id}`)} />)}
        </ScrollView>
      ) : null}
      {questions.length ? (
        <View style={[styles.px, styles.qs]}>
          {questions.slice(0, AREA_QUESTIONS).map((q) => <QuestionCard key={q.id} q={q} onPress={() => router.push(`/question/${q.id}`)} onMeToo={() => meToo(q)} />)}
        </View>
      ) : null}
      <View style={styles.more}>
        <Button label={t('community.seeAll')} variant="Outline" size="M" onPress={() => router.push({ pathname: '/nearby-feed', params: { area } })} />
      </View>
    </View>
  );
}

// ------------------------------------------------------------------------------------------------ full list (3.x)

/** The full Nearby list (3.1–3.6) — search, range chips (with All), ask bar + a question, Dish grid / empty states. */
export function NearbyFeed({ initialQuery = '', initialArea = 'all' }: { initialQuery?: string; initialArea?: Area }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const byline = useByline();
  const { here } = useHere();
  const f = here.forecast;
  const { city } = placeOf(here);
  const [area, setArea] = useState<Area>(initialArea);
  const [submitted, setSubmitted] = useState(initialQuery);
  const dishes = useNearbyDishes(here, area, submitted);
  const { questions, meToo } = useNearbyQuestions(here, 3);
  const condition = f ? t(`weather.${f.mood}`).toLowerCase() : '';

  return (
    <NearbySearch city={city} initial={initialQuery} onSubmit={setSubmitted}>
      <AreaChips here={here} area={area} onChange={setArea} withAll />

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
            {f ? <Chip label={t(`weather.${f.mood}`)} onPress={() => { setSubmitted(''); setArea('weather'); }} /> : null}
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
  tiles: { gap: space[16], paddingHorizontal: space[20], paddingTop: space[8] },
  // See all — Button · Outline · M, full width inside p20.
  more: { paddingHorizontal: space[20], paddingTop: space[8] },
  offCard: { alignItems: 'center', gap: space[12], padding: space[20], borderRadius: radius['2xl'], borderWidth: 1 },
  offText: { textAlign: 'center' },
});
