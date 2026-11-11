import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useTheme, welcomeMesh } from '../theme';

/**
 * Gradient/Welcome (1.2 Sign in hero). Fills its parent; drawn in the 390×420 design box, stretched to fit.
 * react-native-svg has no blend modes, so the Linear-dodge layer is reproduced by its result on this base:
 * base + blue·α clips to white wherever α ≳ 0.16 → a white radial that stays opaque to 84 % and fades to the edge.
 */
export function WelcomeMesh() {
  const { width, height, base, radials } = welcomeMesh;
  const white = useTheme().color('static/white');
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <Defs>
          {radials.map((r, i) => (
            <RadialGradient
              key={i}
              id={`welcome-${i}`}
              gradientUnits="userSpaceOnUse"
              cx={0}
              cy={0}
              r={1}
              gradientTransform={`matrix(${r.ux} ${r.uy} ${r.vx} ${r.vy} ${r.cx} ${r.cy})`}
            >
              {(r.dodge
                ? [[0, 1], [0.84, 1], [1, 0]].map(([o, a]) => <Stop key={o} offset={o} stopColor={white} stopOpacity={a} />)
                : [[0, 1], [1, 0]].map(([o, a]) => <Stop key={o} offset={o} stopColor={r.color} stopOpacity={a} />))}
            </RadialGradient>
          ))}
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill={base} />
        {radials.map((_, i) => (
          <Rect key={i} x={0} y={0} width={width} height={height} fill={`url(#welcome-${i})`} />
        ))}
      </Svg>
    </View>
  );
}
