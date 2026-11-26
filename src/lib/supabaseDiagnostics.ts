/**
 * TEMPORARY — Supabase request diagnostics (401 "No API key found in request" on TestFlight).
 * Observes only: the wrapped fetch passes `input` / `init` through unchanged and returns the original response.
 * Off unless EXPO_PUBLIC_SUPABASE_DIAG=1 at build time. Never logs a full key or any Authorization value.
 * Remove: delete this file, app/dev/supabase.tsx, and the lines marked `SUPABASE_DIAG` in
 * src/lib/supabase.ts, app/sign-in.tsx and app/settings/index.tsx.
 * No react-native imports, so it can be unit-tested in Node (scripts/supabaseDiagnostics.test.mjs).
 */

// Literal `process.env.EXPO_PUBLIC_…` so Expo inlines it at build time.
export const SUPABASE_DIAG = process.env.EXPO_PUBLIC_SUPABASE_DIAG === '1';

type Fetch = typeof fetch;

export type ValueInfo = {
  present: boolean;
  masked: string;
  length: number;
  /** Leading / trailing space or tab. */
  edgeWhitespace: boolean;
  hasCR: boolean;
  hasLF: boolean;
  hasQuote: boolean;
  /** Any char outside printable ASCII 0x21–0x7E (control chars, NBSP, zero-width space, …). */
  hasNonPrintable: boolean;
  /** Code points of the unusual chars only, with their index — never the key's normal characters. */
  oddChars: string[];
  startsWithPublishable: boolean;
};

/** "first 14 chars + *** + (length)" — the only form of a key that may be shown or logged. */
export function maskKey(value: string | null | undefined): string {
  if (!value) return '(none)';
  return `${value.slice(0, 14)}***(${value.length})`;
}

export function inspectValue(value: string | null | undefined): ValueInfo {
  const v = value ?? '';
  const oddChars: string[] = [];
  for (let i = 0; i < v.length; i++) {
    const code = v.charCodeAt(i);
    if (code < 0x21 || code > 0x7e || code === 0x22 || code === 0x27) {
      oddChars.push(`#${i}:U+${code.toString(16).toUpperCase().padStart(4, '0')}`);
    }
  }
  return {
    present: v.length > 0,
    masked: maskKey(v),
    length: v.length,
    edgeWhitespace: /^[ \t]|[ \t]$/.test(v),
    hasCR: v.includes('\r'),
    hasLF: v.includes('\n'),
    hasQuote: /["']/.test(v),
    hasNonPrintable: /[^\x21-\x7e]/.test(v),
    oddChars: oddChars.slice(0, 8),
    startsWithPublishable: v.startsWith('sb_publishable_'),
  };
}

type HeadersKind = 'none' | 'Headers' | 'foreign-object' | 'array' | 'object';

function headersKind(h: unknown): HeadersKind {
  if (h == null) return 'none';
  if (typeof Headers !== 'undefined' && h instanceof Headers) return 'Headers';
  if (Array.isArray(h)) return 'array';
  // An object with get/forEach that is NOT this runtime's Headers (e.g. another polyfill's class).
  if (typeof (h as { forEach?: unknown }).forEach === 'function') return 'foreign-object';
  return 'object';
}

/**
 * The header list exactly as expo/fetch (SDK 58 global fetch) turns it into native headers:
 * expo/src/winter/fetch/RequestUtils.ts normalizeHeadersInit — `instanceof Headers` → forEach, array as is,
 * anything else → Object.entries (a foreign Headers instance loses its entries here).
 */
function nativeHeaderList(h: unknown): [string, string][] {
  if (h == null) return [];
  if (Array.isArray(h)) return h as [string, string][];
  if (typeof Headers !== 'undefined' && h instanceof Headers) {
    const out: [string, string][] = [];
    h.forEach((value, key) => out.push([key, value]));
    return out;
  }
  return Object.entries(h as Record<string, string>).map(([k, v]) => [k, String(v)]);
}

function findHeader(list: [string, string][], name: string): string | null {
  const hit = list.find(([k]) => k.toLowerCase() === name);
  return hit ? hit[1] : null;
}

function isRequestLike(input: unknown): input is Request {
  if (input == null || typeof input !== 'object') return false;
  return (typeof Request !== 'undefined' && input instanceof Request) || (typeof (input as Request).url === 'string' && 'headers' in (input as object));
}

/** URL without query / hash (queries can carry tokens). */
function stripQuery(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return url.split(/[?#]/)[0];
  }
}

export type DiagEntry = {
  id: number;
  at: string;
  url: string;
  method: string;
  inputType: 'string' | 'URL' | 'Request' | 'other';
  /** Where the headers that get sent come from (expo/fetch uses init.headers, else the Request's). */
  headersFrom: 'init' | 'request' | 'none';
  headersKind: HeadersKind;
  /** apikey as expo/fetch would hand it to the native request. */
  apikey: ValueInfo;
  /** apikey as seen through `new Request(url, { method, headers })` (spec-normalised view). */
  apikeyViaRequest: ValueInfo | null;
  requestBuildError: string | null;
  authorization: { present: boolean; bearer: boolean; length: number; hasNewline: boolean };
  headerNames: string[];
  status: number | null;
  redirected: boolean | null;
  finalUrl: string | null;
  error: string | null;
};

const MAX = 20;
let seq = 0;
const ring: DiagEntry[] = [];
const listeners = new Set<() => void>();

export function getDiagLog(): DiagEntry[] {
  return [...ring];
}

export function clearDiagLog() {
  ring.length = 0;
  listeners.forEach((l) => l());
}

export function subscribeDiag(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function push(entry: DiagEntry) {
  ring.push(entry);
  if (ring.length > MAX) ring.splice(0, ring.length - MAX);
  listeners.forEach((l) => l());
}

/** Build the log entry for one call (no network, no side effects on input / init). */
export function describeRequest(input: RequestInfo | URL, init?: RequestInit): DiagEntry {
  const req = isRequestLike(input) ? input : null;
  const rawUrl = req ? req.url : String(input);
  const fromInit = init?.headers != null;
  const sent = fromInit ? init!.headers : req?.headers;
  const list = nativeHeaderList(sent);
  const apikey = findHeader(list, 'apikey');
  const auth = findHeader(list, 'authorization');

  let apikeyViaRequest: ValueInfo | null = null;
  let requestBuildError: string | null = null;
  try {
    // No body on purpose: building a Request from a Request with a body would mark the original as used.
    const probe = new Request(rawUrl, { method: init?.method ?? req?.method ?? 'GET', headers: sent as HeadersInit | undefined });
    apikeyViaRequest = inspectValue(probe.headers.get('apikey'));
  } catch (e) {
    requestBuildError = e instanceof Error ? e.message : String(e);
  }

  return {
    id: ++seq,
    at: new Date().toISOString(),
    url: stripQuery(rawUrl),
    method: (init?.method ?? req?.method ?? 'GET').toUpperCase(),
    inputType: typeof input === 'string' ? 'string' : typeof URL !== 'undefined' && input instanceof URL ? 'URL' : req ? 'Request' : 'other',
    headersFrom: fromInit ? 'init' : req ? 'request' : 'none',
    headersKind: headersKind(sent),
    apikey: inspectValue(apikey),
    apikeyViaRequest,
    requestBuildError,
    authorization: {
      present: !!auth,
      bearer: !!auth && /^Bearer /.test(auth),
      length: auth?.length ?? 0,
      hasNewline: !!auth && /[\r\n]/.test(auth),
    },
    headerNames: list.map(([k]) => k.toLowerCase()),
    status: null,
    redirected: null,
    finalUrl: null,
    error: null,
  };
}

/** Observing wrapper for createClient's `global.fetch`. Calls `base(input, init)` with the same arguments. */
export function createDiagnosticFetch(base: Fetch): Fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    let entry: DiagEntry | null = null;
    try {
      entry = describeRequest(input, init);
    } catch {
      entry = null; // diagnostics must never break the request
    }
    try {
      const res = await base(input, init);
      if (entry) {
        entry.status = res.status;
        entry.redirected = typeof res.redirected === 'boolean' ? res.redirected : null;
        entry.finalUrl = res.url ? stripQuery(res.url) : null;
        push(entry);
      }
      return res;
    } catch (e) {
      if (entry) {
        entry.error = e instanceof Error ? e.message : String(e);
        push(entry);
      }
      throw e;
    }
  }) as Fetch;
}

export type DirectResult = { variant: 'raw key' | 'trimmed key'; status: number | null; body: string; error: string | null };

/**
 * Bypasses supabase-js: GET {url}/auth/v1/settings with only an `apikey` header.
 * 200 → key + network fine (problem is in the SDK / wrapper path). 401 → key value or transport.
 * When the key has edge whitespace / newline, also tries the trimmed key — diagnosis only, the app is unchanged.
 */
export async function directSettingsTest(url: string, key: string, fetchImpl: Fetch = fetch): Promise<DirectResult[]> {
  const base = url.trim().replace(/\/+$/, '');
  const variants: { variant: DirectResult['variant']; key: string }[] = [{ variant: 'raw key', key }];
  if (key.trim() !== key) variants.push({ variant: 'trimmed key', key: key.trim() });
  const out: DirectResult[] = [];
  for (const v of variants) {
    try {
      const res = await fetchImpl(`${base}/auth/v1/settings`, { headers: { apikey: v.key } });
      const text = await res.text();
      out.push({ variant: v.variant, status: res.status, body: text.slice(0, 160), error: null });
    } catch (e) {
      out.push({ variant: v.variant, status: null, body: '', error: e instanceof Error ? e.message : String(e) });
    }
  }
  return out;
}

/** Host only (no path) of the configured Supabase URL, plus whether the URL itself looks odd. */
export function inspectUrl(url: string | null | undefined) {
  const v = url ?? '';
  let host = '(invalid)';
  let path = '';
  let scheme = '';
  try {
    const u = new URL(v.trim());
    host = u.host;
    path = u.pathname;
    scheme = u.protocol;
  } catch {
    /* keep defaults */
  }
  return {
    host,
    scheme,
    /** Anything after the host ('/' is fine; '/rest/v1' etc. would shift every endpoint). */
    extraPath: path && path !== '/' ? path : '',
    trailingSlash: v.trim().endsWith('/'),
    edgeWhitespace: v !== v.trim(),
    length: v.length,
  };
}

let taps: number[] = [];
/** Hidden entry: true on the 5th tap within 3 s (only when SUPABASE_DIAG is on). */
export function diagTap(now = Date.now()): boolean {
  if (!SUPABASE_DIAG) return false;
  taps = [...taps.filter((t) => now - t < 3000), now];
  if (taps.length < 5) return false;
  taps = [];
  return true;
}

/** Everything the panel shows, as one masked object (for "Copy all"). */
export function snapshot(extra: Record<string, unknown> = {}) {
  return {
    flag: SUPABASE_DIAG,
    key: inspectValue(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
    url: inspectUrl(process.env.EXPO_PUBLIC_SUPABASE_URL),
    useRnFetch: process.env.EXPO_PUBLIC_USE_RN_FETCH ?? '(unset → expo/fetch is the global fetch)',
    ...extra,
    log: getDiagLog(),
  };
}
