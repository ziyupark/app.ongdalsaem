import { Tabs } from 'expo-router';
import { useTheme } from '../../src/theme';

/**
 * Home · Community · Timer · Profile. One Tabs navigator so each tab keeps its state (scroll position, loaded data)
 * while another tab is open, and switching is instant. Each screen draws its own TabBar (it hides with that screen's
 * scroll), so the navigator's built-in bar is off. Move between tabs with goTab() from TabBar.
 */
export default function TabsLayout() {
  const { color } = useTheme();
  return (
    <Tabs tabBar={() => null} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: color('bg/default') } }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="community" />
      <Tabs.Screen name="timer" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
