import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Copy, Footprints, LocateFixed, MapPin, Utensils } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import type MapViewType from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { Icon } from '../src/components/Icon';
import { Text } from '../src/components/Text';
import { loadClipboard, loadMaps } from '../src/lib/optionalNative';

// Loaded lazily: a build without react-native-maps keeps working (the sheet still opens Maps).
const Maps = loadMaps();
import { useHere } from '../src/lib/useHere';
import { formatDistance } from '../src/services/places';
import { elevation, radius, space, useTheme } from '../src/theme';
import { Paper } from '../src/components/Paper';

type Params = { name: string; address?: string; kind?: string; lat: string; lon: string; mapsUri?: string; dish?: string; photo?: string };

/** Straight-line metres (good enough for a walking estimate; the turn-by-turn route is Apple / Google Maps' job). */
function meters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const R = 6371000, r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b.latitude - a.latitude) / 2) ** 2 + Math.cos(r(a.latitude)) * Math.cos(r(b.latitude)) * Math.sin(r(b.longitude - a.longitude) / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

/**
 * 2.4b Place · walk there (Figma 109:3225), the free version: an in-app map (Apple Maps on iOS — no key, no cost)
 * with you and the place, a straight dashed line, the walking time estimate, the address with Copy, and
 * "Start walking", which hands the real turn-by-turn route to Apple Maps (Google Maps on Android).
 * Opening hours, price and phone are in the Maps place page (the fork-and-knife button) — those Places fields are paid.
 */
export default function PlaceScreen() {
  const p = useLocalSearchParams<Params>();
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { here } = useHere();
  const map = useRef<MapViewType>(null);
  const [copied, setCopied] = useState(false);

  const dest = useMemo(() => ({ latitude: Number(p.lat), longitude: Number(p.lon) }), [p.lat, p.lon]);
  const me = here.coords;
  const dist = me ? meters(me, dest) : null;
  // ~80 m a minute on foot (rounded up, at least 1).
  const walk = dist == null ? null : Math.max(1, Math.ceil(dist / 80));

  const fit = () => {
    const pts = me ? [me, dest] : [dest];
    map.current?.fitToCoordinates(pts, { edgePadding: { top: insets.top + 140, right: 60, bottom: 380, left: 60 }, animated: true });
  };

  const startWalking = () => {
    const { latitude: la, longitude: lo } = dest;
    const name = encodeURIComponent(p.name ?? '');
    const url = Platform.OS === 'ios'
      ? `maps://?daddr=${la},${lo}&q=${name}&dirflg=w`
      : `https://www.google.com/maps/dir/?api=1&destination=${la},${lo}&travelmode=walking`;
    Linking.openURL(url).catch(() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${la},${lo}&travelmode=walking`).catch(() => undefined));
  };
  const placeInfo = () => {
    const url = p.mapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name ?? ''} ${p.address ?? ''}`)}`;
    Linking.openURL(url).catch(() => undefined);
  };
  const copy = async () => {
    const Clipboard = loadClipboard();
    if (!Clipboard || !p.address) return Alert.alert(t('shareSheet.needsRebuild'));
    await Clipboard.setStringAsync(p.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
      <Paper />
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
        {/* Place pin — dark pill: dish photo · name · dish (Figma 109:3225 map callout). */}
        <Maps.Marker coordinate={dest} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
          <View style={[styles.pin, elevation['Elevation/3 Float'], { backgroundColor: color('bg/inverse') }]}>
            <View style={[styles.pinThumb, { backgroundColor: color('bg/muted') }]}>
              {p.photo ? <Image source={{ uri: p.photo }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Icon icon={MapPin} size={16} color="fg/muted" />}
            </View>
            <View style={styles.pinText}>
              <Text variant="Caption Strong" color="fg/inverse" numberOfLines={1}>{p.name}</Text>
              {p.dish ? <Text variant="Caption" color="fg/inverse" numberOfLines={1} style={styles.dim}>{p.dish}</Text> : null}
            </View>
          </View>
        </Maps.Marker>
      </Maps.default>
      ) : <View style={[StyleSheet.absoluteFill, { backgroundColor: color('bg/muted') }]} />}

      {/* Top: back · walking time · recentre. */}
      <View style={[styles.top, { top: insets.top + space[8] }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={[styles.round, elevation['Elevation/2 Raised'], { backgroundColor: color('bg/default') }]}>
          <Icon icon={ChevronLeft} size={22} />
        </Pressable>
        {walk != null ? (
          <View style={[styles.mode, elevation['Elevation/2 Raised'], { backgroundColor: color('bg/inverse') }]}>
            <Icon icon={Footprints} size={16} color="fg/inverse" />
            <Text variant="Body/S Strong" color="fg/inverse">{t('place.min', { n: walk })}</Text>
          </View>
        ) : <View />}
        <Pressable accessibilityRole="button" accessibilityLabel={t('place.recenter')} onPress={fit} style={[styles.round, elevation['Elevation/2 Raised'], { backgroundColor: color('bg/default') }]}>
          <Icon icon={LocateFixed} size={20} />
        </Pressable>
      </View>

      {/* Sheet — grabber · overline · thumb + name · address card (Copy) · Start walking + place info. */}
      <View style={[styles.sheet, elevation['Elevation/4 Overlay'], { backgroundColor: color('bg/subtle'), paddingBottom: insets.bottom + space[16] }]}>
        <View style={[styles.grabber, { backgroundColor: color('border/default') }]} />
        <View style={styles.head}>
          <View style={[styles.thumb, { backgroundColor: color('bg/muted') }]}>
            {p.photo ? <Image source={{ uri: p.photo }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Icon icon={MapPin} size={24} color="fg/muted" />}
          </View>
          <View style={styles.flex}>
            <Text variant="Overline" color="fg/muted" numberOfLines={1}>
              {[walk != null ? t('nearbyPlaces.walk', { n: walk }) : null, formatDistance(dist)].filter(Boolean).join(' · ').toUpperCase()}
            </Text>
            <Text variant="Display/M" numberOfLines={1}>{p.name}</Text>
            <Text variant="Body/S" color="fg/secondary" numberOfLines={1}>{[p.dish, p.kind].filter(Boolean).join(' · ')}</Text>
          </View>
        </View>
        {p.address ? (
          <View style={[styles.addr, { backgroundColor: color('bg/default'), borderColor: color('border/default') }]}>
            <Icon icon={MapPin} size={20} color="fg/secondary" />
            <Text variant="Body/S Strong" numberOfLines={2} style={styles.flex}>{p.address}</Text>
            <Pressable accessibilityRole="button" onPress={copy} style={[styles.copy, { backgroundColor: color('bg/muted') }]}>
              <Icon icon={Copy} size={14} />
              <Text variant="Caption Strong">{copied ? t('place.copied') : t('place.copy')}</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.actions}>
          <Button label={t('place.startWalking')} size="L" onPress={startWalking} style={styles.flex} />
          <Pressable accessibilityRole="button" accessibilityLabel={t('place.info')} onPress={placeInfo} style={[styles.round56, { backgroundColor: color('bg/default'), borderColor: color('border/default') }]}>
            <Icon icon={Utensils} size={22} />
          </Pressable>
        </View>
        <Text variant="Caption" color="fg/muted" style={styles.center}>{t('place.note')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  dim: { opacity: 0.75 },
  top: { position: 'absolute', left: space[20], right: space[20], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  round: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  mode: { flexDirection: 'row', alignItems: 'center', gap: space[6], height: 40, paddingHorizontal: space[16], borderRadius: radius.full },
  pin: { flexDirection: 'row', alignItems: 'center', gap: space[8], paddingLeft: 4, paddingRight: space[12], height: 44, borderRadius: radius.full, maxWidth: 220 },
  pinThumb: { width: 36, height: 36, borderRadius: radius.full, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  pinText: { flexShrink: 1 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: radius['2xl'], borderTopRightRadius: radius['2xl'], paddingTop: space[10], paddingHorizontal: space[20], gap: space[16] },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: radius.full },
  head: { flexDirection: 'row', alignItems: 'center', gap: space[14] },
  thumb: { width: 56, height: 56, borderRadius: radius.lg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  addr: { flexDirection: 'row', alignItems: 'center', gap: space[10], padding: space[14], borderRadius: radius.lg, borderWidth: 1 },
  copy: { flexDirection: 'row', alignItems: 'center', gap: space[4], height: 32, paddingHorizontal: space[12], borderRadius: radius.full },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space[10] },
  round56: { width: 56, height: 56, borderRadius: radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
