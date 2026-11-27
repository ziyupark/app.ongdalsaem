import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Bell, ChevronLeft, MoreHorizontal, Settings } from './icons/ongdal';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDevWeather } from '../lib/devWeather';
import { dayPart } from '../lib/meals';
import { placeLabel, useHere } from '../lib/useHere';
import { hasUnread } from '../services/activity';
import { washScrollY } from '../lib/weatherBackdrop';
import type { WashScroll } from '../lib/useWashScroll';
import { FX_TIMING, space, useTheme, type TimeOfDay, type WeatherMood } from '../theme';
import { bwOn, useWashInk, washOpacity } from '../theme/washInk';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { Logo } from './Logo';
import { MoodGradient } from './MoodGradient';
import { Text } from './Text';
import { WeatherMoodLayer } from './WeatherMoodLayer';

/** Wash height — the same on Home · Community · Timer · Profile. */
const WASH_HEIGHT = 420;
export const WASH_OPACITY = 0.85;
/** The drawn wash: WASH_OPACITY in light mode, weaker in dark mode (theme/washInk washOpacity), over bg/default. */
export function useWashLook() {
  const { color, scheme } = useTheme();
  return { opacity: washOpacity(WASH_OPACITY, scheme), base: color('bg/default') };
}
/** Mood until the weather is known. */
const FALLBACK_MOOD: WeatherMood = 'overcast';

/**
 * The shared weather reading behind the header and the wash (lib/useHere — my location, cached between screens and
 * launches; the one place weather is read). `on` = false only when location is off and no city was chosen (no wash,
 * plain inks). In dev, app/dev/weather.tsx can force the mood and time of day.
 */
export function useScreenWeather() {
  const { here } = useHere();
  const dev = useDevWeather();
  const f = here.forecast;
  const off = here.status === 'off' && !here.place?.city && !dev;
  return { here, forecast: f, on: !off, mood: dev?.mood ?? f?.mood ?? FALLBACK_MOOD, place: placeLabel(here.place) || f?.city || '', off, dev };
}

/** Night = a clear-night sky, or the night part of the day (21–5 h) for any other weather. */
export function timeOfDayFor(mood: WeatherMood, now: Date): TimeOfDay {
  return mood === 'clear-night' || dayPart(now) === 'night' ? 'night' : 'day';
}

/** Wash ink at a spot `at` (0–1 of the wash height) — for text that sits on the wash below the header (e.g. tabs). */
export function useScreenInk(at: number) {
  const { on, mood } = useScreenWeather();
  return useWashInk(on ? mood : null, at, WASH_OPACITY);
}

/**
 * Status bar ink for the wash + the wash itself. On the four tabs the wash (and its weather motion) is the global
 * WeatherBackdrop behind the transparent screen — this only feeds it this screen's scroll offset while focused, so
 * the wash moves up with the content and fades out. `local` (a pushed screen, e.g. another cook's profile): the
 * screen is opaque, so it draws a still wash of its own that scrolls with `wash.style`. `motion` (with `local`, e.g.
 * 7.1 Post detail): that wash also carries my weather's motion (WeatherMoodLayer) — paused while the screen is not
 * focused or the app is in the background, hidden when there is no weather reading (2.6).
 */
export function ScreenWash({ wash, local = false, motion = false }: { wash: WashScroll; local?: boolean; motion?: boolean }) {
  const { scheme } = useTheme();
  const { on, mood } = useScreenWeather();
  const logoInk = useWashInk(on ? mood : null, 0.12, WASH_OPACITY);
  const look = useWashLook();
  const focused = useSharedValue(false);
  useFocusEffect(useCallback(() => {
    if (local) return;
    focused.value = true;
    washScrollY.value = wash.y.value;
    return () => { focused.value = false; };
  }, [local, focused, wash.y]));
  useAnimatedReaction(() => wash.y.value, (v) => { if (focused.value) washScrollY.value = v; });
  return (
    <>
      <StatusBar style={logoInk ? logoInk.bar : scheme === 'dark' ? 'light' : 'dark'} />
      {local && on ? (
        <Animated.View pointerEvents="none" style={[styles.wash, wash.style]}>
          <MoodGradient mood={mood} opacity={look.opacity} base={look.base} />
          {motion ? <LocalMotion /> : null}
        </Animated.View>
      ) : null}
    </>
  );
}

/** Weather motion inside a pushed screen's own wash — runs only while that screen is focused and the app is active. */
function LocalMotion() {
  const { width } = useWindowDimensions();
  const { mood, forecast, dev } = useScreenWeather();
  const fxMood = dev?.mood ?? forecast?.mood ?? null;
  const timeOfDay = dev?.timeOfDay ?? timeOfDayFor(mood, new Date());
  const [focused, setFocused] = useState(false);
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  const [active, setActive] = useState(AppState.currentState !== 'background');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => setActive(st === 'active'));
    return () => sub.remove();
  }, []);
  if (!fxMood) return null;
  return (
    <WeatherMoodLayer
      mood={fxMood}
      timeOfDay={timeOfDay}
      running={focused && active}
      width={width}
      height={WASH_HEIGHT}
      delay={FX_TIMING.startDelay}
    />
  );
}

type Right = 'settings' | 'notifications' | 'more' | 'none';

/**
 * Header shared by Home · Community · Timer · Profile — Frame 1238:15195, identical on every tab so nothing moves when
 * you switch: safe area → row 40 (logo · right button) → 22 → date · place (Overline) → 13 → weather title (Display/XL).
 * Only the space under the title belongs to the screen (12 · Home 18 · Profile 22). All its spacing lives here.
 * `right`: settings / notifications (unread dot) / more (`onMore`: report · block on another cook) / an empty 40 slot.
 * `onBack` swaps the logo for a back button.
 */
/**
 * `withWeather`: Home · Profile — title → 18 → the Weather card below (Profile: 22). Without it (Community · Timer): 12.
 */
export function ScreenHeader({ right, onBack, onMore, onLogoLongPress, withWeather, profile, backBar }: {
  right: Right; onBack?: () => void; onMore?: () => void; onLogoLongPress?: () => void; withWeather?: boolean;
  /** Profile Header 126:4345 (6.1): title → 22 → the card. */
  profile?: boolean;
  /** TopBar Type=timer (1219:18314): plain back 40 · centred Compact logo · empty 40, 52 high, px 12 — 5.1_0 from a recipe step. */
  backBar?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const { forecast: f, on, mood, place, off, here } = useScreenWeather();
  const logoInk = useWashInk(on ? mood : null, 0.12, WASH_OPACITY);
  const overInk = useWashInk(on ? mood : null, 0.26, WASH_OPACITY);
  const titleInk = useWashInk(on ? mood : null, 0.33, WASH_OPACITY);
  const [unread, setUnread] = useState(false);
  useFocusEffect(useCallback(() => {
    if (right === 'notifications') hasUnread().then(setUnread).catch(() => undefined);
  }, [right]));

  const now = useMemo(() => new Date(), [f]);
  const dateLabel = now.toLocaleDateString(i18n.language, { weekday: 'short', month: 'short', day: 'numeric' });
  const city = here.place?.city ?? f?.city ?? '';
  // The big weather title always shows the English copy; screen readers get the user's language.
  const en = useMemo(() => i18n.getFixedT('en'), [i18n]);
  const part = dayPart(now);

  return (
    <View style={[styles.root, withWeather && styles.rootWeather, profile && styles.rootProfile, { paddingTop: insets.top }]}>
      {backBar && onBack ? (
        <View style={styles.bar}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={space[4]} onPress={onBack} style={styles.slotCenter}>
            <Icon icon={ChevronLeft} size={22} />
          </Pressable>
          <Logo lockup="Compact" tone={logoInk?.light ? 'light' : 'ink'} />
          <View style={styles.slot} />
        </View>
      ) : (
      <View style={styles.row}>
        {onBack ? (
          <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={onBack} />
        ) : (
          <Pressable onLongPress={onLogoLongPress} delayLongPress={600} accessible={false}>
            <Logo lockup="Compact" tone={logoInk?.light ? 'light' : 'ink'} />
          </Pressable>
        )}
        {right === 'settings' ? (
          <IconButton icon={Settings} accessibilityLabel={t('profile.settings')} onPress={() => router.push('/settings')} />
        ) : right === 'more' && onMore ? (
          <IconButton bare icon={MoreHorizontal} accessibilityLabel={t('home.more')} onPress={onMore} />
        ) : right === 'notifications' ? (
          <IconButton icon={Bell} accessibilityLabel={t('home.notifications')} dot={unread} onPress={() => router.push('/notifications')} />
        ) : (
          <View style={styles.slot} />
        )}
      </View>
      )}
      <View style={styles.titleBlock}>
        {off ? (
          <>
            <Text variant="Overline" color="fg/muted">{t('home.locationOff.overline', { city: city || 'Seoul' })}</Text>
            <Text variant="Display/XL" accessibilityRole="header" accessibilityLabel={`${t('home.locationOff.titleA')}${t('home.locationOff.titleB')}`} numberOfLines={1} adjustsFontSizeToFit>
              {en('home.locationOff.titleA')}
              <Text variant="Display/XL" color="fg/disabled">{en('home.locationOff.titleB')}</Text>
            </Text>
          </>
        ) : (
          <>
            <Text variant="Overline" color={overInk?.bw ?? bwOn(color('bg/default'))}>{place ? `${dateLabel} · ${place}` : dateLabel}</Text>
            <Text variant="Display/XL" accessibilityRole="header" accessibilityLabel={`${f ? `${t(`home.titleMood.${mood}`)} ` : ''}${t(`home.dayPart.${part}`)}`} numberOfLines={1} adjustsFontSizeToFit color={titleInk?.strong ?? 'fg/default'}>
              {f ? `${en(`home.titleMood.${mood}`)} ` : ''}
              <Text variant="Display/XL" color={titleInk?.disabled ?? 'fg/disabled'}>{en(`home.dayPart.${part}`)}</Text>
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wash: { position: 'absolute', left: 0, right: 0, top: 0, height: WASH_HEIGHT },
  root: { paddingHorizontal: space[20], paddingBottom: space[12] },
  row: { height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  slot: { width: 40, height: 40 },
  // 52 high, px 12 → 8 outside the header's 20 side padding.
  bar: { height: 52, marginHorizontal: -space[8], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  slotCenter: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  // Frame 1238:15195 — row → 22 → [overline → 13 → title], the same on every tab.
  titleBlock: { paddingTop: 22, gap: 13 },
  rootWeather: { paddingBottom: 18 },
  rootProfile: { paddingBottom: 22 },
});
