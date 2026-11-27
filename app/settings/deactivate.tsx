import { router } from 'expo-router';
import { Clock, Image as ImageIcon, MessageCircle, User } from '../../src/components/icons/ongdal';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { SettingsGroup, SettingsRow, SettingsScreen } from '../../src/components/settings/Settings';
import { Text } from '../../src/components/Text';
import { deactivateMyAccount } from '../../src/services/settings';
import { space } from '../../src/theme';

const GRACE_DAYS = 30;

/**
 * 9.3b Deactivate account (no Figma — built on the 9.9 Delete account layout): Head · What happens · Deletion date ·
 * Destructive L · Ghost L. Confirm → deactivate_own_account(), sign out → 1.1 Splash. Deleted for good after 30 days.
 */
export default function DeactivateAccount() {
  const { t, i18n } = useTranslation();
  const [busy, setBusy] = useState(false);
  const deleteOn = new Date(Date.now() + GRACE_DAYS * 86_400_000).toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' });

  const confirm = () =>
    Alert.alert(t('settings.deactivateConfirmTitle'), t('settings.deactivateConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.deactivateAccount'),
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await deactivateMyAccount();
            router.replace('/');
          } catch {
            setBusy(false);
            Alert.alert(t('settings.deactivateFailed'));
          }
        },
      },
    ]);

  return (
    <SettingsScreen title={t('settings.deactivateAccount')}>
      <View style={styles.head}>
        <Text variant="Display/M">{t('settings.deactivateTitle')}</Text>
        <Text variant="Body/M" color="fg/secondary">{t('settings.deactivateBody')}</Text>
      </View>
      <SettingsGroup label={t('settings.whileDeactivated')} note={t('settings.deactivateCaption')}>
        <SettingsRow icon={User} label={t('settings.deaProfile')} />
        <SettingsRow icon={ImageIcon} label={t('settings.deaDishes')} />
        <SettingsRow icon={MessageCircle} label={t('settings.deaSocial')} />
      </SettingsGroup>
      <SettingsGroup>
        <SettingsRow icon={Clock} label={t('settings.deaDeletedOn')} value={deleteOn} />
      </SettingsGroup>
      <View style={styles.actions}>
        <Button label={t('settings.deactivateAccount')} variant="Destructive" loading={busy} disabled={busy} onPress={confirm} />
        <Button label={t('settings.keepAccount')} variant="Ghost" onPress={() => router.back()} />
      </View>
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  head: { gap: space[8] },
  actions: { gap: space[8] },
});
