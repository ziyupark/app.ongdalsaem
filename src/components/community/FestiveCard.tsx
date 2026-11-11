import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import type { UpcomingFestive } from '../../lib/holidays';
import { radius, space, useTheme } from '../../theme';
import { MoodGradient } from '../MoodGradient';
import { Text } from '../Text';
import { flagSource } from './Parts';

/**
 * Festive card (Group · Festive 398:9710) — 168×196, radius 24, p16: flag badge · date · name · dish over the holiday's
 * food photo. Used by 4.1 Holidays around the world and the all-holidays list. Opens the holiday's tag.
 */
export function FestiveCard({ h, width = 168, height = 196 }: { h: UpcomingFestive; width?: number; height?: number }) {
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const days = Math.round((h.at.getTime() - new Date().setHours(0, 0, 0, 0)) / 864e5);
  const date = h.at.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' }).toUpperCase();
  const flag = flagSource(h.country);
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(`/tag/${h.tag}`)} style={[styles.card, { width, height }]}>
      {h.image ? <Image source={h.image} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} /> : <MoodGradient mood={h.mood} style={StyleSheet.absoluteFill} />}
      <LinearGradient colors={['transparent', color('overlay/scrim-strong')]} locations={[0.35, 1]} style={StyleSheet.absoluteFill} />
      {/* Badge 36 (glass) — the holiday's country flag instead of an icon. */}
      <View style={[styles.badge, { backgroundColor: color('glass/surface') }]}>
        {flag ? <Image source={flag} style={styles.flag} contentFit="cover" /> : null}
      </View>
      <View style={styles.flex} />
      <Text variant="Overline" color="fg/on-photo-secondary">{days <= 1 ? `${date} · ${t(days === 0 ? 'community.today' : 'community.tomorrow').toUpperCase()}` : date}</Text>
      <Text variant="Title/M" color="fg/on-photo">{t(`community.holidays.${h.key}.name`)}</Text>
      <Text variant="Caption" numberOfLines={1} color="fg/on-photo-secondary">{t(`community.holidays.${h.key}.food`)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, overflow: 'hidden', padding: space[16], gap: space[6] },
  badge: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  flag: { width: 20, height: 14, borderRadius: 3 },
  flex: { flex: 1 },
});
