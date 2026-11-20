import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Bell, ChevronLeft, MoreHorizontal, Settings } from './icons/ongdal';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDevWeather } from '../lib/devWeather';
import { dayPart } from '../lib/meals';
import { placeLabel, useHere } from '../lib/useHere';
import { hasUnread } from '../services/activity';
import { washScrollY } from '../lib/weatherBackdrop';
import type { WashScroll } from '../lib/useWashScroll';
import { space, useTheme, type TimeOfDay, type WeatherMood } from '../theme';
import { bwOn, useWashInk } from '../theme/washInk';
import { IconButton } from './IconButton';
import { Logo } from './Logo';
import { MoodGradient } from './MoodGradient';
import { Text } from './Text';

/** Wash height — the same on Home · Community · Timer · Profile. */
const WASH_HEIGHT = 420;
export const WASH_OPACITY = 0.85;
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
 * screen is opaque, so it draws a still wash of its own that scrolls with `wash.style`.
 */
export function ScreenWash({ wash, local = false }: { wash: WashScroll; local?: boolean }) {
  const { scheme } = useTheme();
  const { on, mood } = useScreenWeather();
  const logoInk = useWashInk(on ? mood : null, 0.12, WASH_OPACITY);
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
          <MoodGradient mood={mood} opacity={WASH_OPACITY} />
        </Animated.View>
      ) : null}
    </>
  );
}

type Right = 'settings' | 'notifications' | 'more' | 'none';

/**
 * Header shared by Home · Community · Timer · Profile (Home 2.1): safe area → row 40 (logo · right button) → 20 →
 * date · place (Overline) → 12 → weather title (Display/XL) → 12. All its spacing lives here — screens add none.
 * `right`: settings / notifications (unread dot) / more (`onMore`: report · block on another cook) / an empty 40 slot.
 * `onBack` swaps the logo for a back button.
 */
export function ScreenHeader({ right, onBack, onMore, onLogoLongPress }: { right: Right; onBack?: () => void; onMore?: () => void; onLogoLongPress?: () => void }) {
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
    <View style={[styles.root, { paddingTop: insets.top }]}>
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
          <IconButton icon={MoreHorizontal} accessibilityLabel={t('home.more')} onPress={onMore} />
        ) : right === 'notifications' ? (
          <IconButton icon={Bell} accessibilityLabel={t('home.notifications')} dot={unread} onPress={() => router.push('/notifications')} />
        ) : (
          <View style={styles.slot} />
        )}
      </View>
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
  titleBlock: { paddingTop: space[20], gap: space[12] },
});
