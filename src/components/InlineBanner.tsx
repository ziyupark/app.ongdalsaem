import { StyleSheet, View } from 'react-native';
import { AlertCircle, WifiOff } from './icons/ongdal';
import { Icon } from './Icon';
import { Text } from './Text';
import { radius, space, useTheme } from '../theme';

/**
 * Inline Banner (Figma 136:5108) — icon 18 + one line of Body/S Strong.
 * Neutral (6.4 / 6.4b offline): pill bg/inverse · fg/inverse · `wifi-off` · height 42 · padding 12 16 · gap 10.
 * Warning (8.4 upload failed): no fill · fg/destructive · `alert-circle` · gap 8.
 */
export function InlineBanner({ text, tone = 'Neutral' }: { text: string; tone?: 'Neutral' | 'Warning' }) {
  const { color } = useTheme();
  const neutral = tone === 'Neutral';
  const fg = neutral ? 'fg/inverse' : 'fg/destructive';
  return (
    <View style={[styles.row, neutral ? [styles.neutral, { backgroundColor: color('bg/inverse') }] : styles.warning]}>
      <Icon icon={neutral ? WifiOff : AlertCircle} size={18} color={fg} />
      <Text variant="Body/S Strong" color={fg} style={styles.flex}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  neutral: { gap: space[10], minHeight: space[42], paddingHorizontal: space[16], paddingVertical: space[12], borderRadius: radius.full },
  warning: { gap: space[8] },
  flex: { flex: 1 },
});
