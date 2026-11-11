import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AvatarEdit } from '../../src/components/AvatarEdit';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { Text } from '../../src/components/Text';
import { TopBar } from '../../src/components/TopBar';
import { useKeyboardHeight } from '../../src/hooks/useKeyboardHeight';
import { saveProfileSetup } from '../../src/services/profile';
import { makeHandle, randomHandleDigits } from '../../src/services/username';
import { space, useTheme } from '../../src/theme';
import { Paper } from '../../src/components/Paper';

const MAX_NAME = 30;

/** 1.3 Profile setup — 14:260. One field (Display name); the handle is generated and previewed live. */
export default function ProfileSetup() {
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();
  const { color, scheme } = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ name?: string }>();

  const [name, setName] = useState((params.name ?? '').slice(0, MAX_NAME));
  const [photo, setPhoto] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [digits] = useState(randomHandleDigits);

  const trimmed = name.trim();
  const ready = trimmed.length >= 1;
  const handle = useMemo(() => makeHandle(trimmed, digits), [trimmed, digits]);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.9 });
    if (!result.canceled && result.assets[0]) setPhoto(result.assets[0].uri);
  };

  const submit = async () => {
    if (!ready || saving) return;
    setSaving(true);
    setFailed(false);
    try {
      await saveProfileSetup({ displayName: trimmed, digits, avatarUri: photo });
      router.push('/setup/location');
    } catch (e) {
      console.warn('[profile-setup]', e);
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  const bottom = keyboard > 0 ? keyboard + space[10] : Math.max(insets.bottom, space[24]) + space[10];
  const notice = failed ? t('profileSetup.error') : !ready ? t('profileSetup.missingName') : null;

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default'), paddingTop: insets.top }]}>
      <Paper />
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <TopBar onBack={() => router.back()} backLabel={t('common.back')} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 56 + space[40] + bottom }}>
        <View style={styles.heading}>
          <Text variant="Overline" color="fg/accent">{t('profileSetup.step')}</Text>
          <Text variant="Display/L" accessibilityRole="header">{t('profileSetup.title')}</Text>
        </View>
        <View style={styles.avatar}>
          <AvatarEdit name={trimmed} photoUri={photo} onPress={pickPhoto} accessibilityLabel={t('profileSetup.changePhoto')} />
        </View>
        <View style={styles.content}>
          <Input
            label={t('profileSetup.label')}
            helper={t('profileSetup.helper')}
            value={name}
            onChangeText={(v) => setName(v.slice(0, MAX_NAME))}
            maxLength={MAX_NAME}
            autoFocus={!name}
            autoCorrect={false}
            autoCapitalize="words"
            textContentType="nickname"
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          {ready ? (
            <Text variant="Caption" color="fg/muted">
              {t('profileSetup.handlePrefix')}
              <Text variant="Caption Strong">@{handle}</Text>
              {t('profileSetup.handleSuffix')}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      {/* Block · Button (fixed) — y 744–800, rides above the keyboard. Disabled → reason caption above it. */}
      <View style={[styles.fixed, { bottom }]}>
        {notice ? (
          <Text variant="Caption" color={failed ? 'fg/destructive' : 'fg/muted'} style={styles.notice}>{notice}</Text>
        ) : null}
        <Button label={t('profileSetup.continue')} onPress={submit} disabled={!ready} loading={saving} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  heading: { paddingTop: space[12], paddingHorizontal: space[20], gap: space[8] },
  avatar: { paddingTop: space[24], alignItems: 'center' },
  content: { paddingTop: space[32], paddingHorizontal: space[20], gap: space[16] },
  fixed: { position: 'absolute', left: space[20], right: space[20], gap: space[8] },
  notice: { textAlign: 'center' },
});
