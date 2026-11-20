import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { Plus, RotateCcw } from '../icons/ongdal';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { elevation, iconRing, radius, space, useTheme, WEATHER_ICON, type WeatherMood } from '../../theme';
import type { Meal } from '../../lib/meals';
import { Icon } from '../Icon';
import { Text } from '../Text';
import { WeatherIcon3D } from '../WeatherIcon3D';
import { useTemp } from '../../lib/prefs';

export type SlotView = { meal: Meal; isNow: boolean; tempC?: number; mood?: WeatherMood; photo?: number | { uri: string } | null };

type Props = {
  tempC?: number;
  mood?: WeatherMood;
  condition: string;
  detail: string;
  /** Second detail line ("until 9 PM") — optional. */
  until?: string;
  slots: SlotView[];
  picksHead: string;
  onRefresh: () => void;
  onSlotPress?: (slot: SlotView) => void;
};

/**
 * Weather Card 136:4716 — glass surface (glass/surface + blur, 1px bg/subtle edge, Elevation/3), radius 2xl, padding 18 20, gap 14, children centred.
 * Now row (temp · condition / H·L / until · 3D icon 64) → divider → Picks head (Refresh 32) → Meal timeline
 * (centred, 16 px wider than the card's content box on each side — slots 5 px from the card edge; 4 equal slots of 82 at 390 wide, padding 8 4 10 4, gap 4).
 */
export function WeatherCard({ tempC, mood, condition, detail, until, slots, picksHead, onRefresh, onSlotPress }: Props) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const temp = useTemp();
  const spin = useSharedValue(0);
  const last = useRef(0);
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${-spin.value * 360}deg` }] }));

  // Meal timeline interaction: the bg/muted highlight sits on Now; tapping another slot slides it there (260 ms),
  // then opens that slot's dish. Coming back to Home puts it on Now again.
  const nowIndex = Math.max(0, slots.findIndex((s) => s.isNow));
  const [selected, setSelected] = useState(nowIndex);
  const [rowW, setRowW] = useState(0);
  const busy = useRef(false);
  const x = useSharedValue(0);
  const slotW = rowW ? (rowW - space[4] * (slots.length - 1)) / slots.length : 0;
  const offset = (i: number) => i * (slotW + space[4]);
  useEffect(() => { if (slotW && !busy.current) x.value = offset(selected); }, [slotW]); // eslint-disable-line react-hooks/exhaustive-deps
  useFocusEffect(useCallback(() => {
    busy.current = false;
    setSelected(nowIndex);
    if (slotW) x.value = withTiming(offset(nowIndex), { duration: 200, easing: Easing.out(Easing.cubic) });
  }, [nowIndex, slotW])); // eslint-disable-line react-hooks/exhaustive-deps
  const highlight = useAnimatedStyle(() => ({ width: slotW, transform: [{ translateX: x.value }] }));
  const choose = (i: number) => {
    if (busy.current) return;
    const go = () => { onSlotPress?.(slots[i]); };
    if (i === selected || !slotW) { go(); return; }
    busy.current = true;
    setSelected(i);
    x.value = withTiming(offset(i), { duration: 260, easing: Easing.inOut(Easing.cubic) }, (done) => { if (done) scheduleOnRN(go); });
  };

  const refresh = () => {
    const now = Date.now();
    if (now - last.current < 1000) return; // 1 s guard (docs/05-behavior.md §6.1)
    last.current = now;
    spin.value = 0;
    spin.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    onRefresh();
  };

  return (
    <View style={[styles.card, elevation['Elevation/3 Float'], { borderColor: color('bg/subtle') }]}>
      <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: color('glass/surface') }]} />
      <View style={styles.now}>
        <View style={styles.nowMain}>
          <View style={styles.tempBox}>
            <Text variant="Numeric/XL" style={styles.tabular}>{tempC === undefined ? '--°' : `${temp(tempC)}°`}</Text>
          </View>
          <View style={styles.nowText}>
            <Text variant="Title/M" numberOfLines={1}>{condition}</Text>
            <View style={styles.details}>
              <Text variant="Body/S" color="fg/muted" numberOfLines={1}>{detail}</Text>
              {until ? <Text variant="Body/S" color="fg/muted" numberOfLines={1}>{until}</Text> : null}
            </View>
          </View>
        </View>
        {/* Large weather icon — 3D Weather Mood image (falls back to the mood orb). */}
        <WeatherIcon3D mood={mood} size={64} />
      </View>
      <View style={[styles.divider, { backgroundColor: color('border/default') }]} />
      <View style={styles.head}>
        <Text variant="Caption Strong" color="fg/muted" style={styles.flex}>{picksHead}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={t('home.newPicks')} hitSlop={space[6]} onPress={refresh} style={[styles.refresh, { borderColor: color('border/default') }]}>
          <Animated.View style={spinStyle}>
            <Icon icon={RotateCcw} size={16} />
          </Animated.View>
        </Pressable>
      </View>
      <View style={styles.timeline} onLayout={(e) => setRowW(e.nativeEvent.layout.width)}>
        {slotW ? <Animated.View pointerEvents="none" style={[styles.highlight, { backgroundColor: color('bg/muted') }, highlight]} /> : null}
        {slots.map((s, i) => (
          <MealSlot key={`${s.meal}-${i}`} slot={s} active={i === selected} onPress={() => choose(i)} />
        ))}
      </View>
    </View>
  );
}

/** Meal Slot 131:4280 — label (Overline, centred) → thumb 60 → weather icon 14 + temp. Active = fg/default label on the sliding bg/muted highlight. */
function MealSlot({ slot, active, onPress }: { slot: SlotView; active: boolean; onPress: () => void }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const temp = useTemp();
  const label = slot.isNow ? t('home.meal.now') : t(`home.meal.${slot.meal}`);
  const empty = !slot.photo;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={empty ? t('home.emptySlot', { meal: t(`home.meal.${slot.meal}`) }) : label}
      onPress={onPress}
      style={styles.slot}
    >
      <Text variant="Overline" color={active ? 'fg/default' : 'fg/muted'} numberOfLines={1} style={styles.slotLabel}>{label}</Text>
      {empty ? (
        <View style={[styles.thumb, styles.emptyThumb, { backgroundColor: color('bg/muted'), borderColor: color('border/strong') }]}>
          <Icon icon={Plus} size={18} color="fg/muted" />
        </View>
      ) : (
        <View style={[styles.thumb, { backgroundColor: color('bg/subtle') }]}>
          <Image source={slot.photo!} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
        </View>
      )}
      <View style={styles.slotTemp}>
        <Icon icon={WEATHER_ICON[slot.mood ?? 'overcast']} size={14} />
        <Text variant="Body/S Strong" style={styles.tabular}>{slot.tempC === undefined ? '--°' : `${temp(slot.tempC)}°`}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius['2xl'], borderWidth: 1, paddingHorizontal: space[20], paddingVertical: 18, gap: space[14], overflow: 'hidden', alignSelf: 'stretch' },
  now: { flexDirection: 'row', alignItems: 'center', gap: space[14] },
  // Now 876:13581 — temp (padding 0 · 8 · 2 · 8) · gap 4 · condition over H/L and "until" (gap 6, lines gap 2).
  nowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space[4] },
  tempBox: { paddingHorizontal: space[8], paddingBottom: space[2], alignItems: 'center', justifyContent: 'center' },
  nowText: { flex: 1, gap: space[6] },
  details: { gap: space[2] },
  divider: { height: 1, alignSelf: 'stretch' },
  head: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  flex: { flex: 1 },
  refresh: { width: 32, height: 32, borderRadius: radius.full, borderWidth: iconRing, alignItems: 'center', justifyContent: 'center' },
  timeline: { flexDirection: 'row', gap: space[4], marginHorizontal: -space[16] },
  highlight: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: radius.xl },
  slot: { flex: 1, alignItems: 'center', gap: space[6], paddingTop: space[8], paddingBottom: space[10], paddingHorizontal: space[4], borderRadius: radius.xl },
  slotLabel: { alignSelf: 'stretch', textAlign: 'center' },
  thumb: { width: 60, height: 60, borderRadius: radius.full, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  emptyThumb: { borderWidth: 1, borderStyle: 'dashed' },
  slotTemp: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  tabular: { fontVariant: ['tabular-nums'] },
});
