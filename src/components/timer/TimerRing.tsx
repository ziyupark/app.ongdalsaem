import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
import { gradients, useTheme } from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  size: number;
  stroke: number;
  /** Running: epoch ms when it rings. Paused / idle: null. */
  endAt: number | null;
  /** Paused: seconds left. */
  leftSec: number;
  totalSec: number;
  done?: boolean;
  mirror?: boolean;
  /** Called once when a running ring reaches 0 (on the frame it empties). */
  onComplete?: () => void;
  children?: ReactNode;
};

/**
 * Timer ring — track bg/emphasis, remaining arc Gradient/Dusk (Gradient/Done when finished), clockwise from 12 o'clock.
 * `mirror` (5.1 active ring 20:796): the spent part opens clockwise from 12 o'clock, so the remaining arc ends at the top.
 * While running, the arc is recomputed every frame on the UI thread from `endAt`, so it drains smoothly (not once a second).
 */
export function TimerRing({ size, stroke, endAt, leftSec, totalSec, done, mirror, onComplete, children }: Props) {
  const { color } = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const id = `ring-${size}`;
  const total = Math.max(1, totalSec);
  const running = endAt != null && !done;
  // Added time can push the remaining time past the total — never draw more than a full ring.
  const still = done ? 1 : Math.max(0, Math.min(1, leftSec / total));

  const p = useSharedValue(running ? Math.max(0, Math.min(1, (endAt - Date.now()) / (total * 1000))) : still);
  const end = useSharedValue(endAt ?? 0);
  const totalMs = useSharedValue(total * 1000);
  const fired = useSharedValue(true);

  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;
  const complete = useCallback(() => completeRef.current?.(), []);

  const frame = useFrameCallback(
    useCallback(() => {
      'worklet';
      const next = Math.max(0, Math.min(1, (end.value - Date.now()) / totalMs.value));
      p.value = next;
      if (next <= 0 && !fired.value) {
        fired.value = true;
        scheduleOnRN(complete);
      }
    }, [end, totalMs, p, fired, complete]),
    false,
  );

  useEffect(() => {
    if (running) {
      end.value = endAt;
      totalMs.value = total * 1000;
      // Only a ring that is still counting down when it starts may fire — not one that ended while the app was closed.
      fired.value = endAt <= Date.now();
      frame.setActive(true);
    } else {
      frame.setActive(false);
      p.value = still;
    }
  }, [running, endAt, total, still, frame, end, totalMs, fired, p]);

  const arc = useAnimatedProps(() => ({
    strokeDashoffset: c * (1 - p.value),
    // A round cap would leave a dot at 0 — hide the arc instead.
    strokeOpacity: p.value > 0 ? 1 : 0,
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={mirror ? styles.mirror : undefined}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            {gradients['Gradient/Dusk'].map((s) => <Stop key={s.offset} offset={s.offset} stopColor={s.color} />)}
          </LinearGradient>
          {/* Finished (676:22871): green at the top-left fading to clay at the bottom-right — flipped back when mirrored. */}
          <LinearGradient id={`${id}-done`} x1={mirror ? '1' : '0'} y1="0" x2={mirror ? '0' : '1'} y2="1">
            {gradients['Gradient/Done'].map((s, i) => <Stop key={s.offset} offset={s.offset} stopColor={i === 0 ? color('fg/done') : s.color} />)}
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color('bg/emphasis')} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={done ? `url(#${id}-done)` : `url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c} ${c}`}
          animatedProps={arc}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' }, mirror: { transform: [{ scaleX: -1 }] } });
