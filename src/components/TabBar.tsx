import { BlurView } from 'expo-blur';
import { useFocusEffect } from 'expo-router';
import { Home, Plus, Timer, User, Users, type LucideIcon } from 'lucide-react-native';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing, Extrapolation, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Defs, LinearGradient, Stop } from 'react-native-svg';
import { armTabEnter } from '../lib/tabMotion';
import { elevation, gradients, iconStroke, radius, useTheme } from '../theme';
import { Text } from './Text';

export type TabKey = 'home' | 'community' | 'timer' | 'profile';
const TABS: { key: TabKey; icon: LucideIcon }[] = [
  { key: 'home', icon: Home },
  { key: 'community', icon: Users },
  { key: 'timer', icon: Timer },
  { key: 'profile', icon: User },
];

/**
 * Liquid Glass tab bar (Figma "ongdalsaem · Liquid Glass Tab Bar", after Apple's Tab Bar · Prominent Tab).
 * Glass capsule 62 high with 4 tabs (icon 22 + Nav label) + a separate 62 "Share a dish" circle, gap 10.
 * Scrolling down slides the whole bar (capsule + FAB) down off screen with the finger, scrolling up brings it back
 * (see useTabBarScroll). Active tab = Gradient/Dusk icon, fg/accent label on a bg/accent-subtle pill.
 */
const EXP = { h: 62, fab: 62 };
/** Create FAB size in the bar — also the Questions list photo. */
export const FAB_SIZE = EXP.fab;
const GAP = 10;
const SIDE = 16;
const BOTTOM = 84; // bottom edge of the bar inside the 110-tall area (the 34 home-indicator band sits under it)
const AREA_H = 110;
/** How far the bar slides down when fully hidden: bar height + bottom safe area. */
const hideDistance = (bottomInset: number) => EXP.h + bottomInset;

type Props = {
  active: TabKey;
  /** 0 = shown … 1 = hidden — from useTabBarScroll (follows the scroll, snaps to the nearer end). */
  progress?: SharedValue<number>;
  onTab: (k: TabKey) => void;
  onCreate: () => void;
};

export function TabBar({ active, progress, onTab, onCreate }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { color } = useTheme();
  const { t } = useTranslation();
  const still = useSharedValue(0);
  const p = progress ?? still;
  const max = hideDistance(insets.bottom);

  const barW = width - SIDE * 2 - EXP.fab - GAP;
  // The bar slides as one piece; once mostly hidden it lets touches through to the content behind it.
  const slide = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(p.value, [0, 1], [0, max], Extrapolation.CLAMP) }],
    pointerEvents: p.value > 0.5 ? 'none' : 'box-none',
  }));

  return (
    <Animated.View pointerEvents="box-none" style={[styles.area, { bottom: insets.bottom - 34 }, slide]}>
      <View style={[styles.bar, elevation['Elevation/3 Float'], { borderColor: color('border/default'), width: barW }]}>
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: color('glass/surface') }]} />
        <View style={styles.items}>
          {TABS.map((tab) => (
            <TabItem
              key={tab.key}
              tab={tab}
              label={t(`home.tabs.${tab.key}`)}
              active={tab.key === active}
              onPress={() => { if (tab.key !== active) armTabEnter(); REVEAL.get(p)?.(); onTab(tab.key); }}
            />
          ))}
        </View>
      </View>
      <View style={[styles.fab, elevation['Elevation/3 Float'], { backgroundColor: color('bg/kick'), borderColor: color('border/default'), left: width - SIDE - EXP.fab }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('home.tabs.share')} onPress={onCreate} style={styles.center}>
          <Plus size={24} strokeWidth={2} absoluteStrokeWidth color={color('static/white')} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

function TabGlyph({ tab, active }: { tab: (typeof TABS)[number]; active: boolean }) {
  const { color } = useTheme();
  const Glyph = tab.icon;
  const dusk = gradients['Gradient/Dusk'];
  return active ? (
    <Glyph size={22} strokeWidth={iconStroke(22)} absoluteStrokeWidth color={`url(#dusk-${tab.key})`}>
      <Defs>
        <LinearGradient id={`dusk-${tab.key}`} x1="0" y1="0" x2="1" y2="1">
          {dusk.map((s) => <Stop key={s.offset} offset={s.offset} stopColor={s.color} />)}
        </LinearGradient>
      </Defs>
    </Glyph>
  ) : (
    <Glyph size={22} strokeWidth={iconStroke(22)} absoluteStrokeWidth color={color('fg/default')} />
  );
}

function TabItem({ tab, label, active, onPress }: { tab: (typeof TABS)[number]; label: string; active: boolean; onPress: () => void }) {
  const { color } = useTheme();
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.item, active && { backgroundColor: color('bg/accent-subtle') }]}
    >
      <TabGlyph tab={tab} active={active} />
      <Text variant="Nav label" color={active ? 'fg/accent' : 'fg/default'} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

/** Pause after the last scroll event before the bar snaps to the nearer end. */
const IDLE_MS = 140;
const SNAP = { damping: 20, stiffness: 220 };
/** Reduce Motion: no finger-following, just a short timed snap. */
const SNAP_REDUCED = { duration: 200, easing: Easing.out(Easing.cubic) };
/** Each bar's "show now" (resets the hook's own bookkeeping too) — the TabBar calls it on a tab tap. */
const REVEAL = new WeakMap<SharedValue<number>, () => void>();

/**
 * YouTube-style tab bar: scrolling down slides it down by the finger's travel (fully hidden after bar height +
 * bottom safe area), scrolling up slides it back at the same rate; when the scroll stops for 140 ms it springs to the
 * nearer end. Always shown at the top, at the bottom, on a tab tap and when the screen gains focus.
 * Call `onY(contentOffset.y, contentSize.height - layoutMeasurement.height)`.
 */
export function useTabBarScroll() {
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const progress = useSharedValue(0);
  const max = hideDistance(insets.bottom);
  /** Hidden amount 0…1 the finger has driven the bar to (in Reduce Motion: virtual, only used to pick the end). */
  const hidden = useRef(0);
  /** A snap animation may be running — resume following from where it is, not from its target. */
  const snapping = useRef(false);
  const last = useRef(0);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearIdle = () => { if (idle.current) { clearTimeout(idle.current); idle.current = null; } };
  useEffect(() => clearIdle, []);

  const snapTo = useCallback((to: 0 | 1) => {
    hidden.current = to;
    snapping.current = true;
    progress.value = reduce ? withTiming(to, SNAP_REDUCED) : withSpring(to, SNAP);
  }, [progress, reduce]);

  const show = useCallback(() => {
    clearIdle();
    if (hidden.current !== 0 || snapping.current) snapTo(0);
  }, [snapTo]);
  REVEAL.set(progress, show);

  // Entering (or coming back to) the screen: bar visible, no animation.
  useFocusEffect(useCallback(() => {
    clearIdle();
    hidden.current = 0;
    snapping.current = false;
    progress.value = 0;
  }, [progress]));

  const onY = useCallback((y: number, maxY?: number) => {
    const dy = y - last.current;
    last.current = y;
    clearIdle();
    if (y <= 0 || (maxY != null && maxY > 0 && y >= maxY - 1)) { show(); return; }
    if (reduce) {
      const was = hidden.current >= 0.5 ? 1 : 0;
      hidden.current = Math.min(1, Math.max(0, hidden.current + dy / max));
      const now = hidden.current >= 0.5 ? 1 : 0;
      if (now !== was) {
        progress.value = withTiming(now, SNAP_REDUCED);
      }
      return;
    }
    if (snapping.current) {
      snapping.current = false;
      hidden.current = Math.min(1, Math.max(0, progress.value));
    }
    const next = Math.min(1, Math.max(0, hidden.current + dy / max));
    if (next !== hidden.current) {
      hidden.current = next;
      progress.value = next;
    }
    idle.current = setTimeout(() => {
      idle.current = null;
      const v = hidden.current;
      if (v > 0 && v < 1) snapTo(v >= 0.5 ? 1 : 0);
    }, IDLE_MS);
  }, [max, progress, reduce, show, snapTo]);

  /** A programmatic jump (e.g. Community pager landing on another page) — move the baseline and show the bar. */
  const sync = useCallback((y: number) => { last.current = y; show(); }, [show]);
  return { progress, onY, sync };
}

const styles = StyleSheet.create({
  area: { position: 'absolute', left: 0, right: 0, height: AREA_H },
  bar: { position: 'absolute', left: SIDE, top: BOTTOM - EXP.h, height: EXP.h, borderRadius: radius.full, borderWidth: 0.5, overflow: 'hidden' },
  items: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  item: { flex: 1, height: 54, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', gap: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', top: BOTTOM - EXP.fab, width: EXP.fab, height: EXP.fab, borderRadius: radius.full, borderWidth: 0.5, overflow: 'hidden' },
});
