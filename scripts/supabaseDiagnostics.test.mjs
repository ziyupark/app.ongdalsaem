// TEMPORARY — tests for src/lib/supabaseDiagnostics.ts (remove together with it).
// Run: node --experimental-strip-types --no-warnings --test scripts/supabaseDiagnostics.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClient } from '@supabase/supabase-js';
import { createDiagnosticFetch, describeRequest, directSettingsTest, getDiagLog, clearDiagLog, inspectValue, maskKey } from '../src/lib/supabaseDiagnostics.ts';

const KEY = 'sb_publishable_TESTONLYabcdefghijklmnop';
const URL_ = 'https://example.supabase.co';
const ok = () => Promise.resolve(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }));

test('mask never shows more than 14 chars', () => {
  assert.equal(maskKey(KEY), `sb_publishable***(${KEY.length})`);
  assert.equal(maskKey(''), '(none)');
});

test('apikey kept: plain object headers', () => {
  const e = describeRequest(`${URL_}/auth/v1/token?grant_type=id_token`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  assert.equal(e.headersKind, 'object');
  assert.equal(e.apikey.present, true);
  assert.equal(e.apikeyViaRequest.present, true);
  assert.equal(e.authorization.bearer, true);
  assert.equal(e.url, `${URL_}/auth/v1/token`); // query stripped
});

test('apikey kept: Headers instance', () => {
  const e = describeRequest(`${URL_}/rest/v1/profiles`, { headers: new Headers({ apikey: KEY }) });
  assert.equal(e.headersKind, 'Headers');
  assert.equal(e.apikey.length, KEY.length);
  assert.equal(e.apikeyViaRequest.length, KEY.length);
});

test('apikey kept: Request input without init', () => {
  const req = new Request(`${URL_}/rest/v1/profiles`, { headers: { apikey: KEY } });
  const e = describeRequest(req);
  assert.equal(e.inputType, 'Request');
  assert.equal(e.headersFrom, 'request');
  assert.equal(e.apikey.present, true);
  assert.equal(req.bodyUsed, false);
});

test('a spread Headers instance loses apikey (the classic bug, for reference)', () => {
  const e = describeRequest(`${URL_}/rest/v1/x`, { headers: { ...new Headers({ apikey: KEY }) } });
  assert.equal(e.apikey.present, false);
});

test('newline / zero-width chars are flagged', () => {
  const lf = inspectValue(`${KEY}\n`);
  assert.equal(lf.hasLF, true);
  assert.equal(lf.hasNonPrintable, true);
  assert.deepEqual(lf.oddChars, [`#${KEY.length}:U+000A`]);
  assert.equal(inspectValue(`${KEY}​`).hasNonPrintable, true);
  assert.equal(inspectValue(KEY).hasNonPrintable, false);
});

test('wrapper passes the same arguments and returns the same response', async () => {
  clearDiagLog();
  const seen = [];
  const res = new Response('x', { status: 401 });
  const wrapped = createDiagnosticFetch((input, init) => { seen.push([input, init]); return Promise.resolve(res); });
  const init = { method: 'GET', headers: { apikey: KEY } };
  const out = await wrapped(`${URL_}/auth/v1/settings`, init);
  assert.equal(out, res);
  assert.equal(seen[0][1], init);
  assert.equal(getDiagLog()[0].status, 401);
});

test('ring buffer keeps the last 20', async () => {
  clearDiagLog();
  const wrapped = createDiagnosticFetch(ok);
  for (let i = 0; i < 25; i++) await wrapped(`${URL_}/rest/v1/t${i}`, {});
  const log = getDiagLog();
  assert.equal(log.length, 20);
  assert.equal(log[0].url, `${URL_}/rest/v1/t5`);
});

// RN's global Headers is whatwg-fetch's, whose normalizeValue does NOT trim (Node's undici Headers does).
const { Headers: RNHeaders } = await import('whatwg-fetch/fetch.js');

for (const [runtime, H] of [['Node Headers', globalThis.Headers], ['RN (whatwg-fetch) Headers', RNHeaders]]) {
  for (const [name, key, expectLF] of [['clean key', KEY, false], ['key with trailing LF (EAS paste)', `${KEY}\n`, true]]) {
    test(`supabase-js 2.119 real client, ${runtime}, ${name}`, async () => {
      const NodeHeaders = globalThis.Headers;
      globalThis.Headers = H;
      try {
        clearDiagLog();
        const sb = createClient(URL_, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: createDiagnosticFetch(ok) } });
        await sb.auth.signInWithIdToken({ provider: 'apple', token: 'x.y.z', nonce: 'n' }).catch(() => undefined);
        await sb.from('profiles').select('id');
        const log = getDiagLog();
        const auth = log.find((e) => e.url.endsWith('/auth/v1/token'));
        const rest = log.find((e) => e.url.endsWith('/rest/v1/profiles'));
        assert.ok(auth && rest, 'both requests observed');
        assert.equal(auth.headersKind, 'object'); // auth-js calls global.fetch directly with a plain object
        assert.equal(rest.headersKind, 'Headers'); // postgrest goes through fetchWithAuth -> new Headers(...)
        assert.equal(auth.apikey.present, true);
        assert.equal(rest.apikey.present, true);
        // supabase-js trims the URL but NOT the key: auth requests always carry it as given.
        assert.equal(auth.apikey.hasLF, expectLF);
        assert.equal(auth.authorization.hasNewline, expectLF);
        // REST: only a spec Headers (Node) strips it; RN's whatwg-fetch Headers keeps it.
        assert.equal(rest.apikey.hasLF, H === RNHeaders ? expectLF : false);
      } finally {
        globalThis.Headers = NodeHeaders;
      }
    });
  }
}

test('direct test tries the trimmed key only when it differs', async () => {
  const calls = [];
  const f = (url, init) => { calls.push(init.headers.apikey); return Promise.resolve(new Response('{"external":{}}', { status: 200 })); };
  assert.equal((await directSettingsTest(`${URL_}/`, KEY, f)).length, 1);
  const r = await directSettingsTest(URL_, `${KEY}\n`, f);
  assert.deepEqual(r.map((x) => x.variant), ['raw key', 'trimmed key']);
});
