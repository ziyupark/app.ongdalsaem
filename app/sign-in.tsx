import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthButton } from '../src/components/AuthButton';
import { Button } from '../src/components/Button';
import { Logo } from '../src/components/Logo';
import { LaunchBackdrop } from '../src/components/LaunchBackdrop';
import { Text } from '../src/components/Text';
import { WeatherNow } from '../src/components/WeatherNow';
import { signInWithApple, signInWithDevTestAccount, signInWithGoogle, type SignInResult } from '../src/services/auth';
import { ensureHandle, getMyProfile, needsProfileSetup } from '../src/services/profile';
import { openLegal } from '../src/lib/legal';
import { useTemp } from '../src/lib/prefs';
import { placeLabel } from '../src/lib/useHere';
import { requestDeviceLocation, reverseGeocodeCity, type Place } from '../src/services/location';
import { fetchForecast, type Forecast } from '../src/services/weather';
import { space, useTheme, WEATHER_3D } from '../src/theme';

const FREE_TEAM = !!Constants.expoConfig?.extra?.freeTeam;

type Provider = 'Apple' | 'Google' | 'Dev';

/**
 * 1207:10884 geometry (design px, 844 frame). Weather header y 54–215; Weather 3D 355×359 at y 215 (right under the
 * header, ending where the buttons start); Block · Button at y 574 (Apple → Google → caption, gap 10), 112 above the
 * Home Indicator. Landscape (Rectangle 22) = the splash image in a 390×650 box at y 194, cropped lower than on 1.1.
 */
const HEADER_TOP = 54;
const HERO = { w: 355, h: 359, above: 0, below: 0 };
const ACTIONS_ABOVE_INDICATOR = 112;
const LANDSCAPE = require('../assets/launch/splash-landscape.png');
const ACTIONS_H = 124;
const HEADER_H = 161;

type Reading = { place: Place | null; forecast: Forecast } | null;

/**
 * Weather where you are, before sign-in: asks for location (the system prompt; already decided → no prompt), then the
 * rounded coordinates go to the weather function (signed-out reads allowed for coordinates only). Denied or offline
 * → null (date only, no Weather Now).
 */
function useWeatherHere() {
  const [reading, setReading] = useState<Reading | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    (async () => {
      const coords = await requestDeviceLocation();
      if (!coords) return null;
      const [place, forecast] = await Promise.all([reverseGeocodeCity(coords).catch(() => null), fetchForecast(coords).catch(() => null)]);
      return forecast ? { place, forecast } : null;
    })()
      .catch(() => null)
      .then((r) => { if (alive) setReading(r); });
    return () => { alive = false; };
  }, []);
  return reading;
}

/** 1.2 Sign in — 1207:10884. Sky + glows (LaunchBackdrop) · weather header (Logo · date · place · Weather Now) · Weather 3D of now · Apple · Google · legal caption. */
export default function SignIn() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { color, scheme } = useTheme();
  const { t, i18n } = useTranslation();
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
      // New account: automatic @username, then onboarding from Taste (no nickname step).
      if (needsProfileSetup(profile)) {
        await ensureHandle(result.suggestedName);
        router.push('/setup/taste');
      }
      else router.replace('/home');
    } catch (e) {
      console.warn('[sign-in]', e);
      setFailed(true);
    } finally {
      setBusy(null);
    }
  };

  const reading = useWeatherHere();
  const f = reading?.forecast;
  const temp = useTemp();
  const lang = i18n.language;
  const where = reading ? placeLabel(reading.place) || reading.forecast.city : '';
  const date = new Date().toLocaleDateString(lang, { weekday: 'short', month: 'short', day: 'numeric' });
  const hero = (f?.icon && WEATHER_3D[f.icon] ? f.icon : f?.mood) ?? 'clear';

  // Buttons sit 112 above the Home Indicator; the 3D weather fills the room between the header and the buttons
  // (359 on 844+, smaller on iPhone SE).
  const [headerH, setHeaderH] = useState(HEADER_H);
  const [actionsH, setActionsH] = useState(ACTIONS_H);
  const headerTop = Math.max(insets.top, HEADER_TOP);
  const actionsBottom = insets.bottom + ACTIONS_ABOVE_INDICATOR;
  const actionsTop = height - actionsBottom - actionsH;
  const room = actionsTop - HERO.below - (headerTop + headerH + HERO.above);
  const k = Math.max(0, Math.min(1, room / HERO.h));
  const heroH = HERO.h * k;
  const heroTop = actionsTop - HERO.below - heroH - (room - heroH) / 2;

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {/* Rectangle 22 (1268:17810): landscape at the bottom, under the sky and the glows (as on 1.1). */}
      <View pointerEvents="none" style={styles.landscape}>
        <Image source={LANDSCAPE} style={styles.landscapeImage} contentFit="fill" />
      </View>
      <LaunchBackdrop />

      {/* weather header 1268:17791: Logo row 40 → 22 → Overline date · place → 13 → Weather Now. */}
      <View style={[styles.header, { top: headerTop }]} onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}>
        <View style={styles.logoRow}>
          <Logo lockup="Compact" />
        </View>
        <View style={styles.now}>
          <Text variant="Overline" numberOfLines={1}>{(where ? `${date} · ${where}` : date).toUpperCase()}</Text>
          {f ? (
            <WeatherNow
              mood={f.mood}
              icon={f.icon}
              now={t('signIn.weatherNow', { condition: t(`home.condition.${f.mood}`), temp: temp(f.tempC) })}
              place={t('community.rightNow', { place: where })}
              range={t('home.hiLo', { hi: temp(f.hi), lo: temp(f.lo) })}
            />
          ) : null}
        </View>
      </View>

      {/* Weather 3D of the weather now (1132:220; clear until it's known) — 355×359, centred. */}
      <Image
        source={WEATHER_3D[hero]}
        style={[styles.hero, { top: heroTop, left: (width - HERO.w * k) / 2, width: HERO.w * k, height: heroH }]}
        contentFit="contain"
        transition={300}
        pointerEvents="none"
      />

      {/* Block · Button: Apple → Google → caption, gap 10, 112 above the Home Indicator. */}
      <View style={[styles.actions, { bottom: actionsBottom }]} onLayout={(e) => setActionsH(e.nativeEvent.layout.height)}>
        {/* The free-Apple-ID test build (FREE_APPLE_TEAM=1) can't sign in with Apple. */}
        {FREE_TEAM ? null : <AuthButton provider="Apple" label={t('signIn.apple')} onPress={() => run('Apple')} loading={busy === 'Apple'} disabled={busy !== null} />}
        <AuthButton provider="Google" label={t('signIn.google')} onPress={() => run('Google')} loading={busy === 'Google'} disabled={busy !== null} />
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
 // Box 390×650 whose bottom meets the frame bottom (844); image 188.64 % × 67.27 % at 0.01 % / 43.2 % of it.
  landscape: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 650, overflow: 'hidden' },
  landscapeImage: { position: 'absolute', left: '0.01%', top: '43.2%', width: '188.64%', height: '67.27%' },
  header: { position: 'absolute', left: space[20], right: space[20], gap: 22 },
  logoRow: { height: space[40], flexDirection: 'row', alignItems: 'center' },
  now: { gap: 13 },
  hero: { position: 'absolute' },
  actions: { position: 'absolute', left: space[20], right: space[20], gap: space[10] },
  legal: { textAlign: 'center' },
  dev: { position: 'absolute', right: space[20] },
});

