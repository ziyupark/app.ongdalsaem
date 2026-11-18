import type { LucideIcon } from 'lucide-react-native';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { radius, space, useTheme } from '../theme';
import type { WashInk } from '../theme/washInk';
import { Icon } from './Icon';
import { Text } from './Text';

export type UnderlineTabItem<K extends string> = { key: K; label: string; icon?: LucideIcon };

type Box = { x: number; w: number };

/**
 * X-style tab row: a full-width 1 px border/default hairline at the bottom, and a 3 px fg/default bar under the
 * selected tab — as wide as its label (or icon), sitting on the same baseline — that slides to the new tab (200 ms).
 * `style` = outer (full-width) box; `contentStyle` = the row of tabs (padding / gap).
 * `ink` = colours over a mood wash (strong / muted instead of fg/default / fg/muted).
 * `progress` = a pager's position in tabs (0 … items.length − 1, fractional mid-swipe): the bar follows it — position and
 * width blend between the two tabs — instead of sliding on `value` changes.
 */
export function UnderlineTabs<K extends string>({ items, value, onChange, style, contentStyle, ink, progress }: {
  items: UnderlineTabItem<K>[];
  value: K;
  onChange: (k: K) => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  ink?: WashInk | null;
  progress?: SharedValue<number>;
}) {
  const { color } = useTheme();
  const tabs = useRef<Partial<Record<K, Box>>>({});
  const labels = useRef<Partial<Record<K, Box>>>({});
  const placed = useRef(false);
  const x = useSharedValue(0);
  const w = useSharedValue(0);
  // Pager mode: every tab's bar box (x, w) in item order.
  const boxes = useSharedValue<Box[]>([]);
  const keys = items.map((it) => it.key).join('|');

  const placeAll = useCallback(() => {
    const all: Box[] = [];
    for (const k of keys.split('|') as K[]) {
      const tab = tabs.current[k];
      const label = labels.current[k];
      if (!tab || !label) return;
      all.push({ x: tab.x + label.x, w: label.w });
    }
    boxes.value = all;
  }, [keys, boxes]);

  const place = useCallback(() => {
    const tab = tabs.current[value];
    const label = labels.current[value];
    if (!tab || !label) return;
    const nx = tab.x + label.x;
    if (!placed.current) {
      placed.current = true;
      x.value = nx;
      w.value = label.w;
    } else {
      x.value = withTiming(nx, { duration: 200 });
      w.value = withTiming(label.w, { duration: 200 });
    }
  }, [value, x, w]);

  useEffect(() => { if (!progress) place(); }, [place, progress]);

  const bar = useAnimatedStyle(() => {
    const b = boxes.value;
    if (progress && b.length > 1) {
      const idx = b.map((_, i) => i);
      return {
        width: interpolate(progress.value, idx, b.map((v) => v.w), Extrapolation.CLAMP),
        transform: [{ translateX: interpolate(progress.value, idx, b.map((v) => v.x), Extrapolation.CLAMP) }],
      };
    }
    return { width: w.value, transform: [{ translateX: x.value }] };
  });

  const measure = (store: typeof tabs, k: K) => (e: LayoutChangeEvent) => {
    const { x: lx, width } = e.nativeEvent.layout;
    store.current[k] = { x: lx, w: width };
    if (progress) placeAll();
    else if (k === value) place();
  };

  const strong = ink?.strong ?? 'fg/default';
  const muted = ink?.muted ?? 'fg/muted';

  return (
    <View style={style}>
      <View style={[styles.hairline, { backgroundColor: color('border/default') }]} />
      <View style={[styles.row, contentStyle]}>
        {items.map((it) => {
          const on = it.key === value;
          return (
            <Pressable
              key={it.key}
              accessibilityRole="tab"
              accessibilityLabel={it.label}
              accessibilityState={{ selected: on }}
              onPress={() => onChange(it.key)}
              onLayout={measure(tabs, it.key)}
              style={styles.tab}
            >
              <View onLayout={measure(labels, it.key)}>
                {it.icon ? (
                  <Icon icon={it.icon} size={22} color={on ? strong : muted} />
                ) : (
                  <Text variant={on ? 'Body/M Strong' : 'Body/M'} color={on ? strong : muted}>{it.label}</Text>
                )}
              </View>
            </Pressable>
          );
        })}
        <Animated.View pointerEvents="none" style={[styles.bar, { backgroundColor: color(strong) }, bar]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // border/default at 30 % so the hairline doesn't glare over the mood wash.
  hairline: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, opacity: 0.3 },
  row: { flexDirection: 'row' },
  tab: { height: 43, paddingTop: space[10], paddingBottom: space[12], paddingHorizontal: space[2], alignItems: 'center', justifyContent: 'center' },
  bar: { position: 'absolute', left: 0, bottom: 0, height: 3, borderRadius: radius.full },
});
