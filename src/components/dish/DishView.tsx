import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MoreHorizontal, Timer } from 'lucide-react-native';
import { Bookmark, MessageCircle, Share } from '../icons/custom';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { isPresetMeal, isPresetMood, mealIcon, moodIcon, temperatureIcon, temperatureTag } from '../../lib/tags';
import type { Ingredient, Step } from '../../services/foods';
import { radius, space, useTheme, WEATHER_ICON, withAlpha, type WeatherMood } from '../../theme';
import { AcornIcon } from '../AcornIcon';
import { Chip } from '../Chip';
import { Icon } from '../Icon';
import { AcornTag, PhotoCounter, WeatherTag } from '../PhotoTags';
import { Text } from '../Text';

export type Pic = number | { uri: string };

export type DishViewData = {
  photos: Pic[];
  name: string;
  mood: WeatherMood | null;
  tempC: number | null;
  acorns: number;
  comments: number;
  authorName: string;
  authorAvatar: Pic | null;
  meta: string;
  caption: string;
  meals: string[];
  moods: string[];
  ingredients: Ingredient[];
  steps: Step[];
  calories: number | null;
};

type Props = {
  dish: DishViewData;
  given?: boolean;
  saved?: boolean;
  onAcorn?: () => void;
  onComments?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onMore?: () => void;
  onAuthor?: () => void;
  /** Step timer button (7.1 "Start 15:00 timer"). */
  onStartTimer?: (stepIndex: number) => void;
  /** Rendered after the Details row (7.1 "More from …"). */
  footer?: ReactNode;
  /** Space kept under the content for the fixed action bar. */
  bottomInset: number;
};

export const HERO_HEIGHT = 560;
const SHEET_OVERLAP = 32;

/**
 * 7.1 Post detail / 8.3 Preview body (Figma 20:1380, 309:7358): photo hero 560 (swipe) with scrims, title, Weather/Acorn tags,
 * then the sheet (radius 32, overlapping 32): Feed Post header · actions · caption → dish tags → Ingredients → Steps → Calories.
 */
export function DishView({ dish, given, saved, onAcorn, onComments, onShare, onSave, onMore, onAuthor, onStartTimer, footer, bottomInset }: Props) {
  const { width } = useWindowDimensions();
  const { color } = useTheme();
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const ink = color('static/ink');
  const total = dish.photos.length;

  const onPage = (e: NativeSyntheticEvent<NativeScrollEvent>) => setPage(Math.round(e.nativeEvent.contentOffset.x / width));

  const tags = useDishTags(dish);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomInset }}>
      <View style={{ height: HERO_HEIGHT }}>
        <FlatList
          data={dish.photos}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onPage}
          renderItem={({ item }) => <Image source={item} style={{ width, height: HERO_HEIGHT }} contentFit="cover" transition={150} />}
        />
        <LinearGradient pointerEvents="none" colors={[withAlpha(ink, 0), withAlpha(ink, 0.82)]} style={styles.scrimBottom} />
        <LinearGradient pointerEvents="none" colors={[withAlpha(ink, 0.45), withAlpha(ink, 0)]} style={styles.scrimTop} />
        <View pointerEvents="none" style={styles.title}>
          <Text variant="Display/XL" color="fg/on-photo" numberOfLines={3}>{dish.name}</Text>
        </View>
        {dish.mood && dish.tempC != null ? (
          <View pointerEvents="none" style={styles.weather}>
            <WeatherTag mood={dish.mood} tempC={dish.tempC} condition={t(`weather.${dish.mood}`)} />
          </View>
        ) : null}
        <View pointerEvents="none" style={styles.acorn}>
          <AcornTag count={dish.acorns} />
        </View>
        {total > 1 ? (
          <View pointerEvents="none" style={styles.counter}>
            <PhotoCounter label={t('home.photoCount', { n: page + 1, total })} />
          </View>
        ) : null}
      </View>

      <View style={[styles.sheet, { backgroundColor: color('bg/default') }]}>
        <View style={styles.post}>
          <View style={styles.header}>
            <Pressable onPress={onAuthor} disabled={!onAuthor} style={[styles.avatar, { backgroundColor: color('bg/accent-subtle') }]}>
              {dish.authorAvatar ? <Image source={dish.authorAvatar} style={StyleSheet.absoluteFill} contentFit="cover" /> : (
                <Text variant="Caption Strong" color="fg/accent">{dish.authorName.slice(0, 1).toUpperCase()}</Text>
              )}
            </Pressable>
            <Pressable onPress={onAuthor} disabled={!onAuthor} style={styles.who}>
              <Text variant="Body/S Strong" numberOfLines={1}>{dish.authorName}</Text>
              <Text variant="Caption" color="fg/muted" numberOfLines={1}>{dish.meta}</Text>
            </Pressable>
            {onMore ? (
              <Pressable accessibilityRole="button" accessibilityLabel={t('home.more')} hitSlop={space[8]} onPress={onMore}>
                <Icon icon={MoreHorizontal} size={24} color="fg/secondary" />
              </Pressable>
            ) : (
              <Icon icon={MoreHorizontal} size={24} color="fg/secondary" />
            )}
          </View>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('home.acorns', { count: dish.acorns })} accessibilityState={{ selected: !!given }} disabled={!onAcorn} onPress={onAcorn} style={styles.count}>
              <AcornIcon size={24} filled={!!given} />
              <Text variant="Body/S Strong">{String(dish.acorns)}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={t('home.comments', { count: dish.comments })} disabled={!onComments} onPress={onComments} style={styles.count}>
              <Icon icon={MessageCircle} size={24} />
              <Text variant="Body/S Strong">{String(dish.comments)}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={t('home.share')} disabled={!onShare} onPress={onShare}>
              <Icon icon={Share} size={24} />
            </Pressable>
            <View style={styles.spacer} />
            <Pressable accessibilityRole="button" accessibilityLabel={t('home.save')} accessibilityState={{ selected: !!saved }} disabled={!onSave} onPress={onSave}>
              <Bookmark size={24} strokeWidth={1.6} absoluteStrokeWidth color={color('fg/default')} fill={saved ? color('fg/default') : 'none'} />
            </Pressable>
          </View>
          {dish.caption ? (
            <View style={styles.caption}>
              <Text variant="Body/S">{dish.caption}</Text>
            </View>
          ) : null}
        </View>

        {tags.length ? (
          <View style={styles.tags}>
            {tags.map((g) => <Chip key={g.key} label={g.label} icon={g.icon} static />)}
          </View>
        ) : null}

        <DishRecipe dish={dish} onStartTimer={onStartTimer} />
        {footer}
      </View>
    </ScrollView>
  );
}


/** Weather · temperature · mood · meal chips shown under the caption. */
export function useDishTags(dish: DishViewData) {
  const { t } = useTranslation();
  const tags: { key: string; label: string; icon: ReturnType<typeof mealIcon> }[] = [];
  if (dish.mood) tags.push({ key: `w-${dish.mood}`, label: t(`home.titleMood.${dish.mood}`), icon: WEATHER_ICON[dish.mood] });
  if (dish.tempC != null) {
    const tt = temperatureTag(dish.tempC);
    tags.push({ key: `t-${tt}`, label: t(`dish.temperature.${tt}`), icon: temperatureIcon(tt) });
  }
  dish.moods.forEach((m) => tags.push({ key: `m-${m}`, label: isPresetMood(m) ? t(`share.moods.${m}`) : m, icon: moodIcon(m) }));
  dish.meals.forEach((m) => tags.push({ key: `l-${m}`, label: isPresetMeal(m) ? t(`share.meals.${m}`) : m, icon: mealIcon(m) }));
  return tags;
}

/** Divider → Ingredients → Steps (with timer buttons) → Calories. Shared by 7.1 and 8.3. */
export function DishRecipe({ dish, onStartTimer }: { dish: DishViewData; onStartTimer?: (stepIndex: number) => void }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const hasRecipe = dish.ingredients.length > 0 || dish.steps.length > 0 || dish.calories != null;
  return (
    <>
        {hasRecipe ? (
          <>
            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: color('border/default') }]} />
            </View>
            {dish.ingredients.length ? (
              <View style={styles.section}>
                <Text variant="Title/L">{t('dish.ingredients')}</Text>
                <View>
                  {dish.ingredients.map((ing, i) => (
                    <View key={`${ing.name}-${i}`} style={[styles.ingredient, { borderBottomColor: color('border/default') }]}>
                      <Text variant="Body/M" style={styles.flex}>{ing.name}</Text>
                      <Text variant="Body/M Strong" color="fg/secondary">{ing.amount}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
            {dish.steps.length ? (
              <View style={[styles.section, styles.steps, dish.ingredients.length ? styles.gap32 : null]}>
                <Text variant="Title/L">{t('dish.steps')}</Text>
                {dish.steps.map((s, i) => (
                  <View key={i} style={styles.step}>
                    <View style={[styles.stepNo, { backgroundColor: color('bg/accent-subtle') }]}>
                      <Text variant="Caption Strong" color="fg/accent">{String(i + 1)}</Text>
                    </View>
                    <View style={styles.stepText}>
                      <Text variant="Body/M">{s.text}</Text>
                      {s.timerSec ? (
                        <Pressable accessibilityRole="button" disabled={!onStartTimer} onPress={() => onStartTimer?.(i)} style={({ pressed }) => [styles.timerBtn, { backgroundColor: color('bg/muted') }, pressed && { opacity: 0.85 }]}>
                          <Icon icon={Timer} size={16} />
                          <Text variant="Button/M" style={styles.flex}>{t('dish.startTimer', { time: `${Math.floor(s.timerSec / 60)}:${String(s.timerSec % 60).padStart(2, '0')}` })}</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
            {dish.calories != null ? (
              <View style={[styles.section, styles.gap32]}>
                <View style={[styles.details, { borderColor: color('border/default') }]}>
                  <View style={styles.cal}>
                    <Text variant="Overline" color="fg/muted">{t('dish.caloriesTotal')}</Text>
                    <Text variant="Body/M Strong">{t('dish.kcal', { n: dish.calories })}</Text>
                  </View>
                  <Text variant="Caption" color="fg/muted" style={styles.calNote}>{t('dish.caloriesNote')}</Text>
                </View>
              </View>
            ) : null}
          </>
        ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  scrimBottom: { position: 'absolute', left: 0, right: 0, top: 220, height: 340 },
  scrimTop: { position: 'absolute', left: 0, right: 0, top: 0, height: 140 },
  // Title block top 373 on a 560 hero → its bottom sits 89 above the hero edge (tags at 48 + 28 + 13).
  title: { position: 'absolute', left: space[24], right: space[24], bottom: 89 },
  weather: { position: 'absolute', left: space[16], bottom: 48 },
  acorn: { position: 'absolute', right: space[16], bottom: 48 },
  counter: { position: 'absolute', right: space[16], top: 112 },
  sheet: { marginTop: -SHEET_OVERLAP, borderTopLeftRadius: radius['2xl'], borderTopRightRadius: radius['2xl'], paddingTop: space[12], overflow: 'hidden' },
  post: { paddingBottom: space[24] },
  header: { flexDirection: 'row', alignItems: 'center', gap: space[10], paddingLeft: space[20], paddingRight: space[16], paddingVertical: space[12] },
  avatar: { width: 32, height: 32, borderRadius: radius.full, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  who: { flex: 1, gap: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 18, paddingTop: space[12], paddingBottom: space[8], paddingHorizontal: space[20] },
  count: { flexDirection: 'row', alignItems: 'center', gap: space[6] },
  spacer: { flex: 1 },
  caption: { paddingHorizontal: space[20] },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8], paddingTop: space[4], paddingHorizontal: space[20] },
  dividerRow: { paddingHorizontal: space[20], paddingVertical: 28 },
  divider: { height: 1 },
  section: { paddingHorizontal: space[20], gap: space[8] },
  steps: { gap: space[14] },
  gap32: { marginTop: space[32] },
  ingredient: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: space[8], borderBottomWidth: 1, gap: space[12] },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: space[14] },
  stepNo: { width: 28, height: 28, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  stepText: { flex: 1, gap: space[10] },
  timerBtn: { height: 34, flexDirection: 'row', alignItems: 'center', gap: space[8], paddingHorizontal: space[14], borderRadius: radius.full },
  details: { flexDirection: 'row', alignItems: 'center', paddingVertical: space[14], borderTopWidth: 1, borderBottomWidth: 1, gap: space[12] },
  cal: { gap: space[4] },
  calNote: { flex: 1, textAlign: 'right' },
});
