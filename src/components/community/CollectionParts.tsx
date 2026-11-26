import { Image } from 'expo-image';
import { ChevronLeft, List, Share2, type LucideIcon } from '../icons/ongdal';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { CardDish } from '../../services/community';
import { radius, space, useTheme, type ColorToken } from '../../theme';
import { BottomSheet } from '../BottomSheet';
import { Chip } from '../Chip';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
import { Text } from '../Text';
import { PhotoCard } from './Parts';

// Shared blocks of 4.2 Tag (v2 826:14271) and 4.3 Country (v2 826:15002).

/** Hero carousel — Story-of-the-day sized cards (400 high), gap 6, the first few dishes. */
const HERO_H = 400;
const HERO_GAP = space[6];
const HERO_COUNT = 3;
const CATEGORY = 64;

/**
 * Collection top (4.2 / 4.3 v2) — TopBar · Overlay (back · share, Soft 40) → Header · Title (Display/XL, p22 20 12) →
 * Group (p22 · gap 6): headline (Display/M) over 400-high photo cards (gap 6). Sits on the screen's mood wash; `titleInk`
 * / `headInk` are the wash inks at the title and headline. The title is shown as given; `titleLabel` is read out.
 */
export function CollectionTop({ dishes, width, onOpen, onBack, onShare, title, titleLabel, headline, titleInk, headInk, headGap = HERO_GAP }: {
  dishes: CardDish[] | null;
  width: number;
  onOpen: (d: CardDish) => void;
  onBack: () => void;
  /** Share button on the right of the TopBar — left out when not given (4.2 Tag has none). */
  onShare?: () => void;
  title: string;
  titleLabel: string;
  headline: string;
  titleInk?: ColorToken;
  headInk?: ColorToken;
  /** Headline → cards (4.3: 6 · 4.2 826:14288: 16). */
  headGap?: number;
}) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const cardW = width - space[20] * 2;
  const hero = (dishes ?? []).slice(0, HERO_COUNT);
  return (
    <View>
      <View style={styles.bar}>
        <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={onBack} />
        {onShare ? <IconButton icon={Share2} accessibilityLabel={t('home.share')} onPress={onShare} /> : null}
      </View>
      <View style={styles.title}>
        <Text variant="Display/XL" accessibilityRole="header" accessibilityLabel={titleLabel} numberOfLines={1} adjustsFontSizeToFit color={titleInk ?? 'fg/default'}>{title}</Text>
      </View>
      <View style={[styles.heroGroup, { gap: headGap }]}>
        <Text variant="Display/M" color={headInk ?? 'fg/default'} style={styles.px}>{headline}</Text>
        {dishes == null ? (
          <View style={styles.heroLoading}><ActivityIndicator color={color('fg/muted')} /></View>
        ) : hero.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={cardW + HERO_GAP} decelerationRate="fast" contentContainerStyle={styles.heroRow}>
            {hero.map((d) => (
              <PhotoCard key={d.id} photo={d.photo} width={cardW} height={HERO_H} label={d.name} onPress={() => onOpen(d)}>
                <View />
              </PhotoCard>
            ))}
          </ScrollView>
        ) : null}
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
  bar: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space[12] },
  title: { paddingTop: space[42] - space[20], paddingHorizontal: space[20], paddingBottom: space[12] },
  heroGroup: { paddingTop: space[42] - space[20], gap: space[6] },
  px: { paddingHorizontal: space[20] },
  heroRow: { paddingHorizontal: space[20], gap: HERO_GAP },
  heroLoading: { height: HERO_H, alignItems: 'center', justifyContent: 'center' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: space[8], paddingHorizontal: space[20] },
  pill: { flex: 1, height: 40, flexDirection: 'row', alignItems: 'center', gap: space[12], paddingHorizontal: space[16], borderRadius: radius.full, borderWidth: 1 },
  weather: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: space[6] },
  sep: { width: 1, height: space[14] },
  cats: { gap: space[16], paddingHorizontal: space[20] },
  cat: { alignItems: 'center', gap: space[8] },
  catPhoto: { width: CATEGORY, height: CATEGORY, borderRadius: radius.full, overflow: 'hidden' },
  meals: { flexDirection: 'row', flexWrap: 'wrap', gap: space[6] },
});
