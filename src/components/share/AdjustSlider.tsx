import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import { radius, useTheme } from '../../theme';

const MIN = -100;
const MAX = 100;
const THUMB = 24;
/** Values this close to 0 snap to it (with a tick), so "unchanged" is easy to find again. */
const SNAP = 4;

/**
 * 8.1a adjustment slider, −100 … 100 with 0 in the middle: the bar fills from the centre to the value.
 * Drag (or tap) anywhere on it.
 */
export function AdjustSlider({ value, onChange, accessibilityLabel }: { value: number; onChange: (v: number) => void; accessibilityLabel?: string }) {
  const { color } = useTheme();
  const [w, setW] = useState(0);
  const last = useRef(value);
  last.current = value;
  const h = useRef({ onChange, w });
  h.current = { onChange, w };

  const fromX = (x: number) => {
    const track = h.current.w - THUMB;
    if (track <= 0) return 0;
    let v = Math.round(MIN + ((x - THUMB / 2) / track) * (MAX - MIN));
    v = Math.min(MAX, Math.max(MIN, v));
    if (Math.abs(v) <= SNAP) v = 0;
    return v;
  };
  const set = (x: number) => {
    const v = fromX(x);
    if (v === last.current) return;
    if (v === 0) Haptics.selectionAsync().catch(() => {});
    last.current = v;
    h.current.onChange(v);
  };

  const pan = usePanGesture({
    runOnJS: true,
    minDistance: 0,
    onBegin: (e) => set(e.x),
    onUpdate: (e) => set(e.x),
  });

  const track = Math.max(0, w - THUMB);
  const at = (v: number) => THUMB / 2 + ((v - MIN) / (MAX - MIN)) * track;
  const mid = at(0);
  const pos = at(value);
  return (
    <GestureDetector gesture={pan}>
      <View
        style={styles.root}
        onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min: MIN, max: MAX, now: value }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => onChange(Math.min(MAX, Math.max(MIN, value + (e.nativeEvent.actionName === 'increment' ? 10 : -10))))}
      >
        <View style={[styles.track, { left: THUMB / 2, right: THUMB / 2, backgroundColor: color('bg/emphasis') }]} />
        <View style={[styles.track, { left: Math.min(mid, pos), width: Math.abs(pos - mid), backgroundColor: color('bg/primary') }]} />
        <View style={[styles.tick, { left: mid - 1, backgroundColor: color('border/strong') }]} />
        <View style={[styles.thumb, { left: pos - THUMB / 2, backgroundColor: color('bg/default'), borderColor: color('bg/primary') }]} />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: { height: 40, justifyContent: 'center' },
  track: { position: 'absolute', height: 4, top: 18, borderRadius: radius.xs / 2 },
  tick: { position: 'absolute', width: 2, height: 12, top: 14, borderRadius: 1 },
  thumb: { position: 'absolute', top: 8, width: THUMB, height: THUMB, borderRadius: radius.full, borderWidth: 2 },
});
