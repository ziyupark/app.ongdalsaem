import { Image } from 'expo-image';
import { Folder, MapPin, Navigation } from 'lucide-react-native';
import { MessageCircle } from '../../src/components/icons/custom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, Share, StyleSheet, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Radio, SettingsGroup, SettingsRow, SettingsScreen } from '../../src/components/settings/Settings';
import { Text } from '../../src/components/Text';
import { Toggle } from '../../src/components/Toggle';
import { loadSharing } from '../../src/lib/optionalNative';
import { fetchBlocked, unblockUser, type BlockedUser } from '../../src/services/moderation';
import { exportMyData, fetchAccount, updateAccount, type AccountSettings } from '../../src/services/settings';
import { radius, space, useTheme } from '../../src/theme';

type Precision = AccountSettings['sharedPrecision'];

/** 9.5 Privacy & location (Figma 193:6566). */
export default function Privacy() {
  const { color } = useTheme();
  const { t } = useTranslation();
  const [a, setA] = useState<AccountSettings | null>(null);
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAccount().then(setA).catch(() => undefined);
    fetchBlocked().then(setBlocked).catch(() => undefined);
  }, []);

  const set = async (local: Partial<AccountSettings>, column: Record<string, unknown>) => {
    const prev = a;
    setA((x) => (x ? { ...x, ...local } : x));
    try { await updateAccount(column); } catch { setA(prev); Alert.alert(t('settings.saveFailed')); }
  };

  const pickPrecision = () =>
    Alert.alert(t('settings.precision'), undefined, [
      ...(['neighborhood', 'city', 'country'] as Precision[]).map((p) => ({ text: t(`settings.precisions.${p}`), onPress: () => set({ sharedPrecision: p }, { shared_precision: p }) })),
      { text: t('common.cancel'), style: 'cancel' as const },
    ]);

  const unblock = (u: BlockedUser) =>
    Alert.alert(t('settings.unblockTitle', { name: u.name }), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.unblock'), onPress: async () => { try { await unblockUser(u.id); setBlocked((b) => b.filter((x) => x.id !== u.id)); } catch { Alert.alert(t('settings.saveFailed')); } } },
    ]);

  const download = async () => {
    setExporting(true);
    try {
      const json = await exportMyData();
      const Sharing = loadSharing();
      // Write a file when sharing is available; otherwise share the JSON text itself.
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const FS = require('expo-file-system/legacy') as typeof import('expo-file-system/legacy');
        const path = `${FS.cacheDirectory}ongdalsaem-data.json`;
        await FS.writeAsStringAsync(path, json);
        if (Sharing && (await Sharing.isAvailableAsync())) return await Sharing.shareAsync(path, { mimeType: 'application/json' });
      } catch {
        // fall through
      }
      await Share.share({ message: json });
    } catch {
      Alert.alert(t('settings.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  if (!a) return <SettingsScreen title={t('settings.privacyLocation')}><View /></SettingsScreen>;

  const radioRow = (on: boolean, label: string, onPress: () => void) => (
    <Pressable key={label} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={onPress} style={[styles.radioRow, { backgroundColor: color('bg/default') }]}>
      <Radio on={on} />
      <Text variant="Body/M" style={styles.flex}>{label}</Text>
    </Pressable>
  );

  return (
    <SettingsScreen title={t('settings.privacyLocation')}>
      <View style={[styles.summary, { backgroundColor: color('bg/default') }]}>
        <Text variant="Caption Strong">{t('settings.summaryDishes', { v: t(a.defaultVisibility === 'everyone' ? 'settings.everyone' : 'settings.onlyMe') })}</Text>
        <Text variant="Caption Strong">{t('settings.summaryMessages', { v: t(a.messagePolicy === 'everyone' ? 'settings.everyone' : 'settings.following') })}</Text>
        <Text variant="Caption Strong">{t('settings.summaryShown', { v: t(`settings.precisions.${a.sharedPrecision}`) })}</Text>
        <Text variant="Caption Strong">{t('settings.summaryBlocked', { n: blocked.length })}</Text>
      </View>

      <SettingsGroup label={t('settings.whoSeesDishes')} note={t('settings.defaultsNote')}>
        {radioRow(a.defaultVisibility === 'everyone', t('settings.everyone'), () => set({ defaultVisibility: 'everyone' }, { default_visibility: 'everyone' }))}
        {radioRow(a.defaultVisibility === 'only_me', t('settings.onlyMe'), () => set({ defaultVisibility: 'only_me' }, { default_visibility: 'only_me' }))}
        <SettingsRow icon={MessageCircle} label={t('share.allowComments')} right={<Toggle accessibilityLabel={t('share.allowComments')} value={a.defaultAllowComments} onValueChange={(v) => set({ defaultAllowComments: v }, { default_allow_comments: v })} />} />
      </SettingsGroup>

      <SettingsGroup label={t('settings.whoMessages')} note={t('settings.messagesNote')}>
        {radioRow(a.messagePolicy === 'everyone', t('settings.everyone'), () => set({ messagePolicy: 'everyone' }, { message_policy: 'everyone' }))}
        {radioRow(a.messagePolicy === 'following', t('settings.peopleIFollow'), () => set({ messagePolicy: 'following' }, { message_policy: 'following' }))}
      </SettingsGroup>

      <SettingsGroup label={t('settings.location')} note={t('settings.locationNote')}>
        <SettingsRow icon={MapPin} label={t('settings.useLocation')} right={<Toggle accessibilityLabel={t('settings.useLocation')} value={a.locationEnabled} onValueChange={(v) => set({ locationEnabled: v }, { location_enabled: v })} />} />
        <SettingsRow icon={Navigation} label={t('settings.precision')} value={t(`settings.precisions.${a.sharedPrecision}`)} onPress={pickPrecision} />
      </SettingsGroup>

      <SettingsGroup label={t('settings.blockedCount', { n: blocked.length })} note={t('settings.blockedNote')}>
        {blocked.length === 0 ? (
          <View style={[styles.blockedRow, { backgroundColor: color('bg/default') }]}><Text variant="Body/S" color="fg/muted">{t('settings.noBlocked')}</Text></View>
        ) : blocked.map((u) => (
          <View key={u.id} style={[styles.blockedRow, { backgroundColor: color('bg/default') }]}>
            <View style={[styles.avatar, { backgroundColor: color('bg/accent-subtle') }]}>
              {u.avatarUrl ? <Image source={{ uri: u.avatarUrl }} style={StyleSheet.absoluteFill} /> : <Text variant="Caption Strong" color="fg/accent">{u.name.slice(0, 1)}</Text>}
            </View>
            <View style={styles.flex}>
              <Text variant="Body/M Strong">{u.name}</Text>
              {u.handle ? <Text variant="Caption" color="fg/muted">{`@${u.handle}`}</Text> : null}
            </View>
            <Button label={t('settings.unblock')} variant="Outline" size="S" onPress={() => unblock(u)} />
          </View>
        ))}
      </SettingsGroup>

      <SettingsGroup label={t('settings.yourData')}>
        <SettingsRow icon={Folder} label={t('settings.downloadData')} value={exporting ? '…' : undefined} onPress={exporting ? undefined : download} />
      </SettingsGroup>
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  summary: { borderRadius: radius.lg, padding: space[16], gap: space[6] },
  radioRow: { height: 56, flexDirection: 'row', alignItems: 'center', gap: space[14], paddingHorizontal: space[16] },
  flex: { flex: 1 },
  blockedRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: space[12], paddingHorizontal: space[16], paddingVertical: space[10] },
  avatar: { width: 40, height: 40, borderRadius: radius.full, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
});
