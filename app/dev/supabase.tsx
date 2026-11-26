import * as Application from 'expo-application';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Text } from '../../src/components/Text';
import { loadClipboard } from '../../src/lib/optionalNative';
import {
  clearDiagLog,
  directSettingsTest,
  getDiagLog,
  inspectUrl,
  inspectValue,
  snapshot,
  subscribeDiag,
  type DirectResult,
  type ValueInfo,
} from '../../src/lib/supabaseDiagnostics';
import { SUPABASE_DIAG, SUPABASE_DIAG_SOURCES } from '../../src/lib/supabaseDiagFlag';
import { radius, space, useTheme } from '../../src/theme';

/**
 * TEMPORARY — Supabase request diagnostics (SUPABASE_DIAG). Opened from the sign-in "Diagnostics" button,
 * the sign-in logo or the Settings version line (5 taps) — only in the `diagnostic` EAS build. Not translated: never shipped to users.
 * Shows keys masked only (first 14 chars + *** + length).
 */
export default function SupabaseDiagnostics() {
  const insets = useSafeAreaInsets();
  const { color } = useTheme();
  const [log, setLog] = useState(getDiagLog);
  const [direct, setDirect] = useState<DirectResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => subscribeDiag(() => setLog(getDiagLog())), []);
  if (!SUPABASE_DIAG) return <Redirect href="/" />;

  const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const rawKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const key = inspectValue(rawKey);
  const url = inspectUrl(rawUrl);
  const build = {
    app: `${Application.nativeApplicationVersion ?? '?'} (${Application.nativeBuildVersion ?? '?'})`,
    platform: `${Platform.OS} ${String(Platform.Version)}`,
    dev: __DEV__,
    expoUpdates: 'not installed — the app always runs the bundle embedded at build time (no OTA)',
  };

  const runDirect = async () => {
    setRunning(true);
    try {
      setDirect(await directSettingsTest(rawUrl, rawKey));
    } finally {
      setRunning(false);
    }
  };
  const copyAll = async () => {
    const text = JSON.stringify(snapshot({ flag: SUPABASE_DIAG_SOURCES, build, direct }), null, 2);
    await loadClipboard()?.setStringAsync(text);
    setCopied(true);
  };

  const card = [styles.card, { backgroundColor: color('bg/subtle') }];
  return (
    <ScrollView style={{ backgroundColor: color('bg/default') }} contentContainerStyle={[styles.root, { paddingTop: insets.top + space[16], paddingBottom: insets.bottom + space[24] }]}>
      <Text variant="Title/L">Supabase diagnostics</Text>
      <Text variant="Caption" color="fg/muted">Temporary build. Keys are masked.</Text>

      <View style={card}>
        <Text variant="Title/S">API key (EXPO_PUBLIC_SUPABASE_ANON_KEY)</Text>
        <KeyLines info={key} />
      </View>

      <View style={card}>
        <Text variant="Title/S">URL</Text>
        <Line k="host" v={url.host} />
        <Line k="scheme" v={url.scheme} />
        <Line k="extra path" v={url.extraPath || '(none)'} bad={!!url.extraPath} />
        <Line k="trailing slash" v={String(url.trailingSlash)} />
        <Line k="edge whitespace" v={String(url.edgeWhitespace)} bad={url.edgeWhitespace} />
      </View>

      <View style={card}>
        <Text variant="Title/S">Build</Text>
        <Line k="app" v={build.app} />
        <Line k="platform" v={build.platform} />
        <Line k="__DEV__" v={String(build.dev)} />
        <Line k="expo-updates" v={build.expoUpdates} />
        <Line k="flag (extra / env)" v={`${SUPABASE_DIAG_SOURCES.extra} / ${SUPABASE_DIAG_SOURCES.env}`} />
        <Line k="EXPO_PUBLIC_USE_RN_FETCH" v={process.env.EXPO_PUBLIC_USE_RN_FETCH ?? '(unset → expo/fetch)'} />
      </View>

      <View style={card}>
        <Text variant="Title/S">Direct request (no SDK)</Text>
        <Text variant="Caption" color="fg/muted">GET /auth/v1/settings with only an apikey header.</Text>
        <Button label="Run direct test" size="M" onPress={runDirect} loading={running} disabled={running} />
        {direct?.map((r) => (
          <View key={r.variant} style={styles.entry}>
            <Line k={r.variant} v={r.status == null ? `error: ${r.error}` : String(r.status)} bad={r.status !== 200} />
            <Text variant="Caption" color="fg/muted">{r.body}</Text>
          </View>
        ))}
      </View>

      <View style={card}>
        <Text variant="Title/S">{`Requests (last ${log.length}/20)`}</Text>
        {log.length === 0 ? <Text variant="Caption" color="fg/muted">No requests yet — go back and try signing in.</Text> : null}
        {[...log].reverse().map((e) => (
          <View key={e.id} style={[styles.entry, { borderColor: color('border/default') }]}>
            <Text variant="Caption Strong">{`#${e.id} ${e.method} ${e.url}`}</Text>
            <Line k="status" v={e.status == null ? `error: ${e.error}` : `${e.status}${e.redirected ? ' (redirected)' : ''}`} bad={e.status == null || e.status >= 400} />
            {e.finalUrl && e.finalUrl !== e.url ? <Line k="final url" v={e.finalUrl} bad /> : null}
            <Line k="input / headers" v={`${e.inputType} · ${e.headersFrom} · ${e.headersKind}`} />
            <KeyLines info={e.apikey} />
            {e.apikeyViaRequest ? <Line k="apikey via new Request" v={e.apikeyViaRequest.masked} bad={!e.apikeyViaRequest.present} /> : null}
            {e.requestBuildError ? <Line k="new Request error" v={e.requestBuildError} bad /> : null}
            <Line k="authorization" v={e.authorization.present ? `present · Bearer ${e.authorization.bearer} · len ${e.authorization.length}` : 'absent'} bad={e.authorization.hasNewline} />
            <Line k="header names" v={e.headerNames.join(', ') || '(none)'} />
          </View>
        ))}
      </View>

      <View style={styles.row}>
        <Button label={copied ? 'Copied' : 'Copy all (masked)'} size="M" onPress={copyAll} />
        <Button label="Clear log" variant="Outline" size="M" onPress={clearDiagLog} />
        <Button label="Close" variant="Outline" size="M" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      </View>
    </ScrollView>
  );
}

function KeyLines({ info }: { info: ValueInfo }) {
  return (
    <>
      <Line k="apikey" v={info.masked} bad={!info.present} />
      <Line k="sb_publishable_ prefix" v={String(info.startsWithPublishable)} />
      <Line k="edge space/tab" v={String(info.edgeWhitespace)} bad={info.edgeWhitespace} />
      <Line k="CR / LF" v={`${info.hasCR} / ${info.hasLF}`} bad={info.hasCR || info.hasLF} />
      <Line k="quotes" v={String(info.hasQuote)} bad={info.hasQuote} />
      <Line k="non-printable" v={info.hasNonPrintable ? info.oddChars.join(' ') : 'false'} bad={info.hasNonPrintable} />
    </>
  );
}

function Line({ k, v, bad }: { k: string; v: string; bad?: boolean }) {
  return (
    <Text variant="Caption" color={bad ? 'fg/destructive' : 'fg/secondary'}>
      <Text variant="Caption Strong" color="fg/muted">{`${k}: `}</Text>
      {v}
    </Text>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: space[20], gap: space[12] },
  card: { borderRadius: radius.md, padding: space[16], gap: space[6] },
  entry: { gap: space[2], paddingTop: space[8], borderTopWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8] },
});
