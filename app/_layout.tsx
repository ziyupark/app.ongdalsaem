import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../src/i18n';
import { fontFiles, ThemeProvider, useTheme } from '../src/theme';
import { loadPrefs, usePrefs } from '../src/lib/prefs';
import { usePushSync } from '../src/lib/push';

SplashScreen.preventAutoHideAsync();

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
        {/* Tabs (Home · Community · Timer · Profile) swap instantly — docs/03-ia-and-flows.md "탭 전환 = 즉시". */}
        <Stack.Screen name="home" options={{ animation: 'none', gestureEnabled: false }} />
        <Stack.Screen name="profile" options={{ animation: 'none', gestureEnabled: false }} />
        <Stack.Screen name="community" options={{ animation: 'none', gestureEnabled: false }} />
        {/* 7.1 has no back button in Figma — swipe anywhere to go back. */}
        <Stack.Screen name="dish/[id]" options={{ fullScreenGestureEnabled: true }} />
        <Stack.Screen name="timer" options={{ animation: 'none', gestureEnabled: false }} />
        <Stack.Screen name="settings/document" options={{ presentation: 'transparentModal', animation: 'fade' }} />
        {/* 8.x share flow: no swipe-back mid-form (X asks before discarding). */}
        <Stack.Screen name="share/pick" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
        <Stack.Screen name="share/details" options={{ gestureEnabled: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts(fontFiles);
  const { appearance } = usePrefs();
  useEffect(() => { loadPrefs(); }, []);
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
