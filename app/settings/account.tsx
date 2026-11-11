import { router } from 'expo-router';
import { Mail, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsGroup, SettingsRow, SettingsScreen } from '../../src/components/settings/Settings';
import { fetchAccount, type AccountSettings } from '../../src/services/settings';

/** 9.3 Account & security (Figma 193:6247). Linking a new sign-in provider is part of the sign-in work, so rows only show status. */
export default function Account() {
  const { t } = useTranslation();
  const [a, setA] = useState<AccountSettings | null>(null);
  useEffect(() => { fetchAccount().then(setA).catch(() => undefined); }, []);
  const has = (p: string) => !!a?.providers.includes(p);
  return (
    <SettingsScreen title={t('settings.accountSecurity')}>
      <SettingsGroup label={t('settings.signIn')}>
        <SettingsRow icon={Mail} label={t('settings.email')} value={a?.email ?? '—'} />
      </SettingsGroup>
      <SettingsGroup label={t('settings.connected')} note={t('settings.connectedNote')}>
        <SettingsRow label="Apple" value={t(has('apple') ? 'settings.connectedOn' : 'settings.notConnected')} />
        <SettingsRow label="Google" value={t(has('google') ? 'settings.connectedOn' : 'settings.notConnected')} />
      </SettingsGroup>
      <SettingsGroup label={t('settings.danger')} note={t('settings.deleteNote')}>
        <SettingsRow icon={Trash2} label={t('settings.deleteAccount')} destructive onPress={() => router.push('/settings/delete')} />
      </SettingsGroup>
    </SettingsScreen>
  );
}
