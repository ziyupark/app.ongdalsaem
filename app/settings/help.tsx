import * as Application from 'expo-application';
import { router } from 'expo-router';
import { BookOpen, Compass, List, Lock, Mail, MapPin, Sparkles, Users } from '../../src/components/icons/ongdal';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { AcornIcon } from '../../src/components/AcornIcon';
import { SettingsGroup, SettingsRow, SettingsScreen } from '../../src/components/settings/Settings';
import { openLegal, type LegalDoc } from '../../src/lib/legal';
import { SUPPORT_EMAIL } from '../../src/lib/support';

/** 9.8 Help & policies (Figma 194:6602). Documents open their published page (src/lib/legal.ts), else the 9.8c sheet. */
export default function Help() {
  const { t } = useTranslation();
  const version = `${Application.nativeApplicationVersion ?? '1.0.0'} (${Application.nativeBuildVersion ?? '0'})`;
  const doc = (key: LegalDoc) => openLegal(key);
  return (
    <SettingsScreen title={t('settings.help')}>
      <SettingsGroup label={t('settings.helpGroup')}>
        <SettingsRow icon={Compass} label={t('settings.helpCenter')} onPress={() => doc('help')} />
        <SettingsRow icon={Mail} label={t('settings.contact')} onPress={() => router.push('/settings/support')} />
        <SettingsRow icon={Users} label={t('settings.guidelines')} onPress={() => doc('guidelines')} />
      </SettingsGroup>
      <SettingsGroup label={t('settings.legal')}>
        <SettingsRow icon={List} label={t('settings.terms')} onPress={() => doc('terms')} />
        <SettingsRow icon={Lock} label={t('settings.privacyPolicy')} onPress={() => doc('privacy')} />
        <SettingsRow icon={MapPin} label={t('settings.locationTerms')} onPress={() => doc('location')} />
        <SettingsRow icon={BookOpen} label={t('settings.licenses')} onPress={() => router.push('/settings/licenses')} />
      </SettingsGroup>
      <SettingsGroup label={t('settings.about')} note={t('settings.credits', { email: SUPPORT_EMAIL })}>
        <SettingsRow leading={<AcornIcon size={18} />} label={t('settings.letter')} onPress={() => router.push('/welcome?replay=1')} />
        <SettingsRow icon={Sparkles} label={t('settings.version')} value={version} onPress={() => Alert.alert(t('settings.version'), version)} />
      </SettingsGroup>
    </SettingsScreen>
  );
}
