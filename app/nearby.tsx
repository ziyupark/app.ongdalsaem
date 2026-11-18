import { BlurView } from 'expo-blur';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Beef, CakeSlice, ChevronLeft, ChevronRight, Coffee, CookingPot, Hamburger, List, Map as MapIcon, MapPin, Soup, Utensils,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type MapViewType from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet } from '../src/components/BottomSheet';
import { Button } from '../src/components/Button';
import { Chip } from '../src/components/Chip';
import { EmptyState } from '../src/components/community/Parts';
import { Icon } from '../src/components/Icon';
import { IconButton } from '../src/components/IconButton';
import { Text } from '../src/components/Text';
import { Toggle } from '../src/components/Toggle';
import { UnderlineTabs } from '../src/components/UnderlineTabs';
import { chooseMapApp, MAP_APP_LABEL, searchInMapApp, setSavedMapApp, type MapAppId, type MapSearch } from '../src/lib/mapApps';
import { loadMaps } from '../src/lib/optionalNative';
import { useTemp } from '../src/lib/prefs';
import { placeLabel, useHere } from '../src/lib/useHere';
import { foodFamily, formatDistance, PlacesError, searchNearbyPlaces, type NearbyPlace } from '../src/services/places';
import { elevation, moods, radius, space, useTheme, WEATHER_ICON, withAlpha } from '../src/theme';

// Loaded lazily: a build without react-native-maps keeps the list (no map button).
const Maps = loadMaps();

/** `places` = the dish's places (nearest first), then the similar-food places (nearest first); `same` = how many are the dish. */
type Result = { places: NearbyPlace[]; same: number; err: PlacesError['code'] | null };

// The place's kind (Google's primaryType display name, in the request language) → one of seven groups for the round
// icon. Checked in this order, so "Korean barbecue" is meat and "面包" (bread) is dessert, not noodles.
type KindGroup = 'cafe' | 'dessert' | 'fastfood' | 'noodle' | 'meat' | 'korean' | 'other';
const KIND_WORDS: [KindGroup, string[]][] = [
  ['cafe', ['cafe', 'café', 'coffee', 'cafetería', 'cafeteria', 'kafe', 'kopi', '카페', '커피', 'カフェ', 'コーヒー', '咖啡', 'คาเฟ่', 'กาแฟ', 'cà phê']],
  ['dessert', ['dessert', 'bakery', 'cake', 'ice cream', 'donut', 'doughnut', 'pastry', 'patisserie', 'confectioner', 'postre', 'pastelería', 'panadería', 'heladería', 'sobremesa', 'confeitaria', 'padaria', 'sorveteria', 'toko roti', 'toko kue', '디저트', '베이커리', '제과', '빵', '아이스크림', '케이크', 'スイーツ', 'ケーキ', 'ベーカリー', 'パン', 'デザート', '甜點', '甜点', '蛋糕', '麵包', '面包', '冰淇淋', 'ขนม', 'เบเกอรี่', 'ของหวาน', 'bánh ngọt', 'tráng miệng', 'kem']],
  ['fastfood', ['fast food', 'hamburger', 'burger', 'sandwich', 'pizza', 'comida rápida', 'hamburguesería', 'lanchonete', 'cepat saji', '패스트푸드', '햄버거', '버거', '샌드위치', '피자', 'ファストフード', 'ハンバーガー', 'ピザ', '速食', '快餐', '漢堡', '汉堡', '披薩', 'ฟาสต์ฟู้ด', 'แฮมเบอร์เกอร์', 'đồ ăn nhanh']],
  ['noodle', ['noodle', 'ramen', 'udon', 'soba', 'pho', 'phở', 'bún', 'mie', 'fideos', '국수', '라멘', '라면', '우동', '냉면', '칼국수', '쌀국수', 'ラーメン', 'うどん', 'そば', '麺', '麵', '面', 'ก๋วยเตี๋ยว']],
  ['meat', ['barbecue', 'bbq', 'steak', 'grill', 'meat', 'churrascaria', 'asador', 'parrilla', 'carne', 'daging', 'sate', '고기', '바베큐', '바비큐', '갈비', '삼겹살', '스테이크', '焼肉', '焼き鳥', 'ステーキ', '燒烤', '烧烤', '牛排', 'ปิ้งย่าง', 'สเต๊ก', 'nướng', 'thịt']],
  ['korean', ['korean', 'korea', 'coreano', 'coreana', 'korea', '한식', '한국', '韓国', '韓式', '韩国', '韓國', 'เกาหลี', 'hàn quốc']],
];
const KIND_ICON: Record<KindGroup, LucideIcon> = {
  cafe: Coffee, dessert: CakeSlice, fastfood: Hamburger, noodle: CookingPot, meat: Beef, korean: Soup, other: Utensils,
};
function kindIcon(kind: string | null) {
  const k = (kind ?? '').toLowerCase();
  const hit = k ? KIND_WORDS.find(([, words]) => words.some((w) => k.includes(w))) : undefined;
  return KIND_ICON[hit?.[0] ?? 'other'];
}

/** Korean "A이나 / A나" (A or …) — the particle depends on the last syllable's final consonant. */
function withOr(word: string) {
  const c = word.trim().charCodeAt(word.trim().length - 1);
  if (c < 0xac00 || c > 0xd7a3) return `${word}이나`;
  return (c - 0xac00) % 28 ? `${word}이나` : `${word}나`;
}

const byDistance = (list: NearbyPlace[]) => [...list].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

/**
 * 2.4 Nearby (v2, Figma 848:12957 Similar · 865:12501 Same dish · 865:12609 Empty both) — back + map → date · place →
 * "Nearby" + a grey word (English) → small weather card → "For {dish}" → one tab → Open now / Walkable / Affordable → cards,
 * the list per filter set: the dish's places (nearest first), then its food family's places (nearest
 * first, the dish's own left out) — one tab "{dish} or similar dishes". Nothing at all → Empty (both) + a map-app search.
 * The map button → every pin of the result, the tapped one's card at the bottom, "List" to go back.
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
  const [view, setView] = useState<'list' | 'map'>('list');
  const [sel, setSel] = useState(0);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [picker, setPicker] = useState<MapSearch & { apps: MapAppId[] } | null>(null);
  const [remember, setRemember] = useState(false);
  const loading = useRef(new Set<string>());
  const mapRef = useRef<MapViewType>(null);
  const name = String(dish ?? '');
  const lang = i18n.language;
  const lat = here.coords?.latitude;
  const lon = here.coords?.longitude;
  const f = here.forecast;

  const key = [openNow ? 1 : 0, walkable ? 1 : 0, cheap ? 1 : 0, lat?.toFixed(3), lon?.toFixed(3), lang].join('|');
  const current = results[key];

  useEffect(() => {
    if (lat == null || lon == null || !name || results[key] || loading.current.has(key)) return;
    loading.current.add(key);
    (async () => {
      try {
        const base = { lat, lon, openNow, radius: walkable ? 1000 : 2500, maxPrice: cheap ? (1 as const) : undefined, language: lang };
        const tidy = (list: NearbyPlace[]) => byDistance(walkable ? list.filter((p) => (p.distance ?? 0) <= 1000) : list);
        const first = await searchNearbyPlaces({ ...base, query: name });
        let same: NearbyPlace[] = [];
        let alike: NearbyPlace[] = [];
        if (first.similar) {
          // The dish itself found nothing — the server already answered with similar food.
          alike = first.places;
        } else {
          same = first.places;
          // The dish's food family (soup, rice…), asked with the server's own fallback text (same cached row).
          const family = foodFamily(name, lang);
          if (family) {
            const more = await searchNearbyPlaces({ ...base, query: family.query });
            if (more.similar !== 'words') alike = more.places;
          }
        }
        const sameIds = new Set(same.map((p) => p.id));
        const sameList = tidy(same);
        const alikeList = tidy(alike.filter((p) => !sameIds.has(p.id)));
        setResults((r) => ({ ...r, [key]: { places: [...sameList, ...alikeList], same: sameList.length, err: null } }));
      } catch (e) {
        setResults((r) => ({ ...r, [key]: { places: [], same: 0, err: e instanceof PlacesError ? e.code : 'failed' } }));
      } finally {
        loading.current.delete(key);
      }
    })();
  }, [key, name, lat, lon, openNow, walkable, cheap, lang, results]);

  const places = current?.places ?? null;
  useEffect(() => { setSel(0); }, [key]);
  const pinned = useMemo(() => (places ?? []).filter((p) => p.lat != null && p.lon != null), [places]);

  // The one tab (865:12469): "{dish} or similar dishes" when similar places are in the list, else the dish; only
  // similar places → "Similar dishes". The grey word after "Nearby": the dish, or "Similar dishes" with none of it.
  const sameN = current?.same ?? 0;
  const hasAlike = (places?.length ?? 0) > sameN;
  const label = !hasAlike ? name : sameN ? t('nearbyPlaces.dishOrSimilar', { dish: name }) : t('nearbyPlaces.similarDishes');
  // The title row ("Nearby" + grey word, 848:13143) always shows the English copy, like the shared header's title;
  // screen readers get the user's language.
  const en = useMemo(() => i18n.getFixedT('en'), [i18n]);
  const titleWord = hasAlike && !sameN ? en('nearbyPlaces.similarDishes') : name;

  // Map-app hand-off (src/lib/mapApps): saved or only app → straight there; otherwise the picker.
  const search = async (s: MapSearch) => {
    const c = await chooseMapApp();
    if ('open' in c) return searchInMapApp(c.open, s);
    setRemember(false);
    setPicker({ ...s, apps: c.pick });
  };
  const pick = async (id: MapAppId) => {
    const s = picker;
    setPicker(null);
    if (!s) return;
    if (remember) await setSavedMapApp(id);
    await searchInMapApp(id, s);
  };
  const near = lat != null && lon != null ? { lat, lon } : null;
  const searchDish = () => search({ query: name, near });

  // 2.4b — the place, the walk there and the map-app hand-off; without coordinates fall back to a map-app search.
  const open = (p: NearbyPlace) => (p.lat != null && p.lon != null
    ? router.push({ pathname: '/place', params: { name: p.name, address: p.address ?? '', kind: p.kind ?? '', lat: String(p.lat), lon: String(p.lon), mapsUri: p.mapsUri ?? '', dish: name } })
    : search({ query: `${p.name} ${p.address ?? ''}`.trim(), near }));

  const meta = (p: NearbyPlace) => [
    formatDistance(p.distance),
    p.walkMin != null ? t('nearbyPlaces.walk', { n: p.walkMin }) : null,
  ].filter(Boolean).join(' · ').toUpperCase();

  const card = (p: NearbyPlace, i: number, style?: object) => (
    <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={p.name} onPress={() => open(p)} style={[styles.card, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }, style]}>
      <View style={[styles.orb, { backgroundColor: color('bg/accent-subtle') }]}>
        <Icon icon={kindIcon(p.kind)} size={24} color="fg/accent" />
      </View>
      <View style={styles.body}>
        <View style={styles.names}>
          <Text variant="Overline" color="fg/muted" numberOfLines={1}>{meta(p)}</Text>
          <Text variant="Title/S" numberOfLines={1}>{p.name}</Text>
        </View>
        <View style={[styles.tag, { backgroundColor: color('bg/accent-subtle') }]}>
          <Text variant="Caption Strong" color="fg/accent" numberOfLines={1}>{p.kind || (i < sameN ? name : t('nearbyPlaces.similarDishes'))}</Text>
        </View>
      </View>
      {style ? <Icon icon={ChevronRight} size={20} color="fg/muted" /> : null}
    </Pressable>
  );

  const pickerSheet = (
    <BottomSheet visible={!!picker} onClose={() => setPicker(null)} title={t('mapApps.title')} gap={space[8]}>
      {(picker?.apps ?? []).map((id) => (
        <Pressable key={id} accessibilityRole="button" onPress={() => pick(id)} style={[styles.appRow, { backgroundColor: color('bg/default') }]}>
          <Icon icon={MapIcon} size={20} />
          <Text variant="Body/M Strong" style={styles.flex}>{t(MAP_APP_LABEL[id])}</Text>
        </Pressable>
      ))}
      <View style={styles.remember}>
        <Text variant="Body/M" style={styles.flex}>{t('mapApps.remember')}</Text>
        <Toggle accessibilityLabel={t('mapApps.remember')} value={remember} onValueChange={setRemember} />
      </View>
    </BottomSheet>
  );

  const canMap = !!Maps && !!here.coords;

  // ── 2.4 Nearby · Map ──
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
            const icon = kindIcon(p.kind);
            return (
              <Maps.Marker key={`${p.id}${on ? '-on' : ''}`} coordinate={{ latitude: p.lat!, longitude: p.lon! }} anchor={{ x: 0.5, y: 0.5 }} zIndex={on ? 2 : 1} tracksViewChanges={false} onPress={() => setSel(i)}>
                {on ? (
                  <View style={[styles.pinOn, elevation['Elevation/3 Float'], { backgroundColor: color('bg/inverse') }]}>
                    <View style={[styles.pinOrb, { backgroundColor: color('bg/accent-subtle') }]}>
                      <Icon icon={icon} size={18} color="fg/accent" />
                    </View>
                    <Text variant="Caption Strong" color="fg/inverse" numberOfLines={1} style={styles.shrink}>{p.name}</Text>
                  </View>
                ) : (
                  <View style={[styles.pin, elevation['Elevation/2 Raised'], { backgroundColor: color('bg/default'), borderColor: color('border/default') }]}>
                    <Icon icon={icon} size={16} />
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
            {card(chosen, (places ?? []).indexOf(chosen), elevation['Elevation/3 Float'])}
          </View>
        ) : null}
      </View>
    );
  }

  // Date · place and the weather — the same reading as the shared header (lib/useHere, my location).
  const dateLabel = new Date().toLocaleDateString(lang, { weekday: 'short', month: 'short', day: 'numeric' });
  const where = placeLabel(here.place) || f?.city || '';
  const detail = f
    ? `${t('home.hiLo', { hi: temp(f.hi), lo: temp(f.lo) })}${f.until ? t('home.until', { time: f.until.toLocaleTimeString(lang, { hour: 'numeric' }) }) : ''}`
    : '';

  // ── 2.4 Nearby ──
  return (
    <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space[2], paddingBottom: insets.bottom + space[40] }}>
        <View style={styles.header}>
          <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
          {canMap ? <IconButton icon={MapIcon} accessibilityLabel={t('nearbyPlaces.map')} onPress={() => setView('map')} /> : null}
        </View>

        <View style={styles.titleBlock}>
          <Text variant="Overline" color="fg/secondary" numberOfLines={1}>{(where ? `${dateLabel} · ${where}` : dateLabel).toUpperCase()}</Text>
          <View style={styles.title} accessible accessibilityRole="header" accessibilityLabel={`${t('nearbyPlaces.title')} ${label}`}>
            <Text variant="Display/XL">{en('nearbyPlaces.title')}</Text>
            <Text variant="Display/Quote" color="fg/secondary" numberOfLines={1} style={styles.shrink}>{titleWord}</Text>
          </View>
          {/* Small Weather Card (848:13120) — Home's Weather Card Now row: same reading, same copy, same empty state. */}
          <View style={[styles.weather, elevation['Elevation/3 Float'], { borderColor: color('bg/subtle') }]}>
            <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: color('glass/surface') }]} />
            <View style={styles.now}>
              <View style={styles.temp}>
                <Text variant="Numeric/L" style={styles.tabular}>{f ? `${temp(f.tempC)}°` : '--°'}</Text>
              </View>
              <View style={styles.nowText}>
                <Text variant="Title/S" numberOfLines={1}>{f ? t(`home.condition.${f.mood}`) : t('home.noWeather')}</Text>
                {detail ? <Text variant="Body/S" color="fg/muted" numberOfLines={1}>{detail}</Text> : null}
              </View>
              {/* Mood orb — the current mood's top colour at 35 %. */}
              <View style={[styles.wOrb, { backgroundColor: f ? withAlpha(moods[f.mood].top, 0.35) : color('bg/muted') }]}>
                <Icon icon={WEATHER_ICON[f?.mood ?? 'overcast']} size={20} color={f ? 'fg/default' : 'fg/muted'} />
              </View>
          </View>
            </View>
        </View>

        <View style={styles.places}>
          <View style={styles.forRow}>
            <View style={[styles.forBar, { backgroundColor: color('fg/success') }]} />
            <Text variant="Title/S" numberOfLines={2} style={styles.flex}>
              <Text variant="Title/S" color="fg/muted">{t('nearbyPlaces.forPrefix')}</Text>
              {` ${name}`}
            </Text>
          </View>

          <UnderlineTabs items={[{ key: 'one', label }]} value="one" onChange={() => undefined} />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chips}>
            <Chip label={t('nearbyPlaces.openNow')} selected={openNow} onPress={() => setOpenNow((v) => !v)} />
            <Chip label={t('nearbyPlaces.walkable')} selected={walkable} onPress={() => setWalkable((v) => !v)} />
            <Chip label={t('nearbyPlaces.affordable')} selected={cheap} onPress={() => setCheap((v) => !v)} />
          </ScrollView>

          {here.status === 'loading' && !here.coords ? <ActivityIndicator color={color('fg/muted')} style={styles.loading} /> : !here.coords ? (
            <EmptyState icon={MapPin} title={t('nearbyPlaces.locationTitle')} body={t('nearbyPlaces.locationBody')}>
              <Button label={t('ask.turnOn')} size="M" onPress={allow} />
              <Button label={t('nearbyPlaces.searchInMapApp')} size="M" variant="Outline" onPress={searchDish} />
            </EmptyState>
          ) : places == null ? <ActivityIndicator color={color('fg/muted')} style={styles.loading} /> : current?.err ? (
            <EmptyState icon={MapPin} title={t('nearbyPlaces.errorTitle')} body={t(current.err === 'failed' ? 'nearbyPlaces.errorBody' : 'nearbyPlaces.setupBody')}>
              <Button label={t('nearbyPlaces.searchInMapApp')} size="M" variant="Outline" onPress={searchDish} />
            </EmptyState>
          ) : places.length ? (
            <>
              {places.map((p, i) => card(p, i))}
              <Text variant="Caption" color="fg/muted" style={styles.center}>{t('nearbyPlaces.attribution')}</Text>
            </>
          ) : (
            // Empty (both) — neither the dish nor anything similar close by.
            <View style={[styles.empty, { backgroundColor: color('bg/subtle') }]}>
              <Icon icon={MapPin} size={28} />
              <Text variant="Title/S" style={styles.center}>{t('nearbyPlaces.emptyBothTitle', { dish: name, dishOr: withOr(name) })}</Text>
              <Text variant="Body/S" color="fg/muted" style={styles.center}>{t('nearbyPlaces.emptyBothBody')}</Text>
              <Button label={t('nearbyPlaces.searchInMapApp')} size="M" variant="Secondary" onPress={searchDish} />
            </View>
          )}
        </View>
      </ScrollView>
      {pickerSheet}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  shrink: { flexShrink: 1 },
  center: { textAlign: 'center' },
  tabular: { fontVariant: ['tabular-nums'] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space[20] },
  titleBlock: { paddingHorizontal: space[20], paddingTop: space[20], gap: space[12] },
  title: { flexDirection: 'row', alignItems: 'flex-end', gap: space[12] },
  // Small weather card — the Weather Card's Now row only: glass surface, radius xl, padding 12 16.
  weather: { borderRadius: radius.xl, borderWidth: 1, paddingHorizontal: space[16], paddingVertical: space[12], overflow: 'hidden', alignSelf: 'stretch' },
  now: { flexDirection: 'row', alignItems: 'center', gap: space[14] },
  temp: { width: 77, height: space[56], justifyContent: 'center' },
  nowText: { flex: 1, gap: space[2] },
  wOrb: { width: space[40], height: space[40], borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  places: { paddingHorizontal: space[20], paddingTop: space[24] + space[6], gap: space[12] },
  forRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space[8] },
  forBar: { width: 5, height: 15, marginTop: 3 },
  chipScroll: { marginHorizontal: -space[20] },
  chips: { gap: space[8], paddingHorizontal: space[20] },
  loading: { marginTop: space[40] },
  card: { flexDirection: 'row', alignItems: 'center', gap: space[14], padding: space[12], borderRadius: radius.xl + radius.xs, borderWidth: 1 },
  orb: { width: space[56], height: space[56], borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 5 },
  names: { gap: space[2] },
  tag: { alignSelf: 'flex-start', paddingLeft: space[8], paddingRight: space[10], paddingVertical: 3, borderRadius: radius.full, maxWidth: '100%' },
  empty: { alignItems: 'center', gap: space[12], paddingHorizontal: space[20], paddingVertical: space[24] + space[4], borderRadius: radius.xl + radius.xs },
  appRow: { flexDirection: 'row', alignItems: 'center', gap: space[12], height: space[56], paddingHorizontal: space[16], borderRadius: radius.lg },
  remember: { flexDirection: 'row', alignItems: 'center', gap: space[12], paddingTop: space[8] },
  mapTop: { position: 'absolute', left: space[20], right: space[20], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mapCard: { position: 'absolute', left: space[20], right: space[20] },
  pin: { width: 32, height: 32, borderRadius: radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pinOn: { flexDirection: 'row', alignItems: 'center', gap: space[8], height: 44, paddingLeft: space[4], paddingRight: space[12], borderRadius: radius.full, maxWidth: 220 },
  pinOrb: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
});
