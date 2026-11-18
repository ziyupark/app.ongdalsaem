import { router, useLocalSearchParams } from 'expo-router';
import { Camera, ChevronLeft, Copy, Footprints, Map as MapIcon, MapPin, Navigation, Utensils } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import type MapViewType from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet } from '../src/components/BottomSheet';
import { Button } from '../src/components/Button';
import { Icon } from '../src/components/Icon';
import { IconButton } from '../src/components/IconButton';
import { Text } from '../src/components/Text';
import { Toggle } from '../src/components/Toggle';
import { chooseMapApp, MAP_APP_LABEL, openMapApp, setSavedMapApp, type MapAction, type MapAppId } from '../src/lib/mapApps';
import { loadClipboard, loadMaps } from '../src/lib/optionalNative';
import { resetShareDraft, updateShareDraft } from '../src/lib/shareDraft';
import { useHere } from '../src/lib/useHere';
import { formatDistance } from '../src/services/places';
import { elevation, radius, space, useTheme } from '../src/theme';

// Loaded lazily: a build without react-native-maps keeps working (the buttons still open a map app).
const Maps = loadMaps();

type Params = { name: string; address?: string; kind?: string; lat: string; lon: string; mapsUri?: string; dish?: string };

/** Straight-line metres (good enough for a walking estimate; the turn-by-turn route is the map app's job). */
function meters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const R = 6371000, r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b.latitude - a.latitude) / 2) ** 2 + Math.cos(r(a.latitude)) * Math.cos(r(b.latitude)) * Math.sin(r(b.longitude - a.longitude) / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

/**
 * 2.4b Place (v2, Figma 864:11999) — map on the top 40 % (you, the place, a dashed line) → name · kind → address +
 * Copy → walking distance → Start directions / View in a map app / I ate here → Google attribution.
 * Both map buttons hand off to a map app the phone has (URL schemes only — src/lib/mapApps.ts): the saved one,
 * the only one, or a picker with "Use this app next time". "I ate here" starts a post with the place filled in.
 */
export default function PlaceScreen() {
  const p = useLocalSearchParams<Params>();
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { here } = useHere();
  const map = useRef<MapViewType>(null);
  const [copied, setCopied] = useState(false);
  const [picker, setPicker] = useState<{ action: MapAction; apps: MapAppId[] } | null>(null);
  const [remember, setRemember] = useState(false);

  const dest = useMemo(() => ({ latitude: Number(p.lat), longitude: Number(p.lon) }), [p.lat, p.lon]);
  const target = { lat: dest.latitude, lon: dest.longitude, name: p.name ?? '', mapsUri: p.mapsUri || null };
  const me = here.coords;
  const dist = me ? meters(me, dest) : null;
  // ~80 m a minute on foot (rounded up, at least 1).
  const walk = dist == null ? null : Math.max(1, Math.ceil(dist / 80));
  const mapH = Math.round(height * 0.4);

  const fit = () => map.current?.fitToCoordinates(me ? [me, dest] : [dest], { edgePadding: { top: insets.top + 72, right: 72, bottom: 40, left: 72 }, animated: true });

  const handOff = async (action: MapAction) => {
    const c = await chooseMapApp();
    if ('open' in c) return openMapApp(c.open, target, action);
    setRemember(false);
    setPicker({ action, apps: c.pick });
  };
  const pick = async (id: MapAppId) => {
    const action = picker?.action ?? 'view';
    setPicker(null);
    if (remember) await setSavedMapApp(id);
    await openMapApp(id, target, action);
  };

  const copy = async () => {
    const Clipboard = loadClipboard();
    if (!Clipboard || !p.address) return Alert.alert(t('shareSheet.needsRebuild'));
    await Clipboard.setStringAsync(p.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  // "I ate here" → 8.1 Pick with the place (name, position, today's weather there) already in the draft.
  const ateHere = () => {
    resetShareDraft();
    const f = here.forecast;
    updateShareDraft({
      type: 'travel',
      name: p.dish ?? '',
      placeName: p.name ?? '',
      description: p.name ?? '',
      ...(f ? {
        contextState: 'ready' as const,
        placeEdited: true,
        context: { mood: f.mood, tempC: f.tempC, place: here.place ?? { city: f.city, countryCode: f.countryCode }, takenAt: new Date(), from: 'place' as const, coords: dest },
      } : {}),
    });
    router.push('/share/pick');
  };

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
      <View style={[styles.mapArea, { height: mapH, backgroundColor: color('bg/muted') }]}>
        {Maps ? (
          <Maps.default
            ref={map}
            style={StyleSheet.absoluteFill}
            showsUserLocation
            showsMyLocationButton={false}
            showsPointsOfInterests={false}
            onMapReady={fit}
            initialRegion={{ ...dest, latitudeDelta: 0.012, longitudeDelta: 0.012 }}
          >
            {me ? <Maps.Polyline coordinates={[me, dest]} strokeColor={color('fg/default')} strokeWidth={3} lineDashPattern={[6, 6]} /> : null}
            <Maps.Marker coordinate={dest} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
              <View style={[styles.pin, elevation['Elevation/3 Float'], { backgroundColor: color('bg/inverse') }]}>
                <View style={[styles.pinOrb, { backgroundColor: color('bg/accent-subtle') }]}>
                  <Icon icon={Utensils} size={18} color="fg/accent" />
                </View>
                <Text variant="Caption Strong" color="fg/inverse" numberOfLines={1} style={styles.shrink}>{p.name}</Text>
              </View>
            </Maps.Marker>
          </Maps.default>
        ) : null}
        <View style={[styles.back, { top: insets.top + space[8] }]}>
          <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space[16] }]}>
        <View style={styles.name}>
          <Text variant="Display/M">{p.name}</Text>
          {p.kind || p.dish ? <Text variant="Body/S" color="fg/secondary">{p.kind || p.dish}</Text> : null}
        </View>
        {p.address ? (
          <View style={[styles.addr, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
            <Icon icon={MapPin} size={20} color="fg/secondary" />
            <Text variant="Body/S Strong" numberOfLines={2} style={styles.flex}>{p.address}</Text>
            <Pressable accessibilityRole="button" onPress={copy} style={[styles.copy, { backgroundColor: color('bg/muted') }]}>
              <Icon icon={Copy} size={14} />
              <Text variant="Caption Strong">{copied ? t('place.copied') : t('place.copy')}</Text>
            </Pressable>
          </View>
        ) : null}
        {walk != null ? (
          <View style={styles.walk}>
            <Icon icon={Footprints} size={20} />
            <Text variant="Body/M Strong">{t('place.walkLine', { n: walk, distance: formatDistance(dist) })}</Text>
          </View>
        ) : null}
        <View style={styles.actions}>
          <Button label={t('place.directions')} icon={Navigation} size="L" onPress={() => handOff('walk')} />
          <Button label={t('place.viewInApp')} icon={MapIcon} size="L" variant="Secondary" onPress={() => handOff('view')} />
          <Button label={t('place.ateHere')} icon={Camera} size="L" variant="Outline" onPress={ateHere} />
        </View>
        <Text variant="Caption" color="fg/muted" style={styles.center}>{t('place.source')}</Text>
      </ScrollView>

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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  shrink: { flexShrink: 1 },
  center: { textAlign: 'center' },
  mapArea: { overflow: 'hidden' },
  back: { position: 'absolute', left: space[20] },
  pin: { flexDirection: 'row', alignItems: 'center', gap: space[8], paddingLeft: space[4], paddingRight: space[12], height: 44, borderRadius: radius.full, maxWidth: 220 },
  pinOrb: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  content: { paddingTop: space[20], paddingHorizontal: space[20], gap: space[16] },
  name: { gap: space[4] },
  addr: { flexDirection: 'row', alignItems: 'center', gap: space[10], padding: space[14], borderRadius: radius.lg, borderWidth: 1 },
  copy: { flexDirection: 'row', alignItems: 'center', gap: space[4], height: 32, paddingHorizontal: space[12], borderRadius: radius.full },
  walk: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  actions: { gap: space[10] },
  appRow: { flexDirection: 'row', alignItems: 'center', gap: space[12], height: 56, paddingHorizontal: space[16], borderRadius: radius.lg },
  remember: { flexDirection: 'row', alignItems: 'center', gap: space[12], paddingTop: space[8] },
});
