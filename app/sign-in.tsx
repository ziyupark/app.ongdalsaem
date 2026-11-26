import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthButton } from '../src/components/AuthButton';
import { Button } from '../src/components/Button';
import { Logo } from '../src/components/Logo';
import { WelcomeMesh } from '../src/components/WelcomeMesh';
import { Text } from '../src/components/Text';
import { signInWithApple, signInWithDevTestAccount, signInWithGoogle, type SignInResult } from '../src/services/auth';
import { getMyProfile, needsProfileSetup } from '../src/services/profile';
import { openLegal } from '../src/lib/legal';
import { diagTap, SUPABASE_DIAG } from '../src/lib/supabaseDiagnostics'; // SUPABASE_DIAG (temporary)
import { space, useTheme, withAlpha } from '../src/theme';

const FREE_TEAM = !!Constants.expoConfig?.extra?.freeTeam;

type Provider = 'Apple' | 'Google' | 'Dev';

/** 1.2 Sign in (Welcome) — 14:67. Photo on top, Apple · Google at the bottom (Google = y 754–800). */
export default function SignIn() {
  const insets = useSafeAreaInsets();
  const { color } = useTheme();
  const { t } = useTranslation();
  const [busy, setBusy] = useState<Provider | null>(null);
  const [failed, setFailed] = useState(false);

  const run = async (provider: Provider) => {
    setBusy(provider);
    setFailed(false);
    try {
      const result: SignInResult =
        provider === 'Apple' ? await signInWithApple() : provider === 'Google' ? await signInWithGoogle() : await signInWithDevTestAccount();
      if (result.status === 'cancelled') return;
      const profile = await getMyProfile();
      if (needsProfileSetup(profile)) router.push({ pathname: '/setup/profile', params: { name: result.suggestedName } });
      else router.replace('/home');
    } catch (e) {
      console.warn('[sign-in]', e);
      setFailed(true);
    } finally {
      setBusy(null);
    }
  };

  const bg = color('bg/default');
  const ink = color('static/ink');

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar style="light" />
      {/* Hero 390×420 = Gradient/Welcome + Fade (270–420, transparent → bg/default) + Scrim top (0–120, ink 45% → 0 at 40%). */}
      <View style={styles.photo} pointerEvents="none">
        <WelcomeMesh />
        <LinearGradient colors={[withAlpha(bg, 0), bg]} style={styles.fade} />
        <LinearGradient colors={[color('overlay/scrim'), withAlpha(ink, 0)]} style={styles.scrim} />
      </View>

      <View style={styles.copy}>
        {/* SUPABASE_DIAG (temporary): 5 taps on the logo → diagnostics, only in a diagnostics build. */}
        {SUPABASE_DIAG ? (
          <Pressable onPress={() => diagTap() && router.push('/dev/supabase')}><Logo lockup="Compact" /></Pressable>
        ) : (
          <Logo lockup="Compact" />
        )}
        <View style={{ height: space[10] }} />
        <Text variant="Display/L" accessibilityRole="header">{t('signIn.title')}</Text>
        <View style={{ height: space[8] }} />
        <Text variant="Body/M" color="fg/secondary">{t('signIn.body')}</Text>
      </View>

      {/* Block · Button (fixed): caption → Apple → Google, gap 10, bottom = home indicator + 10. */}
      <View style={[styles.actions, { bottom: Math.max(insets.bottom, space[24]) + space[10] }]}>
        <Text variant="Caption" color={failed ? 'fg/destructive' : 'fg/muted'} style={styles.legal}>
          {failed ? (
            t('signIn.error')
          ) : (
            <>
              {t('signIn.legalPrefix')}
              {/* Terms / Privacy open the published documents (src/lib/legal.ts) — accepting them is the EULA (1.2). */}
              <Text variant="Caption Strong" color="fg/secondary" accessibilityRole="link" onPress={() => openLegal('terms')} suppressHighlighting>{t('signIn.terms')}</Text>
              {t('signIn.and')}
              <Text variant="Caption Strong" color="fg/secondary" accessibilityRole="link" onPress={() => openLegal('privacy')} suppressHighlighting>{t('signIn.privacy')}</Text>
              {t('signIn.legalSuffix')}
            </>
          )}
        </Text>
        {/* The free-Apple-ID test build (FREE_APPLE_TEAM=1) can't sign in with Apple. */}
        {FREE_TEAM ? null : <AuthButton provider="Apple" label={t('signIn.apple')} onPress={() => run('Apple')} loading={busy === 'Apple'} disabled={busy !== null} />}
        <AuthButton provider="Google" label={t('signIn.google')} onPress={() => run('Google')} loading={busy === 'Google'} disabled={busy !== null} />
      </View>

      {/* DEV ONLY — not in the design; stripped from release builds. */}
      {__DEV__ ? (
        <View style={[styles.dev, { top: insets.top + space[8] }]}>
          <Button label="Dev · test account" variant="Ghost" size="S" onPress={() => run('Dev')} loading={busy === 'Dev'} disabled={busy !== null} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  photo: { position: 'absolute', left: 0, right: 0, top: 0, height: 420 },
  fade: { position: 'absolute', left: 0, right: 0, top: 270, height: 150 },
  scrim: { position: 'absolute', left: 0, right: 0, top: 0, height: 120, opacity: 0.4 },
  // Logo y 424 → title 460 → body 542 (on the cream, below the photo).
  copy: { position: 'absolute', left: space[20], right: space[20], top: 424 },
  actions: { position: 'absolute', left: space[20], right: space[20], gap: space[10] },
  legal: { textAlign: 'center' },
  dev: { position: 'absolute', right: space[20] },
});

