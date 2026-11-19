import type React from 'react';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { Copy, Image as ImageIcon, MoreHorizontal } from '../icons/ongdal';
import { useRef, useState } from 'react';
import { useLater } from '../../hooks/useLater';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, Share, StyleSheet, View } from 'react-native';
import { loadClipboard, loadSharing, loadViewShot } from '../../lib/optionalNative';
import { iconRing, radius, space, useTheme, type WeatherMood } from '../../theme';
import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { WeatherTag } from '../PhotoTags';
import { Text } from '../Text';

export type ShareTarget = { id: string; name: string; photo: string; author: string; mood: WeatherMood | null; tempC: number | null; meal?: string };

/** Deep link to a dish. There is no web domain yet, so links open the app (ongdalsaem://dish/<id>). */
const dishLink = (id: string) => Linking.createURL(`/dish/${id}`);

/** 7.4 Share sheet (Figma 367:8515): dish preview + link · Copy link / Share card / More · note · Cancel. */
export function ShareSheet({ visible, dish, onClose }: { visible: boolean; dish: ShareTarget | null; onClose: () => void }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const shot = useRef<React.ComponentRef<typeof View>>(null);
  const [copied, setCopied] = useState(false);
  const later = useLater();
  if (!dish) return null;
  const link = dishLink(dish.id);
  const sub = [t('dish.byAuthor', { name: dish.author }), dish.mood && dish.tempC != null ? `${t(`home.titleMood.${dish.mood}`)} ${dish.tempC}°` : null, dish.meal].filter(Boolean).join(' · ');

  const copy = async () => {
    const Clipboard = loadClipboard();
    if (!Clipboard) return Alert.alert(t('shareSheet.needsRebuild'));
    await Clipboard.setStringAsync(link);
    setCopied(true);
    later(() => setCopied(false), 1500);
  };
  const card = async () => {
    try {
      const ViewShot = loadViewShot();
      if (!ViewShot) return Alert.alert(t('shareSheet.needsRebuild'));
      const uri = shot.current ? await ViewShot.captureRef(shot.current, { format: 'png', quality: 1 }) : null;
      if (!uri) throw new Error('capture');
      const Sharing = loadSharing();
      if (Sharing && (await Sharing.isAvailableAsync())) await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: dish.name });
      else await Share.share({ url: uri });
    } catch {
      Alert.alert(t('shareSheet.cardFailed'));
    }
  };
  const more = () => Share.share({ message: `${dish.name} — ${link}`, url: link }).catch(() => undefined);

  const action = (icon: typeof Copy, label: string, onPress: () => void) => (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.action}>
      <View style={[styles.circle, { backgroundColor: color('bg/default'), borderColor: color('border/default') }]}>
        <Icon icon={icon} size={22} />
      </View>
      <Text variant="Caption" style={styles.center}>{label}</Text>
    </Pressable>
  );

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('shareSheet.title')}>
      <View style={[styles.preview, { backgroundColor: color('bg/default') }]}>
        <Image source={{ uri: dish.photo }} style={styles.thumb} contentFit="cover" />
        <View style={styles.flex}>
          <Text variant="Body/M Strong" numberOfLines={1}>{dish.name}</Text>
          <Text variant="Caption" color="fg/muted" numberOfLines={1}>{sub}</Text>
          <Text variant="Caption Strong" color="fg/accent" numberOfLines={1}>{link}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        {action(Copy, copied ? t('shareSheet.copied') : t('shareSheet.copy'), copy)}
        {action(ImageIcon, t('shareSheet.card'), card)}
        {action(MoreHorizontal, t('shareSheet.more'), more)}
      </View>
      <Text variant="Caption" color="fg/muted">{t('shareSheet.note')}</Text>
      <Button label={t('common.cancel')} variant="Ghost" onPress={onClose} />

      {/* Off-screen share card: photo + Weather Tag + name, captured as PNG. */}
      <View style={styles.offscreen} pointerEvents="none">
        <View ref={shot} collapsable={false}>
          <View style={[styles.card, { backgroundColor: color('bg/default') }]}>
            <Image source={{ uri: dish.photo }} style={styles.cardPhoto} contentFit="cover" />
            {dish.mood && dish.tempC != null ? (
              <View style={styles.cardTag}><WeatherTag mood={dish.mood} tempC={dish.tempC} condition={t(`weather.${dish.mood}`)} /></View>
            ) : null}
            <View style={styles.cardText}>
              <Text variant="Display/M" numberOfLines={2}>{dish.name}</Text>
              <Text variant="Body/S" color="fg/muted">{t('dish.byAuthor', { name: dish.author })} · ongdalsaem</Text>
            </View>
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  preview: { flexDirection: 'row', alignItems: 'center', gap: space[12], paddingLeft: space[12], paddingRight: space[16], paddingVertical: space[12], borderRadius: radius.lg },
  thumb: { width: 56, height: 56, borderRadius: radius.md },
  flex: { flex: 1, gap: space[2] },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  action: { width: 76, alignItems: 'center', gap: space[8] },
  circle: { width: 56, height: 56, borderRadius: radius.full, borderWidth: iconRing, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  offscreen: { position: 'absolute', left: -2000, top: 0 },
  card: { width: 360, borderRadius: radius.xl, overflow: 'hidden' },
  cardPhoto: { width: 360, height: 450 },
  cardTag: { position: 'absolute', left: space[16], top: space[16] },
  cardText: { padding: space[20], gap: space[6] },
});
