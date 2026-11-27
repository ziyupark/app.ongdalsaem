import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { light, type ColorToken, type Palette } from './colors';

export * from './colors';
export * from './layout';
export * from './typography';
export * from './mood';
export * from './gradients';
export * from './effects';
export * from './weatherIcons';
export * from './weatherFx';

type Scheme = 'light' | 'dark';
type Theme = { scheme: Scheme; color: (token: ColorToken) => string; palette: Palette };

const ThemeContext = createContext<Theme | null>(null);

/**
 * Light mode only: the app ignores the device's dark mode (app.json userInterfaceStyle "light" keeps the system UI
 * — alerts, keyboard, pickers — light too). The dark palette stays in colors.ts but is not used.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const value = useMemo<Theme>(() => ({ scheme: 'light', palette: light, color: (t) => light[t] }), []);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const t = useContext(ThemeContext);
  if (!t) throw new Error('useTheme must be used inside <ThemeProvider>');
  return t;
}
