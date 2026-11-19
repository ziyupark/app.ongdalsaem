import { useFocusEffect } from 'expo-router';
import { memo, useCallback, useEffect, useId, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue,
  withDelay, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';
import { FX_COLOR, WEATHER_FX, type BoltFx, type FlakeFx, type GlowFx, type GustFx, type PuffFx, type RainFx, type TwinkleFx, type WeatherMood } from '../theme';

/**
 * Weather motion over a mood wash — rain, snow, lightning, drifting clouds, fog, gusts, stars, sun glow.
 * Fills its parent (put it right after <MoodGradient>). Runs only while the screen is focused,
 * and not at all when the system "Reduce Motion" setting is on.
 */
export const WeatherFx = memo(function WeatherFx({ mood }: { mood: WeatherMood }) {
  const reduce = useReducedMotion();
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [focused, setFocused] = useState(true);
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!size || size.w !== width || size.h !== height) setSize({ w: width, h: height });
  };
  const fx = WEATHER_FX[mood];
  const live = !reduce && focused && size;
  return (
    <View pointerEvents="none" style={styles.fill} onLayout={onLayout}>
      {live ? (
        <>
          {fx.glow ? <Glow spec={fx.glow} w={size.w} h={size.h} /> : null}
          {fx.puffs ? <Puffs spec={fx.puffs} w={size.w} h={size.h} seed={mood.length} /> : null}
          {fx.twinkle ? <Twinkles spec={fx.twinkle} w={size.w} h={size.h} /> : null}
          {fx.rain ? <Rain spec={fx.rain} w={size.w} h={size.h} /> : null}
          {fx.pellets ? <Flakes spec={fx.pellets} w={size.w} h={size.h} seed={7} /> : null}
          {fx.flakes ? <Flakes spec={fx.flakes} w={size.w} h={size.h} seed={3} /> : null}
          {fx.gusts ? <Gusts spec={fx.gusts} w={size.w} h={size.h} /> : null}
          {fx.bolt ? <Bolt spec={fx.bolt} w={size.w} h={size.h} /> : null}
        </>
      ) : null}
    </View>
  );
});

// ── helpers ────────────────────────────────────────────────────────────────

/** Deterministic random so particles don't reshuffle on every render. */
function rng(seed: number) {
  let a = seed * 2654435761 + 1;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const between = (r: () => number, [a, b]: [number, number]) => a + (b - a) * r();

/** 0→1 forever, starting part-way through (`phase`) so the screen is already populated on open. */
function useLoop(dur: number, phase: number) {
  const p = useSharedValue(phase);
  useEffect(() => {
    p.value = withSequence(
      withTiming(1, { duration: dur * (1 - phase), easing: Easing.linear }),
      withRepeat(withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: dur, easing: Easing.linear })), -1, false),
    );
    return () => cancelAnimation(p);
  }, [dur, phase, p]);
  return p;
}

/** Fade in over the first 6 %, out over the last 40 % of the wash (it melts into bg/default there). */
function edgeFade(p: number) {
  'worklet';
  if (p < 0.06) return p / 0.06;
  if (p > 0.6) return Math.max(0, (1 - p) / 0.4);
  return 1;
}

// ── rain ───────────────────────────────────────────────────────────────────

function Rain({ spec, w, h }: { spec: RainFx; w: number; h: number }) {
  const drops = useMemo(() => {
    const r = rng(11);
    return Array.from({ length: spec.count }, () => ({
      x: r() * (w + spec.slant * h) - spec.slant * h,
      len: between(r, spec.len), dur: between(r, spec.dur), a: between(r, spec.alpha), phase: r(),
    }));
  }, [spec, w, h]);
  const angle = `${(-Math.atan(spec.slant) * 180) / Math.PI}deg`;
  return <>{drops.map((d, i) => <Drop key={i} {...d} h={h} drift={spec.slant * h} thick={spec.thick} angle={angle} />)}</>;
}

function Drop({ x, len, dur, a, phase, h, drift, thick, angle }: { x: number; len: number; dur: number; a: number; phase: number; h: number; drift: number; thick: number; angle: string }) {
  const p = useLoop(dur, phase);
  const style = useAnimatedStyle(() => ({
    opacity: a * edgeFade(p.value),
    transform: [{ translateX: x + drift * p.value }, { translateY: -len + p.value * (h + len) }, { rotate: angle }],
  }));
  return <Animated.View style={[styles.abs, { width: thick, height: len, borderRadius: thick, backgroundColor: FX_COLOR.white }, style]} />;
}

// ── snow / sleet pellets / dust ────────────────────────────────────────────

function Flakes({ spec, w, h, seed }: { spec: FlakeFx; w: number; h: number; seed: number }) {
  const flakes = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: spec.count }, () => ({
      x: r() * (w + spec.drift) - spec.drift, size: between(r, spec.size), dur: between(r, spec.dur),
      a: between(r, spec.alpha), phase: r(), wobble: 1 + r() * 2, offset: r() * Math.PI * 2,
    }));
  }, [spec, w, seed]);
  return <>{flakes.map((f, i) => <Flake key={i} {...f} h={h} sway={spec.sway} drift={spec.drift} color={spec.color} />)}</>;
}

function Flake({ x, size, dur, a, phase, wobble, offset, h, sway, drift, color }: { x: number; size: number; dur: number; a: number; phase: number; wobble: number; offset: number; h: number; sway: number; drift: number; color: string }) {
  const p = useLoop(dur, phase);
  const style = useAnimatedStyle(() => ({
    opacity: a * edgeFade(p.value),
    transform: [
      { translateX: x + drift * p.value + Math.sin(p.value * Math.PI * 2 * wobble + offset) * sway },
      { translateY: -size + p.value * (h + size) },
    ],
  }));
  return <Animated.View style={[styles.abs, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />;
}

// ── stars / frost glints ───────────────────────────────────────────────────

function Twinkles({ spec, w, h }: { spec: TwinkleFx; w: number; h: number }) {
  const stars = useMemo(() => {
    const r = rng(5);
    return Array.from({ length: spec.count }, () => ({ x: r() * w, y: r() * h * spec.band, size: between(r, spec.size), period: between(r, spec.period), delay: r() * 3000 }));
  }, [spec, w, h]);
  return <>{stars.map((s, i) => <Star key={i} {...s} color={spec.color} />)}</>;
}

function Star({ x, y, size, period, delay, color }: { x: number; y: number; size: number; period: number; delay: number; color: string }) {
  const o = useSharedValue(0.15);
  useEffect(() => {
    o.value = withDelay(delay, withRepeat(withTiming(1, { duration: period / 2, easing: Easing.inOut(Easing.quad) }), -1, true));
    return () => cancelAnimation(o);
  }, [o, delay, period]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[styles.abs, { left: x, top: y, width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />;
}

// ── clouds / fog / heat haze ───────────────────────────────────────────────

function Puffs({ spec, w, h, seed }: { spec: PuffFx; w: number; h: number; seed: number }) {
  const puffs = useMemo(() => {
    const r = rng(seed + 20);
    return Array.from({ length: spec.count }, () => ({
      y: between(r, spec.y) * h, pw: between(r, spec.w) * w, ph: between(r, spec.h) * h, dur: between(r, spec.dur), phase: r(),
    }));
  }, [spec, w, h, seed]);
  return <>{puffs.map((p, i) => <Puff key={i} {...p} w={w} alpha={spec.alpha} color={spec.color} id={`puff${seed}${i}`} />)}</>;
}

function Puff({ y, pw, ph, dur, phase, w, alpha, color, id }: { y: number; pw: number; ph: number; dur: number; phase: number; w: number; alpha: number; color: string; id: string }) {
  const p = useLoop(dur, phase);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: -pw + p.value * (w + pw) }] }));
  return (
    <Animated.View style={[styles.abs, { top: y, width: pw, height: ph }, style]}>
      <SoftEllipse id={id} w={pw} h={ph} color={color} alpha={alpha} />
    </Animated.View>
  );
}

function SoftEllipse({ id, w, h, color, alpha }: { id: string; w: number; h: number; color: string; alpha: number }) {
  return (
    <Svg width={w} height={h}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={alpha} />
          <Stop offset="0.6" stopColor={color} stopOpacity={alpha * 0.5} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

// ── sun / moon glow ────────────────────────────────────────────────────────

function Glow({ spec, w, h }: { spec: GlowFx; w: number; h: number }) {
  const id = `glow${useId().replace(/:/g, '')}`;
  const o = useSharedValue(0);
  useEffect(() => {
    o.value = withRepeat(withTiming(1, { duration: spec.period / 2, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(o);
  }, [o, spec.period]);
  const d = spec.r * w * 2;
  const style = useAnimatedStyle(() => ({
    opacity: spec.alpha[0] + (spec.alpha[1] - spec.alpha[0]) * o.value,
    transform: [{ scale: 0.92 + 0.16 * o.value }],
  }));
  return (
    <Animated.View style={[styles.abs, { left: spec.cx * w - d / 2, top: spec.cy * h - d / 2, width: d, height: d }, style]}>
      <SoftEllipse id={id} w={d} h={d} color={spec.color} alpha={1} />
    </Animated.View>
  );
}

// ── wind gusts ─────────────────────────────────────────────────────────────

function Gusts({ spec, w, h }: { spec: GustFx; w: number; h: number }) {
  const gusts = useMemo(() => {
    const r = rng(9);
    return Array.from({ length: spec.count }, () => ({ y: (0.04 + r() * 0.5) * h, gw: between(r, spec.w), dur: between(r, spec.dur), phase: r(), rest: 0.8 + r() * 1.6 }));
  }, [spec, h]);
  return <>{gusts.map((g, i) => <Gust key={i} {...g} w={w} alpha={spec.alpha} />)}</>;
}

/** One streak: crosses in `dur`, then rests off-screen for `rest`×dur so gusts come in bursts. */
function Gust({ y, gw, dur, phase, rest, w, alpha }: { y: number; gw: number; dur: number; phase: number; rest: number; w: number; alpha: number }) {
  const cycle = dur * (1 + rest);
  const p = useLoop(cycle, phase);
  const k = 1 + rest;
  const style = useAnimatedStyle(() => {
    const t = Math.min(1, p.value * k); // 0→1 during the crossing, then held at 1 (off-screen)
    return { opacity: alpha * Math.sin(Math.PI * t), transform: [{ translateX: -gw + t * (w + gw) }] };
  });
  return <Animated.View style={[styles.abs, { top: y, width: gw, height: 1.5, borderRadius: 1, backgroundColor: FX_COLOR.white }, style]} />;
}

// ── lightning ──────────────────────────────────────────────────────────────

function Bolt({ spec, w, h }: { spec: BoltFx; w: number; h: number }) {
  const flash = useSharedValue(0);
  const [gap] = useState(() => between(Math.random, spec.every));
  useEffect(() => {
    flash.value = withRepeat(
      withSequence(
        withDelay(gap, withTiming(0.9, { duration: 50 })),
        withTiming(0.15, { duration: 90 }),
        withTiming(0.7, { duration: 50 }),
        withTiming(0, { duration: 450, easing: Easing.out(Easing.quad) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(flash);
  }, [flash, gap]);
  const sky = useAnimatedStyle(() => ({ opacity: flash.value * 0.45 }));
  const bolt = useAnimatedStyle(() => ({ opacity: flash.value > 0.3 ? 1 : flash.value / 0.3 }));
  const bx = spec.x * w;
  const bh = h * 0.42;
  const d = `M ${bx} 0 L ${bx - 10} ${bh * 0.38} L ${bx + 4} ${bh * 0.42} L ${bx - 14} ${bh * 0.78} L ${bx - 2} ${bh * 0.8} L ${bx - 18} ${bh}`;
  return (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: FX_COLOR.white }, sky]} />
      <Animated.View style={[StyleSheet.absoluteFill, bolt]}>
        <Svg width={w} height={h}>
          <Path d={d} stroke={FX_COLOR.boltGlow} strokeWidth={5} strokeOpacity={0.35} strokeLinejoin="round" strokeLinecap="round" fill="none" />
          <Path d={d} stroke={FX_COLOR.white} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden' },
  abs: { position: 'absolute', left: 0, top: 0 },
});

