import { Image } from 'expo-image';
import { Plus } from '../icons/ongdal';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { elevation, radius, space, useTheme } from '../../theme';
import { Icon } from '../Icon';
import { Text } from '../Text';
import { Avatar } from './Parts';

/** One dish on a table: photo, cook, label under the plate. */
export type PlateItem = { id: string; photo: string; label: string; cook: { id: string; name: string; avatarUrl: string | null } };

const PLATE = 95;
const RIM = 6;
const BADGE = 24;
const BADGE_RING = 2;

/**
 * Table · <day> (Figma 4.4 Community · Table 730:11437) — bg/subtle card r24 · p16 · gap 16:
 * header (Title/M + Caption) → 3-column grid of round plates (gap 16) → optional "See more" (Caption Strong).
 */
export function PlateTable({ title, subtitle, children, onMore, moreLabel }: {
  title: string; subtitle?: string; children: ReactNode; onMore?: () => void; moreLabel?: string;
}) {
  const { color } = useTheme();
  return (
    <View style={[styles.table, { backgroundColor: color('bg/subtle') }]}>
      <View style={styles.header}>
        <Text variant="Title/M" numberOfLines={1}>{title}</Text>
        {subtitle ? <Text variant="Caption" color="fg/secondary" numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {children}
      {onMore && moreLabel ? (
        <Pressable accessibilityRole="button" onPress={onMore} hitSlop={space[8]} style={styles.more}>
          <Text variant="Caption Strong" color="fg/secondary">{moreLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Plate grid — 3 per row, gap 16; cells share the row width (95 pt on a 390 screen). */
export function PlateGrid({ children }: { children: ReactNode[] }) {
  const rows: ReactNode[][] = [];
  children.forEach((c, i) => { if (i % 3 === 0) rows.push([]); rows[rows.length - 1].push(c); });
  return (
    <View style={styles.grid}>
      {rows.map((r, i) => (
        <View key={i} style={styles.row}>
          {[0, 1, 2].map((j) => <View key={j} style={styles.cell}>{r[j] ?? null}</View>)}
        </View>
      ))}
    </View>
  );
}

/**
 * Plate — round photo with a bg/default rim (6) + Elevation/1 Low, cook avatar 24 at the bottom-right, 1-line label.
 * `onFollow` (neighbour plate): a small "+ Follow" pill beside the avatar — bg/primary, Caption Strong fg/on-primary, h24.
 */
export function Plate({ item, tone = 'dish', onPress, onCook, onFollow, followLabel, children }: {
  /** dish = Caption fg/secondary · mine = Caption Strong fg/accent ("My seat") · cook = Caption Strong fg/default (suggested cook). */
  item: PlateItem; tone?: 'dish' | 'mine' | 'cook'; onPress: () => void; onCook: () => void;
  onFollow?: () => void; followLabel?: string; children?: ReactNode;
}) {
  const { color } = useTheme();
  return (
    <View style={styles.cellInner}>
      <View style={styles.plateBox}>
        <Pressable accessibilityRole="button" accessibilityLabel={item.label} onPress={onPress}
          style={[styles.plate, elevation['Elevation/1 Low'], { backgroundColor: color('bg/default') }]}>
          <Image source={{ uri: item.photo }} style={styles.photo} contentFit="cover" contentPosition="center" transition={150} recyclingKey={item.id} />
        </Pressable>
        <View style={styles.badgeRow} pointerEvents="box-none">
          {onFollow && followLabel ? (
            <Pressable accessibilityRole="button" accessibilityLabel={`${followLabel}, ${item.cook.name}`} onPress={onFollow} hitSlop={space[4]}
              style={[styles.follow, { borderColor: color('bg/default'), backgroundColor: color('bg/primary') }]}>
              <Icon icon={Plus} size={12} color="fg/on-primary" />
              <Text variant="Caption Strong" color="fg/on-primary" numberOfLines={1} style={styles.followText}>{followLabel}</Text>
            </Pressable>
          ) : null}
          <Pressable accessibilityRole="button" accessibilityLabel={item.cook.name} onPress={onCook} hitSlop={space[6]}
            style={[styles.badge, { borderColor: color('bg/default'), backgroundColor: color('bg/default') }]}>
            <Avatar url={item.cook.avatarUrl} name={item.cook.name} size={BADGE} />
          </Pressable>
        </View>
      </View>
      <Text variant={tone === 'dish' ? 'Caption' : 'Caption Strong'} color={tone === 'dish' ? 'fg/secondary' : tone === 'mine' ? 'fg/accent' : 'fg/default'} numberOfLines={1} style={styles.label}>{item.label}</Text>
      {children}
    </View>
  );
}

/** My seat · Empty — dashed border/default circle with plus (fg/accent), "Place your dish" in Caption Strong fg/accent. */
export function EmptySeat({ label, onPress }: { label: string; onPress: () => void }) {
  const { color } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.cellInner}>
      <View style={styles.plateBox}>
        <View style={[styles.dashed, { borderColor: color('border/default') }]}>
          <Icon icon={Plus} size={24} color="fg/accent" />
        </View>
      </View>
      <Text variant="Caption Strong" color="fg/accent" numberOfLines={1} style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  table: { borderRadius: radius.xl, padding: space[16], gap: space[16] },
  header: { gap: space[2] },
  more: { alignSelf: 'center' },
  grid: { gap: space[16] },
  row: { flexDirection: 'row', gap: space[16] },
  cell: { flex: 1 },
  cellInner: { alignItems: 'center', gap: space[8] },
  plateBox: { width: '100%', maxWidth: PLATE, aspectRatio: 1 },
  plate: { flex: 1, borderRadius: radius.full, padding: RIM },
  photo: { flex: 1, borderRadius: radius.full },
  // Avatar (+ Follow pill on its left) pinned to the plate's bottom-right; the pill shrinks to fit the plate width.
  badgeRow: {
    position: 'absolute', left: -BADGE_RING, right: -BADGE_RING, bottom: -BADGE_RING,
    flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: space[2],
  },
  badge: { borderWidth: BADGE_RING, borderRadius: radius.full, overflow: 'hidden' },
  follow: {
    flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: space[2], height: BADGE + BADGE_RING * 2,
    paddingHorizontal: space[8], borderWidth: BADGE_RING, borderRadius: radius.full,
  },
  followText: { flexShrink: 1 },
  dashed: { flex: 1, borderRadius: radius.full, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  label: { alignSelf: 'stretch', textAlign: 'center' },
});
