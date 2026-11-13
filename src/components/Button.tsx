import { BlurView } from 'expo-blur';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { elevation, radius, space, useTheme, type ColorToken } from '../theme';
import { Icon } from './Icon';
import { Text } from './Text';

type Variant = 'Primary' | 'Secondary' | 'Outline' | 'Ghost' | 'Kick' | 'Destructive' | 'Glass' | 'White';
type Size = 'L' | 'M' | 'S';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  disabled?: boolean;
  /** Server request in flight: dots instead of the label, button disabled (docs/04-screens/01 STATES). */
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  /** Small count pill right of the label (7.1 "Add to shopping" n) — bg/inverse · fg/inverse, radius full. */
  badge?: number;
};

// Button 6:192 — height L 56 / M 46 / S 36, radius full, Disabled = 40% opacity.
const SIZE = {
  L: { height: 56, paddingHorizontal: space[24], text: 'Button/L' as const, icon: 20 as const },
  M: { height: 46, paddingHorizontal: space[20], text: 'Button/M' as const, icon: 18 as const },
  S: { height: 36, paddingHorizontal: space[14], text: 'Button/M' as const, icon: 16 as const },
};
const TONE: Record<Variant, { bg?: ColorToken; fg: ColorToken; border?: ColorToken; borderWidth?: number }> = {
  Primary: { bg: 'bg/primary', fg: 'fg/on-primary' },
  Secondary: { bg: 'bg/muted', fg: 'fg/default' },
  Outline: { bg: 'bg/default', fg: 'fg/default', border: 'border/strong', borderWidth: 1.5 },
  Ghost: { fg: 'fg/default' },
  Kick: { bg: 'bg/kick', fg: 'fg/on-primary' },
  Destructive: { bg: 'bg/default', fg: 'fg/destructive', border: 'border/strong', borderWidth: 1 },
  // Glass: Blur/Glass M (16) under glass/fill + 1.5 glass/stroke-strong; White: static/white + Elevation/2.
  Glass: { fg: 'fg/on-primary', border: 'glass/stroke-strong', borderWidth: 1.5 },
  White: { bg: 'static/white', fg: 'fg/default' },
};

export function Button({ label, onPress, variant = 'Primary', size = 'L', icon, disabled, loading, style, accessibilityLabel, badge }: Props) {
  const { color } = useTheme();
  const s = SIZE[size];
  const tone = TONE[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { height: s.height, paddingHorizontal: s.paddingHorizontal, backgroundColor: tone.bg ? color(tone.bg) : 'transparent' },
        tone.border ? { borderWidth: tone.borderWidth ?? 1.5, borderColor: color(tone.border) } : null,
        variant === 'White' ? elevation['Elevation/2 Raised'] : null,
        variant === 'Glass' ? styles.clip : null,
        disabled && styles.disabled,
        pressed && !inactive && styles.pressed,
        style,
      ]}
    >
      {variant === 'Glass' ? <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} /> : null}
      {variant === 'Glass' ? <View style={[StyleSheet.absoluteFill, { backgroundColor: color('glass/fill') }]} /> : null}
      {loading ? (
        <View style={styles.dots} accessibilityElementsHidden>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, { backgroundColor: color(tone.fg) }]} />
          ))}
        </View>
      ) : (
        <>
          {icon ? <Icon icon={icon} size={s.icon} color={tone.fg} /> : null}
          <Text variant={s.text} color={tone.fg}>{label}</Text>
          {badge != null ? (
            <View style={[styles.badge, { backgroundColor: color('bg/inverse') }]}>
              <Text variant="Caption Strong" color="fg/inverse">{String(badge)}</Text>
            </View>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[8], borderRadius: radius.full },
  disabled: { opacity: 0.4 },
  clip: { overflow: 'hidden' },
  pressed: { opacity: 0.85 },
  dots: { flexDirection: 'row', gap: space[6] },
  badge: { minWidth: 20, height: 20, paddingHorizontal: space[6], borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  dot: { width: space[6], height: space[6], borderRadius: radius.full },
});
