import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { getHere, onHere } from '../lib/useHere';
import { moods, radius, useTheme, WEATHER_3D, WEATHER_ICON, withAlpha, type WeatherMood } from '../theme';
import { Icon } from './Icon';

/**
 * Large weather icon (Home Weather Card · Profile header) — the 3D Weather Mood image in the 56 slot, no orb.
 * Moods without a 3D image (and no weather yet) keep the old mood orb: top colour at 35 % + Lucide 28.
 * Same image in light and dark (no tint).
 */
export function WeatherIcon3D({ mood }: { mood?: WeatherMood }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const source = mood ? WEATHER_3D[mood] : undefined;
  const label = mood ? t(`weather.${mood}`) : undefined;
  if (source) {
    return <Image source={source} style={styles.slot} contentFit="contain" accessible accessibilityRole="image" accessibilityLabel={label} />;
  }
  return (
    <View accessible={!!mood} accessibilityRole="image" accessibilityLabel={label} style={[styles.slot, styles.orb, { backgroundColor: withAlpha(mood ? moods[mood].top : color('bg/muted'), 0.35) }]}>
      <Icon icon={WEATHER_ICON[mood ?? 'overcast']} size={28} color={mood ? 'fg/default' : 'fg/muted'} />
    </View>
  );
}

/** App start: decode only the current weather's 3D image (and again when the mood changes). Returns an unsubscribe. */
export function preloadWeather3D() {
  const done = new Set<WeatherMood>();
  const load = (mood?: WeatherMood) => {
    const source = mood ? WEATHER_3D[mood] : undefined;
    if (!mood || !source || done.has(mood)) return;
    done.add(mood);
    Image.loadAsync(source).catch(() => done.delete(mood));
  };
  load(getHere().forecast?.mood);
  return onHere((h) => load(h.forecast?.mood));
}

const styles = StyleSheet.create({
  slot: { width: 56, height: 56 },
  orb: { borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
});
