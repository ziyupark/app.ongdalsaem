import { BlurView } from 'expo-blur';
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { blur, radius, space, useTheme } from '../theme';
import { Icon } from './Icon';
import { Text } from './Text';

/** IconButton · Glass (over photos) — 40 circle, glass/surface + background blur 8, icon 20. */
export function GlassIconButton({ icon, onPress, accessibilityLabel, ink }: { icon: LucideIcon; onPress?: () => void; accessibilityLabel: string; ink?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} hitSlop={space[4]} style={({ pressed }) => [pressed && { opacity: 0.8 }]}>
      <Glass style={styles.btn} ink={ink}>
        <Icon icon={icon} size={20} color={ink ? 'fg/on-primary' : 'fg/default'} />
      </Glass>
    </Pressable>
  );
}

/** Preview pill (8.3) — 40 high pill, padding 0 16, Caption Strong. `ink` = static/ink + Blur/Glass M, fg/on-primary. */
export function GlassPill({ label, ink }: { label: string; ink?: boolean }) {
  return (
    <Glass style={styles.pill} ink={ink}>
      <Text variant="Caption Strong" color={ink ? 'fg/on-primary' : 'fg/default'}>{label}</Text>
    </Glass>
  );
}

function Glass({ style, children, ink }: { style: object; children: ReactNode; ink?: boolean }) {
  const { color } = useTheme();
  return (
    <View style={[style, styles.clip]}>
      <BlurView intensity={(ink ? blur.M : blur.S) * 2} tint={ink ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: color(ink ? 'static/ink' : 'glass/surface') }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden', borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  btn: { width: 40, height: 40 },
  pill: { height: 40, paddingHorizontal: space[16] },
});
