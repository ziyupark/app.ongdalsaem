import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { radius, space, useTheme } from '../theme';
import { AcornIcon } from './AcornIcon';
import { Text } from './Text';

/** Toast 12:264 — bg/inverse, radius 16, padding 12 16, acorn 18 · Body/S Strong · action (bg/kick text). Auto-hides after `duration` ms (default 4 s); `onPress` makes the whole toast tappable. */
export function Toast({ visible, message, action, onAction, onPress, onHide, bottom, duration = 4000 }: {
  visible: boolean; message: string; action?: string; onAction?: () => void; onPress?: () => void; onHide: () => void; bottom: number; duration?: number;
}) {
  const { color } = useTheme();
  useEffect(() => {
    if (!visible) return;
    const h = setTimeout(onHide, duration);
    return () => clearTimeout(h);
  }, [visible, onHide, duration]);
  if (!visible) return null;
  return (
    <Animated.View entering={FadeInDown.duration(200)} exiting={FadeOutDown.duration(150)} style={[styles.wrap, { bottom }]} accessibilityLiveRegion="polite">
      <Pressable disabled={!onPress} onPress={onPress} accessibilityRole={onPress ? 'button' : undefined} style={[styles.toast, { backgroundColor: color('bg/inverse') }]}>
      <AcornIcon size={18} color="fg/inverse" />
      <Text variant="Body/S Strong" color="fg/inverse" style={styles.flex}>{message}</Text>
      {action ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={space[8]}>
          <Text variant="Body/S Strong" style={{ color: color('bg/kick') }}>{action}</Text>
        </Pressable>
      ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: space[20], right: space[20] },
  toast: { flexDirection: 'row', alignItems: 'center', gap: space[10], paddingHorizontal: space[16], paddingVertical: space[12], borderRadius: radius.lg },
  flex: { flex: 1 },
});
