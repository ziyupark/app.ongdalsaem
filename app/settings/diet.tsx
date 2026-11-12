import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';
import { DietForm } from '../../src/components/settings/DietForm';
import { SettingsScreen } from '../../src/components/settings/Settings';
import { saveDietPrefs, useDietPrefs, type DietPrefs } from '../../src/lib/dietPrefs';
import { space } from '../../src/theme';

/** Settings › Diet & allergies — saved as you tap (profiles.diet · allergies). */
export default function DietSettings() {
  const { t } = useTranslation();
  const saved = useDietPrefs();
  const [value, setValue] = useState<DietPrefs>(saved);
  useEffect(() => { setValue(saved); }, [saved]);

  const change = async (next: DietPrefs) => {
    const prev = value;
    setValue(next);
    try { await saveDietPrefs(next); } catch { setValue(prev); Alert.alert(t('settings.saveFailed')); }
  };

  return (
    <SettingsScreen title={t('diet.title')}>
      <View style={styles.body}>
        <DietForm value={value} onChange={change} />
      </View>
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: space[8] },
});
