import { ImagePlus, RotateCcw, Trash2 } from '../icons/ongdal';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { radius, space, useTheme } from '../../theme';
import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { Text } from '../Text';

/** 8.4b Photo options (Figma 207:7065) — Try again · Replace · Remove · note · Cancel. */
export function PhotoOptionsSheet({ visible, index, total, onClose, onRetry, onReplace, onRemove }: {
  visible: boolean; index: number; total: number; onClose: () => void; onRetry: () => void; onReplace: () => void; onRemove: () => void;
}) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const row = (icon: typeof RotateCcw, label: string, onPress: () => void, destructive?: boolean) => (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, { backgroundColor: color('bg/default') }, pressed && { opacity: 0.85 }]}>
      <Icon icon={icon} size={20} color={destructive ? 'fg/destructive' : 'fg/default'} />
      <Text variant="Body/M" color={destructive ? 'fg/destructive' : 'fg/default'}>{label}</Text>
    </Pressable>
  );
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.head}>
        <Text variant="Title/M">{t('share.photoFailedTitle')}</Text>
        <Text variant="Body/S" color="fg/muted">{t('share.photoFailedSub', { n: index + 1, total })}</Text>
      </View>
      <View style={styles.box}>
        {row(RotateCcw, t('share.tryAgain'), onRetry)}
        {row(ImagePlus, t('share.replacePhoto'), onReplace)}
        {row(Trash2, t('share.removePhotoOption'), onRemove, true)}
      </View>
      <Text variant="Caption" color="fg/muted">{t('share.retryNote')}</Text>
      <Button label={t('common.cancel')} variant="Ghost" onPress={onClose} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  head: { gap: space[4] },
  box: { borderRadius: radius.lg, overflow: 'hidden' },
  row: { height: 56, flexDirection: 'row', alignItems: 'center', gap: space[14], paddingHorizontal: space[16] },
});
