import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Check } from '../../src/components/icons/ongdal';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Icon } from '../../src/components/Icon';
import { Text } from '../../src/components/Text';
import { TopBar } from '../../src/components/TopBar';
import { TASTE_TAGS } from '../../src/lib/tags';
import { saveFavoriteTags } from '../../src/services/profile';
import { radius, space, useTheme } from '../../src/theme';

/** Onboarding taste step (after 1.3 Profile, before 1.4 Location). Picks → profiles.favorite_tags. */
export default function TasteStep() {
  const insets = useSafeAreaInsets();
  const { color, scheme } = useTheme();
  const { t } = useTranslation();
  const [picked, setPicked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const next = () => router.push('/setup/diet');
  const toggle = (key: string) => setPicked((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));

  const submit = async () => {
    if (saving) return;
    if (!picked.length) { next(); return; }
    setSaving(true);
    setFailed(false);
    try {
      await saveFavoriteTags(picked);
      next();
    } catch (e) {
      console.warn('[taste-setup]', e);
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
          <Text variant="Overline" color="fg/accent">{t('taste.step')}</Text>
          <Text variant="Display/L" accessibilityRole="header">{t('taste.title')}</Text>
          <Text variant="Body/M" color="fg/secondary">{t('taste.body')}</Text>
        </View>
        <View style={styles.grid}>
          {TASTE_TAGS.map((tag) => {
            const on = picked.includes(tag.key);
            const label = t(`share.${tag.group}.${tag.key}`);
            return (
              <Pressable
                key={tag.key}
                accessibilityRole="checkbox"
                accessibilityLabel={label}
                accessibilityState={{ checked: on }}
                onPress={() => toggle(tag.key)}
                style={({ pressed }) => [
                  styles.card,
                  { backgroundColor: on ? color('bg/accent-subtle') : color('bg/subtle'), borderColor: on ? color('border/accent') : color('border/default') },
                  pressed && styles.pressed,
                ]}
              >
                <Icon icon={tag.icon} size={22} color={on ? 'fg/accent' : 'fg/secondary'} />
                <Text variant="Body/M Strong" style={styles.label} numberOfLines={1}>{label}</Text>
                <View style={[styles.check, on ? { backgroundColor: color('bg/inverse') } : { borderColor: color('border/strong'), borderWidth: 1 }]}>
                  {on ? <Icon icon={Check} size={14} color="fg/inverse" /> : null}
                </View>
              </Pressable>
            );
          })}
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[10], paddingTop: space[24], paddingHorizontal: space[20] },
  card: { width: '48%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: space[10], padding: space[16], borderRadius: radius.lg, borderWidth: 1 },
  label: { flex: 1 },
  check: { width: 22, height: 22, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.85 },
  fixed: { position: 'absolute', left: space[20], right: space[20], gap: space[8] },
  notice: { textAlign: 'center' },
});
