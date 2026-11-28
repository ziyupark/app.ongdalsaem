// Air quality card copy (docs/05-behavior.md §6.11). Only Korean exists so far, so every app language uses it —
// add `airquality-copy.<lang>.json` here for another language. The card renders its Text in `lang`'s font.
import type { AirCopy } from '../lib/airQuality';
import ko from './airquality-copy.ko.json';

const COPIES: Record<string, AirCopy> = { ko: ko as AirCopy };

export function airCopyFor(appLanguage: string): { copy: AirCopy; lang: string } {
  const lang = COPIES[appLanguage] ? appLanguage : COPIES[appLanguage.split('-')[0]] ? appLanguage.split('-')[0] : 'ko';
  return { copy: COPIES[lang], lang };
}
