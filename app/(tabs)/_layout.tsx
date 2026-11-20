import { Tabs, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { setTabsOnTop } from '../../src/components/TabBar';
import { useTheme } from '../../src/theme';

/**
 * Home · Community · Timer · Profile. One Tabs navigator so each tab keeps its state (scroll position, loaded data)
 * while another tab is open, and switching is instant. Each screen draws its own TabBar (it hides with that screen's
 * scroll), so the navigator's built-in bar is off. Move between tabs with goTab() from TabBar.
 * freezeOnBlur: a tab in the background doesn't re-render (e.g. the Timer's 1 s tick) until it is shown again.
 * Scenes are transparent: the global WeatherBackdrop (app/_layout.tsx) is the tabs' background.
 */
export default function TabsLayout() {
  const { color } = useTheme();
  // goTab() switches tabs directly while they are on top, and pops back to them otherwise.
  useFocusEffect(useCallback(() => {
    setTabsOnTop(true);
    return () => setTabsOnTop(false);
  }, []));
  return (
    <Tabs tabBar={() => null} screenOptions={{ headerShown: false, freezeOnBlur: true, sceneStyle: { backgroundColor: 'transparent' } }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="community" />
      <Tabs.Screen name="timer" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
