import { Image } from 'expo-image';
import { useTheme, type ColorToken } from '../theme';

const ACORN = require('../../assets/icons/acorn.svg');
const ACORN_COLOR = require('../../assets/icons/acorn-color.svg');

/**
 * Custom acorn icons (Figma 02 Icons): `icon/acorn` 134:10304 = line glyph, one colour token ·
 * `icon/acorn-color` 134:10227 = filled brand acorn (given state, acorn counts) — never tinted.
 */
export function AcornIcon({ size, color = 'fg/default', filled }: { size: 12 | 14 | 16 | 18 | 20 | 24; color?: ColorToken; filled?: boolean }) {
  const { color: c } = useTheme();
  if (filled) return <Image source={ACORN_COLOR} style={{ width: size, height: size }} contentFit="contain" />;
  return <Image source={ACORN} style={{ width: size, height: size }} tintColor={c(color)} contentFit="contain" />;
}
