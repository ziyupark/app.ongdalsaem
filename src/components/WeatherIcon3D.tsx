import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { getHere, onHere } from '../lib/useHere';
import { moods, radius, useTheme, WEATHER_3D, WEATHER_ICON, WEATHER_MOODS, withAlpha, type Weather3DKey, type WeatherMood } from '../theme';
import { Icon } from './Icon';

const isMood = (key: Weather3DKey): key is WeatherMood => (WEATHER_MOODS as readonly string[]).includes(key);

/**
 * Large weather icon (Weather Card 136:4508 — Home · Profile header · Nearby): the Weather 3D image (Figma 1132:220, 41 keys)
 * in a 56 slot (Home: 64), no orb. `icon` = the finer key from the forecast; without it the mood's own image. Accessibility
 * label = the finer weather name. No weather yet → the old muted orb + Lucide 28. Same image in light and dark (no tint).
 */
export function WeatherIcon3D({ mood, icon, size = 56 }: { mood?: WeatherMood; icon?: Weather3DKey; size?: number }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const key = mood ? (icon && WEATHER_3D[icon] ? icon : mood) : undefined;
  const label = key ? (isMood(key) ? t(`weather.${key}`) : t(`weatherDetail.${key}`)) : undefined;
  if (key) {
    return <Image source={WEATHER_3D[key]} style={{ width: size, height: size }} contentFit="contain" accessible accessibilityRole="image" accessibilityLabel={label} />;
  }
  return (
    <View accessible={!!mood} accessibilityRole="image" accessibilityLabel={label} style={[{ width: size, height: size }, styles.orb, { backgroundColor: withAlpha(mood ? moods[mood].top : color('bg/muted'), 0.35) }]}>
      <Icon icon={WEATHER_ICON[mood ?? 'overcast']} size={28} color={mood ? 'fg/default' : 'fg/muted'} />
    </View>
  );
}

/** App start: decode only the current weather's 3D image (and again when it changes). Returns an unsubscribe. */
export function preloadWeather3D() {
  const done = new Set<Weather3DKey>();
  const load = (key?: Weather3DKey) => {
    if (!key || done.has(key)) return;
    done.add(key);
    Image.loadAsync(WEATHER_3D[key]).catch(() => done.delete(key));
  };
  const keyOf = (f = getHere().forecast) => f?.icon ?? f?.mood;
  load(keyOf());
  return onHere((h) => load(keyOf(h.forecast)));
}

const styles = StyleSheet.create({
  orb: { borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
});
