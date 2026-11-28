import { Redirect, router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Chip } from '../../src/components/Chip';
import { MoodGradient } from '../../src/components/MoodGradient';
import { WASH_OPACITY, useScreenWeather } from '../../src/components/ScreenHeader';
import { Text } from '../../src/components/Text';
import { setDevWeather, useDevWeather } from '../../src/lib/devWeather';
import { SKY_PHASES, type SkyPhase } from '../../src/lib/skyPhase';
import { BACKDROPS, elevation, radius, space, useTheme, WEATHER_MOODS, type BackdropKey, type MoodFamily, type WeatherMood } from '../../src/theme';
import { useWashInk } from '../../src/theme/washInk';

/** The 7 motion groups of the Weather Mood layer, and the moods that use each. */
const GROUPS: { name: string; moods: WeatherMood[] }[] = [
  { name: 'Clear', moods: ['clear', 'clear-night', 'heat'] },
  { name: 'Cloudy', moods: ['cloudy', 'overcast', 'fog'] },
  { name: 'Rain', moods: ['drizzle', 'rain', 'heavy-rain', 'shower', 'sleet'] },
  { name: 'Snow', moods: ['flurries', 'snow', 'heavy-snow', 'cold'] },
  { name: 'Thunder', moods: ['thunder'] },
  { name: 'Wind', moods: ['windy', 'dust'] },
];
const PHASE_LABEL: Record<SkyPhase, string> = { day: 'Day', sunset: 'Sunset', night: 'Night' };
/** One mood per background family — tapping a preview tile forces that family × phase. */
const FAMILY_MOOD: Record<MoodFamily, WeatherMood> = { sunny: 'clear', cloudy: 'cloudy', rain: 'rain', snow: 'snow' };
const FAMILIES: MoodFamily[] = ['sunny', 'cloudy', 'rain', 'snow'];

/**
 * Dev only (long-press the Home logo → "Weather mood preview"). A sheet over the tabs: pick any mood × day / sunset /
 * night and the global WeatherBackdrop switches (1 s cross-fade) behind it — also on every other tab until "Live
 * weather". The grid at the top shows all 12 backgrounds (family × phase) with the header ink they get.
 * Not translated: never shipped to users.
 */
export default function DevWeather() {
  const insets = useSafeAreaInsets();
  const { color } = useTheme();
  const dev = useDevWeather();
  const { forecast, phase: livePhase, bgKey } = useScreenWeather();
  if (!__DEV__) return <Redirect href="/home" />;
  const live = forecast?.mood ?? 'overcast';
  const mood = dev?.mood ?? live;
  const phase: SkyPhase = dev?.phase ?? livePhase;
  const set = (m: WeatherMood, p: SkyPhase) => setDevWeather({ mood: m, phase: p });
  const grouped = new Set(GROUPS.flatMap((g) => g.moods));
  const others = WEATHER_MOODS.filter((m) => !grouped.has(m));
  return (
    <View style={styles.root}>
      <View style={[styles.sheet, elevation['Elevation/3 Float'], { backgroundColor: color('glass/surface'), paddingBottom: insets.bottom + space[16] }]}>
        <Text variant="Title/M">Weather mood preview</Text>
        <Text variant="Body/S" color="fg/muted">
          {dev ? `Forced: ${dev.mood} · ${dev.phase} → ${bgKey}` : `Live: ${live} · ${livePhase} → ${bgKey}`}
        </Text>
        <ScrollView style={styles.list} contentContainerStyle={{ gap: space[12] }}>
          <View style={styles.grid}>
            {FAMILIES.flatMap((fam) => SKY_PHASES.map((p) => {
              const key = `${fam}_${p}` as BackdropKey;
              return <Tile key={key} id={key} selected={bgKey === key} onPress={() => set(FAMILY_MOOD[fam], p)} />;
            }))}
          </View>
          <View style={styles.row}>
            {SKY_PHASES.map((p) => (
              <Chip key={p} label={PHASE_LABEL[p]} selected={!!dev && phase === p} onPress={() => set(mood, p)} />
            ))}
          </View>
          {[...GROUPS, ...(others.length ? [{ name: 'Other', moods: others }] : [])].map((g) => (
            <View key={g.name} style={{ gap: space[6] }}>
              <Text variant="Caption Strong" color="fg/muted">{g.name}</Text>
              <View style={styles.row}>
                {g.moods.map((m) => <Chip key={m} label={m} selected={!!dev && mood === m} onPress={() => set(m, phase)} />)}
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={styles.row}>
          <Button label="Live weather" variant="Outline" size="M" onPress={() => setDevWeather(null)} />
          <Button label="Done" size="M" onPress={() => router.back()} />
        </View>
      </View>
    </View>
  );
}

/** A small copy of the wash (same drawing and opacity) with a sample header line in the ink that background gets. */
function Tile({ id, selected, onPress }: { id: BackdropKey; selected: boolean; onPress: () => void }) {
  const { color } = useTheme();
  const ink = useWashInk(BACKDROPS[id], 0.3, WASH_OPACITY);
  return (
    <View style={[styles.tile, { borderColor: color(selected ? 'border/focus' : 'border/default') }]} onTouchEnd={onPress} accessibilityRole="button" accessibilityLabel={id}>
      <MoodGradient spec={BACKDROPS[id]} opacity={WASH_OPACITY} base={color('bg/default')} />
      <Text variant="Caption Strong" color={ink?.strong ?? 'fg/default'}>{id}</Text>
      <Text variant="Caption" color={ink?.secondary ?? 'fg/secondary'}>Aa · 12°</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radius['2xl'], borderTopRightRadius: radius['2xl'], padding: space[20], gap: space[12], maxHeight: '80%' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8] },
  tile: { width: '31%', height: 84, borderRadius: radius.md, borderWidth: 1, overflow: 'hidden', padding: space[8], gap: space[2] },
  list: { flexGrow: 0 },
});
