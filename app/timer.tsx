import { router } from 'expo-router';
import { Bell, Check, Clock, Pause, Play, Plus, RotateCcw, Timer } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip } from '../src/components/Chip';
import { Icon } from '../src/components/Icon';
import { TimerSheet } from '../src/components/share/TimerSheet';
import { TabBar, useTabBarScroll, type TabKey } from '../src/components/TabBar';
import { Text } from '../src/components/Text';
import { TimerRing } from '../src/components/timer/TimerRing';
import {
  addMinute, addTime, fmt, foodOf, isFinished, pauseTimer, removeTimer, resetTimer, resumeTimer, secondsLeft, startTimer, useNow, useTimers, type KitchenTimer,
} from '../src/lib/timers';
import { elevation, radius, space, useTheme } from '../src/theme';

/** A timer started this recently before the screen opened is treated as new and takes the big ring. */
const JUST_STARTED_MS = 10_000;

const PRESETS = [
  { key: 'softEgg', sec: 390 },
  { key: 'rice', sec: 900 },
  { key: 'tea', sec: 180 },
] as const;

/** 5.1 Kitchen timer + 5.1b Add timer sheet + 5.2 Timer finished (Figma 20:748 · 669:11033 · 76:3268). */
export default function KitchenTimerScreen() {
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const timers = useTimers();
  const now = useNow();
  const [featuredId, setFeaturedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const bar = useTabBarScroll();

  // A timer that just started anywhere (Add Timer, a preset, a recipe step) takes the big ring, so “Food Name”
  // follows the newest timer instead of staying on an older pinned or finished one. Start time = the id's
  // timestamp (startTimer makes `t-<ms>`); one started moments before this screen opened (a recipe step's
  // "Start timer" → /timer) counts too.
  const lastStart = useRef<number | null>(null);
  useEffect(() => {
    if (!timers.length) return;
    const startOf = (x: KitchenTimer) => Number(x.id.slice(2)) || 0;
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
  const others = timers.filter((x) => x.id !== featured?.id);

  const onTab = (k: TabKey) => {
    if (k === 'home') router.replace('/home');
    if (k === 'community') router.replace('/community');
    if (k === 'profile') router.replace('/profile');
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    bar.onY(y);
  };

  const left = featured ? secondsLeft(featured, now) : 0;
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
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: color('bg/subtle') }]}>
      <ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: 96 + space[24] }} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <Text variant="Display/L">
            {t('timer.titleA')}
            <Text variant="Display/L" color="fg/disabled">{t('timer.titleB')}</Text>
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('home.notifications')} hitSlop={space[8]} onPress={() => router.push('/notifications')}>
            <Icon icon={Bell} size={24} />
          </Pressable>
        </View>

        {done && featured ? (
          <View style={styles.bannerWrap}>
            <View style={[styles.banner, elevation['Elevation/4 Overlay'], { backgroundColor: color('bg/done-subtle'), borderColor: color('border/done') }]}>
              <Icon icon={Check} size={20} color="fg/done" />
              <View style={styles.flex}>
                <Text variant="Body/M Strong" numberOfLines={1}>{t('timer.ready', { label: featured.label })}</Text>
                {featured.source ? (
                  <Text variant="Caption" color="fg/muted" numberOfLines={1}>{t('timer.stepOf', { dish: featured.source.dishName, n: featured.source.step, total: featured.source.stepCount })}</Text>
                ) : null}
              </View>
              <Pressable accessibilityRole="button" onPress={() => { pin(); addMinute(featured.id); }} style={[styles.smallBtn, elevation['Elevation/2 Raised'], { backgroundColor: color('bg/subtle') }]}>
                <Text variant="Button/M">{t('timer.plusMin')}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Block · Active timer 88:3084 — p30 20 0: “Food Name” → 13 → ring → 24 → controls → Frame 11 (p20 0 12, Add Timer). */}
        <View style={[styles.active, { paddingTop: done ? space[20] : 30 }]}>
          {food ? <Text variant="Display/M" numberOfLines={1} style={styles.food}>{`“${food}”`}</Text> : null}
          <TimerRing mirror size={196.8} stroke={10} progress={featured ? (done ? 1 : left / Math.max(1, featured.totalSec)) : 0} done={done}>
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
            <Pressable accessibilityRole="button" onPress={() => setAdding(true)} style={({ pressed }) => [styles.addBtn, { backgroundColor: color('bg/inverse') }, pressed && { opacity: 0.85 }]}>
              <Icon icon={Timer} size={24} color="fg/inverse" />
              <Text variant="Button/M" color="fg/inverse">{t('timer.addTimer')}</Text>
            </Pressable>
          </View>
        </View>

        {/* Block · presets 88:3085 — p0 0 20. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presets}>
          {PRESETS.map((p) => (
            <Chip key={p.key} icon={Clock} label={`${t(`timer.presets.${p.key}`)} ${fmt(p.sec).replace(/^0/, '')}`} onPress={async () => { const name = t(`timer.presets.${p.key}`); const id = await startTimer(name, p.sec, undefined, name); setFeaturedId(id); }} />
          ))}
        </ScrollView>

        <View style={styles.running}>
          <View style={styles.sectionHead}>
            <Text variant="Title/L" style={styles.flex}>{t('timer.running')}</Text>
          </View>
          {others.length === 0 ? (
            // Empty state only (676:22674) — gone once a second timer is running.
            <Pressable accessibilityRole="button" accessibilityLabel={t('timer.addTimer')} onPress={() => setAdding(true)} style={({ pressed }) => [styles.addCard, { backgroundColor: color('bg/default'), borderColor: color('border/default') }, pressed && { opacity: 0.7 }]}>
              <View style={styles.addPlus}>
                <View style={[styles.addLineH, { backgroundColor: color('border/strong') }]} />
                <View style={[styles.addLineV, { backgroundColor: color('border/strong') }]} />
              </View>
            </Pressable>
          ) : (
            others.map((x) => {
              const l = secondsLeft(x, now);
              const on = x.endAt != null && l > 0;
              return (
                <Pressable key={x.id} accessibilityRole="button" onPress={() => setFeaturedId(x.id)} onLongPress={() => removeAsk(x)} style={[styles.card, { backgroundColor: color('bg/default'), borderColor: color('border/default') }]}>
                  <TimerRing size={52} stroke={5} progress={l / Math.max(1, x.totalSec)} done={l === 0} />
                  <View style={styles.flex}>
                    <Text variant="Body/S Strong" color="fg/muted" numberOfLines={1}>{foodOf(x) && foodOf(x) !== x.label ? `${foodOf(x)} · ${x.label}` : x.label}</Text>
                    <Text variant="Numeric/L" color={l === 0 ? 'fg/done' : 'fg/default'} style={styles.tabular}>{fmt(l)}</Text>
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
        primary ? { backgroundColor: color('bg/primary') } : [{ backgroundColor: color('bg/subtle'), borderColor: color('border/default'), borderWidth: 1 }, elevation['Elevation/1 Low']],
        pressed && { opacity: 0.85 },
      ]}
    >
      <Icon icon={icon} size={22} color={primary ? 'fg/on-primary' : 'fg/default'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: space[20], paddingVertical: space[12] },
  bannerWrap: { paddingTop: space[12], paddingHorizontal: space[20] },
  banner: { flexDirection: 'row', alignItems: 'center', gap: space[12], paddingLeft: space[16], paddingRight: space[12], paddingVertical: space[12], borderRadius: radius.xl, borderWidth: 1 },
  smallBtn: { height: 36, paddingHorizontal: space[14], borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  active: { alignItems: 'center', paddingHorizontal: space[20] },
  // Inner circle is 196.8 − 2×10 ≈ 176 wide; the light numerals overhang their box, so give them side room.
  mid: { alignItems: 'center', gap: space[2], width: 172 },
  time: { paddingHorizontal: space[4] },
  tabular: { fontVariant: ['tabular-nums'] },
  controls: { width: 196, marginTop: space[24], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  round: { width: 48, height: 48, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  // Frame 14 676:22625 — 25 circle overlapping the + button's top-right corner.
  badge: { position: 'absolute', right: -11, top: -7, width: 25, height: 25, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  food: { maxWidth: 300, textAlign: 'center', marginBottom: 13 },
  presets: { gap: space[8], paddingHorizontal: space[20], paddingBottom: 30 },
  addWrap: { alignSelf: 'stretch', paddingTop: space[20], paddingBottom: space[12] },
  addBtn: { height: 52, borderRadius: radius.full, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[8] },
  running: { paddingHorizontal: space[20], gap: space[10] },
  // Figma 676:22674 — dashed placeholder card with a thin 48px plus
  addCard: { height: 88, borderRadius: radius.xl, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addPlus: { width: 62, height: 62, alignItems: 'center', justifyContent: 'center' },
  addLineH: { position: 'absolute', width: 48, height: 1.6, borderRadius: 1 },
  addLineV: { position: 'absolute', width: 1.6, height: 48, borderRadius: 1 },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: -2 },
  card: { height: 88, flexDirection: 'row', alignItems: 'center', gap: space[14], paddingHorizontal: 18, borderRadius: radius.xl, borderWidth: 1 },
  cardBtn: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: space[2] },
});
