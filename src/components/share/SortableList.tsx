import * as Haptics from 'expo-haptics';
import { useEffect, useLayoutEffect, type ReactNode } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { elevation } from '../../theme';

/** Wraps a row (or just its ⋮⋮ handle) so pressing-and-holding it picks the row up. */
export type HandleWrap = (node: ReactNode) => ReactNode;

type Shared = {
  active: SharedValue<number>;
  target: SharedValue<number>;
  dy: SharedValue<number>;
  heights: SharedValue<number[]>;
};

const HOLD_MS = 250;
const SHIFT_MS = 160;
const LIFT = elevation['Elevation/2 Raised'];

/**
 * 8.2a drag-to-reorder list (rows of any height). Hold the handle, drag, release —
 * the other rows slide out of the way and `onReorder(from, to)` fires once on drop.
 * Plain column, so it lives happily inside the screen's ScrollView.
 */
export function SortableList<T>({
  data,
  keyOf,
  renderItem,
  onReorder,
  onDragChange,
  activeBackground,
}: {
  data: T[];
  keyOf: (item: T, index: number) => string;
  /** `handle` wraps the grip icon; pass the bare icon instead to make a row not draggable. */
  renderItem: (item: T, index: number, handle: HandleWrap) => ReactNode;
  onReorder: (from: number, to: number) => void;
  /** true while a row is held — use it to pause the parent ScrollView. */
  onDragChange?: (dragging: boolean) => void;
  /** Fill behind the lifted row so it doesn't show the rows underneath. */
  activeBackground: string;
}) {
  const active = useSharedValue(-1);
  const target = useSharedValue(-1);
  const dy = useSharedValue(0);
  const heights = useSharedValue<number[]>([]);
  const s: Shared = { active, target, dy, heights };

  // New order rendered → drop the drag offsets in the same frame.
  useLayoutEffect(() => {
    active.value = -1;
    target.value = -1;
    dy.value = 0;
    if (heights.value.length > data.length) heights.value = heights.value.slice(0, data.length);
  }, [data, active, target, dy, heights]);

  const start = () => {
    onDragChange?.(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };
  const end = (from: number, to: number) => {
    onDragChange?.(false);
    if (from !== to) {
      Haptics.selectionAsync().catch(() => {});
      onReorder(from, to);
    } else {
      active.value = -1;
      target.value = -1;
      dy.value = 0;
    }
  };

  return (
    <View>
      {data.map((item, i) => (
        <SortableRow key={keyOf(item, i)} index={i} s={s} onStart={start} onEnd={end} activeBackground={activeBackground}>
          {(handle) => renderItem(item, i, handle)}
        </SortableRow>
      ))}
    </View>
  );
}

function SortableRow({
  index,
  s,
  onStart,
  onEnd,
  activeBackground,
  children,
}: {
  index: number;
  s: Shared;
  onStart: () => void;
  onEnd: (from: number, to: number) => void;
  activeBackground: string;
  children: (handle: HandleWrap) => ReactNode;
}) {
  const { active, target, dy, heights } = s;
  const idx = useSharedValue(index);
  useEffect(() => {
    idx.value = index;
  }, [index, idx]);

  const onLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (heights.value[index] === h) return;
    const next = heights.value.slice();
    next[index] = h;
    heights.value = next;
  };

  const pan = usePanGesture({
    activateAfterLongPress: HOLD_MS,
    onActivate: () => {
      'worklet';
      active.value = idx.value;
      target.value = idx.value;
      dy.value = 0;
      scheduleOnRN(onStart);
    },
    onUpdate: (e) => {
      'worklet';
      const me = idx.value;
      const hs = heights.value;
      dy.value = e.translationY;
      let top = 0;
      for (let k = 0; k < me; k++) top += hs[k] ?? 0;
      const center = top + e.translationY + (hs[me] ?? 0) / 2;
      let to = hs.length - 1;
      let acc = 0;
      for (let k = 0; k < hs.length; k++) {
        acc += hs[k] ?? 0;
        if (center < acc) {
          to = k;
          break;
        }
      }
      target.value = Math.max(0, to);
    },
    onDeactivate: () => {
      'worklet';
      const from = idx.value;
      const to = target.value;
      const hs = heights.value;
      let off = 0;
      if (to > from) for (let k = from + 1; k <= to; k++) off += hs[k] ?? 0;
      else for (let k = to; k < from; k++) off -= hs[k] ?? 0;
      dy.value = withTiming(off, { duration: 140 }, () => {
        scheduleOnRN(onEnd, from, to);
      });
    },
  });

  const style = useAnimatedStyle(() => {
    const a = active.value;
    const me = idx.value;
    if (a < 0) return { transform: [{ translateY: 0 }, { scale: 1 }], zIndex: 0, shadowOpacity: 0, backgroundColor: 'transparent' };
    if (a === me) return { transform: [{ translateY: dy.value }, { scale: 1.02 }], zIndex: 10, shadowOpacity: LIFT.shadowOpacity ?? 0.12, backgroundColor: activeBackground };
    const h = heights.value[a] ?? 0;
    const t = target.value;
    let shift = 0;
    if (a < me && me <= t) shift = -h;
    else if (t <= me && me < a) shift = h;
    return { transform: [{ translateY: withTiming(shift, { duration: SHIFT_MS }) }, { scale: 1 }], zIndex: 0, shadowOpacity: 0, backgroundColor: 'transparent' };
  });

  const handle: HandleWrap = (node) => (
    <GestureDetector gesture={pan}>
      <View collapsable={false}>
        {node}
      </View>
    </GestureDetector>
  );

  return (
    <Animated.View onLayout={onLayout} style={[{ shadowColor: LIFT.shadowColor, shadowOffset: LIFT.shadowOffset, shadowRadius: LIFT.shadowRadius }, style]}>
      {children(handle)}
    </Animated.View>
  );
}
