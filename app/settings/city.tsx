import { router } from 'expo-router';
import { Check, CloudSun, Navigation, Search } from '../../src/components/icons/ongdal';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../src/components/Icon';
import { Text } from '../../src/components/Text';
import { TopBar } from '../../src/components/TopBar';
import { displayTemp } from '../../src/lib/prefs';
import { requestDeviceLocation, reverseGeocodeCity } from '../../src/services/location';
import { refreshHere } from '../../src/lib/useHere';
import { getMyProfile, saveLocationChoice } from '../../src/services/profile';
import { searchCities, type CityHit } from '../../src/services/settings';
import { fetchCurrentWeather } from '../../src/services/weather';
import { radius, space, text, useTheme, WEATHER_ICON, type WeatherMood, FONT_SCALE_MAX } from '../../src/theme';

type Hit = CityHit & { tempC?: number; mood?: WeatherMood };
const { lineHeight: _lh, ...fieldText } = text['Body/M'];

/** 9.7 Choose city (Figma 26:248) — search · Use current location · results with today's weather · confirmation. */
export default function ChooseCity() {
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const seq = useRef(0);

  useEffect(() => { getMyProfile().then((p) => setCurrent(p?.city ?? null)).catch(() => undefined); }, []);

  useEffect(() => {
    const n = ++seq.current;
    if (q.trim().length < 2) { setHits([]); return; }
    const h = setTimeout(async () => {
      setBusy(true);
      const list = await searchCities(q);
      if (n !== seq.current) return;
      setHits(list);
      setBusy(false);
      // Weather per result, in the background.
      const withWeather = await Promise.all(list.map(async (c) => {
        const w = await fetchCurrentWeather({ latitude: c.lat, longitude: c.lon });
        return { ...c, tempC: w?.tempC, mood: w?.mood };
      }));
      if (n === seq.current) setHits(withWeather);
    }, 300);
    return () => clearTimeout(h);
  }, [q]);

  const choose = async (city: string, country?: string) => {
    await saveLocationChoice({ city, country, locationEnabled: false }).catch(() => undefined);
    setCurrent(city);
    setSaved(city);
    refreshHere();
    setTimeout(() => router.back(), 900);
  };

  const useHere = async () => {
    setBusy(true);
    const c = await requestDeviceLocation();
    const place = c ? await reverseGeocodeCity(c) : null;
    setBusy(false);
    if (place) {
      await saveLocationChoice({ city: place.city, country: place.countryCode ?? place.country, locationEnabled: true }).catch(() => undefined);
      setSaved(place.city);
      refreshHere();
      setTimeout(() => router.back(), 900);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: color('bg/subtle') }]}>
      <TopBar title={t('settings.chooseCity')} onBack={() => router.back()} backLabel={t('common.back')} />
      <View style={styles.searchWrap}>
        <View style={[styles.search, { backgroundColor: color('bg/default'), borderColor: color('border/default') }]}>
          <Icon icon={Search} size={18} color="fg/muted" />
          <TextInput maxFontSizeMultiplier={FONT_SCALE_MAX} value={q} onChangeText={setQ} autoFocus placeholder={t('settings.searchCity')} placeholderTextColor={color('fg/muted')} selectionColor={color('border/focus')} style={[fieldText, styles.input, { color: color('fg/default') }]} returnKeyType="search" />
          {busy ? <ActivityIndicator color={color('fg/muted')} /> : null}
        </View>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <Pressable accessibilityRole="button" onPress={useHere} style={styles.row}>
          <Icon icon={Navigation} size={20} color="fg/accent" />
          <Text variant="Body/M Strong" color="fg/accent">{t('settings.useCurrent')}</Text>
        </Pressable>
        {hits.map((h, i) => {
          const on = current === h.name;
          return (
            <Pressable key={`${h.name}-${h.lat}-${i}`} accessibilityRole="button" onPress={() => choose(h.name, h.country)} style={[styles.row, { borderTopColor: color('border/default'), borderTopWidth: 1 }]}>
              <View style={styles.flex}>
                <Text variant="Body/M">{h.name}</Text>
                <Text variant="Caption" color="fg/muted">{[h.state, h.country].filter(Boolean).join(', ')}</Text>
              </View>
              {h.mood ? <Icon icon={WEATHER_ICON[h.mood]} size={18} /> : null}
              {h.tempC != null ? <Text variant="Body/S Strong">{`${displayTemp(h.tempC)}°`}</Text> : null}
              {on ? <Icon icon={Check} size={20} color="fg/accent" /> : null}
            </Pressable>
          );
        })}
        {q.trim().length >= 2 && !busy && hits.length === 0 ? <Text variant="Body/S" color="fg/muted" style={styles.none}>{t('settings.noCity')}</Text> : null}
      </ScrollView>
      {saved ? (
        <View style={[styles.toast, { bottom: insets.bottom + space[20], backgroundColor: color('bg/inverse') }]}>
          <Icon icon={CloudSun} size={18} color="fg/inverse" />
          <Text variant="Body/S Strong" color="fg/inverse">{t('settings.cityConfirm', { city: saved })}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchWrap: { paddingHorizontal: space[20], paddingVertical: space[8] },
  search: { height: 48, flexDirection: 'row', alignItems: 'center', gap: space[8], paddingHorizontal: space[16], borderRadius: radius.full, borderWidth: 1 },
  input: { flex: 1, padding: 0 },
  row: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: space[12], paddingHorizontal: space[20], paddingVertical: space[10] },
  flex: { flex: 1, gap: space[2] },
  none: { paddingHorizontal: space[20], paddingTop: space[12] },
  toast: { position: 'absolute', left: space[20], right: space[20], flexDirection: 'row', alignItems: 'center', gap: space[10], paddingHorizontal: space[16], paddingVertical: space[12], borderRadius: radius.lg },
});
