import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Check, Clock, Pause, Play, Plus, RotateCcw, Timer } from '../../src/components/icons/ongdal';
import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import { Alert, Pressable, ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Chip } from '../../src/components/Chip';
import { Icon } from '../../src/components/Icon';
import { ScreenHeader, ScreenWash } from '../../src/components/ScreenHeader';
import { TimerSheet } from '../../src/components/share/TimerSheet';
import { goTab, TabBar, useTabBarScroll, type TabKey } from '../../src/components/TabBar';
import { Text } from '../../src/components/Text';
import { TimerRing } from '../../src/components/timer/TimerRing';
import { useWashScroll } from '../../src/lib/useWashScroll';
import {
  addMinute, addTime, fmt, foodOf, isFinished, pauseTimer, removeTimer, resetTimer, resumeTimer, ringFinished, secondsLeft, setTimeLeft, startTimer, useFocusRequest, useNow, useTimers, type KitchenTimer,
} from '../../src/lib/timers';
import { elevation, iconRing, radius, space, useTheme } from '../../src/theme';

/** A timer started this recently before the screen opened is treated as new and takes the big ring. */
const JUST_STARTED_MS = 10_000;

// Big ring (Active timer 20:796) — 220 donut, inner radius 0.885 → stroke ≈ 12.65. Also the drag geometry.
const RING = 220;
const RING_STROKE = 12.65;
/** Hold the ring this long, then drag around it to change the time. */
const HOLD_MS = 350;
/** Touches this close to the ring's centre line (pt) count as on the ring. */
const RING_HIT = 24;
const DRAG_STEP = 5;
const DRAG_MAX = 24 * 3600 - DRAG_STEP;

const PRESETS = [
  { key: 'softEgg', sec: 420 },
  { key: 'hardEgg', sec: 600 },
  { key: 'ramen', sec: 270 },
  { key: 'cupNoodle', sec: 180 },
  { key: 'pasta', sec: 540 },
  { key: 'dumplings', sec: 480 },
  { key: 'tea', sec: 180 },
  { key: 'coffee', sec: 240 },
] as const;

/** 5.1 Kitchen timer + 5.1b Add timer sheet + 5.2 Timer finished (Figma 20:748 · 669:11033 · 76:3268). */
export default function KitchenTimerScreen() {
  const { color } = useTheme();
  const { t } = useTranslation();
  const timers = useTimers();
  // Ticks only while some timer has an end time (running or just finished) — no per-second re-render otherwise.
  const tick = useNow(timers.some((x) => x.endAt != null));
  // A ring that empties between ticks moves `now` up to that moment, so the finished state shows on the same frame.
  const [endedAt, setEndedAt] = useState(0);
  const now = Math.max(tick, endedAt);
  const onRingEnd = (id: string) => {
    setEndedAt(Date.now());
    ringFinished(id);
  };
  const [featuredId, setFeaturedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  // Tapping a "— done" toast (anywhere in the app) brings that timer to the big ring.
  const focusReq = useFocusRequest();
  useEffect(() => { if (focusReq) setFeaturedId(focusReq.id); }, [focusReq]);
  const bar = useTabBarScroll();

  // A timer that just started anywhere (Add Timer, a preset, a recipe step) takes the big ring, so “Food Name”
  // follows the newest timer instead of staying on an older pinned or finished one. Start time = the id's
  // timestamp (startTimer makes `t-<ms>-<rand>`); one started moments before this screen opened (a recipe step's
  // "Start timer" → /timer) counts too.
  const lastStart = useRef<number | null>(null);
  useEffect(() => {
    if (!timers.length) return;
    const startOf = (x: KitchenTimer) => Number(x.id.split('-')[1]) || 0;
    const newest = timers.reduce((a, b) => (startOf(b) > startOf(a) ? b : a));
    const at = startOf(newest);
    const fresh = lastStart.current == null ? Date.now() - at < JUST_STARTED_MS : at > lastStart.current;
    if (fresh) setFeaturedId(newest.id);
    lastStart.current = Math.max(lastStart.current ?? 0, at);
  }, [timers]);

  // Featured = the one tapped (or just started), else the first finished, else the soonest to ring.
  const featured = useMemo<KitchenTimer | undefined>(() => {
    const picked = timers.find((x) => x.id === featuredId);
    if (picked) return picked;
    const done = timers.find((x) => isFinished(x, now));
    if (done) return done;
    return [...timers].sort((a, b) => secondsLeft(a, now) - secondsLeft(b, now))[0];
  }, [timers, featuredId, now]);
  // Finished timers first, then the rest in their usual order.
  const others = timers.filter((x) => x.id !== featured?.id).sort((a, b) => Number(secondsLeft(b, now) === 0) - Number(secondsLeft(a, now) === 0));

  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const onTab = (k: TabKey) => (k === 'timer' ? scroll.current?.scrollTo({ y: 0, animated: true }) : goTab(k));
  // Same scrolling as Home: header + wash travel up with the content, the wash fades out, the tab bar hides.
  const wash = useWashScroll();
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    wash.onY(y);
    const { contentSize, layoutMeasurement } = e.nativeEvent;
    bar.onY(y, contentSize.height - layoutMeasurement.height);
  };

  // Hold the big ring, then drag around it: the arc's end follows the finger (counter-clockwise = more time, since the
  // ring is mirrored), in 5-second steps, past a full lap if needed. A running timer pauses while held and resumes on release.
  const [dragSec, setDragSec] = useState<number | null>(null);
  const featuredRef = useRef(featured);
  featuredRef.current = featured;
  const drag = useRef({ on: false, id: '', run: false, base: 0, total: 1, acc: 0, last: 0, sec: 0 });
  /** Angle of a touch, counter-clockwise from 12 o'clock (degrees), and its distance from the centre. */
  const polar = (x: number, y: number) => {
    const dx = x - RING / 2;
    const dy = y - RING / 2;
    return { deg: (Math.atan2(-dx, -dy) * 180) / Math.PI, dist: Math.hypot(dx, dy) };
  };
  const ringPan = usePanGesture({
    activateAfterLongPress: HOLD_MS,
    runOnJS: true,
    enabled: !!featured && !(featured && secondsLeft(featured, now) === 0),
    onActivate: (e) => {
      const f = featuredRef.current;
      const { deg, dist } = polar(e.x, e.y);
      if (!f || Math.abs(dist - (RING - RING_STROKE) / 2) > RING_HIT) return;
      const sec = secondsLeft(f);
      if (sec === 0) return;
      const run = f.endAt != null;
      drag.current = { on: true, id: f.id, run, base: sec, total: Math.max(1, f.totalSec), acc: 0, last: deg, sec };
      setFeaturedId(f.id);
      if (run) pauseTimer(f.id);
      setDragSec(sec);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    },
    onUpdate: (e) => {
      const d = drag.current;
      if (!d.on) return;
      const { deg } = polar(e.x, e.y);
      let delta = deg - d.last;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      d.last = deg;
      d.acc += delta;
      const raw = d.base + (d.acc / 360) * d.total;
      const sec = Math.min(DRAG_MAX, Math.max(DRAG_STEP, Math.round(raw / DRAG_STEP) * DRAG_STEP));
      if (sec !== d.sec) {
        d.sec = sec;
        setDragSec(sec);
        Haptics.selectionAsync().catch(() => undefined);
      }
    },
    onFinalize: () => {
      const d = drag.current;
      if (!d.on) return;
      d.on = false;
      setTimeLeft(d.id, d.sec, d.run);
      setDragSec(null);
    },
  });

  const dragging = dragSec != null;
  const left = dragging ? dragSec : featured ? secondsLeft(featured, now) : 0;
  const done = !!featured && left === 0;
  const running = !!featured && featured.endAt != null && !done;
  // Food Name above the ring: the typed / recipe dish, else the timer's own name (presets: Soft egg).
  const food = featured ? foodOf(featured) ?? featured.label : null;
  // Acting on the big timer keeps it there — otherwise "15s +" / pause would hand the ring to whichever timer now rings first.
  const pin = () => { if (featured) setFeaturedId(featured.id); };

  const removeAsk = (x: KitchenTimer) =>
    Alert.alert(t('timer.removeTitle', { label: x.label }), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('timer.remove'), style: 'destructive', onPress: () => removeTimer(x.id) },
    ]);

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
      <ScreenWash scrollStyle={wash.style} />
      <ScrollView ref={scroll} onScroll={onScroll} scrollEventThrottle={16} scrollEnabled={!dragging} contentContainerStyle={{ paddingBottom: 96 + space[24] }} showsVerticalScrollIndicator={false}>
        <ScreenHeader right="none" />
        <View>
        {/* Block · Active timer 88:3084 — p30 20 0: “Food Name” → 13 → ring → 24 → controls → Frame 11 (p20 0 12, Add Timer). */}
        <View style={[styles.active, { paddingTop: 30 }]}>
          {food ? <Text variant="Display/M" numberOfLines={1} style={styles.food}>{`“${food}”`}</Text> : null}
          <GestureDetector gesture={ringPan}>
          <View collapsable={false}>
          <TimerRing
            mirror
            size={RING}
            stroke={RING_STROKE}
            endAt={dragging ? null : featured?.endAt ?? null}
            leftSec={left}
            totalSec={featured?.totalSec ?? 1}
            done={done}
            onComplete={featured ? () => onRingEnd(featured.id) : undefined}
          >
            <View style={styles.mid}>
              {/* mid 20:799 — only the time, centred in the ring (the name above the number is gone; “Food Name” sits above the ring). */}
              {/* 5.2 finished (676:22872): "Simmer the stew — done" above the time. */}
              {featured && done ? <Text variant="Caption Strong" color="fg/muted" numberOfLines={1}>{t('timer.labelDone', { label: featured.label })}</Text> : null}
              <Text variant="Numeric/Timer" color={done ? 'fg/done' : 'fg/default'} numberOfLines={1} adjustsFontSizeToFit style={[styles.tabular, styles.time]}>{fmt(left)}</Text>
              {/* The hint stays for the idle (no timer) state only. */}
              {!featured ? (
                <Text variant="Caption" color="fg/muted" numberOfLines={1}>
                  {t('timer.idleHint')}
                </Text>
              ) : null}
            </View>
          </TimerRing>
          </View>
          </GestureDetector>
          {featured ? (
            <View style={styles.controls}>
              <RoundBtn icon={RotateCcw} label={t('timer.reset')} onPress={() => { pin(); resetTimer(featured.id); }} />
              {done ? (
                <RoundBtn
                  icon={Check}
                  label={featured.source ? t('timer.backToRecipe') : t('timer.dismiss')}
                  primary
                  onPress={() => {
                    const fid = featured.source?.foodId;
                    removeTimer(featured.id);
                    if (fid) router.push(`/dish/${fid}`);
                  }}
                />
              ) : (
                <RoundBtn icon={running ? Pause : Play} label={t(running ? 'timer.pause' : 'timer.resume')} primary onPress={() => { pin(); if (running) pauseTimer(featured.id); else resumeTimer(featured.id); }} />
              )}
              {/* 678:11164 — round + with a "15s" badge (676:22625): each tap adds 15 seconds (a finished timer starts again). */}
              <View>
                <RoundBtn icon={Plus} label={t('timer.plus15Label')} onPress={() => { pin(); addTime(featured.id, 15); }} />
                <View pointerEvents="none" style={[styles.badge, { backgroundColor: color('bg/kick') }]}>
                  <Text variant="Caption Strong">15s</Text>
                </View>
              </View>
            </View>
          ) : null}
          {/* Frame 11 676:22599 — Add Timer now sits right under the controls (p20 0 20). */}
          <View style={styles.addWrap}>
            {/* Timer Button · Size=Bar 676:22600 — bg/subtle · border/default 1 · Elevation/1, `timer` 24 + Button/M fg/default. */}
            <Pressable accessibilityRole="button" onPress={() => setAdding(true)} style={({ pressed }) => [styles.addBtn, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }, elevation['Elevation/1 Low'], pressed && { opacity: 0.85 }]}>
              <Icon icon={Timer} size={24} color="fg/default" />
              <Text variant="Button/M" color="fg/default">{t('timer.addTimer')}</Text>
            </Pressable>
          </View>
        </View>

        {/* Block · presets 88:3085 — p0 0 20. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presets}>
          {PRESETS.map((p) => (
            <Chip key={p.key} icon={Clock} label={`${t(`timer.presets.${p.key}`)} · ${p.sec % 60 ? t('timer.presetMinSec', { m: Math.floor(p.sec / 60), s: p.sec % 60 }) : t('timer.presetMin', { n: p.sec / 60 })}`} onPress={async () => { const name = t(`timer.presets.${p.key}`); const id = await startTimer(name, p.sec, undefined, name); setFeaturedId(id); }} />
          ))}
        </ScrollView>

        <View style={styles.running}>
          <View style={styles.sectionHead}>
            <Text variant="Title/L" style={styles.flex}>{t('timer.running')}</Text>
          </View>
          {others.length === 0 ? (
            // Empty state only (676:22674) — gone once a second timer is running.
            // Placeholder only — not tappable (Add Timer above starts one).
            <View style={[styles.addCard, { backgroundColor: color('bg/default'), borderColor: color('border/default') }]}>
              <View style={styles.addPlus}>
                <View style={[styles.addLineH, { backgroundColor: color('border/strong') }]} />
                <View style={[styles.addLineV, { backgroundColor: color('border/strong') }]} />
              </View>
            </View>
          ) : (
            others.map((x) => {
              const l = secondsLeft(x, now);
              const on = x.endAt != null && l > 0;
              const finished = l === 0;
              return (
                <Pressable key={x.id} accessibilityRole="button" onPress={() => setFeaturedId(x.id)} onLongPress={() => removeAsk(x)} style={[styles.card, { backgroundColor: color('bg/default'), borderColor: color(finished ? 'fg/done' : 'border/default') }]}>
                  <TimerRing size={52} stroke={9} endAt={x.endAt} leftSec={l} totalSec={x.totalSec} done={finished} onComplete={() => onRingEnd(x.id)} />
                  <View style={styles.flex}>
                    <View style={styles.nameRow}>
                      <Text variant="Body/S Strong" color="fg/muted" numberOfLines={1} style={styles.shrink}>{foodOf(x) && foodOf(x) !== x.label ? `${foodOf(x)} · ${x.label}` : x.label}</Text>
                      {finished ? (
                        <View style={[styles.doneBadge, { backgroundColor: color('bg/success-subtle') }]}>
                          <Text variant="Caption Strong" color="fg/done">{t('timer.doneBadge')}</Text>
                        </View>
                      ) : null}
                    </View>
                    {/* Finished: "Done" in place of 00:00. */}
                    <Text variant="Numeric/L" color={finished ? 'fg/done' : 'fg/default'} numberOfLines={1} style={styles.tabular}>{finished ? t('timer.doneBadge') : fmt(l)}</Text>
                  </View>
                  <Pressable accessibilityRole="button" accessibilityLabel={t(on ? 'timer.pause' : 'timer.resume')} onPress={() => (on ? pauseTimer(x.id) : l === 0 ? addMinute(x.id) : resumeTimer(x.id))} style={[styles.cardBtn, { backgroundColor: color('bg/inverse') }]}>
                    <Icon icon={on ? Pause : l === 0 ? Plus : Play} size={20} color="fg/inverse" />
                  </Pressable>
                </Pressable>
              );
            })
          )}
          {timers.length > 0 ? <Text variant="Caption" color="fg/muted">{t('timer.holdToRemove')}</Text> : null}
        </View>
        </View>
      </ScrollView>

      <TabBar active="timer" progress={bar.progress} onTab={onTab} onCreate={() => router.push('/share/pick')} />

      <TimerSheet
        visible={adding}
        overline={t('timer.newOverline')}
        stepNo={0}
        stepText=""
        onClose={() => setAdding(false)}
        onSet={async (sec, name) => {
          setAdding(false);
          if (sec) setFeaturedId(await startTimer(t('timer.defaultLabel'), sec, undefined, name));
        }}
        hideNoTimer
        foodName
      />
    </View>
  );
}

function RoundBtn({ icon, label, onPress, primary }: { icon: typeof Plus; label: string; onPress: () => void; primary?: boolean }) {
  const { color } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.round,
        primary ? { backgroundColor: color('bg/primary') } : [{ backgroundColor: color('bg/subtle'), borderColor: color('border/default'), borderWidth: iconRing }, elevation['Elevation/1 Low']],
        pressed && { opacity: 0.85 },
      ]}
    >
      <Icon icon={icon} size={22} color={primary ? 'fg/on-primary' : 'fg/default'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  active: { alignItems: 'center', paddingHorizontal: space[20] },
  // Inner circle is 220 − 2×12.65 ≈ 195 wide; the light numerals overhang their box, so give them side room.
  mid: { alignItems: 'center', gap: space[2], width: 152 },
  time: { paddingHorizontal: space[4] },
  tabular: { fontVariant: ['tabular-nums'] },
  // Active timer 20:795 — ring → 28 → controls (48 · 28 · 48 · 28 · 48).
  controls: { width: 196, marginTop: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  round: { width: 48, height: 48, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  // Frame 14 676:22625 — 25 circle overlapping the + button's top-right corner.
  badge: { position: 'absolute', right: -11, top: -7, width: 25, height: 25, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  food: { maxWidth: 300, textAlign: 'center', marginBottom: 13 },
  presets: { gap: space[8], paddingHorizontal: space[20], paddingBottom: 30 },
  addWrap: { alignSelf: 'stretch', paddingTop: space[20], paddingBottom: space[12] },
  addBtn: { height: 52, borderRadius: radius.full, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[8] },
  running: { paddingHorizontal: space[20], gap: space[10] },
  // Figma 676:22674 — dashed placeholder card with a thin 48px plus
  addCard: { height: 88, borderRadius: radius.xl, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addPlus: { width: 62, height: 62, alignItems: 'center', justifyContent: 'center' },
  addLineH: { position: 'absolute', width: 48, height: 1.6, borderRadius: 1 },
  addLineV: { position: 'absolute', width: 1.6, height: 48, borderRadius: 1 },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: -2 },
  card: { height: 88, flexDirection: 'row', alignItems: 'center', gap: space[14], paddingHorizontal: 18, borderRadius: radius.xl, borderWidth: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: space[6] },
  shrink: { flexShrink: 1 },
  doneBadge: { paddingHorizontal: space[6], paddingVertical: space[2], borderRadius: radius.xs },
  cardBtn: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: space[2] },
});
