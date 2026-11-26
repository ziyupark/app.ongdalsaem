import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthButton } from '../src/components/AuthButton';
import { Button } from '../src/components/Button';
import { Logo } from '../src/components/Logo';
import { LaunchBackdrop } from '../src/components/LaunchBackdrop';
import { Text } from '../src/components/Text';
import { signInWithApple, signInWithDevTestAccount, signInWithGoogle, type SignInResult } from '../src/services/auth';
import { getMyProfile, needsProfileSetup } from '../src/services/profile';
import { openLegal } from '../src/lib/legal';
import { space, useTheme } from '../src/theme';

const FREE_TEAM = !!Constants.expoConfig?.extra?.freeTeam;

type Provider = 'Apple' | 'Google' | 'Dev';

const SUN = require('../assets/launch/sun-3d.png');
const ACORN = require('../assets/launch/acorn-3d.png');
const SUN_SHADOW = require('../assets/launch/sun-shadow.png');

/**
 * 1207:10995 geometry (design px). Sun frame 385 at y 89. Acorn 179 rotated 15.28° in a 219.84 box at (157, 145) of the
 * frame → its own box at (157 + 20.42, 145 + 20.42). Shadow: ellipse 324×41 at y 398; the exported asset adds the blur
 * margin (366.2×83.2, 21.1 above).
 */
const ART = {
  top: 89,
  size: 385,
  acorn: { x: 157 + (219.836 - 179) / 2, y: 145 + (219.836 - 179) / 2, size: 179 },
  shadow: { y: 398 - 21.1, w: 366.2, h: 83.2 },
};

/** 1.2 Sign in — 1207:10884. Sky + glows (LaunchBackdrop), 3D sun with acorn on top, copy from y 482, Apple · Google at the bottom (Google = y 754–800). */
export default function SignIn() {
  const insets = useSafeAreaInsets();
  const { color } = useTheme();
  const { width } = useWindowDimensions();
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

  // "3d icon" 1207:10995 — the 385 frame sits at x 2 in the 390 frame (centred); everything inside is placed from it.
  const artLeft = (width - ART.size) / 2;

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
      <StatusBar style="dark" />
      <LaunchBackdrop />
      {/* Hero "3d icon": shadow ellipse 324×41 at y 398 (asset incl. its blur) → Weather 3D / clear 385 at y 89 → Brand 3D / acorn 179, 15.28°. */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Image source={SUN_SHADOW} style={[styles.shadow, { left: (width - ART.shadow.w) / 2 }]} contentFit="fill" />
        <Image source={SUN} style={[styles.sun, { left: artLeft }]} contentFit="cover" />
        <Image source={ACORN} style={[styles.acorn, { left: artLeft + ART.acorn.x }]} contentFit="cover" />
      </View>

      <View style={styles.copy}>
        <Logo lockup="Compact" />
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
  shadow: { position: 'absolute', top: ART.shadow.y, width: ART.shadow.w, height: ART.shadow.h },
  sun: { position: 'absolute', top: ART.top, width: ART.size, height: ART.size },
  acorn: { position: 'absolute', top: ART.top + ART.acorn.y, width: ART.acorn.size, height: ART.acorn.size, transform: [{ rotate: '15.28deg' }] },
  // Logo y 482 → 10 → title 518 → 8 → body 600 (below the 3D art).
  copy: { position: 'absolute', left: space[20], right: space[20], top: 482 },
  actions: { position: 'absolute', left: space[20], right: space[20], gap: space[10] },
  legal: { textAlign: 'center' },
  dev: { position: 'absolute', right: space[20] },
});

