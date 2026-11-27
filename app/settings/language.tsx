import { Check, Search } from '../../src/components/icons/ongdal';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Icon } from '../../src/components/Icon';
import { SettingsGroup, SettingsRow, SettingsScreen } from '../../src/components/settings/Settings';
import { Text } from '../../src/components/Text';
import { Toggle } from '../../src/components/Toggle';
import type { AppLanguage } from '../../src/i18n';
import { deviceLanguage, isLaunched, NATIVE_NAMES, resolveLanguage, setPrefs, SUPPORTED_LANGUAGES, usePrefs } from '../../src/lib/prefs';
import { updateAccount } from '../../src/services/settings';
import { radius, space, text, useTheme, FONT_SCALE_MAX } from '../../src/theme';

const { lineHeight: _lh, ...fieldText } = text['Body/M'];

/** 9.6 Language (Figma 394:9167) — English, Korean and the big social-media markets (ja, zh-TW, es, pt-BR, id, th, vi). */
export default function Language() {
  const { color } = useTheme();
  const { t } = useTranslation();
  const prefs = usePrefs();
  const device = deviceLanguage();
  const current = resolveLanguage(prefs.language);
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const shown = SUPPORTED_LANGUAGES.filter((l) => !needle || [l, NATIVE_NAMES[l], t(`settings.languages.${l}`)].some((s) => s.toLowerCase().includes(needle)));

  const choose = (lng: AppLanguage | null) => {
    setPrefs({ language: lng });
    updateAccount({ language: resolveLanguage(lng) }).catch(() => undefined);
  };

  return (
    <SettingsScreen title={t('settings.language')}>
      <View style={[styles.search, { backgroundColor: color('bg/default'), borderColor: color('border/default') }]}>
        <Icon icon={Search} size={18} color="fg/muted" />
        <TextInput maxFontSizeMultiplier={FONT_SCALE_MAX}
          value={q}
          onChangeText={setQ}
          placeholder={t('settings.searchLanguages')}
          placeholderTextColor={color('fg/muted')}
          selectionColor={color('border/focus')}
          autoCorrect={false}
          returnKeyType="search"
          style={[fieldText, styles.input, { color: color('fg/default') }]}
        />
      </View>
      <SettingsGroup label={t('settings.appLanguage')} note={t('settings.languageNote')}>
        <SettingsRow
          label={t('settings.useDevice')}
          sub={t('settings.deviceIs', { lang: NATIVE_NAMES[device] })}
          right={<Toggle accessibilityLabel={t('settings.useDevice')} value={prefs.language == null} onValueChange={(v) => choose(v ? null : current)} />}
        />
      </SettingsGroup>
      <SettingsGroup label={t('settings.allLanguages')} note={t('settings.languageUnits')}>
        {shown.map((l) => {
          const on = current === l;
          // v1 is English only: the other languages are listed but can't be picked yet ("Coming soon").
          const soon = !isLaunched(l);
          const off = prefs.language == null || soon;
          return (
            <Pressable key={l} accessibilityRole="radio" accessibilityState={{ selected: on, disabled: off }} disabled={off} onPress={() => choose(l)} style={[styles.row, { backgroundColor: color('bg/default') }, off && { opacity: 0.5 }]}>
              <View style={styles.flex}>
                <Text variant="Body/M">{t(`settings.languages.${l}`)}</Text>
                <Text variant="Caption" color="fg/muted">{soon ? `${NATIVE_NAMES[l]} · ${t('settings.languageSoon')}` : NATIVE_NAMES[l]}</Text>
              </View>
              {on ? <Icon icon={Check} size={20} color="fg/accent" /> : null}
            </Pressable>
          );
        })}
      </SettingsGroup>
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  row: { height: 60, flexDirection: 'row', alignItems: 'center', gap: space[12], paddingHorizontal: space[16] },
  search: { height: 48, flexDirection: 'row', alignItems: 'center', gap: space[8], paddingHorizontal: space[16], borderRadius: radius.full, borderWidth: 1 },
  input: { flex: 1, padding: 0 },
  flex: { flex: 1, gap: space[2] },
});
