import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast } from '../src/components/Toast';
import { deviceLanguage } from '../src/i18n';
import { coreFontFiles, koreanFontFiles, ThemeProvider, useTheme } from '../src/theme';
import { loadPrefs, usePrefs } from '../src/lib/prefs';
import { usePushSync } from '../src/lib/push';
import { dismissDone, focusTimer, useDoneQueue, useTimers } from '../src/lib/timers';

SplashScreen.preventAutoHideAsync();

/** App open: a finished timer shows "<label> — done" for 3 s, one at a time; tap → Timer screen with it on the big ring. */
function TimerDoneToast() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const queue = useDoneQueue();
  const timers = useTimers();
  const id = queue[0];
  const timer = id ? timers.find((x) => x.id === id) : undefined;
  useEffect(() => { if (id && !timer) dismissDone(id); }, [id, timer]);
  const hide = useCallback(() => { if (id) dismissDone(id); }, [id]);
  if (!timer) return null;
  return (
    <Toast
      key={timer.id}
      visible
      duration={3000}
      message={t('timer.labelDone', { label: timer.label })}
      onHide={hide}
      onPress={() => { hide(); focusTimer(timer.id); router.dismissTo('/timer'); }}
      bottom={insets.bottom + 96}
    />
  );
}

function Root() {
  const { color, scheme } = useTheme();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color('bg/default') } }}>
        {/* 1.1 → 1.1b / 1.2 / Home are replacements, not pushes: no swipe-back into the splash. */}
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="welcome" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="sign-in" options={{ animation: 'fade', gestureEnabled: false }} />
        {/* Tabs (Home · Community · Timer · Profile) — one Tabs navigator, swaps instantly (docs/03-ia-and-flows.md "탭 전환 = 즉시"). */}
        <Stack.Screen name="(tabs)" options={{ animation: 'none', gestureEnabled: false }} />
        {/* 7.1 has no back button in Figma — swipe anywhere to go back. */}
        <Stack.Screen name="dish/[id]" options={{ fullScreenGestureEnabled: true }} />
        <Stack.Screen name="settings/document" options={{ presentation: 'transparentModal', animation: 'fade' }} />
        {/* 8.x share flow: no swipe-back mid-form (X asks before discarding). */}
        <Stack.Screen name="share/pick" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
        <Stack.Screen name="share/details" options={{ gestureEnabled: false }} />
      </Stack>
      <TimerDoneToast />
    </>
  );
}

export default function RootLayout() {
  // Both sets start loading now. The splash waits for Noto Sans KR (~12 MB) only when the UI is Korean — the only
  // language that draws it (components/Text); for everyone else it finishes in the background.
  const [coreLoaded] = useFonts(coreFontFiles);
  const [koreanLoaded] = useFonts(koreanFontFiles);
  const [prefsReady, setPrefsReady] = useState(false);
  const { appearance, language } = usePrefs();
  useEffect(() => { loadPrefs().finally(() => setPrefsReady(true)); }, []);
  const loaded = coreLoaded && prefsReady && (koreanLoaded || (language ?? deviceLanguage()) !== 'ko');
  usePushSync();
  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);
  if (!loaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider appearance={appearance}>
          <Root />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
