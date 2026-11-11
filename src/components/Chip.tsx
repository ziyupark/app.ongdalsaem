import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';
import { radius, space, useTheme } from '../theme';
import { Icon } from './Icon';
import { Text } from './Text';

type Props = {
  label: string;
  selected?: boolean;
  /** Icon=Yes (18, gap 8). */
  icon?: LucideIcon;
  /** 'add' = Chip · Add mood (dashed border/focus, fg/accent). */
  variant?: 'default' | 'add' | 'glass';
  onPress?: () => void;
  onLongPress?: () => void;
  /** Read-only tag (7.1 dish tags). */
  static?: boolean;
};

/**
 * Chip 6:245 — 36 high, padding 0 16, radius full.
 * Default = bg/subtle + 1px border/strong · Selected = bg/inverse + fg/inverse · Add = bg/subtle + 1px dashed border/focus, fg/accent.
 */
export function Chip({ label, selected, icon, variant = 'default', onPress, onLongPress, static: readOnly }: Props) {
  const { color } = useTheme();
  const add = variant === 'add';
  const glass = variant === 'glass';
  const fg = selected || glass ? 'fg/inverse' : add ? 'fg/accent' : 'fg/default';
  return (
    <Pressable
      accessibilityRole={readOnly ? 'text' : 'button'}
      accessibilityState={readOnly ? undefined : { selected: !!selected }}
      disabled={readOnly}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.chip,
        selected
          ? { backgroundColor: color('bg/inverse') }
          : glass
          ? { backgroundColor: color('glass/fill-strong'), borderWidth: 1, borderColor: color('glass/stroke') }
          : { backgroundColor: color('bg/subtle'), borderWidth: 1, borderColor: color(add ? 'border/focus' : 'border/strong'), borderStyle: add ? 'dashed' : 'solid' },
        pressed && !readOnly && { opacity: 0.8 },
      ]}
    >
      {icon ? <Icon icon={icon} size={18} color={fg} /> : null}
      <Text variant="Body/M" color={fg}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { height: 36, paddingHorizontal: space[16], borderRadius: radius.full, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[8] },
});
