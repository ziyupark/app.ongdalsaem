import { Image } from 'expo-image';
import { Camera } from './icons/ongdal';
import { Pressable, StyleSheet, View } from 'react-native';
import { radius, useTheme } from '../theme';
import { Icon } from './Icon';
import { Text } from './Text';

type Props = { name: string; photoUri?: string; onPress: () => void; accessibilityLabel: string };

/**
 * Avatar edit 96×96 (docs/02-components.md Avatar): Avatar 88 at (4, 4) + camera badge 32 at (64, 64), no clipping.
 * Without a photo the avatar shows the first letter of the display name (Title/L, fg/accent on bg/accent-subtle).
 */
export function AvatarEdit({ name, photoUri, onPress, accessibilityLabel }: Props) {
  const { color } = useTheme();
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={styles.box}>
      <View style={[styles.avatar, { backgroundColor: color('bg/accent-subtle'), borderColor: color('bg/subtle') }]}>
        <Text variant="Title/L" color="fg/accent">{initial}</Text>
        {photoUri ? <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
      </View>
      <View style={[styles.badge, { backgroundColor: color('bg/primary'), borderColor: color('bg/default') }]}>
        <Icon icon={Camera} size={16} color="fg/on-primary" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { width: 96, height: 96 },
  avatar: { position: 'absolute', left: 4, top: 4, width: 88, height: 88, borderRadius: radius.full, borderWidth: 1.2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', left: 64, top: 64, width: 32, height: 32, borderRadius: radius.lg, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
