import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Linking, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthButton } from '../src/components/AuthButton';
import { Button } from '../src/components/Button';
import { Logo } from '../src/components/Logo';
import { Navigation } from '../src/components/icons/ongdal';
import { LaunchBackdrop } from '../src/components/LaunchBackdrop';
import { Text } from '../src/components/Text';
import { timeOfDayFor } from '../src/components/ScreenHeader';
import { signInWithApple, signInWithDevTestAccount, signInWithGoogle, type SignInResult } from '../src/services/auth';
import { ensureHandle, getMyProfile, needsProfileSetup } from '../src/services/profile';
import { openLegal } from '../src/lib/legal';
import { useTemp } from '../src/lib/prefs';
import { placeLabel } from '../src/lib/useHere';
import { requestDeviceLocation, reverseGeocodeCity, type Place } from '../src/services/location';
import { fetchForecast, type Forecast } from '../src/services/weather';
import { radius, space, useTheme, WEATHER_3D, withAlpha } from '../src/theme';

const FREE_TEAM = !!Constants.expoConfig?.extra?.freeTeam;

type Provider = 'Apple' | 'Google' | 'Dev';

/**
 * 1207:10884 geometry (design px, 844 frame). weather header from y 54, centred: Logo row 40 → 22 → Overline date
 * (with the year) → 8 → Overline place → 7 → Weather card · small (padding 12 16: temp Numeric/XL · condition Title/M ·
 * H/L · until Body/S) → Weather 3D 282×283 starting 4 above the card's bottom (y 250–533).
 * Block · Button at y 544 (11 under the 3D; Apple → Google → caption, gap 10), 142 above the Home Indicator.
 * Landscape (Rectangle 22) = the splash image in a 390×650 box at y 194, cropped lower than on 1.1.
 */
const HEADER_TOP = 54;
const HERO = { w: 282, h: 283, overlap: 4, below: 11 };
const ACTIONS_ABOVE_INDICATOR = 142;
const LANDSCAPE = require('../assets/launch/splash-landscape.png');
const ACTIONS_H = 124;
/** Logo row 40 + 22 + date 14 + 8 + place 14 + 7 + Weather card · small 95. */
const HEADER_H = 200;

type Reading = { place: Place | null; forecast: Forecast };
type WeatherHere = { status: 'loading' | 'ready' | 'denied' | 'failed'; reading: Reading | null };

/**
 * Weather where you are, before sign-in: asks for location (the system prompt; already decided → no prompt), then the
 * rounded coordinates go to the weather function (signed-out reads allowed for coordinates only).
 * - denied: no permission or location services off → "Turn on location" (iOS Settings). Coming back to the app reads again.
 * - failed: located, but the weather couldn't be read (offline, server) → the card stays empty.
 */
function useWeatherHere(): WeatherHere {
  const [state, setState] = useState<WeatherHere>({ status: 'loading', reading: null });
  const [tries, setTries] = useState(0);
  useEffect(() => {
    let alive = true;
    (async (): Promise<WeatherHere> => {
      const coords = await requestDeviceLocation();
      if (__DEV__) console.log('[sign-in weather] location', coords ? 'ok' : 'denied / off');
      if (!coords) return { status: 'denied', reading: null };
      const [place, forecast] = await Promise.all([reverseGeocodeCity(coords).catch(() => null), fetchForecast(coords).catch(() => null)]);
      if (__DEV__) console.log('[sign-in weather] place', place?.city ?? null, '· forecast', forecast ? `${forecast.mood} ${forecast.tempC}°` : 'FAILED (see [weather] above)');
      return forecast ? { status: 'ready', reading: { place, forecast } } : { status: 'failed', reading: null };
    })()
      .catch((e): WeatherHere => { if (__DEV__) console.warn('[sign-in weather]', e); return { status: 'failed', reading: null }; })
      .then((r) => { if (alive) setState(r); });
    return () => { alive = false; };
  }, [tries]);
  // Back from Settings (or any return to the app) while location was off → read again.
  const denied = state.status === 'denied';
  useEffect(() => {
    if (!denied) return;
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') setTries((n) => n + 1); });
    return () => sub.remove();
  }, [denied]);
  return state;
}

/** 1.2 Sign in — 1207:10884. Weather sky + motion + glows (LaunchBackdrop) · landscape · weather header (Logo · date · place · temp card) · Weather 3D of now · Apple · Google · legal caption. */
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

  const { status, reading } = useWeatherHere();
  const f = reading?.forecast;
  const temp = useTemp();
  const lang = i18n.language;
  const where = reading ? placeLabel(reading.place) || reading.forecast.city : '';
  const date = new Date().toLocaleDateString(lang, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const hero = (f?.icon && WEATHER_3D[f.icon] ? f.icon : f?.mood) ?? 'clear';
  // Sky + motion follow the weather now (clear until it's known, or without location).
  const mood = f?.mood ?? 'clear';
  const weather = useMemo(() => ({ mood, timeOfDay: timeOfDayFor(mood, new Date()) }), [mood]);
  const until = f?.until ? t('home.untilLine', { time: f.until.toLocaleTimeString(lang, { hour: 'numeric' }) }) : '';

  // Buttons sit 142 above the Home Indicator; the 3D weather (283 on 844+) shrinks to the room left under the
  // header on small screens (iPhone SE), keeping 11 above the buttons.
  const [headerH, setHeaderH] = useState(HEADER_H);
  const [actionsH, setActionsH] = useState(ACTIONS_H);
  const headerTop = Math.max(insets.top, HEADER_TOP);
  const actionsBottom = insets.bottom + ACTIONS_ABOVE_INDICATOR;
  const actionsTop = height - actionsBottom - actionsH;
  const heroTop = headerTop + headerH - HERO.overlap;
  const k = Math.max(0, Math.min(1, (actionsTop - HERO.below - heroTop) / HERO.h));

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {/* Rectangle 22 (1268:17810): landscape at the bottom, under the sky and the glows (as on 1.1). */}
      <View pointerEvents="none" style={styles.landscape}>
        <Image source={LANDSCAPE} style={styles.landscapeImage} contentFit="fill" />
        {/* The image's top edge sits under the white glow on 844; on taller phones the landscape (bottom-anchored)
            drops below the glow — this 120 fade keeps its edge soft there. */}
        <LinearGradient colors={[color('bg/subtle'), withAlpha(color('bg/subtle'), 0)]} style={styles.landscapeFade} />
      </View>
      <LaunchBackdrop weather={weather} />

      {/* weather header 1268:17791 (centred): Logo row 40 → 22 → Overline date → 8 → Overline place → 7 → Weather card · small. */}
      <View style={[styles.header, { top: headerTop }]} onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}>
        <View style={styles.logoRow}>
          <Logo lockup="Compact" />
        </View>
        <View style={styles.center}>
          {/* 1268:17795 — the place line keeps its height while unknown, so the card doesn't move when it arrives. */}
          <View style={styles.dateBlock}>
            <Text variant="Overline" numberOfLines={1} style={styles.centerText}>{date.toUpperCase()}</Text>
            <Text variant="Overline" numberOfLines={1} style={styles.centerText}>{where ? where.toUpperCase() : ' '}</Text>
          </View>
          {/* Weather card · small 1268:17827 — the space stays while loading / without weather, so nothing jumps.
              Location off → "Turn on location" (Button Outline M, navigation) in its place → iOS Settings. */}
          <View style={styles.cardSlot}>
            <View pointerEvents="none" style={[styles.card, { opacity: f ? 1 : 0 }]} accessible={!!f} accessibilityLabel={f ? [`${temp(f.tempC)}°`, t(`home.condition.${f.mood}`), t('home.hiLo', { hi: temp(f.hi), lo: temp(f.lo) }), until].filter(Boolean).join(', ') : undefined}>
              <View style={styles.tempBox}>
                <Text variant="Numeric/XL" style={styles.tabular}>{f ? `${temp(f.tempC)}°` : '--°'}</Text>
              </View>
              <View style={styles.condition}>
                <Text variant="Title/M" numberOfLines={1}>{f ? t(`home.condition.${f.mood}`) : ' '}</Text>
                <View style={styles.details}>
                  <Text variant="Body/S" color="fg/muted" numberOfLines={1}>{f ? t('home.hiLo', { hi: temp(f.hi), lo: temp(f.lo) }) : ' '}</Text>
                  {until ? <Text variant="Body/S" color="fg/muted" numberOfLines={1}>{until}</Text> : null}
                </View>
              </View>
            </View>
            {status === 'denied' ? (
              <View style={[StyleSheet.absoluteFill, styles.turnOn]}>
                <Button label={t('ask.turnOn')} icon={Navigation} variant="Outline" size="M" onPress={() => Linking.openSettings().catch(() => undefined)} />
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* Weather 3D of the weather now (1132:220; clear until it's known) — 282×283, centred, 4 into the card's bottom. */}
      <Image
        source={WEATHER_3D[hero]}
        style={[styles.hero, { top: heroTop, left: (width - HERO.w * k) / 2, width: HERO.w * k, height: HERO.h * k }]}
        contentFit="contain"
        transition={300}
        pointerEvents="none"
      />

      {/* Block · Button: Apple → Google → caption, gap 10, 142 above the Home Indicator. */}
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
        <View style={[styles.dev, { bottom: insets.bottom + space[4] }]}>
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
  landscapeFade: { position: 'absolute', left: 0, right: 0, top: '43.2%', height: 120 },
  header: { position: 'absolute', left: space[20], right: space[20], gap: 22 },
  logoRow: { height: space[40], flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', gap: 7 },
  dateBlock: { alignItems: 'center', gap: space[8] },
  centerText: { textAlign: 'center' },
  // Weather card · small: padding 12 16, radius 24 (no fill); temp (padding 1 8 4) → 4 → condition (gap 6) / details (gap 2).
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[4], paddingHorizontal: space[16], paddingVertical: space[12], borderRadius: radius.xl },
  tempBox: { paddingHorizontal: space[8], paddingTop: 1, paddingBottom: space[4], alignItems: 'center', justifyContent: 'center' },
  tabular: { fontVariant: ['tabular-nums'] },
  condition: { gap: space[6] },
  cardSlot: { alignSelf: 'stretch', alignItems: 'center' },
  turnOn: { alignItems: 'center', justifyContent: 'center' },
  details: { gap: space[2] },
  hero: { position: 'absolute' },
  actions: { position: 'absolute', left: space[20], right: space[20], gap: space[10] },
  legal: { textAlign: 'center' },
  // Bottom-left over the landscape, clear of the centred logo and the buttons.
  dev: { position: 'absolute', left: space[20] },
});

