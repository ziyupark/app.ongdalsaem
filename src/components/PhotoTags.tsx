import { StyleSheet, View } from 'react-native';
import { radius, WEATHER_ICON, useTheme, type WeatherMood } from '../theme';
import { AcornIcon } from './AcornIcon';
import { Icon } from './Icon';
import { Text } from './Text';
import { useTemp } from '../lib/prefs';

type Size = 'L' | 'XL';
// XL = 28 high (padding 5 12 5 9, gap 5, icon 18, Body/S Strong) · L = 24 (padding 4 9 4 7, gap 4, icon 16, Caption Strong).
const SIZE = {
  XL: { pt: 5, pr: 12, pl: 9, gap: 5, icon: 18 as const, text: 'Body/S Strong' as const },
  L: { pt: 4, pr: 9, pl: 7, gap: 4, icon: 16 as const, text: 'Caption Strong' as const },
};

/** Weather Tag 362:332 — icon colour is always fg/on-photo. `condition` shows the state name (Feed Post only). */
export function WeatherTag({ mood, tempC, size = 'XL', condition }: { mood: WeatherMood; tempC: number; size?: Size; condition?: string }) {
  const { color } = useTheme();
  const s = SIZE[size];
  const temp = useTemp();
  return (
    <View style={[styles.pill, { backgroundColor: color('overlay/scrim'), paddingVertical: s.pt, paddingLeft: s.pl, paddingRight: s.pr, gap: s.gap }]}>
      <Icon icon={WEATHER_ICON[mood]} size={s.icon} color="fg/on-photo" />
      {condition ? (
        <Text variant={s.text} color="fg/on-photo" numberOfLines={1} style={size === 'L' ? styles.condL : null}>{condition}</Text>
      ) : null}
      <Text variant={s.text} color="fg/on-photo">{`${temp(tempC)}°`}</Text>
    </View>
  );
}

/** Acorn Tag 284:7293 — State Default = line acorn (fg/on-photo) · State Eaten = acorn-color (you gave one). */
export function AcornTag({ count, size = 'XL', given }: { count: number; size?: Size; given?: boolean }) {
  const { color } = useTheme();
  const s = SIZE[size];
  return (
    <View style={[styles.pill, { backgroundColor: color('overlay/scrim'), paddingVertical: s.pt, paddingLeft: s.pl, paddingRight: s.pr, gap: s.gap }]}>
      <AcornIcon size={s.icon} color="fg/on-photo" filled={!!given} />
      <Text variant={s.text} color="fg/on-photo">{String(count)}</Text>
    </View>
  );
}

/** Photo Counter 383:333 · XL — 28 high, padding 5 11, overlay/scrim-strong. */
export function PhotoCounter({ label }: { label: string }) {
  const { color } = useTheme();
  return (
    <View style={[styles.pill, styles.counter, { backgroundColor: color('overlay/scrim-strong') }]}>
      <Text variant="Body/S Strong" color="fg/on-photo">{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.full, alignSelf: 'flex-start' },
  counter: { paddingVertical: 5, paddingHorizontal: 11 }, // Figma Photo Counter XL
  condL: { maxWidth: 56 },
});
