import { router } from 'expo-router';
import { Check, ChevronRight, Navigation, Search, X } from '../../src/components/icons/ongdal';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Icon } from '../../src/components/Icon';
import { Text } from '../../src/components/Text';
import { TopBar } from '../../src/components/TopBar';
import { displayTemp } from '../../src/lib/prefs';
import { getShareDraft, updateShareDraft } from '../../src/lib/shareDraft';
import { requestDeviceLocation, reverseGeocodeCity, type Place } from '../../src/services/location';
import { searchCities, type CityHit } from '../../src/services/settings';
import { fetchCurrentWeather } from '../../src/services/weather';
import { radius, space, text, useTheme, WEATHER_ICON, type WeatherMood, FONT_SCALE_MAX } from '../../src/theme';

type Option = { key: string; place: Place; lat: number; lon: number; mood?: WeatherMood; tempC?: number };
const { lineHeight: _lh, ...fieldText } = text['Body/M'];
const label = (p: Place) => [p.district, p.city].filter(Boolean).join(', ');

/** 8.2d Edit place (Figma 204:7131) — search · Use current location · results with weather · "Use {place}". */
export default function EditPlace() {
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const ctx = getShareDraft().context;
  const [q, setQ] = useState(ctx?.place?.district ?? ctx?.place?.city ?? '');
  const [opts, setOpts] = useState<Option[]>([]);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<Option | null>(null);
  const [here, setHere] = useState<Option | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    const n = ++seq.current;
    if (q.trim().length < 2) { setOpts([]); return; }
    const h = setTimeout(async () => {
      setBusy(true);
      const hits: CityHit[] = await searchCities(q);
      if (n !== seq.current) return;
      const list: Option[] = hits.map((c, i) => ({ key: `${c.lat},${c.lon},${i}`, place: { city: c.state && c.state !== c.name ? c.state : c.name, district: c.state && c.state !== c.name ? c.name : undefined, countryCode: c.country }, lat: c.lat, lon: c.lon }));
      setOpts(list);
      setBusy(false);
      const withW = await Promise.all(list.map(async (o) => { const w = await fetchCurrentWeather({ latitude: o.lat, longitude: o.lon }); return { ...o, mood: w?.mood, tempC: w?.tempC }; }));
      if (n === seq.current) setOpts(withW);
    }, 300);
    return () => clearTimeout(h);
  }, [q]);

  const useCurrent = async () => {
    setBusy(true);
    const c = await requestDeviceLocation();
    if (c) {
      const [p, w] = await Promise.all([reverseGeocodeCity(c), fetchCurrentWeather(c)]);
      if (p) { const o = { key: 'here', place: p, lat: c.latitude, lon: c.longitude, mood: w?.mood, tempC: w?.tempC }; setHere(o); setPicked(o); }
    }
    setBusy(false);
  };

  const apply = async () => {
    if (!picked) return;
    let { mood, tempC } = picked;
    if (mood == null || tempC == null) {
      const w = await fetchCurrentWeather({ latitude: picked.lat, longitude: picked.lon });
      mood = w?.mood; tempC = w?.tempC;
    }
    const cur = getShareDraft().context;
    // Edit mode: the post keeps its original weather — only the place changes.
    if (getShareDraft().editId && cur) { mood = cur.mood; tempC = cur.tempC; }
    updateShareDraft({
      contextState: 'ready',
      placeEdited: true,
      context: { mood: mood ?? cur?.mood ?? 'cloudy', tempC: tempC ?? cur?.tempC ?? 0, place: picked.place, takenAt: cur?.takenAt ?? getShareDraft().photos[0]?.takenAt ?? new Date(), from: 'place', coords: { latitude: picked.lat, longitude: picked.lon } },
    });
    router.back();
  };

  const row = (o: Option) => {
    const on = picked?.key === o.key;
    return (
      <Pressable key={o.key} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => setPicked(o)} style={[styles.row, { borderTopColor: color('border/default') }]}>
        <View style={styles.flex}>
          <Text variant="Body/M">{label(o.place)}</Text>
          {o.place.countryCode ? <Text variant="Caption" color="fg/muted">{o.place.countryCode}</Text> : null}
        </View>
        {o.mood ? <Icon icon={WEATHER_ICON[o.mood]} size={18} /> : null}
        {o.tempC != null ? <Text variant="Body/S Strong">{`${displayTemp(o.tempC)}°`}</Text> : null}
        {on ? <Icon icon={Check} size={20} color="fg/accent" /> : <View style={styles.w20} />}
      </Pressable>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: color('bg/subtle') }]}>
      <TopBar title={t('place.title')} onBack={() => router.back()} backLabel={t('common.back')} />
      <View style={styles.searchWrap}>
        <View style={[styles.search, { backgroundColor: color('bg/default'), borderColor: color('border/focus') }]}>
          <Icon icon={Search} size={18} color="fg/muted" />
          <TextInput maxFontSizeMultiplier={FONT_SCALE_MAX} value={q} onChangeText={setQ} autoFocus placeholder={t('place.search')} placeholderTextColor={color('fg/muted')} selectionColor={color('border/focus')} style={[fieldText, styles.input, { color: color('fg/default') }]} />
          {busy ? <ActivityIndicator color={color('fg/muted')} /> : q ? <Pressable onPress={() => setQ('')} hitSlop={space[8]}><Icon icon={X} size={18} color="fg/muted" /></Pressable> : null}
        </View>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        <Pressable accessibilityRole="button" onPress={useCurrent} style={[styles.current, { backgroundColor: color('bg/default') }]}>
          <Icon icon={Navigation} size={20} color="fg/accent" />
          <View style={styles.flex}>
            <Text variant="Body/M Strong" color="fg/accent">{t('settings.useCurrent')}</Text>
            {here ? <Text variant="Caption" color="fg/muted">{label(here.place)}</Text> : null}
          </View>
          <Icon icon={ChevronRight} size={18} color="fg/muted" />
        </Pressable>
        {opts.length ? <Text variant="Overline" color="fg/muted" style={styles.overline}>{t('place.results')}</Text> : null}
        {opts.map(row)}
        <Text variant="Caption" color="fg/muted" style={styles.note}>{t('place.note')}</Text>
      </ScrollView>
      <View style={[styles.cta, { paddingBottom: Math.max(insets.bottom, space[12]), backgroundColor: color('bg/subtle') }]}>
        <Button label={picked ? t('place.use', { place: label(picked.place) }) : t('place.pick')} disabled={!picked} onPress={apply} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchWrap: { paddingHorizontal: space[20], paddingVertical: space[8] },
  search: { height: 48, flexDirection: 'row', alignItems: 'center', gap: space[8], paddingHorizontal: space[16], borderRadius: radius.full, borderWidth: 1.5 },
  input: { flex: 1, padding: 0 },
  current: { marginHorizontal: space[20], marginTop: space[8], height: 64, flexDirection: 'row', alignItems: 'center', gap: space[12], paddingHorizontal: space[16], borderRadius: radius.lg },
  overline: { paddingHorizontal: space[20], paddingTop: space[20], paddingBottom: space[8] },
  row: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: space[12], paddingHorizontal: space[20], paddingVertical: space[10], borderTopWidth: 1 },
  flex: { flex: 1, gap: space[2] },
  w20: { width: 20 },
  note: { paddingHorizontal: space[20], paddingTop: space[16] },
  cta: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: space[12], paddingHorizontal: space[20] },
});
