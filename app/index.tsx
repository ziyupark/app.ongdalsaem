import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LaunchBackdrop } from '../src/components/LaunchBackdrop';
import { Logo } from '../src/components/Logo';
import { hasSeenWelcomeLetter } from '../src/lib/flags';
import { supabase } from '../src/lib/supabase';
import { ensureHandle, getMyProfile, needsProfileSetup } from '../src/services/profile';
import { useTheme } from '../src/theme';

const SPLASH_MS = 1200;

/** Where 1.1 goes after 1.2 s (docs/04-screens/00-launch.md 1.1). */
async function nextRoute() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    try {
      const profile = await getMyProfile();
      if (!needsProfileSetup(profile)) return '/home';
      await ensureHandle();
      return '/setup/taste';
    } catch {
      return '/home';
    }
  }
  return (await hasSeenWelcomeLetter()) ? '/sign-in' : '/welcome';
}

/** 1.1 Splash — 1157:10518. Sky + white glows (LaunchBackdrop) over a pond landscape at the bottom + Logo (Wordmark lockup). */
export default function Splash() {
  const { color, scheme } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    let alive = true;
    const started = Date.now();
    // Any failure (session / storage read) still leaves the splash — to Sign in — instead of waiting forever.
    nextRoute().catch(() => '/sign-in' as const).then((route) => {
      const wait = Math.max(0, SPLASH_MS - (Date.now() - started));
      setTimeout(() => alive && router.replace(route), wait);
    });
    return () => { alive = false; };
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {/* 1207:10854 — landscape 390×650, bottom of the frame; the image is placed inside it as in Figma (cropped). */}
      <View pointerEvents="none" style={styles.landscape}>
        <Image source={LANDSCAPE} style={styles.landscapeImage} contentFit="fill" />
      </View>
      <LaunchBackdrop />
      {/* 1207:10883 — Wordmark 36 → 10 → Tagline, centred 19 above the middle. */}
      <View style={styles.center}>
        <Logo lockup="Wordmark" tagline={t('common.brandTagline')} />
      </View>
    </View>
  );
}

const LANDSCAPE = require('../assets/launch/splash-landscape.png');

const styles = StyleSheet.create({
  root: { flex: 1 },
  // Box 390×650 whose bottom meets the frame bottom (844); image 188.64 % × 67.27 % at 0.01 % / 32.8 % of it.
  landscape: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 650, overflow: 'hidden' },
  landscapeImage: { position: 'absolute', left: '0.01%', top: '32.8%', width: '188.64%', height: '67.27%' },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', transform: [{ translateY: -19 }] },
});
