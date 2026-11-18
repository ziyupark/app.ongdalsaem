// i18n — docs/05-behavior.md §9.1. Language = 9.6 choice → device language → English.
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';

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

/**
 * Strings per language, read only when that language is needed (each file is ~50–90 KB): English (the fallback) is
 * always there, the others are added by ensureLanguage() — at start for the device language, then on a language change.
 */
const LOAD: Record<AppLanguage, () => object> = {
  en: () => en,
  ko: () => require('./ko.json'),
  ja: () => require('./ja.json'),
  'zh-TW': () => require('./zh-TW.json'),
  es: () => require('./es.json'),
  'pt-BR': () => require('./pt-BR.json'),
  id: () => require('./id.json'),
  th: () => require('./th.json'),
  vi: () => require('./vi.json'),
};

/** Make sure a language's strings are loaded — call before i18n.changeLanguage(lng). */
export function ensureLanguage(lng: AppLanguage) {
  if (!i18n.hasResourceBundle(lng, 'translation')) i18n.addResourceBundle(lng, 'translation', LOAD[lng]());
}

const startLng = deviceLanguage();
i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ...(startLng !== 'en' ? { [startLng]: { translation: LOAD[startLng]() } } : {}) },
  lng: startLng,
  fallbackLng: 'en',
  // Keep region codes (zh-TW, pt-BR) as resource keys instead of falling back to zh / pt.
  load: 'currentOnly',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
