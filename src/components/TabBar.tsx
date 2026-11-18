import { BlurView } from 'expo-blur';
import { router, useFocusEffect, type Href } from 'expo-router';
import { Home, Plus, Timer, User, Users, type LucideIcon } from 'lucide-react-native';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing, Extrapolation, interpolate, makeMutable, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Defs, LinearGradient, Stop } from 'react-native-svg';
import { elevation, gradients, iconStroke, radius, useTheme, withAlpha } from '../theme';
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
 * (see useTabBarScroll). Active tab = Gradient/Dusk icon, fg/accent label on a bg/accent-subtle pill; on a tab switch
 * the pill slides over to the new tab (220 ms ease-out expo, mostly there in ~70 ms; Reduce Motion: jumps). The pill is slightly see-through
 * (82 %) with a glass highlight edge and Elevation/1 so it reads as a raised glass chip. The screens themselves swap instantly.
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

const HREF: Record<TabKey, '/home' | '/community' | '/timer' | '/profile'> = {
  home: '/home', community: '/community', timer: '/timer', profile: '/profile',
};

/** Whether the tabs are the top screen of the root stack — set by app/(tabs)/_layout.tsx. */
let tabsOnTop = false;
export function setTabsOnTop(on: boolean) {
  tabsOnTop = on;
}

/**
 * Go to a tab. The four tabs live in one Tabs navigator that keeps each tab's state (scroll, loaded data).
 * Tabs on top: switch tab (navigate). A screen pushed on top of them: pop back to the tabs on that tab (dismissTo), so
 * no second copy of the tabs is stacked. (dismissTo alone does nothing inside the tabs — the tab router has no POP_TO.)
 */
export function goTab(k: TabKey, params?: Record<string, string>) {
  const href = (params ? { pathname: HREF[k], params } : HREF[k]) as Href;
  if (tabsOnTop) router.navigate(href);
  else router.dismissTo(href);
}

/** Pill position, shared by every TabBar (each screen draws its own) so it can slide on from the screen being left. */
const pillX = makeMutable(-1);
/** The tab the pill is heading to — a TabBar that gains focus with a different active tab just snaps the pill. */
let pillGoal = -1;
/** Front-loaded so the pill lands with the (instant) screen swap: ~90 % of the way in the first ~70 ms. */
const PILL = { duration: 220, easing: Easing.out(Easing.exp) };
const ITEMS_PAD = 4;

type Props = {
  active: TabKey;
  /** 0 = shown … 1 = hidden — from useTabBarScroll (follows the scroll, snaps by the last scroll direction). */
  progress?: SharedValue<number>;
  /** Also called for the tab that is already active (re-tap: the screen scrolls back to the top). */
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
  const reduce = useReducedMotion();
  const index = TABS.findIndex((x) => x.key === active);

  useFocusEffect(useCallback(() => {
    if (pillGoal !== index) {
      pillGoal = index;
      pillX.value = index;
    }
  }, [index]));

  const barW = width - SIDE * 2 - EXP.fab - GAP;
  // The bar slides as one piece; once mostly hidden it lets touches through to the content behind it.
  const slide = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(p.value, [0, 1], [0, max], Extrapolation.CLAMP) }],
    pointerEvents: p.value > 0.5 ? 'none' : 'box-none',
  }));
  const itemW = (barW - ITEMS_PAD * 2) / TABS.length;
  const pill = useAnimatedStyle(() => ({
    transform: [{ translateX: (pillX.value < 0 ? index : pillX.value) * itemW }],
  }));
  const press = (k: TabKey, i: number) => {
    REVEAL.get(p)?.();
    if (i !== index) {
      pillGoal = i;
      pillX.value = reduce ? i : withTiming(i, PILL);
    }
    onTab(k);
  };

  return (
    <Animated.View pointerEvents="box-none" style={[styles.area, { bottom: insets.bottom - 34 }, slide]}>
      <View style={[styles.bar, elevation['Elevation/3 Float'], { borderColor: color('border/default'), width: barW }]}>
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: color('glass/surface') }]} />
        <View style={styles.items}>
          <Animated.View
            pointerEvents="none"
            style={[styles.pill, elevation['Elevation/1 Low'], { width: itemW, backgroundColor: withAlpha(color('bg/accent-subtle'), 0.82), borderColor: color('glass/stroke-strong') }, pill]}
          />
          {TABS.map((tab, i) => (
            <TabItem
              key={tab.key}
              tab={tab}
              label={t(`home.tabs.${tab.key}`)}
              active={tab.key === active}
              i={i}
              activeIndex={index}
              onPress={() => press(tab.key, i)}
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

type ItemProps = { tab: (typeof TABS)[number]; label: string; active: boolean; i: number; activeIndex: number; onPress: () => void };

/**
 * Both looks are drawn on top of each other and cross-fade with the pill's position (UI thread), so the Dusk icon and
 * fg/accent label arrive together with the pill instead of waiting for the next tab's screen to render.
 */
function TabItem({ tab, label, active, i, activeIndex, onPress }: ItemProps) {
  const on = useAnimatedStyle(() => {
    const x = pillX.value < 0 ? activeIndex : pillX.value;
    return { opacity: interpolate(Math.abs(x - i), [0, 1], [1, 0], Extrapolation.CLAMP) };
  });
  const off = useAnimatedStyle(() => {
    const x = pillX.value < 0 ? activeIndex : pillX.value;
    return { opacity: interpolate(Math.abs(x - i), [0, 1], [0, 1], Extrapolation.CLAMP) };
  });
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={styles.item}
    >
      <Animated.View style={[styles.look, off]}>
        <TabGlyph tab={tab} active={false} />
        <Text variant="Nav label" color="fg/default" numberOfLines={1}>{label}</Text>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, styles.look, on]}>
        <TabGlyph tab={tab} active />
        <Text variant="Nav label" color="fg/accent" numberOfLines={1}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

/** Pause after the last scroll event before the bar snaps (in the last scroll direction). */
const IDLE_MS = 140;
const SNAP = { damping: 20, stiffness: 220 };
/** Reduce Motion: no finger-following, just a short timed snap. */
const SNAP_REDUCED = { duration: 200, easing: Easing.out(Easing.cubic) };
/** Each bar's "show now" (resets the hook's own bookkeeping too) — the TabBar calls it on a tab tap. */
const REVEAL = new WeakMap<SharedValue<number>, () => void>();

/**
 * YouTube-style tab bar: scrolling down slides it down by the finger's travel (fully hidden after bar height +
 * bottom safe area), scrolling up slides it back at the same rate; when the scroll stops for 140 ms it springs to the
 * end the last scroll was heading to (up, even a little → shown; down → hidden), like YouTube / Chrome. Always shown at the top, at the bottom, on a tab tap and when the screen gains focus.
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
  /** Direction of the latest scroll step: 1 = down (hide), 0 = up (show). */
  const dir = useRef<0 | 1>(0);
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
    if (dy !== 0) dir.current = dy > 0 ? 1 : 0;
    const settle = () => {
      idle.current = setTimeout(() => {
        idle.current = null;
        if (hidden.current !== dir.current) snapTo(dir.current);
      }, IDLE_MS);
    };
    if (reduce) {
      const was = hidden.current >= 0.5 ? 1 : 0;
      hidden.current = Math.min(1, Math.max(0, hidden.current + dy / max));
      const now = hidden.current >= 0.5 ? 1 : 0;
      if (now !== was) {
        progress.value = withTiming(now, SNAP_REDUCED);
      }
      settle();
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
    settle();
  }, [max, progress, reduce, show, snapTo]);

  /** A programmatic jump (e.g. Community pager landing on another page) — move the baseline and show the bar. */
  const sync = useCallback((y: number) => { last.current = y; show(); }, [show]);
  return { progress, onY, sync };
}

const styles = StyleSheet.create({
  area: { position: 'absolute', left: 0, right: 0, height: AREA_H },
  bar: { position: 'absolute', left: SIDE, top: BOTTOM - EXP.h, height: EXP.h, borderRadius: radius.full, borderWidth: 0.5, overflow: 'hidden' },
  items: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: ITEMS_PAD },
  pill: { position: 'absolute', left: ITEMS_PAD, top: '50%', marginTop: -27, height: 54, borderRadius: radius.full, borderWidth: 0.5 },
  item: { flex: 1, height: 54, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  look: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', top: BOTTOM - EXP.fab, width: EXP.fab, height: EXP.fab, borderRadius: radius.full, borderWidth: 0.5, overflow: 'hidden' },
});
