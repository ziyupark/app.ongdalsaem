import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { elevation, iconRing, radius, useTheme } from '../theme';
import { Icon } from './Icon';

/** IconButton 6:217 · Style=Soft, Size=M — 40 circle, bg/subtle + 0.22 border/default, Elevation/1. Optional unread dot (6, fg/accent).
 * `bare`: icon only — same 40 tap area, no fill · ring · shadow. */
export function IconButton({ icon, onPress, accessibilityLabel, dot, bare }: { icon: LucideIcon; onPress?: () => void; accessibilityLabel: string; dot?: boolean; bare?: boolean }) {
  const { color } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.btn, bare ? styles.bare : [elevation['Elevation/1 Low'], { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }], pressed && { opacity: bare ? 0.5 : 0.8 }]}
    >
      <Icon icon={icon} size={20} />
      {dot ? <View style={[styles.dot, { backgroundColor: color('fg/accent') }]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: 40, height: 40, borderRadius: radius.full, borderWidth: iconRing, alignItems: 'center', justifyContent: 'center' },
  bare: { borderWidth: 0 },
  dot: { position: 'absolute', top: 8, right: 9, width: 6, height: 6, borderRadius: radius.full },
});
