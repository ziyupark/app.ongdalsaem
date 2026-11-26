import { Image, type ImageSource } from 'expo-image';

type Pic = number | ImageSource;

const SIMILAR_BITES = require('../../../assets/icons/similar-bites.png');
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, MapPin } from '../icons/ongdal';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { radius, space, useTheme, withAlpha, type WeatherMood } from '../../theme';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { AcornTag, WeatherTag } from '../PhotoTags';
import { Text } from '../Text';
import { Avatar } from '../community/Parts';

/** Gradient/Card scrim — ink 45 % at 0 → 0 at 30 % → 0 at 50 % → ink 82 % at 100 %. */
function CardScrim() {
  const { color } = useTheme();
  const ink = color('static/ink');
  return (
    <LinearGradient
      colors={[withAlpha(ink, 0.45), withAlpha(ink, 0), withAlpha(ink, 0), withAlpha(ink, 0.82)]}
      locations={[0, 0.3, 0.5, 1]}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}

/** Acorn Tag that gives / takes back an acorn when `onPress` is set (filled = given); a plain tag otherwise. */
function AcornToggle({ count, given, onPress }: { count: number; given?: boolean; onPress?: () => void }) {
  const { t } = useTranslation();
  if (!onPress) return <AcornTag count={count} given={given} />;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={t('home.acorns', { count })} accessibilityState={{ selected: !!given }} hitSlop={space[8]} onPress={onPress}>
      <AcornTag count={count} given={given} />
    </Pressable>
  );
}

/** Nearby Card 131:4542 — row, padding 14, gap 14, radius 2xl, bg/subtle + 1px border/default. */
export function NearbyCard({ title, meta, onPress }: { title: string; meta: string; onPress?: () => void }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.nearby, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
      <Image source={SIMILAR_BITES} style={styles.nearbyPhoto} contentFit="contain" />
      <View style={styles.nearbyText}>
        <Text variant="Overline" color="fg/muted" numberOfLines={1}>{t('home.eatNearby')}</Text>
        <Text variant="Title/M" numberOfLines={1}>{title}</Text>
        <Text variant="Body/S" color="fg/secondary" numberOfLines={1}>{meta}</Text>
      </View>
      <Icon icon={ChevronRight} size={18} color="fg/muted" />
    </Pressable>
  );
}

/**
 * Pick Card 54:554 — same make-up as Explore's Story of the day card (4.1 75:2431): 350×400, radius 2xl, Card scrim,
 * padding 24, space-between. Top: section title (Display/M like Story of the day's title, always English) + chevron. Bottom (gap 16): dish name (Statement, 2 lines) →
 * description (Body/M, 2 lines, only when there is one) → byline (Body/S) with the cook's avatar 40 on the right; then
 * weather tag · acorns.
 */
export function PickCard({ headingKey, photo, title, description, byline, cookName, cookAvatar, mood, tempC, acorns, onPress, given, onAcorn }: {
  /** i18n key of the title on the photo — shown in English, read out in the local language. */
  headingKey: string; photo: Pic; title: string; description?: string; byline: string; cookName: string; cookAvatar?: string | null;
  mood: WeatherMood; tempC: number; acorns: number; onPress?: () => void; given?: boolean; onAcorn?: () => void;
}) {
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const en = useMemo(() => i18n.getFixedT('en'), [i18n]);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${t(headingKey)}. ${title}`} onPress={onPress} style={[styles.pick, { backgroundColor: color('bg/muted') }]}>
      <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      <CardScrim />
      <View style={styles.storyTop}>
        <Text variant="Display/M" color="fg/on-photo" numberOfLines={1} style={styles.flex}>{en(headingKey)}</Text>
        <Icon icon={ChevronRight} size={20} color="fg/on-photo" />
      </View>
      <View style={styles.pickFoot}>
        <View style={styles.pickBody}>
          <View style={[styles.flex, styles.pickText]}>
            <Text variant="Statement" color="fg/on-photo" numberOfLines={2}>{title}</Text>
            {description ? <Text variant="Body/M" color="fg/on-photo-secondary" numberOfLines={2}>{description}</Text> : null}
            <Text variant="Body/S" color="fg/on-photo-secondary" numberOfLines={1}>{byline}</Text>
          </View>
          <Avatar url={cookAvatar ?? null} name={cookName} size={40} />
        </View>
        <View style={styles.tags}>
          <WeatherTag mood={mood} tempC={tempC} condition={t(`weather.${mood}`)} />
          <AcornToggle count={acorns} given={given} onPress={onAcorn} />
        </View>
      </View>
    </Pressable>
  );
}

/** 2.5 Location card — bg/subtle + 1px border/default, radius 2xl, padding 20, gap 12. */
export function LocationCard({ onChooseCity, onAllowLocation, busy }: { onChooseCity: () => void; onAllowLocation: () => void; busy?: boolean }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={[styles.location, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
      <View style={styles.locationRow}>
        <View style={[styles.pin, { backgroundColor: color('bg/muted') }]}>
          <Icon icon={MapPin} size={22} />
        </View>
        <View style={styles.locationText}>
          <Text variant="Overline" color="fg/muted">{t('home.locationOff.unknown')}</Text>
          <Text variant="Title/M">{t('home.locationOff.where')}</Text>
        </View>
      </View>
      <View style={styles.locationButtons}>
        <Button label={t('home.locationOff.choose')} size="M" onPress={onChooseCity} />
        <Button label={t('home.locationOff.allow')} size="M" variant="Outline" onPress={onAllowLocation} loading={busy} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  storyTop: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  tags: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nearby: { flexDirection: 'row', alignItems: 'center', gap: space[14], padding: space[14], borderRadius: radius['2xl'], borderWidth: 1, alignSelf: 'stretch' },
  nearbyPhoto: { width: 72, height: 72, borderRadius: radius.lg },
  nearbyText: { flex: 1, gap: space[8] },
  // Pick = Story of the day card (app/community.tsx): 400 high, r2xl, p24; title on top · foot at the bottom; foot gap 16 · body gap 16 · text gap 8.
  pick: { height: 400, borderRadius: radius['2xl'], overflow: 'hidden', padding: space[24], justifyContent: 'space-between', alignSelf: 'stretch' },
  pickFoot: { gap: space[16] },
  pickBody: { flexDirection: 'row', alignItems: 'flex-end', gap: space[16] },
  pickText: { gap: space[8] },
  location: { borderRadius: radius['2xl'], borderWidth: 1, padding: space[20], gap: space[12], alignSelf: 'stretch' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: space[12] },
  pin: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  locationText: { gap: space[2] },
  locationButtons: { flexDirection: 'row', gap: space[8] },
});
