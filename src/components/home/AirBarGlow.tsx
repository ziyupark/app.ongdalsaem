import { BlurMask, Canvas, Circle, Line, LinearGradient, vec } from '@shopify/react-native-skia';
import { gradients, useTheme } from '../../theme';
import { AIR_BAR, airColorAt } from './airBar';

const STOPS = gradients['Gradient/Air quality'];
const COLORS = STOPS.map((s) => s.color);
const POSITIONS = STOPS.map((s) => s.offset);

/**
 * Air quality bar (Figma Air Quality Card · Gradient bar) — a thin neon gradient line with a soft glow of itself under it,
 * and a white knob haloed in the bar's colour at that point. Skia only (loaded through optionalNative).
 */
export default function AirBarGlow({ width, position }: { width: number; position: number }) {
  const { color } = useTheme();
  const { height, lineY, pad, line, glow, knob, halo } = AIR_BAR;
  const x0 = pad;
  const x1 = Math.max(pad, width - pad);
  const cx = x0 + (x1 - x0) * position;
  const grad = <LinearGradient start={vec(x0, lineY)} end={vec(x1, lineY)} colors={COLORS} positions={POSITIONS} />;
  return (
    <Canvas style={{ width, height }} pointerEvents="none">
      <Line p1={vec(x0, lineY)} p2={vec(x1, lineY)} style="stroke" strokeWidth={glow} strokeCap="round" opacity={0.45}>
        {grad}
        <BlurMask blur={5} style="normal" />
      </Line>
      <Line p1={vec(x0, lineY)} p2={vec(x1, lineY)} style="stroke" strokeWidth={line} strokeCap="round">
        {grad}
      </Line>
      <Circle cx={cx} cy={lineY} r={halo} color={airColorAt(position)} opacity={0.55}>
        <BlurMask blur={9} style="normal" />
      </Circle>
      <Circle cx={cx} cy={lineY} r={knob} color={color('static/white')} />
      <Circle cx={cx} cy={lineY} r={knob} style="stroke" strokeWidth={1} color={color('border/default')} />
    </Canvas>
  );
}
