import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, CloudRain, MapPin, Star } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { Chip } from '../src/components/Chip';
import { EmptyState } from '../src/components/community/Parts';
import { IconButton } from '../src/components/IconButton';
import { Icon } from '../src/components/Icon';
import { Text } from '../src/components/Text';
import { openMapsSearch } from '../src/lib/maps';
import { useHere } from '../src/lib/useHere';
import { formatDistance, formatPrice, PlacesError, searchNearbyPlaces, type NearbyPlace } from '../src/services/places';
import { radius, space, useTheme, WEATHER_ICON } from '../src/theme';

/** 2.4 Eat this nearby (99:3302) — "{dish} nearby" · Open now / Walkable / budget · place cards (Google Places). */
export default function EatNearby() {
  const { dish, photo } = useLocalSearchParams<{ dish: string; photo?: string }>();
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { here, allow } = useHere();
  const [openNow, setOpenNow] = useState(true);
  const [walkable, setWalkable] = useState(false);
  const [cheap, setCheap] = useState(false);
  const [places, setPlaces] = useState<NearbyPlace[] | null>(null);
  const [err, setErr] = useState<PlacesError['code'] | null>(null);
  const [similar, setSimilar] = useState<string | null>(null);
  const name = String(dish ?? '');
  const mood = here.forecast?.mood ?? null;

  const load = useCallback(async () => {
    if (!here.coords) return;
    setPlaces(null);
    setErr(null);
    try {
      const { places: list, similar: sim } = await searchNearbyPlaces({
        query: name, lat: here.coords.latitude, lon: here.coords.longitude, openNow,
        radius: walkable ? 1000 : 2500, maxPrice: cheap ? 1 : undefined, language: i18n.language,
      });
      setSimilar(sim);
      setPlaces(walkable ? list.filter((p) => (p.distance ?? 0) <= 1000) : list);
    } catch (e) {
      setErr(e instanceof PlacesError ? e.code : 'failed');
      setPlaces([]);
    }
  }, [here.coords, name, openNow, walkable, cheap, i18n.language]);
  useEffect(() => { load(); }, [load]);

  // 2.4b — the place on a map with the walk there; without coordinates fall back to the Maps place page.
  const open = (p: NearbyPlace) => (p.lat != null && p.lon != null
    ? router.push({ pathname: '/place', params: { name: p.name, address: p.address ?? '', kind: p.kind ?? '', lat: String(p.lat), lon: String(p.lon), mapsUri: p.mapsUri ?? '', dish: name, photo: photo ?? '' } })
    : p.mapsUri ? Linking.openURL(p.mapsUri).catch(() => openMapsSearch(`${p.name} ${p.address ?? ''}`)) : openMapsSearch(p.name));
  const words = name.split(' ');

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space[8], paddingBottom: insets.bottom + space[24] }}>
        <View style={[styles.px, styles.backRow]}>
          <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
        </View>
        <Text variant="Display/L" style={styles.title}>
          {words.join(' ')}
          <Text variant="Display/L" color="fg/muted">{` ${t('nearbyPlaces.nearby')}`}</Text>
        </Text>

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
          ) : places == null ? <ActivityIndicator color={color('fg/muted')} style={styles.loading} /> : err ? (
            <EmptyState icon={MapPin} title={t('nearbyPlaces.errorTitle')} body={t(err === 'failed' ? 'nearbyPlaces.errorBody' : 'nearbyPlaces.setupBody')}>
              <Button label={t('nearbyPlaces.openMaps')} size="M" variant="Outline" onPress={() => openMapsSearch(name)} />
            </EmptyState>
          ) : places.length ? (
            <>
              {similar ? (
                <Text variant="Body/S" color="fg/muted" style={styles.similar}>
                  {similar === 'words'
                    ? t('nearbyPlaces.similarWords', { dish: name })
                    : t('nearbyPlaces.similar', { dish: name, kind: t(`nearbyPlaces.kinds.${similar}`) })}
                </Text>
              ) : null}
              {places.map((p) => {
                const meta = [
                  formatDistance(p.distance),
                  p.walkMin != null ? t('nearbyPlaces.walk', { n: p.walkMin }) : null,
                  p.closesAt ? t('nearbyPlaces.openTill', { time: p.closesAt }) : p.openNow === false ? t('nearbyPlaces.closed') : null,
                ].filter(Boolean).join(' · ').toUpperCase();
                const price = formatPrice(p, i18n.language);
                return (
                  <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={p.name} onPress={() => open(p)} style={[styles.card, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
                    <View style={[styles.thumb, { backgroundColor: color('bg/muted') }]}>
                      {p.photo ? <Image source={{ uri: p.photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} /> : <Icon icon={MapPin} size={24} color="fg/muted" />}
                    </View>
                    <View style={styles.body}>
                      <Text variant="Overline" color="fg/muted" numberOfLines={1}>{meta}</Text>
                      <Text variant="Title/S" numberOfLines={1}>{p.name}</Text>
                      <Text variant="Body/S" color="fg/secondary" numberOfLines={1}>{[p.kind, price].filter(Boolean).join(' · ') || name}</Text>
                      {p.address ? <Text variant="Caption" color="fg/muted" numberOfLines={1}>{p.address}</Text> : null}
                      <View style={styles.foot}>
                        {p.summary ? (
                          <View style={[styles.pill, { backgroundColor: color('bg/accent-subtle') }]}>
                            <Icon icon={mood ? WEATHER_ICON[mood] : CloudRain} size={16} color="fg/accent" />
                            <Text variant="Caption Strong" color="fg/accent" numberOfLines={1} style={styles.shrink}>{p.summary}</Text>
                          </View>
                        ) : <View style={styles.shrink} />}
                        {p.rating != null ? (
                          <View style={styles.rating}>
                            <Icon icon={Star} size={14} color="fg/secondary" />
                            <Text variant="Caption Strong" color="fg/secondary">{`${p.rating.toFixed(1)} (${p.ratings})`}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
              <Text variant="Caption" color="fg/muted" style={styles.attr}>{t('nearbyPlaces.attribution')}</Text>
            </>
          ) : (
            <EmptyState icon={MapPin} title={t('nearbyPlaces.emptyTitle', { dish: name })} body={t('nearbyPlaces.emptyBody')}>
              <Button label={t('nearbyPlaces.openMaps')} size="M" variant="Outline" onPress={() => openMapsSearch(name)} />
            </EmptyState>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  similar: { marginBottom: space[4] },
  px: { paddingHorizontal: space[20] },
  backRow: { alignItems: 'flex-start' },
  title: { paddingHorizontal: space[20], paddingTop: space[24] },
  chips: { gap: space[8], paddingHorizontal: space[20], paddingTop: space[16] },
  list: { paddingHorizontal: space[20], paddingTop: space[20], gap: space[14] },
  loading: { marginTop: space[40] },
  card: { flexDirection: 'row', alignItems: 'center', gap: space[14], padding: space[12], borderRadius: 28, borderWidth: 1 }, // Place Card 131:4620
  thumb: { width: 84, height: 84, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 3 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: space[6] },
  pill: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: space[4], paddingLeft: space[8], paddingRight: space[10], paddingVertical: 3, borderRadius: radius.full },
  shrink: { flexShrink: 1, flex: 1 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  attr: { textAlign: 'center' },
});
