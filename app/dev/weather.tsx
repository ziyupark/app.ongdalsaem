import { Redirect, router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Chip } from '../../src/components/Chip';
import { Text } from '../../src/components/Text';
import { setDevWeather, useDevWeather } from '../../src/lib/devWeather';
import { useHere } from '../../src/lib/useHere';
import { elevation, radius, space, useTheme, WEATHER_MOODS, type TimeOfDay, type WeatherMood } from '../../src/theme';

/** The 7 motion groups of the Weather Mood layer, and the moods that use each. */
const GROUPS: { name: string; moods: WeatherMood[] }[] = [
  { name: 'Clear', moods: ['clear', 'clear-night', 'heat'] },
  { name: 'Cloudy', moods: ['cloudy', 'overcast', 'fog'] },
  { name: 'Rain', moods: ['drizzle', 'rain', 'heavy-rain', 'shower', 'sleet'] },
  { name: 'Snow', moods: ['flurries', 'snow', 'heavy-snow', 'cold'] },
  { name: 'Thunder', moods: ['thunder'] },
  { name: 'Wind', moods: ['windy', 'dust'] },
];

/**
 * Dev only (long-press the Home logo → "Weather mood preview"). A sheet over the tabs: pick any mood × day / night
 * and the global WeatherBackdrop switches (cross-fade) behind it — also on every other tab until "Live weather".
 * Not translated: never shipped to users.
 */
export default function DevWeather() {
  const insets = useSafeAreaInsets();
  const { color } = useTheme();
  const dev = useDevWeather();
  const { here } = useHere();
  if (!__DEV__) return <Redirect href="/home" />;
  const live = here.forecast?.mood ?? 'overcast';
  const mood = dev?.mood ?? live;
  const tod: TimeOfDay = dev?.timeOfDay ?? 'day';
  const set = (m: WeatherMood, t: TimeOfDay) => setDevWeather({ mood: m, timeOfDay: t });
  const grouped = new Set(GROUPS.flatMap((g) => g.moods));
  const others = WEATHER_MOODS.filter((m) => !grouped.has(m));
  return (
    <View style={styles.root}>
      <View style={[styles.sheet, elevation['Elevation/3 Float'], { backgroundColor: color('glass/surface'), paddingBottom: insets.bottom + space[16] }]}>
        <Text variant="Title/M">Weather mood preview</Text>
        <Text variant="Body/S" color="fg/muted">
          {dev ? `Forced: ${dev.mood} · ${dev.timeOfDay}` : `Live weather: ${live}`}
        </Text>
        <View style={styles.row}>
          {(['day', 'night'] as const).map((t) => (
            <Chip key={t} label={t === 'day' ? 'Day' : 'Night'} selected={!!dev && tod === t} onPress={() => set(mood, t)} />
          ))}
        </View>
        <ScrollView style={styles.list} contentContainerStyle={{ gap: space[12] }}>
          {[...GROUPS, ...(others.length ? [{ name: 'Other', moods: others }] : [])].map((g) => (
            <View key={g.name} style={{ gap: space[6] }}>
              <Text variant="Caption Strong" color="fg/muted">{g.name}</Text>
              <View style={styles.row}>
                {g.moods.map((m) => <Chip key={m} label={m} selected={!!dev && mood === m} onPress={() => set(m, tod)} />)}
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

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radius['2xl'], borderTopRightRadius: radius['2xl'], padding: space[20], gap: space[12], maxHeight: '62%' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8] },
  list: { flexGrow: 0 },
});
