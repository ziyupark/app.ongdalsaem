import { LinearGradient } from 'expo-linear-gradient';
import { memo, useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation, Easing, Extrapolation, interpolate, useAnimatedReaction, useAnimatedStyle, useFrameCallback,
  useReducedMotion, useSharedValue, withDelay, withTiming, type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
import {
  FX_CAP, FX_COLOR, FX_DENSITY, FX_FADE_FROM, FX_TIMING, weatherFxFor, withAlpha,
  type FlakeFx, type GlowFx, type GustFx, type MeteorFx, type PuffFx, type RainFx, type TimeOfDay, type TwinkleFx, type WeatherFxSpec, type WeatherMood,
} from '../theme';

type Props = {
  /** Current weather mood. `null` = no weather (2.6 Weather unavailable) → nothing drawn. */
  mood: WeatherMood | null;
  timeOfDay: TimeOfDay;
  /** false = frozen exactly where it is (hidden screen, app in the background). true again = carries on from there. */
  running: boolean;
  /** Laid-out size (fixed, so a wash-height change never rebuilds the particles). */
  width: number;
  height: number;
  /** ms before the very first effect fades in (cold start: after the wash). */
  delay?: number;
  /**
   * Particle multiplier (default FX_DENSITY = 3): rain, snow, sleet pellets, motes, stars and wind lines — and their caps — ×density.
   * Clouds / fog banks and the sun glow aren't particles and stay as they are.
   */
  density?: number;
};

type Layer = { key: string; mood: WeatherMood; timeOfDay: TimeOfDay; leaving: boolean; delay: number };

/**
 * Weather Mood animation layer — slow, quiet motion over the mood wash (rain, snow, lightning, drifting clouds,
 * fog, wind, stars with faint red / green / blue halos, shooting stars, breathing sun glow). Mounted once in the global WeatherBackdrop (and on 1.2 Sign in, LaunchBackdrop); ignores touches and melts away
 * over the bottom 40 %.
 *
 * Every particle is a pure function of one clock (ms), advanced by a frame callback: pausing stops the callback, so
 * no frame work happens at all and resuming continues from the same positions. Particles are built once per
 * mood × size (useMemo) and never reshuffle on re-render. Only transform / opacity are animated (UI thread).
 *
 * - Mood change: old effect fades out 800 ms, new fades in 1200 ms. That and the cold start are the only fades here.
 * - Reduce Motion: the clock never runs — one still frame, and no lightning or shooting stars at all.
 */
export const WeatherMoodLayer = memo(function WeatherMoodLayer({ mood, timeOfDay, running, width, height, delay = 0, density = FX_DENSITY }: Props) {
  const reduce = useReducedMotion();
  const clock = useSharedValue(0);
  const frame = useFrameCallback((f) => {
    // Clamp the step so a hitch (or the first frame after a resume) never jumps the particles.
    clock.value += Math.min(f.timeSincePreviousFrame ?? 16, 50);
  }, false);
  const live = running && !reduce;
  useEffect(() => { frame.setActive(live); }, [live, frame]);

  const seq = useRef(0);
  const [layers, setLayers] = useState<Layer[]>(() => (mood ? [{ key: `${mood}-${timeOfDay}-0`, mood, timeOfDay, leaving: false, delay }] : []));
  useEffect(() => {
    setLayers((ls) => {
      const top = ls.find((l) => !l.leaving);
      if (top && mood && top.mood === mood && top.timeOfDay === timeOfDay) return ls;
      if (!top && !mood) return ls;
      const next = ls.map((l) => ({ ...l, leaving: true }));
      if (mood) next.push({ key: `${mood}-${timeOfDay}-${++seq.current}`, mood, timeOfDay, leaving: false, delay: 0 });
      return next;
    });
  }, [mood, timeOfDay]);
  const gone = useCallback((key: string) => setLayers((ls) => ls.filter((l) => l.key !== key)), []);

  return (
    <View pointerEvents="none" style={[styles.box, { width, height }]}>
      {layers.map((l) => (
        <Fade key={l.key} leaving={l.leaving} delay={l.delay} onGone={gone} id={l.key}>
          <Effect mood={l.mood} timeOfDay={l.timeOfDay} w={width} h={height} clock={clock} still={reduce} density={density} />
        </Fade>
      ))}
    </View>
  );
});

function Fade({ id, leaving, delay, onGone, children }: { id: string; leaving: boolean; delay: number; onGone: (id: string) => void; children: ReactNode }) {
  const o = useSharedValue(0);
  const finish = useCallback(() => onGone(id), [onGone, id]);
  useEffect(() => {
    if (leaving) {
      o.value = withTiming(0, { duration: FX_TIMING.fadeOut, easing: Easing.inOut(Easing.quad) }, (ok) => { if (ok) scheduleOnRN(finish); });
    } else {
      o.value = withDelay(delay, withTiming(1, { duration: FX_TIMING.fadeIn, easing: Easing.inOut(Easing.quad) }));
    }
    return () => cancelAnimation(o);
  }, [leaving]); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[StyleSheet.absoluteFill, style]}>{children}</Animated.View>;
}

type Clock = SharedValue<number>;

/** Particle counts ×k (rounded); everything else unchanged. */
function denser(spec: WeatherFxSpec, k: number): WeatherFxSpec {
  if (k === 1) return spec;
  const n = <T extends { count: number }>(fx?: T) => (fx ? { ...fx, count: Math.round(fx.count * k) } : undefined);
  return { ...spec, rain: n(spec.rain), flakes: n(spec.flakes), pellets: n(spec.pellets), motes: n(spec.motes), twinkle: n(spec.twinkle), gusts: n(spec.gusts) };
}

const Effect = memo(function Effect({ mood, timeOfDay, w, h, clock, still, density }: { mood: WeatherMood; timeOfDay: TimeOfDay; w: number; h: number; clock: Clock; still: boolean; density: number }) {
  const { spec, dim } = useMemo(() => {
    const fx = weatherFxFor(mood, timeOfDay);
    return { spec: denser(fx.spec, density), dim: fx.dim };
  }, [mood, timeOfDay, density]);
  const cap = { rain: FX_CAP.rain * density, snow: FX_CAP.snow * density, other: FX_CAP.other * density };
  const seed = mood.length;
  return (
    <>
      {spec.glow ? <Glow spec={spec.glow} w={w} h={h} clock={clock} /> : null}
      {spec.puffs ? <Puffs spec={spec.puffs} w={w} h={h} seed={seed} dim={dim} clock={clock} /> : null}
      {spec.twinkle ? <Twinkles spec={spec.twinkle} w={w} h={h} clock={clock} cap={cap.other} /> : null}
      {spec.meteors && !still ? <Meteors spec={spec.meteors} w={w} h={h} clock={clock} /> : null}
      {spec.motes ? <Flakes spec={spec.motes} w={w} h={h} seed={13} dim={dim} clock={clock} cap={cap.other} /> : null}
      {spec.rain ? <Rain spec={spec.rain} w={w} h={h} dim={dim} clock={clock} cap={cap.rain} /> : null}
      {spec.pellets ? <Flakes spec={spec.pellets} w={w} h={h} seed={7} dim={dim} clock={clock} cap={cap.other} /> : null}
      {spec.flakes ? <Flakes spec={spec.flakes} w={w} h={h} seed={3} dim={dim} clock={clock} cap={mood === 'dust' ? cap.other : cap.snow} /> : null}
      {spec.gusts ? <Gusts spec={spec.gusts} w={w} h={h} dim={dim} clock={clock} cap={cap.other} /> : null}
      {spec.bolt && !still ? <Lightning every={spec.bolt.every} w={w} h={h} dim={dim} clock={clock} /> : null}
    </>
  );
});

// ── helpers ────────────────────────────────────────────────────────────────

/** Deterministic random so particles are identical on every render. */
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
const lerp = ([a, b]: [number, number], t: number) => a + (b - a) * t;

/** Loop progress 0→1 for a `dur` ms cycle, offset by `phase` so the wash is already populated at t = 0. */
function loop(t: number, dur: number, phase: number) {
  'worklet';
  const v = t / dur + phase;
  return v - Math.floor(v);
}

/** The layer's mask at a height (0 = top, 1 = bottom): fades in over the top 4 %, out over the bottom 40 %. */
function maskAt(y: number) {
  'worklet';
  if (y < 0.04) return Math.max(0, y / 0.04);
  if (y > FX_FADE_FROM) return Math.max(0, (1 - y) / (1 - FX_FADE_FROM));
  return 1;
}

/** Soft dot or ellipse (radial fade to transparent) — drawn once, then only moved. */
function SoftEllipse({ w, h, color, alpha, core = 0.6 }: { w: number; h: number; color: string; alpha: number; core?: number }) {
  const id = `soft${useId().replace(/:/g, '')}`;
  return (
    <Svg width={w} height={h}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={alpha} />
          <Stop offset={core} stopColor={color} stopOpacity={alpha * 0.5} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

// ── rain ───────────────────────────────────────────────────────────────────

function Rain({ spec, w, h, dim, clock, cap }: { spec: RainFx; w: number; h: number; dim: number; clock: Clock; cap: number }) {
  const drops = useMemo(() => {
    const r = rng(11);
    return Array.from({ length: Math.min(spec.count, cap) }, () => ({
      x: r() * (w + spec.slant * h) - spec.slant * h,
      len: between(r, spec.len), dur: between(r, spec.dur), a: between(r, spec.alpha) * dim, phase: r(),
    }));
  }, [spec, w, h, dim]);
  const angle = `${(-Math.atan(spec.slant) * 180) / Math.PI}deg`;
  return <>{drops.map((d, i) => <Drop key={i} {...d} h={h} drift={spec.slant * h} thick={spec.thick} angle={angle} clock={clock} />)}</>;
}

function Drop({ x, len, dur, a, phase, h, drift, thick, angle, clock }: { x: number; len: number; dur: number; a: number; phase: number; h: number; drift: number; thick: number; angle: string; clock: Clock }) {
  const style = useAnimatedStyle(() => {
    const p = loop(clock.value, dur, phase);
    const y = -len + p * (h + len);
    return {
      opacity: a * maskAt((y + len / 2) / h),
      transform: [{ translateX: x + drift * p }, { translateY: y }, { rotate: angle }],
    };
  });
  return <Animated.View style={[styles.abs, { width: thick, height: len, borderRadius: thick, backgroundColor: FX_COLOR.white }, style]} />;
}

// ── snow / sleet pellets / dust / rising light motes ───────────────────────

function Flakes({ spec, w, h, seed, dim, clock, cap }: { spec: FlakeFx; w: number; h: number; seed: number; dim: number; clock: Clock; cap: number }) {
  const flakes = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: Math.min(spec.count, cap) }, () => {
      const z = r(); // depth: 0 = far (small, slow, faint) → 1 = near (big, faster, brighter)
      return {
        x: r() * (w + spec.drift) - spec.drift, size: lerp(spec.size, z), dur: lerp([spec.dur[1], spec.dur[0]], z),
        a: lerp(spec.alpha, z) * dim, sway: lerp(spec.sway, z), phase: r(), wobble: 1 + Math.floor(r() * 2), offset: r() * Math.PI * 2,
      };
    });
  }, [spec, w, seed, dim, cap]);
  return <>{flakes.map((f, i) => <Flake key={i} {...f} h={h} drift={spec.drift} color={spec.color} soft={!!spec.soft} rise={!!spec.rise} clock={clock} />)}</>;
}

function Flake({ x, size, dur, a, phase, wobble, offset, sway, h, drift, color, soft, rise, clock }: {
  x: number; size: number; dur: number; a: number; phase: number; wobble: number; offset: number; sway: number;
  h: number; drift: number; color: string; soft: boolean; rise: boolean; clock: Clock;
}) {
  // A soft dot is drawn 2× its size so the blurred edge has room; the solid core stays `size`.
  const box = soft ? size * 2 : size;
  const style = useAnimatedStyle(() => {
    const p = loop(clock.value, dur, phase);
    const y = rise ? h - p * (h + box) : -box + p * (h + box);
    return {
      opacity: a * maskAt((y + box / 2) / h),
      transform: [
        // whole sine periods per crossing, so a flake re-enters exactly where it left (no sideways jump)
        { translateX: x + drift * p + Math.sin(p * Math.PI * 2 * wobble + offset) * sway },
        { translateY: y },
      ],
    };
  });
  return soft ? (
    <Animated.View style={[styles.abs, { width: box, height: box }, style]}>
      <SoftEllipse w={box} h={box} color={color} alpha={1} core={0.45} />
    </Animated.View>
  ) : (
    <Animated.View style={[styles.abs, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />
  );
}

// ── stars / frost glints ───────────────────────────────────────────────────

function Twinkles({ spec, w, h, clock, cap }: { spec: TwinkleFx; w: number; h: number; clock: Clock; cap: number }) {
  const stars = useMemo(() => {
    const r = rng(5);
    return Array.from({ length: Math.min(spec.count, cap) }, () => ({ x: r() * w, y: r() * h * spec.band, size: between(r, spec.size), period: between(r, spec.period), phase: r() }));
  }, [spec, w, h]);
  // Only every other star gets a halo (half as many glows), tinted red / green / blue in turn among those.
  return <>{stars.map((s, i) => <Star key={i} {...s} alpha={spec.alpha} color={spec.color} glow={i % 2 === 0 ? spec.glow : undefined} tint={FX_COLOR.starGlow[(i / 2) % FX_COLOR.starGlow.length]} clock={clock} />)}</>;
}

/**
 * Stars are not dimmed at night — they *are* the night. Opacity eases 0.3 ↔ 0.8 over a random 3–6 s. With `glow` (every
 * other star), a faint halo in the star's tint (red / green / blue in turn) sits behind it and brightens with the twinkle.
 */
function Star({ x, y, size, period, phase, alpha, color, glow, tint, clock }: {
  x: number; y: number; size: number; period: number; phase: number; alpha: [number, number]; color: string;
  glow?: TwinkleFx['glow']; tint: string; clock: Clock;
}) {
  const style = useAnimatedStyle(() => {
    const k = 0.5 - 0.5 * Math.cos(Math.PI * 2 * loop(clock.value, period, phase));
    return { opacity: alpha[0] + (alpha[1] - alpha[0]) * k };
  });
  const halo = useAnimatedStyle(() => {
    const k = 0.5 - 0.5 * Math.cos(Math.PI * 2 * loop(clock.value, period, phase));
    return { opacity: (glow?.alpha ?? 0) * (0.25 + 0.75 * k), transform: [{ scale: 0.85 + 0.3 * k }] };
  });
  const d = glow ? size * glow.scale : 0;
  return (
    <>
      {glow ? (
        <Animated.View style={[styles.abs, { left: x + size / 2 - d / 2, top: y + size / 2 - d / 2, width: d, height: d }, halo]}>
          <SoftEllipse w={d} h={d} color={tint} alpha={1} core={0.25} />
        </Animated.View>
      ) : null}
      <Animated.View style={[styles.abs, { left: x, top: y, width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />
    </>
  );
}

// ── shooting stars ─────────────────────────────────────────────────────────

function Meteors({ spec, w, h, clock }: { spec: MeteorFx; w: number; h: number; clock: Clock }) {
  const list = useMemo(() => {
    const r = rng(17);
    return Array.from({ length: spec.count }, (_, i) => ({
      seed: i + 1, dur: between(r, spec.dur), rest: between(r, spec.rest), len: between(r, spec.len), travel: between(r, spec.travel) * w, phase: r(),
    }));
  }, [spec, w]);
  return <>{list.map((m, i) => <Meteor key={i} {...m} w={w} h={h} angle={spec.angle} alpha={spec.alpha} band={spec.band} clock={clock} />)}</>;
}

/** Cheap per-pass random 0…1 (worklet), so each pass of a meteor starts somewhere new. */
function hash(n: number) {
  'worklet';
  const v = Math.sin(n * 12.9898) * 43758.5453;
  return v - Math.floor(v);
}

/**
 * One streak: a thin tail fading to transparent behind a bright head, flying down-left at `angle`°. Visible for `dur`,
 * then off for `rest`. Opacity rises and falls over the pass (sin), and melts with the layer mask.
 */
function Meteor({ seed, dur, rest, len, travel, phase, w, h, angle, alpha, band, clock }: {
  seed: number; dur: number; rest: number; len: number; travel: number; phase: number; w: number; h: number; angle: number; alpha: number; band: number; clock: Clock;
}) {
  const cycle = dur + rest;
  const rad = (angle * Math.PI) / 180;
  const dx = -Math.cos(rad);
  const dy = Math.sin(rad);
  const style = useAnimatedStyle(() => {
    const v = clock.value / cycle + phase;
    const pass = Math.floor(v);
    const t = ((v - pass) * cycle) / dur; // 0→1 while flying, >1 while resting
    if (t >= 1) return { opacity: 0 };
    const sx = w * (0.35 + 0.65 * hash(pass * 7 + seed)); // starts right of centre-ish, flies left
    const sy = h * band * hash(pass * 13 + seed * 3);
    const hx = sx + dx * travel * t;
    const hy = sy + dy * travel * t;
    return {
      opacity: alpha * Math.sin(Math.PI * Math.min(1, t * 1.15)) * maskAt(hy / h),
      // the tail's centre sits half a length behind the head, then the box is turned to the flight direction
      transform: [{ translateX: hx - (dx * len) / 2 - len / 2 }, { translateY: hy - (dy * len) / 2 - 1 }, { rotate: `${180 - angle}deg` }],
    };
  });
  return (
    <Animated.View style={[styles.abs, { width: len, height: 2 }, style]}>
      <LinearGradient colors={[withAlpha(FX_COLOR.white, 0), withAlpha(FX_COLOR.white, 0.35), FX_COLOR.white]} locations={[0, 0.6, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.tail} />
      <View style={styles.head} />
    </Animated.View>
  );
}

// ── clouds / fog / heat haze ───────────────────────────────────────────────

/** One puff per `durs` entry; slower layers sit further back (smaller, fainter) — parallax. */
function Puffs({ spec, w, h, seed, dim, clock }: { spec: PuffFx; w: number; h: number; seed: number; dim: number; clock: Clock }) {
  const puffs = useMemo(() => {
    const r = rng(seed + 20);
    const fastest = Math.min(...spec.durs);
    const slowest = Math.max(...spec.durs);
    return spec.durs.slice(0, FX_CAP.other).map((dur) => {
      const k = 1 - 0.3 * ((dur - fastest) / (slowest - fastest || 1)); // fastest = nearest = full size, slowest = 70 %
      const y = between(r, spec.y) * h;
      const ph = between(r, spec.h) * h * k;
      return { y, pw: between(r, spec.w) * w * k, ph, dur, phase: r(), alpha: spec.alpha * dim * (0.7 + 0.3 * k) * maskAt((y + ph / 2) / h) };
    });
  }, [spec, w, h, seed, dim]);
  return <>{puffs.map((p, i) => <Puff key={i} {...p} w={w} color={spec.color} clock={clock} />)}</>;
}

function Puff({ y, pw, ph, dur, phase, alpha, w, color, clock }: { y: number; pw: number; ph: number; dur: number; phase: number; alpha: number; w: number; color: string; clock: Clock }) {
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: -pw + loop(clock.value, dur, phase) * (w + pw) }] }));
  return (
    <Animated.View style={[styles.abs, { top: y, width: pw, height: ph }, style]}>
      <SoftEllipse w={pw} h={ph} color={color} alpha={alpha} />
    </Animated.View>
  );
}

// ── sun / moon glow ────────────────────────────────────────────────────────

/** Breathes: scale 1 → 1.06 → 1 over `period` (ease-in-out), opacity following along. */
function Glow({ spec, w, h, clock }: { spec: GlowFx; w: number; h: number; clock: Clock }) {
  const d = spec.r * w * 2;
  const style = useAnimatedStyle(() => {
    const k = 0.5 - 0.5 * Math.cos(Math.PI * 2 * loop(clock.value, spec.period, 0));
    return { opacity: spec.alpha[0] + (spec.alpha[1] - spec.alpha[0]) * k, transform: [{ scale: 1 + 0.06 * k }] };
  });
  return (
    <Animated.View style={[styles.abs, { left: spec.cx * w - d / 2, top: spec.cy * h - d / 2, width: d, height: d }, style]}>
      <SoftEllipse w={d} h={d} color={spec.color} alpha={1} />
    </Animated.View>
  );
}

// ── wind ───────────────────────────────────────────────────────────────────

function Gusts({ spec, w, h, dim, clock, cap }: { spec: GustFx; w: number; h: number; dim: number; clock: Clock; cap: number }) {
  const gusts = useMemo(() => {
    const r = rng(9);
    return Array.from({ length: Math.min(spec.count, cap) }, () => {
      const y = (0.05 + r() * 0.5) * h;
      return { y, gw: between(r, spec.w), dur: between(r, spec.dur), phase: r(), rest: 0.6 + r() * 1.2, alpha: spec.alpha * dim * maskAt(y / h) };
    });
  }, [spec, h, dim]);
  return <>{gusts.map((g, i) => <Gust key={i} {...g} w={w} clock={clock} />)}</>;
}

/** One thin line: drifts across in `dur`, then rests off-screen for `rest`×dur, so the wind comes and goes. */
function Gust({ y, gw, dur, phase, rest, alpha, w, clock }: { y: number; gw: number; dur: number; phase: number; rest: number; alpha: number; w: number; clock: Clock }) {
  const k = 1 + rest;
  const style = useAnimatedStyle(() => {
    const t = Math.min(1, loop(clock.value, dur * k, phase) * k); // 0→1 while crossing, then held off-screen
    return { opacity: alpha * Math.sin(Math.PI * t), transform: [{ translateX: -gw + t * (w + gw) }] };
  });
  return <Animated.View style={[styles.abs, { top: y, width: gw, height: 1.5, borderRadius: 1, backgroundColor: FX_COLOR.white }, style]} />;
}

// ── lightning ──────────────────────────────────────────────────────────────

/** Flash over ~400 ms: 0 → 0.35 → 0.1 → 0.25 → 0 — a quick double crackle (2 peaks: under 3 a second), never above 0.35. */
const FLASH_T = [0, 60, 140, 200, 400];
const FLASH_V = [0, 0.35, 0.1, 0.25, 0];
const BOLT_MS = 150;
const NEVER = -1e9;

/**
 * Strikes at a random 6–14 s gap on the layer clock (so it pauses with everything else): a whole-wash flash and, on
 * every third strike, a thin zig-zag bolt near the top for 150 ms. Never mounted with Reduce Motion.
 */
function Lightning({ every, w, h, dim, clock }: { every: [number, number]; w: number; h: number; dim: number; clock: Clock }) {
  const next = useSharedValue(clock.value + between(Math.random, every));
  const at = useSharedValue(NEVER);
  const n = useSharedValue(0);
  const boltX = useSharedValue(0.6);
  const [lo, hi] = every;
  useAnimatedReaction(() => clock.value, (t) => {
    if (t < next.value) return;
    at.value = t;
    n.value += 1;
    if (n.value % 3 === 1) boltX.value = 0.25 + Math.random() * 0.55;
    next.value = t + lo + Math.random() * (hi - lo);
  });
  const sky = useAnimatedStyle(() => ({ opacity: dim * interpolate(clock.value - at.value, FLASH_T, FLASH_V, Extrapolation.CLAMP) }));
  const bolt = useAnimatedStyle(() => {
    const dt = clock.value - at.value;
    return { opacity: n.value % 3 === 1 && dt >= 0 && dt < BOLT_MS ? 1 : 0, transform: [{ translateX: boltX.value * w }] };
  });
  const d = useMemo(() => zigzag(h * 0.34), [h]);
  return (
    <>
      {/* The flash melts away over the bottom 40 % too, so cards and text below never flicker. */}
      <Animated.View style={[StyleSheet.absoluteFill, sky]}>
        <LinearGradient colors={[FX_COLOR.white, FX_COLOR.white, withAlpha(FX_COLOR.white, 0)]} locations={[0, FX_FADE_FROM, 1]} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[styles.abs, { width: 40, height: h * 0.34 }, bolt]}>
        <Svg width={40} height={h * 0.34}>
          <Path d={d} stroke={FX_COLOR.boltGlow} strokeWidth={4} strokeOpacity={0.3 * dim} strokeLinejoin="round" strokeLinecap="round" fill="none" />
          <Path d={d} stroke={FX_COLOR.white} strokeWidth={1.2} strokeOpacity={0.85 * dim} strokeLinejoin="round" strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>
    </>
  );
}

/** Thin zig-zag inside a 40-wide box (x 2…38). */
function zigzag(len: number) {
  const pts: [number, number][] = [[20, 0], [11, 0.3], [23, 0.36], [8, 0.66], [18, 0.7], [4, 1]];
  return pts.map(([x, t], i) => `${i ? 'L' : 'M'} ${x} ${t * len}`).join(' ');
}

const styles = StyleSheet.create({
  box: { position: 'absolute', left: 0, top: 0, overflow: 'hidden' },
  abs: { position: 'absolute', left: 0, top: 0 },
  tail: { position: 'absolute', left: 0, right: 0, top: 0.25, height: 1.5, borderRadius: 1 },
  head: { position: 'absolute', right: -0.5, top: -0.5, width: 3, height: 3, borderRadius: 1.5, backgroundColor: FX_COLOR.white },
});
