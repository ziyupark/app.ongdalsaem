// Terms · Privacy · Location terms · Community guidelines · Help center (9.8c) — the published web pages.
// Paste each document's public link (Google Docs: File → Share → Publish to web → Link, or "Anyone with the link").
// `ko` is the official version for users in Korea; every other app language opens `en`.
// A document without a link still opens the 9.8c sheet (the "Coming before launch" notice), so fill all of them
// before submitting to the App Store / Play Store.
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import i18n from '../i18n';

export type LegalDoc = 'terms' | 'privacy' | 'location' | 'guidelines' | 'help';

export const LEGAL_URLS: Record<LegalDoc, { en: string; ko: string }> = {
  terms: { en: '', ko: '' },
  privacy: { en: '', ko: '' },
  location: { en: '', ko: '' },
  guidelines: { en: '', ko: '' },
  help: { en: '', ko: '' },
};

export function legalUrl(doc: LegalDoc): string | null {
  const urls = LEGAL_URLS[doc];
  const url = i18n.language.startsWith('ko') ? urls.ko || urls.en : urls.en || urls.ko;
  return url || null;
}

/** Opens the published document in the in-app browser, or the 9.8c sheet when it has no link yet. */
export async function openLegal(doc: LegalDoc) {
  const url = legalUrl(doc);
  if (!url) {
    if (__DEV__) console.warn(`[legal] no link for "${doc}" yet — set it in src/lib/legal.ts`);
    router.push(`/settings/document?doc=${doc}`);
    return;
  }
  try {
    await WebBrowser.openBrowserAsync(url, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET });
  } catch {
    router.push(`/settings/document?doc=${doc}`);
  }
}
