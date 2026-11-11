import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';
import { SettingsGroup, SettingsRow, SettingsScreen } from '../../src/components/settings/Settings';

type Item = { name: string; license: string; url: string };
const GROUPS: { key: string; items: Item[] }[] = [
  { key: 'icons', items: [{ name: 'Lucide', license: 'ISC', url: 'https://lucide.dev/license' }] },
  {
    key: 'fonts',
    items: [
      { name: 'Fraunces', license: 'OFL 1.1', url: 'https://fonts.google.com/specimen/Fraunces/license' },
      { name: 'Outfit', license: 'OFL 1.1', url: 'https://fonts.google.com/specimen/Outfit/license' },
      { name: 'Noto Sans KR', license: 'OFL 1.1', url: 'https://fonts.google.com/noto/specimen/Noto+Sans+KR/license' },
      { name: 'Gaegu', license: 'OFL 1.1', url: 'https://fonts.google.com/specimen/Gaegu/license' },
      { name: 'Google Sans', license: 'OFL 1.1', url: 'https://fonts.google.com/specimen/Google+Sans/license' },
    ],
  },
  {
    key: 'libraries',
    items: [
      { name: 'React Native', license: 'MIT', url: 'https://github.com/facebook/react-native/blob/main/LICENSE' },
      { name: 'Expo', license: 'MIT', url: 'https://github.com/expo/expo/blob/main/LICENSE' },
      { name: 'Supabase JS', license: 'MIT', url: 'https://github.com/supabase/supabase-js/blob/master/LICENSE' },
      { name: 'React Native Reanimated', license: 'MIT', url: 'https://github.com/software-mansion/react-native-reanimated/blob/main/LICENSE' },
      { name: 'React Native SVG', license: 'MIT', url: 'https://github.com/software-mansion/react-native-svg/blob/main/LICENSE' },
      { name: 'i18next', license: 'MIT', url: 'https://github.com/i18next/i18next/blob/master/LICENSE' },
      { name: 'react-native-view-shot', license: 'MIT', url: 'https://github.com/gre/react-native-view-shot/blob/master/LICENSE' },
    ],
  },
  { key: 'data', items: [{ name: 'OpenWeather', license: 'CC BY-SA 4.0', url: 'https://openweather.co.uk/storage/app/media/Terms/Openweather_terms_and_conditions_of_sale.pdf' }] },
];

/** 9.8b Open-source licenses (Figma 497:11726). Tap a row to read the full license. */
export default function Licenses() {
  const { t } = useTranslation();
  return (
    <SettingsScreen title={t('settings.licenses')}>
      {GROUPS.map((g) => (
        <SettingsGroup key={g.key} label={t(`licenses.${g.key}`)} note={g.key === 'libraries' ? t('licenses.librariesNote') : undefined}>
          {g.items.map((i) => <SettingsRow key={i.name} label={i.name} value={i.license} onPress={() => Linking.openURL(i.url).catch(() => undefined)} />)}
        </SettingsGroup>
      ))}
    </SettingsScreen>
  );
}
