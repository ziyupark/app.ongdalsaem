import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { DietForm } from '../../src/components/settings/DietForm';
import { Text } from '../../src/components/Text';
import { TopBar } from '../../src/components/TopBar';
import { saveDietPrefs, type DietPrefs } from '../../src/lib/dietPrefs';
import { space, useTheme } from '../../src/theme';

/** Onboarding diet & allergies (optional, after taste, before 1.4 Location). Skip = nothing saved. */
export default function DietStep() {
  const insets = useSafeAreaInsets();
  const { color, scheme } = useTheme();
  const { t } = useTranslation();
  const [value, setValue] = useState<DietPrefs>({ diet: null, allergies: [] });
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const next = () => router.push('/setup/location');
  const submit = async () => {
    if (saving) return;
    if (!value.diet && !value.allergies.length) { next(); return; }
    setSaving(true);
    setFailed(false);
    try {
      await saveDietPrefs(value);
      next();
    } catch (e) {
      console.warn('[diet-setup]', e);
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  const bottom = Math.max(insets.bottom, space[24]) + space[10];

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default'), paddingTop: insets.top }]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <View style={styles.bar}>
        <TopBar onBack={() => router.back()} backLabel={t('common.back')} />
        <Button label={t('taste.skip')} variant="Ghost" size="S" onPress={next} style={styles.skip} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 56 + space[40] + bottom }}>
        <View style={styles.heading}>
          <Text variant="Overline" color="fg/accent">{t('diet.step')}</Text>
          <Text variant="Display/L" accessibilityRole="header">{t('diet.setupTitle')}</Text>
          <Text variant="Body/M" color="fg/secondary">{t('diet.setupBody')}</Text>
        </View>
        <View style={styles.form}>
          <DietForm value={value} onChange={setValue} />
        </View>
      </ScrollView>

      <View style={[styles.fixed, { bottom }]}>
        {failed ? <Text variant="Caption" color="fg/destructive" style={styles.notice}>{t('taste.error')}</Text> : null}
        <Button label={t('taste.continue')} onPress={submit} loading={saving} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bar: { justifyContent: 'center' },
  skip: { position: 'absolute', right: space[20] },
  heading: { paddingTop: space[12], paddingHorizontal: space[20], gap: space[12] },
  form: { paddingTop: space[24], paddingHorizontal: space[20] },
  fixed: { position: 'absolute', left: space[20], right: space[20], gap: space[8] },
  notice: { textAlign: 'center' },
});
