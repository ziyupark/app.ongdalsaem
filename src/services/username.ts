// Handle (username) auto-generation — docs/04-screens/01-sign-in-setup.md 1.3.
// display name → lower-case roman letters (Hangul romanised) → keep a–z 0–9 . _ → "_" + 4 digits. 3–20 chars.

const INITIALS = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
const VOWELS = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
const FINALS = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't'];

/** Revised Romanization of Korean, syllable by syllable (simplified: no sound-change rules). */
export function romanizeHangul(input: string) {
  let out = '';
  for (const ch of input) {
    const code = ch.charCodeAt(0) - 0xac00;
    if (code >= 0 && code < 11172) {
      out += INITIALS[Math.floor(code / 588)] + VOWELS[Math.floor((code % 588) / 28)] + FINALS[code % 28];
    } else {
      out += ch;
    }
  }
  return out;
}

const MAX_BASE = 15; // 20 − "_1234"

export function handleBase(displayName: string) {
  const base = romanizeHangul(displayName)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9._]/g, '')
    .replace(/^[._]+|[._]+$/g, '')
    .slice(0, MAX_BASE);
  return base || 'cook';
}

export function randomHandleDigits() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
}

export function makeHandle(displayName: string, digits: string) {
  return `${handleBase(displayName)}_${digits}`;
}
