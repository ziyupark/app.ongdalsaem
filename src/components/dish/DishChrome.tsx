import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { space, useTheme, withAlpha } from '../../theme';

/** Action bar — bg/default 0 → 100 % at 35 %, padding 28 20 34, gap 10. */
export function DishActionBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { color } = useTheme();
  const bg = color('bg/default');
  return (
    <LinearGradient
      colors={[withAlpha(bg, 0), bg, bg]}
      locations={[0, 0.35, 1]}
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space[20]) }]}
    >
      {children}
    </LinearGradient>
  );
}

/** Height the scroll content keeps free under the action bar (28 + 56 + bottom inset + breathing room). */
export function useActionBarInset() {
  const insets = useSafeAreaInsets();
  return 28 + 56 + Math.max(insets.bottom, space[20]) + space[24];
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: space[10], paddingTop: 28, paddingHorizontal: space[20] },
});
