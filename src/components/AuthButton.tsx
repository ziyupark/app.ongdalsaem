import { Image } from 'expo-image';
import { Pressable, StyleSheet } from 'react-native';
import { radius, space, thirdPartyBrand } from '../theme';
import { Text } from './Text';

type Props = { provider: 'Apple' | 'Google'; label: string; onPress: () => void; loading?: boolean; disabled?: boolean };

/**
 * Official artwork only.
 * - Apple: Apple Design Resources › Sign in with Apple Logo › Left-aligned · Black · Medium (31×44, padding built in —
 *   drawn at the height inside the outline, never cropped, no extra gap before the title).
 * - Google: pre-approved Sign in with Google bundle › iOS · Light — the standard G (20×20), rendered to PNG
 *   because its SVG uses a blurred conic gradient that native SVG renderers can't draw.
 */
const APPLE_LOGO = require('../../assets/brand/apple-logo-black-medium.svg');
const GOOGLE_G = require('../../assets/brand/google-g.png');

/** Auth Button 201:801 — 350×44 (FILL), pill, white fill, #747775 1px outline. Same size and weight for both. */
const HEIGHT = 44;

/**
 * Sign-in buttons built to each provider's official rules (Figma Auth Button description).
 * - Apple (custom Sign in with Apple button, iOS + Android): logo and title black only, title = 43% of the height
 *   (Google Sans Medium 19 on 44 — custom buttons may change the title font), "Continue with Apple" (i18n),
 *   bezel stroke #747775 (allowed for custom buttons).
 * - Google (Light theme): #FFFFFF, 1px #747775 inside, #1F1F1F Google Sans Medium 15/22, standard G, padding 16 · 12 · 16.
 */
export function AuthButton({ provider, label, onPress, loading, disabled }: Props) {
  const inactive = !!(loading || disabled);
  const apple = provider === 'Apple';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [styles.button, !apple && styles.googleGap, (pressed || inactive) && styles.dim]}
    >
      {apple ? (
        <Image source={APPLE_LOGO} style={styles.appleLogo} contentFit="contain" accessibilityIgnoresInvertColors />
      ) : (
        <Image source={GOOGLE_G} style={styles.googleLogo} contentFit="contain" accessibilityIgnoresInvertColors />
      )}
      <Text
        variant={apple ? 'Auth label/Apple' : 'Auth label/Google'}
        numberOfLines={1}
        style={apple ? styles.appleTitle : styles.googleTitle}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: HEIGHT,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[16],
    borderRadius: radius.full,
    borderWidth: 1,
    backgroundColor: thirdPartyBrand.surface,
    borderColor: thirdPartyBrand.outline,
  },
  googleGap: { gap: space[12] },
  // The logo file (31×44) has a white background rectangle. Sized to the height inside the 1px outline (42), same
  // proportions, so that rectangle never paints over the outline (it did at 44 + negative margins).
  appleLogo: { width: (31 * (HEIGHT - 2)) / HEIGHT, height: HEIGHT - 2 },
  googleLogo: { width: 20, height: 20 },
  appleTitle: { color: thirdPartyBrand.appleInk },
  googleTitle: { color: thirdPartyBrand.googleInk },
  dim: { opacity: 0.6 },
});
