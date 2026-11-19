import { Image } from 'expo-image';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import type { DishSummary } from '../../services/foods';
import { radius, space, useTheme } from '../../theme';
import { AcornTag, WeatherTag } from '../PhotoTags';
import { Text } from '../Text';

/** Media is 167×208 in Figma — keep that ratio at any width. */
const tileMediaHeight = (width: number) => Math.round((width * 208) / 167);

/**
 * Dish Tile 670:20058 — Media (radius 24): Weather Tag XL top-left 8 · Acorn Tag XL bottom-left 8;
 * gap 6 → Text (px 20): Title (Title/S) · Byline "Comfort · Dinner" (Caption, fg/muted).
 * Used everywhere a dish grid or rail appears: 6.1 Profile, 4.5 Cook profile, 7.1 "More from", tables, challenges.
 */
/** `onAcorn` turns the Acorn Tag into a give / take-back toggle (`given` = filled); `acorns` overrides the count. */
/** `place`: small label before the byline (Explore · Our area marks dishes from a wider range, e.g. "Mapo-gu"). */
/** `rounded`: photo corner radius token (default xl; Explore · Our area uses 2xl like the other photo cards there). */
type Props = { dish: DishSummary; width: number; onPress?: () => void; given?: boolean; onAcorn?: () => void; acorns?: number; rounded?: 'xl' | '2xl'; place?: string };

/** Memoized: a grid re-renders only the tiles whose props changed (FoodGrid passes stable handlers). */
export const DishTile = memo(function DishTile({ dish, width, onPress, given, onAcorn, acorns, rounded = 'xl', place }: Props) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const mood = dish.moods?.[0];
  const meal = dish.meals?.[0];
  const byline = [mood && t(`share.moods.${mood}`, { defaultValue: mood }), meal && t(`share.meals.${meal}`, { defaultValue: meal })].filter(Boolean).join(' · ');
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={dish.name} onPress={onPress} style={[styles.tile, { width }]}>
      <View style={[styles.media, { height: tileMediaHeight(width), borderRadius: radius[rounded], backgroundColor: color('bg/muted') }]}>
        <Image source={{ uri: dish.photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} recyclingKey={dish.id} />
        {dish.mood && dish.tempC != null ? (
          <View style={styles.tl}>
            <WeatherTag mood={dish.mood} tempC={dish.tempC} size="XL" condition={t(`weather.${dish.mood}`)} />
          </View>
        ) : null}
        <View style={styles.bl}>
          {onAcorn ? (
            <Pressable accessibilityRole="button" accessibilityLabel={t('home.acorns', { count: acorns ?? dish.acorns })} accessibilityState={{ selected: !!given }} hitSlop={space[8]} onPress={onAcorn}>
              <AcornTag count={acorns ?? dish.acorns} size="XL" given={given} />
            </Pressable>
          ) : (
            <AcornTag count={acorns ?? dish.acorns} size="XL" given={given} />
          )}
        </View>
      </View>
      <View style={styles.text}>
        <Text variant="Title/S" numberOfLines={1}>{dish.name}</Text>
        {byline || place ? (
          <Text variant="Caption" color="fg/muted" numberOfLines={1}>
            {place ? <Text variant="Caption Strong" color="fg/secondary">{place}</Text> : null}
            {place && byline ? ' · ' : ''}
            {byline}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  tile: { gap: space[6] },
  media: { borderRadius: radius.xl, overflow: 'hidden' },
  tl: { position: 'absolute', left: space[8], top: space[8], right: space[8], alignItems: 'flex-start' },
  bl: { position: 'absolute', left: space[8], bottom: space[8] },
  text: { paddingHorizontal: space[20] },
});
