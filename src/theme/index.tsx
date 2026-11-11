import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { dark, light, type ColorToken, type Palette } from './colors';

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

/** appearance: 'system' | 'light' | 'dark' (9.1 Appearance sheet). */
export function ThemeProvider({ appearance = 'system', children }: { appearance?: 'system' | Scheme; children: ReactNode }) {
  const system = useColorScheme();
  const scheme: Scheme = appearance === 'system' ? (system === 'dark' ? 'dark' : 'light') : appearance;
  const value = useMemo<Theme>(() => {
    const palette = scheme === 'dark' ? dark : light;
    return { scheme, palette, color: (t) => palette[t] };
  }, [scheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const t = useContext(ThemeContext);
  if (!t) throw new Error('useTheme must be used inside <ThemeProvider>');
  return t;
}

/** Background/Paper — opacity of the paper-grain tile (src/components/Paper.tsx). Light 5 %, dark 4 %. */
export const paper = { light: 0.05, dark: 0.04 } as const;
