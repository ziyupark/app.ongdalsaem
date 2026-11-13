import { router } from 'expo-router';
import { Image as ImageIcon, User } from 'lucide-react-native';
import { Bookmark, MessageCircle } from '../../src/components/icons/custom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { SettingsGroup, SettingsRow, SettingsScreen } from '../../src/components/settings/Settings';
import { Text } from '../../src/components/Text';
import { supabase } from '../../src/lib/supabase';
import { deleteMyAccount } from '../../src/services/settings';
import { space } from '../../src/theme';

/** 9.9 Delete account (Figma 194:6780) — confirm twice, then delete_own_account() and back to 1.1 Splash. */
export default function DeleteAccount() {
  const { t } = useTranslation();
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const { count: n } = await supabase.from('foods').select('id', { count: 'exact', head: true }).eq('creator_id', data.user.id);
      setCount(n ?? 0);
    })().catch(() => undefined);
  }, []);

  const confirm = () =>
    Alert.alert(t('settings.deleteConfirmTitle'), t('settings.deleteConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.deleteAccount'),
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await deleteMyAccount();
            router.replace('/');
          } catch {
            setBusy(false);
            Alert.alert(t('settings.deleteFailed'));
          }
        },
      },
    ]);

  return (
    // 9.9 (194:6780) — Head (Display/M · Body/M) · What gets deleted · Destructive L · Ghost L, all in the content (gap 24).
    <SettingsScreen title={t('settings.deleteAccount')}>
      <View style={styles.head}>
        <Text variant="Display/M">{t('settings.deleteTitle')}</Text>
        <Text variant="Body/M" color="fg/secondary">{t('settings.deleteBody')}</Text>
      </View>
      <SettingsGroup label={t('settings.whatDeleted')} note={t('settings.deleteCaption')}>
        <SettingsRow icon={User} label={t('settings.delProfile')} />
        <SettingsRow icon={ImageIcon} label={t('settings.delDishes', { count })} />
        <SettingsRow icon={MessageCircle} label={t('settings.delSocial')} />
        <SettingsRow icon={Bookmark} label={t('settings.delDiary')} />
      </SettingsGroup>
      <View style={styles.actions}>
        <Button label={busy ? '…' : t('settings.deleteAccount')} variant="Destructive" disabled={busy} onPress={confirm} />
        <Button label={t('settings.keepAccount')} variant="Ghost" onPress={() => router.back()} />
      </View>
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  head: { gap: space[8] },
  actions: { gap: space[8] },
});
