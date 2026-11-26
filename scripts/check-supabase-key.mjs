// TEMPORARY (SUPABASE_DIAG) — check the Supabase key in a dotenv file without printing it.
// Usage: node --experimental-strip-types --no-warnings scripts/check-supabase-key.mjs <env-file>
// Prints only: mask (first 14 + *** + length), odd characters, and the HTTP status of GET /auth/v1/settings
// sent with node:https (which does not trim header values — a CR/LF makes it refuse, like iOS drops it).
import { readFileSync } from 'node:fs';
import https from 'node:https';
import { inspectUrl, inspectValue } from '../src/lib/supabaseDiagnostics.ts';

const file = process.argv[2];
if (!file) { console.error('usage: check-supabase-key.mjs <env-file>'); process.exit(2); }
const raw = readFileSync(file, 'utf8');

/** Raw value of NAME= — keeps quotes / spaces; decodes "\n" escapes inside double quotes the way dotenv does. */
function read(name) {
  const line = raw.split('\n').find((l) => l.startsWith(`${name}=`));
  if (line == null) return null;
  let v = line.slice(name.length + 1);
  const rawHasQuotes = /^\s*["']/.test(v);
  if (/^".*"\s*$/.test(v)) v = v.trim().slice(1, -1).replace(/\\n/g, '\n').replace(/\\r/g, '\r');
  else if (/^'.*'\s*$/.test(v)) v = v.trim().slice(1, -1);
  return { value: v.replace(/\r$/, ''), rawHasQuotes, fileLineEndsCR: line.endsWith('\r') };
}

const url = read('EXPO_PUBLIC_SUPABASE_URL');
const key = read('EXPO_PUBLIC_SUPABASE_ANON_KEY');
console.log('url :', url ? inspectUrl(url.value) : 'MISSING');
console.log('key :', key ? { ...inspectValue(key.value), quotedInFile: key.rawHasQuotes, fileLineEndsCR: key.fileLineEndsCR } : 'MISSING');
if (!url || !key) process.exit(1);

const get = (k) => new Promise((resolve) => {
  try {
    const req = https.get(`${url.value.trim().replace(/\/+$/, '')}/auth/v1/settings`, { headers: { apikey: k } }, (res) => {
      res.resume();
      resolve(String(res.statusCode));
    });
    req.on('error', (e) => resolve(`error ${e.code ?? e.message}`));
  } catch (e) {
    resolve(`refused locally: ${e.code ?? e.message}`); // e.g. ERR_INVALID_CHAR for a newline
  }
});
console.log('GET /auth/v1/settings, raw key    :', await get(key.value));
if (key.value.trim() !== key.value) console.log('GET /auth/v1/settings, trimmed key:', await get(key.value.trim()));
