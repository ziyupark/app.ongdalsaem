import { StyleSheet, View } from 'react-native';
import { radius, space, useTheme, type Weather3DKey, type WeatherMood } from '../theme';
import { Text } from './Text';
import { WeatherIcon3D } from './WeatherIcon3D';

type Props = { mood?: WeatherMood; icon?: Weather3DKey; now: string; place: string; range: string };

/**
 * Weather Now (363:8179) — one-line current weather: glass/surface, radius 16, padding 10 16, gap 12.
 * Weather 3D 52 · Now Body/M Strong over Place Caption fg/muted (gap 2) · Range Caption Strong fg/muted.
 */
export function WeatherNow({ mood, icon, now, place, range }: Props) {
  const { color } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: color('glass/surface') }]} accessible accessibilityLabel={[now, place, range].filter(Boolean).join(', ')}>
      <WeatherIcon3D mood={mood} icon={icon} size={52} />
      <View style={styles.text}>
        <Text variant="Body/M Strong" numberOfLines={1}>{now}</Text>
        <Text variant="Caption" color="fg/muted" numberOfLines={1}>{place}</Text>
      </View>
      <Text variant="Caption Strong" color="fg/muted" numberOfLines={1}>{range}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: space[12], paddingHorizontal: space[16], paddingVertical: space[10], borderRadius: radius.lg, overflow: 'hidden' },
  text: { flex: 1, minWidth: 0, gap: space[2] },
});
