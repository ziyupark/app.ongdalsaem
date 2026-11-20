import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle, useFrameCallback, useReducedMotion, useSharedValue, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
import { gradients, useTheme, type ColorToken } from '../../theme';

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
  /** Finished ring as one solid colour (5.1 big ring 676:22871) instead of Gradient/Done. */
  doneColor?: ColorToken;
  mirror?: boolean;
  /** Big ring only: a glowing knob + a short needle toward the centre ride the arc's moving end (TimerKnob). */
  knob?: boolean;
  /** Called once when a running ring reaches 0 (on the frame it empties). */
  onComplete?: () => void;
  children?: ReactNode;
};

/**
 * Timer ring — track bg/emphasis, remaining arc Gradient/Dusk (Gradient/Done when finished), clockwise from 12 o'clock.
 * `mirror` (5.1 active ring 20:796): the spent part opens clockwise from 12 o'clock, so the remaining arc ends at the top.
 * While running, the arc is recomputed every frame on the UI thread from `endAt`, so it drains smoothly (not once a second).
 */
export function TimerRing({ size, stroke, endAt, leftSec, totalSec, done, doneColor, mirror, knob, onComplete, children }: Props) {
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
  /** ms left while running (−1 = not running) — drives the knob's last-10-seconds pulse. */
  const leftMs = useSharedValue(-1);

  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;
  const complete = useCallback(() => completeRef.current?.(), []);

  const frame = useFrameCallback(
    useCallback(() => {
      'worklet';
      const ms = end.value - Date.now();
      const next = Math.max(0, Math.min(1, ms / totalMs.value));
      p.value = next;
      leftMs.value = Math.max(0, ms);
      if (next <= 0 && !fired.value) {
        fired.value = true;
        scheduleOnRN(complete);
      }
    }, [end, totalMs, p, fired, complete, leftMs]),
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
      leftMs.value = -1;
    }
  }, [running, endAt, total, still, frame, end, totalMs, fired, p, leftMs]);

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
          stroke={done ? (doneColor ? color(doneColor) : `url(#${id}-done)`) : `url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c} ${c}`}
          animatedProps={arc}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {knob && !done ? <TimerKnob size={size} stroke={stroke} p={p} leftMs={leftMs} mirror={!!mirror} /> : null}
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

/** Knob dot (× stroke) · glow diameter (× stroke) · needle length (× stroke) · gap between the dot and the needle. */
const KNOB = { dot: 0.55, glow: 2.6, needle: 1.1, gap: 0.45 };
/** Last 10 seconds: the glow beats once a second, peaking right as the number changes. */
const PULSE_FROM_MS = 10_000;

/**
 * The arc's moving end: a white dot in a soft Gradient/Dusk glow, and a thin needle pointing to the centre — one arm
 * the size of the ring, rotated to the progress angle on the UI thread (transform only), so it follows the countdown
 * every frame and the finger while the ring is dragged (`p` is the same value the arc draws from). Hidden at 0.
 */
function TimerKnob({ size, stroke, p, leftMs, mirror }: { size: number; stroke: number; p: SharedValue<number>; leftMs: SharedValue<number>; mirror: boolean }) {
  const { color } = useTheme();
  const reduce = useReducedMotion();
  const glowD = stroke * KNOB.glow;
  const dot = stroke * KNOB.dot;
  const needleLen = stroke * KNOB.needle;
  const tint = gradients['Gradient/Dusk'][1].color;
  const arm = useAnimatedStyle(() => ({
    opacity: p.value > 0.001 ? 1 : 0,
    // 0 at 12 o'clock; the mirrored ring's arc runs counter-clockwise, so its end turns the other way.
    transform: [{ rotate: `${(mirror ? -360 : 360) * p.value}deg` }],
  }));
  const glow = useAnimatedStyle(() => {
    const ms = leftMs.value;
    let beat = 0;
    if (!reduce && ms > 0 && ms <= PULSE_FROM_MS) {
      const phase = (ms % 1000) / 1000; // ~1 just after a second ticks over → 0 just before the next
      beat = phase * phase * phase;
    }
    return { opacity: 0.55 + 0.45 * beat, transform: [{ scale: 1 + 0.35 * beat }] };
  });
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, arm]}>
      {/* everything is laid out at 12 o'clock on the ring's centre line and rotated with the arm */}
      <Animated.View style={[styles.abs, { left: size / 2 - glowD / 2, top: stroke / 2 - glowD / 2, width: glowD, height: glowD }, glow]}>
        <Svg width={glowD} height={glowD}>
          <Defs>
            <RadialGradient id="knobGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={tint} stopOpacity={0.75} />
              <Stop offset="0.45" stopColor={tint} stopOpacity={0.3} />
              <Stop offset="1" stopColor={tint} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={glowD / 2} cy={glowD / 2} r={glowD / 2} fill="url(#knobGlow)" />
        </Svg>
      </Animated.View>
      <View style={[styles.abs, { left: size / 2 - dot / 2, top: stroke / 2 - dot / 2, width: dot, height: dot, borderRadius: dot / 2, backgroundColor: color('static/white') }]} />
      <View style={[styles.abs, { left: size / 2 - 0.75, top: stroke + stroke * KNOB.gap, width: 1.5, height: needleLen, borderRadius: 1, backgroundColor: tint, opacity: 0.7 }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({ abs: { position: 'absolute' }, center: { alignItems: 'center', justifyContent: 'center' }, mirror: { transform: [{ scaleX: -1 }] } });
