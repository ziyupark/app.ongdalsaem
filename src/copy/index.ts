// Air quality card copy (docs/05-behavior.md §6.11): airquality-copy.<lang>.json — English and Korean so far.
// Another app language uses English until its file is added here. The card renders its Text in `lang`'s font.
import type { AirCopy } from '../lib/airQuality';
import en from './airquality-copy.en.json';
import ko from './airquality-copy.ko.json';

const COPIES: Record<string, AirCopy> = { en: en as AirCopy, ko: ko as AirCopy };

export function airCopyFor(appLanguage: string): { copy: AirCopy; lang: string } {
  const base = appLanguage.split('-')[0];
  const lang = COPIES[appLanguage] ? appLanguage : COPIES[base] ? base : 'en';
  return { copy: COPIES[lang], lang };
}
