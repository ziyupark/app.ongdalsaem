import * as Application from 'expo-application';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { Bell, BookOpen, ChevronRight, Eye, Globe, Lock, LogOut, Map as MapIcon, Salad, Thermometer } from '../../src/components/icons/ongdal';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../../src/components/Icon';
import { SettingsGroup, SettingsRow, SettingsScreen } from '../../src/components/settings/Settings';
import { Text } from '../../src/components/Text';
import { useDietPrefs } from '../../src/lib/dietPrefs';
import { getSavedMapApp, installedMapApps, MAP_APP_LABEL, setSavedMapApp, type MapAppId } from '../../src/lib/mapApps';
import { setPrefs, usePrefs } from '../../src/lib/prefs';
import { signOut } from '../../src/services/auth';
import { getMyProfile, type MyProfile } from '../../src/services/profile';
import { radius, space, useTheme } from '../../src/theme';

/** 9.1 Settings (Figma 26:2). */
export default function Settings() {
  const { color } = useTheme();
  const { t } = useTranslation();
  const diet = useDietPrefs();
  const prefs = usePrefs();
  const [me, setMe] = useState<MyProfile | null>(null);
  const [mapApp, setMapApp] = useState<MapAppId | null>(null);
  useFocusEffect(useCallback(() => { getMyProfile().then(setMe).catch(() => undefined); getSavedMapApp().then(setMapApp); }, []));

  const pickUnit = () =>
    Alert.alert(t('settings.temperature'), undefined, [
      { text: '°C', onPress: () => setPrefs({ tempUnit: 'C' }) },
      { text: '°F', onPress: () => setPrefs({ tempUnit: 'F' }) },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  // 2.4b map-app hand-off: "Ask every time" or one of the installed map apps.
  const pickMapApp = async () => {
    const apps = await installedMapApps();
    const choose = (id: MapAppId | null) => { setSavedMapApp(id); setMapApp(id); };
    Alert.alert(t('settings.mapApp'), undefined, [
      { text: t('mapApps.ask'), onPress: () => choose(null) },
      ...apps.map((id) => ({ text: t(MAP_APP_LABEL[id]), onPress: () => choose(id) })),
      { text: t('common.cancel'), style: 'cancel' as const },
    ]);
  };
  const askSignOut = () =>
    Alert.alert(t('settings.signOutTitle'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.signOut'), style: 'destructive', onPress: async () => { await signOut(); router.replace('/'); } },
    ]);

  const version = `${Application.nativeApplicationVersion ?? '1.0.0'} (${Application.nativeBuildVersion ?? '0'})`;

  return (
    <SettingsScreen title={t('settings.title')}>
      <Pressable accessibilityRole="button" onPress={() => router.push('/settings/edit-profile')} style={({ pressed }) => [styles.card, { backgroundColor: color('bg/subtle') }, pressed && { opacity: 0.85 }]}>
        <View style={[styles.avatar, { backgroundColor: color('bg/accent-subtle') }]}>
          {me?.avatarUrl ? <Image source={{ uri: me.avatarUrl }} style={StyleSheet.absoluteFill} contentFit="cover" /> : (
            <Text variant="Title/L" color="fg/accent">{(me?.displayName ?? ' ').slice(0, 1).toUpperCase()}</Text>
          )}
        </View>
        <View style={styles.flex}>
          <Text variant="Title/S" numberOfLines={1}>{me?.displayName ?? ' '}</Text>
          <Text variant="Body/S" color="fg/muted" numberOfLines={1}>{`${me?.username ? `@${me.username} · ` : ''}${t('settings.editProfile')}`}</Text>
        </View>
        <Icon icon={ChevronRight} size={18} />
      </Pressable>

      <SettingsGroup label={t('settings.account')}>
        <SettingsRow icon={Lock} label={t('settings.accountSecurity')} onPress={() => router.push('/settings/account')} />
      </SettingsGroup>
      <SettingsGroup label={t('settings.preferences')}>
        <SettingsRow icon={Bell} label={t('settings.notifications')} onPress={() => router.push('/settings/notifications')} />
        <SettingsRow icon={Thermometer} label={t('settings.temperature')} value={prefs.tempUnit === 'F' ? '°F' : '°C'} onPress={pickUnit} />
        <SettingsRow icon={Globe} label={t('settings.language')} value={t(`settings.languages.${prefs.language ?? 'device'}`)} onPress={() => router.push('/settings/language')} />
        <SettingsRow
          icon={Salad}
          label={t('diet.title')}
          value={[diet.diet ? t(`diet.diets.${diet.diet}`) : null, diet.allergies.length ? t('diet.allergyCount', { n: diet.allergies.length }) : null].filter(Boolean).join(' · ') || t('diet.none')}
          onPress={() => router.push('/settings/diet')}
        />
        <SettingsRow icon={MapIcon} label={t('settings.mapApp')} value={mapApp ? t(MAP_APP_LABEL[mapApp]) : t('mapApps.ask')} onPress={pickMapApp} />
      </SettingsGroup>
      <SettingsGroup label={t('settings.privacySafety')}>
        <SettingsRow icon={Eye} label={t('settings.privacyLocation')} onPress={() => router.push('/settings/privacy')} />
      </SettingsGroup>
      <SettingsGroup label={t('settings.support')}>
        <SettingsRow icon={BookOpen} label={t('settings.help')} onPress={() => router.push('/settings/help')} />
      </SettingsGroup>
      <SettingsGroup>
        <SettingsRow icon={LogOut} label={t('profile.signOut')} destructive onPress={askSignOut} />
      </SettingsGroup>
      <View style={styles.indent}>
        <Text variant="Caption" color="fg/disabled">{t('settings.versionLine', { version })}</Text>
      </View>
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  card: { height: 100, flexDirection: 'row', alignItems: 'center', gap: space[14], paddingHorizontal: space[16], borderRadius: radius.lg },
  avatar: { width: 56, height: 56, borderRadius: radius.full, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: space[2] },
  indent: { paddingLeft: 66, marginTop: -space[16] },
});
