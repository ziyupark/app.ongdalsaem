import type { LucideIcon } from 'lucide-react-native';
import { iconStroke, useTheme, type ColorToken } from '../theme';

type Props = { icon: LucideIcon; size: 12 | 14 | 16 | 18 | 20 | 22 | 24 | 28 | 30 | 36; color?: ColorToken };

/** Ongdal icon (icons/ongdal, Lucide-compatible) with the stroke rule of docs/02-components.md §3.2 (absolute stroke by size). */
export function Icon({ icon: Glyph, size, color = 'fg/default' }: Props) {
  const { color: c } = useTheme();
  return <Glyph size={size} color={c(color)} strokeWidth={iconStroke(size)} absoluteStrokeWidth />;
}
