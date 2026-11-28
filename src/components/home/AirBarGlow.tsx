import { BlurMask, Canvas, Circle, Line, LinearGradient, vec } from '@shopify/react-native-skia';
import { gradients, useTheme } from '../../theme';
import { AIR_BAR, airColorAt, knobX } from './airBar';

const STOPS = gradients['Gradient/Air quality'];
const COLORS = STOPS.map((s) => s.color);
const POSITIONS = STOPS.map((s) => s.offset);

/**
 * Air quality bar (Figma Air Quality Card · bar) — a gradient line with a blurred glow of itself under it, and a white
 * knob haloed in the bar's colour at that point. Skia only (loaded through optionalNative).
 */
export default function AirBarGlow({ width, position }: { width: number; position: number }) {
  const { color } = useTheme();
  const { height, lineY, line, glow, knob, halo } = AIR_BAR;
  // Round caps reach half the stroke past each end, so the line ends exactly at the bar's edges.
  const g0 = glow / 2;
  const l0 = line / 2;
  const cx = knobX(width, position);
  return (
    <Canvas style={{ width, height }} pointerEvents="none">
      <Line p1={vec(g0, lineY)} p2={vec(width - g0, lineY)} style="stroke" strokeWidth={glow} strokeCap="round" opacity={0.45}>
        <LinearGradient start={vec(0, lineY)} end={vec(width, lineY)} colors={COLORS} positions={POSITIONS} />
        <BlurMask blur={5} style="normal" />
      </Line>
      <Line p1={vec(l0, lineY)} p2={vec(width - l0, lineY)} style="stroke" strokeWidth={line} strokeCap="round">
        <LinearGradient start={vec(0, lineY)} end={vec(width, lineY)} colors={COLORS} positions={POSITIONS} />
      </Line>
      <Circle cx={cx} cy={lineY} r={halo} color={airColorAt(position)} opacity={0.55}>
        <BlurMask blur={7} style="normal" />
      </Circle>
      <Circle cx={cx} cy={lineY} r={knob} color={color('static/white')} />
      <Circle cx={cx} cy={lineY} r={knob} style="stroke" strokeWidth={1} color={color('border/default')} />
    </Canvas>
  );
}
