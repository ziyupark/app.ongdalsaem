import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, StyleSheet, TextInput, View } from 'react-native';
import { AvatarEdit } from '../../src/components/AvatarEdit';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { SettingsScreen } from '../../src/components/settings/Settings';
import { LoadError } from '../../src/components/LoadError';
import { Text } from '../../src/components/Text';
import { canChangeHandle, fetchAccount, HANDLE_RE, saveProfile, type AccountSettings } from '../../src/services/settings';
import { isObjectionable } from '../../src/services/moderation';
import { radius, space, text, useTheme, FONT_SCALE_MAX } from '../../src/theme';

const MAX_BIO = 80;
const { lineHeight: _lh, ...areaText } = text['Body/M'];

/** 9.2 Edit profile (Figma 193:6134) · 9.2b photo = system picker. */
export default function EditProfile() {
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const [a, setA] = useState<AccountSettings | null>(null);
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [bioFocus, setBioFocus] = useState(false);

  const [failed, setFailed] = useState(false);
  const load = useCallback(
    () => fetchAccount().then((x) => { setA(x); setHandle(x.username); setBio(x.bio); setFailed(false); }).catch(() => setFailed(true)),
    [],
  );
  useEffect(() => { load(); }, [load]);

  // Offline / server error: Try again in place of the form, never a spinner that doesn't stop.
  if (!a && failed) return <SettingsScreen title={t('settings.editProfile')}><LoadError onRetry={load} /></SettingsScreen>;
  if (!a) return <SettingsScreen title={t('settings.editProfile')}><ActivityIndicator color={color('fg/muted')} /></SettingsScreen>;

  const cleanHandle = handle.trim().toLowerCase().replace(/^@/, '');
  const handleChanged = cleanHandle !== a.username;
  const cd = canChangeHandle(a);
  const handleError = handleChanged && !HANDLE_RE.test(cleanHandle) ? t('settings.handleFormat') : handleChanged && !cd.ok ? t('settings.handleCooldown', { date: cd.nextAt?.toLocaleDateString(i18n.language) }) : undefined;
  // No separate nickname: the @username is the name shown everywhere (comments, profile, settings).
  const dirty = handleChanged || bio.trim() !== a.bio || !!photo;
  const ok = cleanHandle.length > 0 && !handleError && dirty;

  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.9 });
    if (!r.canceled && r.assets[0]) setPhoto(r.assets[0].uri);
  };

  const save = async () => {
    if (!ok || saving) return;
    setSaving(true);
    try {
      await saveProfile(a, { username: cleanHandle, bio, avatarUri: photo });
      router.back();
    } catch (e) {
      const code = (e as { code?: string }).code;
      Alert.alert(code === 'handle-taken' ? t('settings.handleTaken') : isObjectionable(e) ? t('moderation.objectionable') : t('settings.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsScreen title={t('settings.editProfile')} footer={<Button label={t('settings.saveChanges')} disabled={!ok} loading={saving} onPress={save} />}>
      <View style={styles.avatar}>
        <AvatarEdit name={cleanHandle} photoUri={photo ?? a.avatarUrl ?? undefined} onPress={pick} accessibilityLabel={t('settings.changePhoto')} />
      </View>
      <Input
        label={t('settings.username')}
        value={handle}
        onChangeText={(v) => setHandle(v.replace(/\s/g, '').toLowerCase())}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={21}
        error={handleError}
        helper={t('settings.usernameHelper', { handle: cleanHandle })}
      />
      <View style={styles.bio}>
        <Text variant="Body/S Strong">{t('settings.bio')}</Text>
        <View style={[styles.area, { backgroundColor: color('bg/default'), borderColor: color(bioFocus ? 'border/focus' : 'border/default'), borderWidth: bioFocus ? 2 : 1 }]}>
          <TextInput maxFontSizeMultiplier={FONT_SCALE_MAX}
            accessibilityLabel={t('settings.bio')}
            value={bio}
            onChangeText={setBio}
            maxLength={MAX_BIO}
            multiline
            onFocus={() => setBioFocus(true)}
            onBlur={() => setBioFocus(false)}
            placeholder={t('settings.bioPlaceholder')}
            placeholderTextColor={color('fg/muted')}
            selectionColor={color('border/focus')}
            style={[areaText, styles.areaInput, { color: color('fg/default') }]}
          />
        </View>
        <Text variant="Caption" color="fg/muted" style={styles.right}>{`${bio.length} / ${MAX_BIO}`}</Text>
      </View>
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center' },
  bio: { gap: space[6] },
  area: { height: 92, borderRadius: radius.input, paddingHorizontal: space[16], paddingVertical: space[12] },
  areaInput: { flex: 1, padding: 0, textAlignVertical: 'top' },
  right: { textAlign: 'right' },
});
