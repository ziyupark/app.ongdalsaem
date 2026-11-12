import { Image } from 'expo-image';
import { ChevronLeft, List, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CardDish } from '../../services/community';
import { radius, space, useTheme } from '../../theme';
import { BottomSheet } from '../BottomSheet';
import { Chip } from '../Chip';
import { GlassIconButton } from '../GlassIconButton';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
import { Text } from '../Text';
import { FlagTag } from './Parts';

// Shared blocks of 4.2 Tag (v2 718:11114) and 4.3 Country (v2 718:11248).

const HERO_H = 420;
/** The title card rides up over the bottom of the photos. */
const OVERLAP = space[40];
const CATEGORY = 64;

/** Hero — swipeable photos (420, page dots) with a glass back button, and the title card overlapping their bottom. */
export function CollectionHero({ dishes, width, onOpen, onBack, overline, flag, title, band }: {
  dishes: CardDish[];
  width: number;
  onOpen: (d: CardDish) => void;
  onBack: () => void;
  overline: string;
  flag?: string;
  title: string;
  band: string;
}) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const photos = dishes.slice(0, 3);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setPage(Math.round(e.nativeEvent.contentOffset.x / width));

  return (
    <View>
      <View style={[styles.photos, { backgroundColor: color('bg/muted') }]}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScroll}>
          {photos.map((d) => (
            <Pressable key={d.id} accessibilityRole="button" accessibilityLabel={d.name} onPress={() => onOpen(d)}>
              <Image source={{ uri: d.photo }} style={{ width, height: HERO_H }} contentFit="cover" transition={150} recyclingKey={d.id} />
            </Pressable>
          ))}
        </ScrollView>
        <View style={[styles.back, { top: insets.top + space[6] }]}>
          <GlassIconButton icon={ChevronLeft} onPress={onBack} accessibilityLabel={t('common.back')} />
        </View>
        {photos.length > 1 ? (
          <View style={styles.dots} pointerEvents="none">
            {photos.map((d, i) => (
              <View key={d.id} style={[styles.dot, i === page && styles.dotOn, { backgroundColor: color(i === page ? 'fg/on-photo' : 'fg/on-photo-tertiary') }]} />
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.cardWrap}>
        <View style={[styles.card, { backgroundColor: color('bg/accent-subtle') }]}>
          <View style={styles.cardBody}>
            <View style={styles.overline}>
              {flag ? <FlagTag code={flag} /> : null}
              <Text variant="Overline" color="fg/accent">{overline}</Text>
            </View>
            <Text variant="Display/M">{title}</Text>
          </View>
          <View style={[styles.band, { backgroundColor: color('bg/inverse') }]}>
            <Text variant="Caption Strong" color="fg/inverse">{band}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/** Info row — one rounded pill [weather icon + weather · temp | dish count] and a round filter button. */
export function InfoRow({ icon, weather, count, onFilter, filtered }: { icon?: LucideIcon; weather?: string | null; count: string; onFilter: () => void; filtered: boolean }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.infoRow}>
      <View style={[styles.pill, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
        {weather ? (
          <>
            <View style={styles.weather}>
              {icon ? <Icon icon={icon} size={16} /> : null}
              <Text variant="Caption Strong" numberOfLines={1}>{weather}</Text>
            </View>
            <View style={[styles.sep, { backgroundColor: color('border/default') }]} />
          </>
        ) : null}
        <Text variant="Caption" color="fg/secondary" numberOfLines={1}>{count}</Text>
      </View>
      <IconButton icon={List} onPress={onFilter} accessibilityLabel={t('tag.filter')} dot={filtered} />
    </View>
  );
}

export type Category = { key: string; label: string; photo: string };

/** Round categories — 64 photo + Caption label; the selected one gets a 2 px fg/accent ring and an fg/accent label. Tap again to clear. */
export function CategoryRow({ items, value, onChange }: { items: Category[]; value: string | null; onChange: (k: string | null) => void }) {
  const { color } = useTheme();
  if (!items.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cats}>
      {items.map((c) => {
        const on = c.key === value;
        return (
          <Pressable key={c.key} accessibilityRole="button" accessibilityLabel={c.label} accessibilityState={{ selected: on }} onPress={() => onChange(on ? null : c.key)} style={styles.cat}>
            <View style={[styles.catPhoto, { backgroundColor: color('bg/muted') }, on && { borderColor: color('fg/accent'), borderWidth: 2 }]}>
              <Image source={{ uri: c.photo }} style={StyleSheet.absoluteFill} contentFit="cover" recyclingKey={c.key} />
            </View>
            <Text variant="Caption" color={on ? 'fg/accent' : 'fg/secondary'} numberOfLines={1}>{c.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Categories from the most-used mood tags in `rows` (photo = the first dish with that tag), skipping `except`. */
export function tagCategories(rows: CardDish[], label: (tag: string) => string, except?: string, max = 6): Category[] {
  const m = new Map<string, { n: number; photo: string }>();
  for (const r of rows) for (const tg of r.moods) {
    if (tg === except) continue;
    const cur = m.get(tg);
    m.set(tg, { n: (cur?.n ?? 0) + 1, photo: cur?.photo ?? r.photo });
  }
  return [...m.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, max).map(([key, v]) => ({ key, label: label(key), photo: v.photo }));
}

/** Meal filter sheet — "All meals" + the meals found in the list. */
export function MealSheet({ visible, onClose, meals, value, onChange }: { visible: boolean; onClose: () => void; meals: string[]; value: string | null; onChange: (m: string | null) => void }) {
  const { t } = useTranslation();
  const pick = (m: string | null) => { onChange(m); onClose(); };
  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('tag.mealFilter')}>
      <View style={styles.meals}>
        <Chip label={t('tag.allMeals')} selected={value == null} onPress={() => pick(null)} />
        {meals.map((m) => <Chip key={m} label={t(`share.meals.${m}`, { defaultValue: m })} selected={value === m} onPress={() => pick(m)} />)}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  photos: { height: HERO_H, overflow: 'hidden' },
  back: { position: 'absolute', left: space[12] },
  dots: { position: 'absolute', left: 0, right: 0, bottom: OVERLAP + space[16], flexDirection: 'row', justifyContent: 'center', gap: space[6] },
  dot: { width: space[6], height: space[6], borderRadius: radius.full },
  dotOn: { width: space[16] },
  cardWrap: { marginTop: -OVERLAP, paddingHorizontal: space[20] },
  card: { borderRadius: radius.xl, overflow: 'hidden' },
  cardBody: { padding: space[20], gap: space[8] },
  overline: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  band: { paddingVertical: space[12], paddingHorizontal: space[20] },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: space[8], paddingHorizontal: space[20] },
  pill: { flex: 1, height: 40, flexDirection: 'row', alignItems: 'center', gap: space[12], paddingHorizontal: space[16], borderRadius: radius.full, borderWidth: 1 },
  weather: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: space[6] },
  sep: { width: 1, height: space[14] },
  cats: { gap: space[16], paddingHorizontal: space[20] },
  cat: { alignItems: 'center', gap: space[8] },
  catPhoto: { width: CATEGORY, height: CATEGORY, borderRadius: radius.full, overflow: 'hidden' },
  meals: { flexDirection: 'row', flexWrap: 'wrap', gap: space[6] },
});
