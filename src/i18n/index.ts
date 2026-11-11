// i18n — docs/05-behavior.md §9.1. Language = 9.6 choice → device language → English.
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import es from './es.json';
import id from './id.json';
import ja from './ja.json';
import ko from './ko.json';
import ptBR from './pt-BR.json';
import th from './th.json';
import vi from './vi.json';
import zhTW from './zh-TW.json';

/** 9.6 order: English, Korean, then the big social-media markets. */
export const SUPPORTED_LANGUAGES = ['en', 'ko', 'ja', 'zh-TW', 'es', 'pt-BR', 'id', 'th', 'vi'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Each language's own name (9.6 second line, support ticket). */
export const NATIVE_NAMES: Record<AppLanguage, string> = {
  en: 'English',
  ko: '한국어',
  ja: '日本語',
  'zh-TW': '繁體中文',
  es: 'Español',
  'pt-BR': 'Português (Brasil)',
  id: 'Bahasa Indonesia',
  th: 'ไทย',
  vi: 'Tiếng Việt',
};

/** Maps the phone's first locale to a supported language (zh only when Traditional / TW·HK·MO; any pt → pt-BR). */
export function deviceLanguage(): AppLanguage {
  const l = getLocales()[0];
  const code = l?.languageCode ?? 'en';
  if (code === 'zh') {
    const trad = l?.languageScriptCode === 'Hant' || ['TW', 'HK', 'MO'].includes(l?.regionCode ?? '');
    return trad ? 'zh-TW' : 'en';
  }
  if (code === 'pt') return 'pt-BR';
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(code) ? (code as AppLanguage) : 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ko: { translation: ko },
    ja: { translation: ja },
    'zh-TW': { translation: zhTW },
    es: { translation: es },
    'pt-BR': { translation: ptBR },
    id: { translation: id },
    th: { translation: th },
    vi: { translation: vi },
  },
  lng: deviceLanguage(),
  fallbackLng: 'en',
  // Keep region codes (zh-TW, pt-BR) as resource keys instead of falling back to zh / pt.
  load: 'currentOnly',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
