import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Logo } from '../src/components/Logo';
import { hasSeenWelcomeLetter } from '../src/lib/flags';
import { supabase } from '../src/lib/supabase';
import { getMyProfile, needsProfileSetup } from '../src/services/profile';
import { gradients, useTheme } from '../src/theme';

const SPLASH_MS = 1200;

/** Where 1.1 goes after 1.2 s (docs/04-screens/00-launch.md 1.1). */
async function nextRoute() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    try {
      const profile = await getMyProfile();
      return needsProfileSetup(profile) ? '/setup/profile' : '/home';
    } catch {
      return '/home';
    }
  }
  return (await hasSeenWelcomeLetter()) ? '/sign-in' : '/welcome';
}

/** 1.1 Splash — 14:2. Sunset glow (Gradient/Sunset, blurred circle, full width) + Logo (Acorn lockup), both centred on the screen. */
export default function Splash() {
  const { color, scheme } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    let alive = true;
    const started = Date.now();
    nextRoute().then((route) => {
      const wait = Math.max(0, SPLASH_MS - (Date.now() - started));
      setTimeout(() => alive && router.replace(route), wait);
    });
    return () => { alive = false; };
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <View pointerEvents="none" style={styles.layer}>
        <View style={styles.glow}>
          {/* Soft edge of the Figma layer blur = the same stops fading to 0. */}
          <Svg width="100%" height="100%" viewBox="0 0 390 390">
            <Defs>
              <RadialGradient id="splash-glow" cx="50%" cy="50%" r="50%">
                {gradients['Gradient/Sunset'].map((s) => (
                  <Stop key={s.offset} offset={s.offset} stopColor={s.color} stopOpacity={s.offset === 0 ? 0.32 : s.offset < 1 ? 0.12 : 0} />
                ))}
              </RadialGradient>
            </Defs>
            <Circle cx={195} cy={195} r={195} fill="url(#splash-glow)" />
          </Svg>
        </View>
      </View>
      <View style={styles.layer}>
        <Logo lockup="Acorn" tagline={t('common.brandTagline')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // Logo and glow share the screen's exact centre, whatever the device height or safe-area insets.
  layer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  glow: { width: '100%', aspectRatio: 1 },
});
