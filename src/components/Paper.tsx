import { Image, StyleSheet } from 'react-native';
import { paper, useTheme } from '../theme';

/**
 * Paper — the warm, barely-there paper grain behind every screen (Figma: Background/Paper).
 * A seamless 256 pt tile with no colour of its own (dark flecks + light flecks on transparent), so it sits on any
 * surface — bg/default, bg/subtle or the weather wash — and in dark mode. Strength is the `paper` token.
 * Put it right after a screen's root (and after the wash) so cards and photos draw on top of it, untouched.
 */
export function Paper() {
  const { scheme } = useTheme();
  return (
    <Image
      source={require('../../assets/textures/paper.png')}
      resizeMode="repeat"
      style={[StyleSheet.absoluteFill, { opacity: scheme === 'dark' ? paper.dark : paper.light }]}
      pointerEvents="none"
      accessible={false}
    />
  );
}
