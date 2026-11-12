import { BlurView } from 'expo-blur';
import { Home, Plus, Timer, User, Users, type LucideIcon } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing, Extrapolation, interpolate, useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Defs, LinearGradient, Stop } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
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
 * Expanded: glass capsule 62 high with 4 tabs (icon 22 + Nav label) + a separate 62 "Share a dish" circle, gap 10.
 * Minimized (scrolling down, Apple-style): the capsule shrinks to a 48 glass circle holding only the current tab's
 * icon, the + shrinks to 48 — tap the small circle to open the bar again. Active tab = Gradient/Dusk icon,
 * fg/accent label on a bg/accent-subtle pill.
 */
const EXP = { h: 62, fab: 62 };
/** Create FAB size in the expanded bar — also the Questions list photo. */
export const FAB_SIZE = EXP.fab;
const MIN = { h: 48, fab: 48 };
const GAP = 10;
const SIDE = 16;
const BOTTOM = 84; // bottom edge of the bar inside the 110-tall area (the 34 home-indicator band sits under it)
const AREA_H = 110;

type Props = {
  active: TabKey;
  /** 0 = expanded … 1 = minimized — from useTabBarScroll (follows the scroll, settles to the nearer end). */
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
  const [mini, setMini] = useState(false);
  useAnimatedReaction(() => p.value > 0.5, (now, prev) => { if (now !== prev) scheduleOnRN(setMini, now); });

  const barW = width - SIDE * 2 - EXP.fab - GAP;
  const bar = useAnimatedStyle(() => {
    const h = interpolate(p.value, [0, 1], [EXP.h, MIN.h], Extrapolation.CLAMP);
    return { width: interpolate(p.value, [0, 1], [barW, MIN.h], Extrapolation.CLAMP), height: h, top: BOTTOM - h };
  });
  const fab = useAnimatedStyle(() => {
    const s = interpolate(p.value, [0, 1], [EXP.fab, MIN.fab], Extrapolation.CLAMP);
    return { width: s, height: s, top: BOTTOM - s, left: width - SIDE - s };
  });
  const row = useAnimatedStyle(() => ({ opacity: interpolate(p.value, [0, 0.55], [1, 0], Extrapolation.CLAMP) }));
  const dot = useAnimatedStyle(() => ({ opacity: interpolate(p.value, [0.45, 1], [0, 1], Extrapolation.CLAMP) }));
  const plus = useAnimatedStyle(() => ({ transform: [{ scale: interpolate(p.value, [0, 1], [1, 0.84], Extrapolation.CLAMP) }] }));

  const expand = () => {
    const goal = GOALS.get(p);
    if (goal) goal.current = 0;
    p.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) });
  };
  const Active = TABS.find((x) => x.key === active)!;

  return (
    <View pointerEvents="box-none" style={[styles.area, { bottom: insets.bottom - 34 }]}>
      <Animated.View style={[styles.bar, elevation['Elevation/3 Float'], { borderColor: color('border/default') }, bar]}>
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: color('glass/surface') }]} />
        {/* Expanded: the 4 tabs (they fade out as the capsule shrinks; the capsule clips them). */}
        <Animated.View pointerEvents={mini ? 'none' : 'box-none'} style={[styles.items, { width: barW }, row]}>
          {TABS.map((tab) => (
            <TabItem key={tab.key} tab={tab} label={t(`home.tabs.${tab.key}`)} active={tab.key === active} onPress={() => onTab(tab.key)} />
          ))}
        </Animated.View>
        {/* Minimized: only the current tab's icon; tap to open the bar again. */}
        <Animated.View pointerEvents={mini ? 'auto' : 'none'} style={[StyleSheet.absoluteFill, styles.center, dot]}>
          <Pressable accessibilityRole="button" accessibilityLabel={t(`home.tabs.${active}`)} onPress={expand} style={[StyleSheet.absoluteFill, styles.center]}>
            <TabGlyph tab={Active} active />
          </Pressable>
        </Animated.View>
      </Animated.View>
      <Animated.View style={[styles.fab, elevation['Elevation/3 Float'], { backgroundColor: color('bg/kick'), borderColor: color('border/default') }, fab]}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('home.tabs.share')} onPress={onCreate} style={styles.center}>
          <Animated.View style={plus}>
            <Plus size={24} strokeWidth={2} absoluteStrokeWidth color={color('static/white')} />
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
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

/** Scroll distance from expanded to minimized. */
const TRAVEL = 120;
/**
 * The bar trails the scroll instead of tracking it 1:1 — each scroll step eases toward the new target, so the shrink
 * lags a beat behind the finger like an afterimage (docs/05-behavior.md: 250 ms ease-out).
 */
const FOLLOW = { duration: 250, easing: Easing.out(Easing.cubic) };
const SETTLE = { duration: 320, easing: Easing.out(Easing.cubic) };
/** Where each bar is heading (the value it eases toward), so tapping the minimized bar open resets it too. */
const GOALS = new WeakMap<SharedValue<number>, { current: number }>();

/**
 * Apple-style tab bar: scrolling down minimizes it (following the scroll), scrolling up opens it again; if the scroll
 * stops half-way it settles to the nearer state. Always expanded at the top. Call `onY(contentOffset.y)`.
 */
export function useTabBarScroll() {
  const progress = useSharedValue(0);
  const target = useRef(0);
  GOALS.set(progress, target);
  const last = useRef(0);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (settle.current) clearTimeout(settle.current); }, []);
  const onY = useCallback((y: number) => {
    const dy = y - last.current;
    last.current = y;
    if (settle.current) clearTimeout(settle.current);
    if (y <= 0) {
      target.current = 0;
      progress.value = withTiming(0, SETTLE);
      return;
    }
    const next = Math.min(1, Math.max(0, target.current + dy / TRAVEL));
    if (next !== target.current) {
      target.current = next;
      progress.value = withTiming(next, FOLLOW);
    }
    settle.current = setTimeout(() => {
      const v = target.current;
      if (v > 0 && v < 1) {
        target.current = v > 0.5 ? 1 : 0;
        progress.value = withTiming(target.current, SETTLE);
      }
    }, 140);
  }, [progress]);
  return { progress, onY };
}

const styles = StyleSheet.create({
  area: { position: 'absolute', left: 0, right: 0, height: AREA_H },
  bar: { position: 'absolute', left: SIDE, borderRadius: radius.full, borderWidth: 0.5, overflow: 'hidden' },
  items: { position: 'absolute', left: 0, top: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  item: { flex: 1, height: 54, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', gap: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', borderRadius: radius.full, borderWidth: 0.5, overflow: 'hidden' },
});
