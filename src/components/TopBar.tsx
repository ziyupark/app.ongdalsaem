import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { radius, space } from '../theme';
import { Icon } from './Icon';
import { Text } from './Text';

type Props = { title?: string; onBack: () => void; backLabel: string };

/** TopBar 12:224 · Type=Inline, Show action Off — 52 high, px 12, back 40 · title (Title/S) · empty 40 slot. */
export function TopBar({ title, onBack, backLabel }: Props) {
  return (
    <View style={styles.bar}>
      <Pressable accessibilityRole="button" accessibilityLabel={backLabel} hitSlop={space[4]} onPress={onBack} style={styles.btn}>
        <Icon icon={ChevronLeft} size={22} />
      </Pressable>
      <Text variant="Title/S" numberOfLines={1}>{title ?? ''}</Text>
      <View style={styles.btn} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space[12] },
  btn: { width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
});
