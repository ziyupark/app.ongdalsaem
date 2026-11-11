import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MapPin, Navigation } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Icon } from '../../src/components/Icon';
import { Text } from '../../src/components/Text';
import { TopBar } from '../../src/components/TopBar';
import { hasLocationPermission, requestDeviceLocation, reverseGeocodeCity } from '../../src/services/location';
import { refreshHere } from '../../src/lib/useHere';
import { saveLocationChoice } from '../../src/services/profile';
import { fetchCurrentWeather, type CurrentWeather } from '../../src/services/weather';
import { radius, space, useTheme, type WeatherMood } from '../../src/theme';
import { Paper } from '../../src/components/Paper';

/** Default city when location is not known yet (docs/05-behavior.md 2.5 = Seoul). */
const DEFAULT_CITY = 'Seoul';

/**
 * 3D weather icons for the orb (guides/weather-3d-icon-prompts.pdf, assets/weather3d/weather3d_{mood}.png).
 * Only `clear` exists so far; the other moods use it until their PNGs are added here.
 */
const WEATHER_3D: Partial<Record<WeatherMood, number>> = {
  clear: require('../../assets/weather3d/weather3d_clear.png'),
};
const orbFor = (mood?: WeatherMood) => (mood && WEATHER_3D[mood]) ?? WEATHER_3D.clear!;

/** 1.4 Location — 14:314. Only the city is stored; coordinates never leave the device. */
export default function LocationStep() {
  const insets = useSafeAreaInsets();
  const { color, scheme } = useTheme();
  const { t } = useTranslation();
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [busy, setBusy] = useState(false);

  // Preview: the device city if permission was already given, otherwise the default city.
  useEffect(() => {
    let alive = true;
    (async () => {
      let w: CurrentWeather | null = null;
      if (await hasLocationPermission()) {
        const coords = await requestDeviceLocation();
        if (coords) w = await fetchCurrentWeather(coords);
      }
      w ??= await fetchCurrentWeather({ city: DEFAULT_CITY });
      if (alive) setWeather(w);
    })();
    return () => { alive = false; };
  }, []);

  const goHome = () => router.replace('/home');

  const useMyLocation = async () => {
    setBusy(true);
    try {
      const coords = await requestDeviceLocation();
      if (!coords) {
        // Permission denied / location off → 2.5 Location off.
        await saveLocationChoice({ locationEnabled: false }).catch(() => undefined);
        refreshHere();
        router.replace({ pathname: '/home', params: { state: 'location-off' } });
        return;
      }
      const place = await reverseGeocodeCity(coords);
      await saveLocationChoice({ city: place?.city, country: place?.country, locationEnabled: true }).catch((e) => console.warn('[location]', e));
      refreshHere();
      goHome();
    } finally {
      setBusy(false);
    }
  };

  const chooseCity = async () => {
    await saveLocationChoice({ locationEnabled: false }).catch(() => undefined);
    refreshHere();
    router.replace({ pathname: '/home', params: { state: 'location-off' } });
  };

  const bottom = Math.max(insets.bottom, space[24]) + space[10];

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default'), paddingTop: insets.top }]}>
      <Paper />
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <TopBar onBack={() => router.back()} backLabel={t('common.back')} />
      <ScrollView contentContainerStyle={{ paddingBottom: 56 * 2 + space[8] + bottom + space[16] }}>
        <View style={styles.heading}>
          <Text variant="Overline" color="fg/accent">{t('location.step')}</Text>
          <Text variant="Display/L" accessibilityRole="header">{t('location.title')}</Text>
          <Text variant="Body/M" color="fg/secondary">{t('location.body')}</Text>
        </View>
        <View style={styles.orbBlock}>
          <View style={styles.orb}>
            <Image source={orbFor(weather?.mood)} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityIgnoresInvertColors />
          </View>
        </View>
        <View style={styles.cityBlock}>
          {weather ? (
            <View
              accessible
              accessibilityLabel={`${weather.city}, ${weather.countryCode}, ${weather.tempC}°, ${t(`weather.${weather.mood}`)}`}
              style={[styles.city, { backgroundColor: color('bg/default'), borderColor: color('border/default') }]}
            >
              <Icon icon={MapPin} size={20} color="fg/accent" />
              <Text variant="Body/M Strong">{`${weather.city}, ${weather.countryCode}`}</Text>
              <Text variant="Body/S" color="fg/muted">{t('location.now', { temp: weather.tempC, condition: t(`weather.${weather.mood}`) })}</Text>
            </View>
          ) : (
            <View style={styles.cityPlaceholder} />
          )}
        </View>
      </ScrollView>

      {/* Block · Button (fixed): Ghost L (680–736) + Primary L (744–800), gap 8. */}
      <View style={[styles.fixed, { bottom }]}>
        <Button label={t('location.chooseCity')} variant="Ghost" onPress={chooseCity} disabled={busy} />
        <Button label={t('location.useLocation')} icon={Navigation} onPress={useMyLocation} loading={busy} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  heading: { paddingTop: space[12], paddingHorizontal: space[20], gap: space[12] },
  orbBlock: { paddingTop: space[40], alignItems: 'center' },
  orb: { width: 220, height: 220, borderRadius: radius.full, overflow: 'hidden' },
  cityBlock: { paddingTop: space[24], alignItems: 'center' },
  city: { flexDirection: 'row', alignItems: 'center', gap: space[10], paddingHorizontal: space[16], paddingVertical: space[12], borderRadius: radius.full, borderWidth: 1 },
  cityPlaceholder: { height: 46 },
  fixed: { position: 'absolute', left: space[20], right: space[20], gap: space[8] },
});
