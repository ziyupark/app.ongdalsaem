import { X } from '../icons/ongdal';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { radius, space, useTheme } from '../../theme';
import { Icon } from '../Icon';
import { Text } from '../Text';

type Props = { step: number; total: number; onClose: () => void; action?: string; onAction?: () => void; actionDisabled?: boolean };

/** Flow Top Bar 132:4918 (44 high: x · "Step n of m" · action) + Step Progress 132:4957 (4 high bars, gap 6), px 20, gap 4. */
export function FlowTopBar({ step, total, onClose, action, onAction, actionDisabled }: Props) {
  const { color } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.group}>
      <View style={styles.bar}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} hitSlop={space[10]} onPress={onClose} style={styles.side}>
          <Icon icon={X} size={22} />
        </Pressable>
        <Text variant="Body/S Strong" color="fg/muted">{t('share.step', { n: step, total })}</Text>
        <View style={[styles.side, styles.right]}>
          {action ? (
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!actionDisabled }} disabled={actionDisabled} hitSlop={space[10]} onPress={onAction}>
              <Text variant="Body/M Strong" color={actionDisabled ? 'fg/disabled' : 'fg/accent'}>{action}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <View style={styles.progress}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.seg, { backgroundColor: color(i < step ? 'bg/primary' : 'bg/emphasis') }]} />
        ))}
      </View>
    </View>
  );
}

/** Section head: Title/S + Caption hint (Type · Meal · Mood · Recipe · Sharing). */
export function FieldHead({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.head}>
      <Text variant="Title/S">{title}</Text>
      {hint ? <Text variant="Caption" color="fg/muted">{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { paddingHorizontal: space[20], gap: space[4] },
  bar: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  side: { minWidth: 60, justifyContent: 'center' },
  right: { alignItems: 'flex-end' },
  progress: { flexDirection: 'row', gap: space[6] },
  seg: { flex: 1, height: 4, borderRadius: radius.xs / 2 },
  head: { flexDirection: 'row', alignItems: 'baseline', gap: space[6] },
});
