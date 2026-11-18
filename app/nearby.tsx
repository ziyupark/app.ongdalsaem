import { router, useLocalSearchParams } from 'expo-router';
import {
  Beef, CakeSlice, ChevronLeft, ChevronRight, CookingPot, Croissant, Fish, List, Map as MapIcon, MapPin, Pizza, Salad, Sandwich, Soup, Utensils,
  type LucideIcon,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type MapViewType from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { Chip } from '../src/components/Chip';
import { EmptyState } from '../src/components/community/Parts';
import { Icon } from '../src/components/Icon';
import { IconButton } from '../src/components/IconButton';
import { Text } from '../src/components/Text';
import { UnderlineTabs } from '../src/components/UnderlineTabs';
import { openMapsSearch } from '../src/lib/maps';
import { loadMaps } from '../src/lib/optionalNative';
import { useTemp } from '../src/lib/prefs';
import { useHere } from '../src/lib/useHere';
import { foodFamily, formatDistance, PlacesError, searchNearbyPlaces, type NearbyPlace } from '../src/services/places';
import { elevation, radius, space, useTheme, WEATHER_ICON, type WeatherMood } from '../src/theme';

// Loaded lazily: a build without react-native-maps keeps the list (no "Map" button).
const Maps = loadMaps();

type TabKey = 'same' | 'similar';
type Result = { places: NearbyPlace[]; err: PlacesError['code'] | null };

/** Food family → the round kind icon on each row (Utensils when the dish has no family). */
const FAMILY_ICON: Record<string, LucideIcon> = {
  burger: Sandwich, noodle: CookingPot, curry: CookingPot, dumpling: CookingPot, soup: Soup, rice: CookingPot,
  seafood: Fish, meat: Beef, pizza: Pizza, salad: Salad, dessert: CakeSlice, bread: Croissant,
};

/** ⑤ one line per weather family (i18n nearbyPlaces.tip.*). */
function tipKey(m: WeatherMood) {
  if (['drizzle', 'rain', 'heavy-rain', 'shower', 'thunder'].includes(m)) return 'rain';
  if (['sleet', 'flurries', 'snow', 'heavy-snow'].includes(m)) return 'snow';
  if (m === 'cold') return 'cold';
  if (m === 'heat') return 'heat';
  if (m === 'clear' || m === 'clear-night') return 'clear';
  return 'cloudy';
}

const byDistance = (list: NearbyPlace[]) => [...list].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

/**
 * 2.4 Nearby (v2, Figma 861:11860) — eyebrow · "{dish} nearby" · walk/open summary · weather tip · tabs (the dish /
 * similar food family) · Open now / Walkable / budget · "{n} · nearest first" · rows, always nearest first.
 * "Map" → 2.4 Nearby · Map (v2, 863:11996): every pin of the current tab, the tapped one's row at the bottom.
 * Each tab's result is kept per filter set, so switching back never calls the server again.
 */
export default function EatNearby() {
  const { dish } = useLocalSearchParams<{ dish: string }>();
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const temp = useTemp();
  const { here, allow } = useHere();
  const [openNow, setOpenNow] = useState(true);
  const [walkable, setWalkable] = useState(false);
  const [cheap, setCheap] = useState(false);
  const [tab, setTab] = useState<TabKey>('same');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [sel, setSel] = useState(0);
  const [results, setResults] = useState<Record<string, Result>>({});
  const loading = useRef(new Set<string>());
  const mapRef = useRef<MapViewType>(null);
  const name = String(dish ?? '');
  const lang = i18n.language;
  const family = useMemo(() => foodFamily(name, lang), [name, lang]);
  const kind = family ? t(`nearbyPlaces.kinds.${family.id}`) : '';
  const mood = here.forecast?.mood ?? null;
  const lat = here.coords?.latitude;
  const lon = here.coords?.longitude;

  const keyOf = useCallback((k: TabKey) => [k, openNow ? 1 : 0, walkable ? 1 : 0, cheap ? 1 : 0, lat?.toFixed(3), lon?.toFixed(3), lang].join('|'), [openNow, walkable, cheap, lat, lon, lang]);
  const key = keyOf(tab);
  const current = results[key];

  useEffect(() => {
    if (lat == null || lon == null || results[key] || loading.current.has(key)) return;
    if (tab === 'similar' && !family) return;
    loading.current.add(key);
    const tidy = (list: NearbyPlace[]) => byDistance(walkable ? list.filter((p) => (p.distance ?? 0) <= 1000) : list);
    const base = { lat, lon, openNow, radius: walkable ? 1000 : 2500, maxPrice: cheap ? (1 as const) : undefined, language: lang };
    (async () => {
      try {
        const res = await searchNearbyPlaces({ ...base, query: tab === 'same' ? name : family!.query });
        const next: Record<string, Result> = {};
        if (tab === 'same' && res.similar && res.similar !== 'words') {
          // The dish itself found nothing and the server answered with its food family — that is the similar tab.
          next[key] = { places: [], err: null };
          if (family && res.similar === family.id) next[keyOf('similar')] = { places: tidy(res.places), err: null };
        } else if (tab === 'similar' && res.similar === 'words') {
          next[key] = { places: [], err: null }; // only loose word matches — not this food family
        } else {
          next[key] = { places: tidy(res.places), err: null };
        }
        setResults((r) => ({ ...r, ...next }));
      } catch (e) {
        setResults((r) => ({ ...r, [key]: { places: [], err: e instanceof PlacesError ? e.code : 'failed' } }));
      } finally {
        loading.current.delete(key);
      }
    })();
  }, [key, keyOf, tab, family, name, lat, lon, openNow, walkable, cheap, lang, results]);

  const places = current?.places ?? null;
  useEffect(() => { setSel(0); }, [key]);
  const pinned = useMemo(() => (places ?? []).filter((p) => p.lat != null && p.lon != null), [places]);

  // 2.4b — the place, the walk there and the map-app hand-off; without coordinates fall back to a Maps search.
  const open = (p: NearbyPlace) => (p.lat != null && p.lon != null
    ? router.push({ pathname: '/place', params: { name: p.name, address: p.address ?? '', kind: p.kind ?? '', lat: String(p.lat), lon: String(p.lon), mapsUri: p.mapsUri ?? '', dish: name, family: family?.id ?? '' } })
    : openMapsSearch(`${p.name} ${p.address ?? ''}`));

  const kindIcon = (family && FAMILY_ICON[family.id]) || Utensils;
  const meta = (p: NearbyPlace) => [
    formatDistance(p.distance),
    p.walkMin != null ? t('nearbyPlaces.walk', { n: p.walkMin }) : null,
    p.closesAt ? t('nearbyPlaces.openTill', { time: p.closesAt }) : p.openNow === false ? t('nearbyPlaces.closed') : null,
  ].filter(Boolean).join(' · ').toUpperCase();

  const row = (p: NearbyPlace, i: number, style?: object) => (
    <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={p.name} onPress={() => open(p)} style={[styles.card, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }, style]}>
      <View style={[styles.orb, { backgroundColor: color('bg/accent-subtle') }]}>
        <Icon icon={kindIcon} size={22} color="fg/accent" />
      </View>
      <View style={styles.body}>
        <Text variant="Overline" color="fg/muted" numberOfLines={1}>{meta(p)}</Text>
        <Text variant="Title/S" numberOfLines={1}>{p.name}</Text>
        <Text variant="Caption" color="fg/secondary" numberOfLines={1}>{p.kind || (tab === 'similar' ? kind : name)}</Text>
        {i === 0 ? (
          <View style={[styles.badge, { backgroundColor: color('bg/accent-subtle') }]}>
            <Text variant="Caption Strong" color="fg/accent">{t('nearbyPlaces.nearest')}</Text>
          </View>
        ) : null}
      </View>
      {style ? <Icon icon={ChevronRight} size={20} color="fg/muted" /> : null}
    </Pressable>
  );

  // ④ "{n} within a 15-min walk · {n} open now" from what came back.
  const summary = places && places.length ? [
    (() => { const w = places.filter((p) => p.walkMin != null && p.walkMin <= 15).length; return w ? t('nearbyPlaces.summaryWalk', { count: w }) : t('nearbyPlaces.summaryNear', { count: places.length }); })(),
    (() => { const o = places.filter((p) => p.openNow === true).length; return o ? t('nearbyPlaces.summaryOpen', { count: o }) : null; })(),
  ].filter(Boolean).join(' · ') : null;

  const where = here.place?.district ?? here.place?.city ?? null;
  const canMap = !!Maps && !!here.coords && pinned.length > 0;

  // ── 2.4 Nearby · Map (v2) ──
  if (view === 'map' && Maps && here.coords) {
    const chosen = pinned[Math.min(sel, pinned.length - 1)];
    const fit = () => mapRef.current?.fitToCoordinates(
      [here.coords!, ...pinned.map((p) => ({ latitude: p.lat!, longitude: p.lon! }))],
      { edgePadding: { top: insets.top + 100, right: 60, bottom: 220, left: 60 }, animated: false },
    );
    return (
      <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
        <Maps.default
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          showsUserLocation
          showsMyLocationButton={false}
          showsPointsOfInterests={false}
          onMapReady={fit}
          initialRegion={{ latitude: here.coords.latitude, longitude: here.coords.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
        >
          {pinned.map((p, i) => {
            const on = p === chosen;
            return (
              <Maps.Marker key={`${p.id}${on ? '-on' : ''}`} coordinate={{ latitude: p.lat!, longitude: p.lon! }} anchor={{ x: 0.5, y: 0.5 }} zIndex={on ? 2 : 1} tracksViewChanges={false} onPress={() => setSel(i)}>
                {on ? (
                  <View style={[styles.pinOn, elevation['Elevation/3 Float'], { backgroundColor: color('bg/inverse') }]}>
                    <View style={[styles.pinOrb, { backgroundColor: color('bg/accent-subtle') }]}>
                      <Icon icon={kindIcon} size={18} color="fg/accent" />
                    </View>
                    <Text variant="Caption Strong" color="fg/inverse" numberOfLines={1} style={styles.shrink}>{p.name}</Text>
                  </View>
                ) : (
                  <View style={[styles.pin, elevation['Elevation/2 Raised'], { backgroundColor: color('bg/default'), borderColor: color('border/default') }]}>
                    <Icon icon={kindIcon} size={16} />
                  </View>
                )}
              </Maps.Marker>
            );
          })}
        </Maps.default>
        <View style={[styles.mapTop, { top: insets.top + space[8] }]}>
          <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
          <Button label={t('nearbyPlaces.list')} icon={List} size="S" variant="White" onPress={() => setView('list')} />
        </View>
        {chosen ? (
          <View style={[styles.mapCard, { bottom: insets.bottom + space[12] }]}>
            {row(chosen, pinned.indexOf(chosen), elevation['Elevation/3 Float'])}
          </View>
        ) : null}
      </View>
    );
  }

  // ── 2.4 Nearby (v2) ──
  return (
    <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space[8], paddingBottom: insets.bottom + space[24] }}>
        <View style={[styles.px, styles.header]}>
          <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
          {canMap ? <Button label={t('nearbyPlaces.map')} icon={MapIcon} size="S" variant="Secondary" onPress={() => setView('map')} /> : null}
        </View>

        <View style={styles.titleBlock}>
          <View style={styles.eyebrow}>
            <Text variant="Overline" color="fg/muted">{[t('nearbyPlaces.eyebrow'), where].filter(Boolean).join(' · ').toUpperCase()}</Text>
            {here.forecast ? (
              <>
                <Text variant="Overline" color="fg/muted">·</Text>
                <Icon icon={WEATHER_ICON[here.forecast.mood]} size={14} color="fg/muted" />
                <Text variant="Overline" color="fg/muted">{`${temp(here.forecast.tempC)}°`}</Text>
              </>
            ) : null}
          </View>
          <Text variant="Display/L">
            {name}
            <Text variant="Display/L" color="fg/muted">{` ${t('nearbyPlaces.nearby')}`}</Text>
          </Text>
          {summary ? <Text variant="Body/M" color="fg/secondary">{summary}</Text> : null}
          {mood ? (
            <View style={[styles.tip, { backgroundColor: color('bg/accent-subtle') }]}>
              <Text variant="Body/S">{t(`nearbyPlaces.tip.${tipKey(mood)}`)}</Text>
            </View>
          ) : null}
        </View>

        {family ? (
          <UnderlineTabs
            style={styles.tabs}
            contentStyle={styles.tabRow}
            value={tab}
            onChange={setTab}
            items={[{ key: 'same', label: name }, { key: 'similar', label: t('nearbyPlaces.similarTab', { kind }) }]}
          />
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label={t('nearbyPlaces.openNow')} selected={openNow} onPress={() => setOpenNow((v) => !v)} />
          <Chip label={t('nearbyPlaces.walkable')} selected={walkable} onPress={() => setWalkable((v) => !v)} />
          <Chip label={t('nearbyPlaces.cheap')} selected={cheap} onPress={() => setCheap((v) => !v)} />
        </ScrollView>

        <View style={styles.list}>
          {here.status === 'loading' ? <ActivityIndicator color={color('fg/muted')} style={styles.loading} /> : !here.coords ? (
            <EmptyState icon={MapPin} title={t('nearbyPlaces.locationTitle')} body={t('nearbyPlaces.locationBody')}>
              <Button label={t('ask.turnOn')} size="M" onPress={allow} />
              <Button label={t('nearbyPlaces.openMaps')} size="M" variant="Outline" onPress={() => openMapsSearch(name)} />
            </EmptyState>
          ) : places == null ? <ActivityIndicator color={color('fg/muted')} style={styles.loading} /> : current?.err ? (
            <EmptyState icon={MapPin} title={t('nearbyPlaces.errorTitle')} body={t(current.err === 'failed' ? 'nearbyPlaces.errorBody' : 'nearbyPlaces.setupBody')}>
              <Button label={t('nearbyPlaces.openMaps')} size="M" variant="Outline" onPress={() => openMapsSearch(name)} />
            </EmptyState>
          ) : places.length ? (
            <>
              <Text variant="Caption Strong" color="fg/secondary">{t('nearbyPlaces.sortedCount', { count: places.length })}</Text>
              {places.map((p, i) => row(p, i))}
              <Text variant="Caption" color="fg/muted" style={styles.center}>{t('nearbyPlaces.attribution')}</Text>
            </>
          ) : tab === 'same' && family ? (
            <EmptyState icon={MapPin} title={t('nearbyPlaces.emptyTitle', { dish: name })}>
              <Button label={t('nearbyPlaces.seeSimilar', { kind })} size="M" variant="Secondary" onPress={() => setTab('similar')} />
            </EmptyState>
          ) : (
            <EmptyState icon={MapPin} title={t('nearbyPlaces.emptyTitle', { dish: tab === 'similar' ? kind : name })} body={t('nearbyPlaces.emptyBody')}>
              <Button label={t('nearbyPlaces.openMaps')} size="M" variant="Outline" onPress={() => openMapsSearch(tab === 'similar' && family ? family.query : name)} />
            </EmptyState>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  px: { paddingHorizontal: space[20] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleBlock: { paddingHorizontal: space[20], paddingTop: space[24], gap: space[6] },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: space[4] },
  tip: { alignSelf: 'flex-start', marginTop: space[6], paddingHorizontal: space[12], paddingVertical: space[6], borderRadius: radius.full },
  tabs: { marginTop: space[16] },
  tabRow: { paddingHorizontal: space[20], gap: space[20] },
  chips: { gap: space[8], paddingHorizontal: space[20], paddingTop: space[16] },
  list: { paddingHorizontal: space[20], paddingTop: space[16], gap: space[12] },
  loading: { marginTop: space[40] },
  center: { textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', gap: space[14], paddingVertical: space[14], paddingLeft: space[14], paddingRight: space[16], borderRadius: radius.xl, borderWidth: 1 },
  orb: { width: 48, height: 48, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: space[2] },
  badge: { alignSelf: 'flex-start', marginTop: space[2], paddingHorizontal: space[8], paddingVertical: space[2], borderRadius: radius.full },
  shrink: { flexShrink: 1 },
  mapTop: { position: 'absolute', left: space[20], right: space[20], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mapCard: { position: 'absolute', left: space[20], right: space[20] },
  pin: { width: 32, height: 32, borderRadius: radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pinOn: { flexDirection: 'row', alignItems: 'center', gap: space[8], height: 44, paddingLeft: space[4], paddingRight: space[12], borderRadius: radius.full, maxWidth: 220 },
  pinOrb: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
});
