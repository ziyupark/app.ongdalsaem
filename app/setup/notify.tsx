import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Bell } from 'lucide-react-native';
import { useMemo, useRef, useState, type ComponentRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Text } from '../../src/components/Text';
import { TopBar } from '../../src/components/TopBar';
import { getPrefs, setPrefs } from '../../src/lib/prefs';
import { syncPush } from '../../src/lib/push';
import { radius, space, useTheme } from '../../src/theme';

/** Wheel rows: every 30 minutes of the day, "HH:MM" (prefs.pickTime format). */
const TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);
const ROW = 46;
const VISIBLE = 5;
const PAD = ROW * Math.floor(VISIBLE / 2);

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
/** Closest wheel row to a saved time (saved times off the 30-min grid snap to the nearest row). */
const nearestIndex = (hhmm: string) => {
  const target = toMinutes(hhmm);
  let best = 0;
  TIMES.forEach((t, i) => { if (Math.abs(toMinutes(t) - target) < Math.abs(toMinutes(TIMES[best]) - target)) best = i; });
  return best;
};

/** Onboarding 4/4: daily "Today's pick" time → prefs.pickTime, then the notification permission prompt → Home. */
export default function NotifyStep() {
  const insets = useSafeAreaInsets();
  const { color, scheme } = useTheme();
  const { t, i18n } = useTranslation();
  const { state } = useLocalSearchParams<{ state?: string }>();
  const [index, setIndex] = useState(() => nearestIndex(getPrefs().pickTime));
  const [busy, setBusy] = useState(false);
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const placed = useRef(false);

  const label = useMemo(() => (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString(i18n.language, { hour: 'numeric', minute: '2-digit' });
  }, [i18n.language]);

  const goHome = () => router.replace(state === 'location-off' ? { pathname: '/home', params: { state } } : '/home');

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.max(0, Math.min(TIMES.length - 1, Math.round(e.nativeEvent.contentOffset.y / ROW)));
    if (i !== index) setIndex(i);
  };
  const stepBy = (delta: number) => {
    const i = Math.max(0, Math.min(TIMES.length - 1, index + delta));
    setIndex(i);
    scroller.current?.scrollTo({ y: i * ROW, animated: true });
  };

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      setPrefs({ pickTime: TIMES[index], notify: { ...getPrefs().notify, dailyPick: true } });
      // Shows the system notification prompt (src/lib/push.ts) and saves the time with this device's token.
      await syncPush({ ask: true });
    } finally {
      setBusy(false);
      goHome();
    }
  };

  const bottom = Math.max(insets.bottom, space[24]) + space[10];

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default'), paddingTop: insets.top }]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <View style={styles.bar}>
        <TopBar onBack={() => router.back()} backLabel={t('common.back')} />
        <Button label={t('notify.skip')} variant="Ghost" size="S" onPress={goHome} disabled={busy} style={styles.skip} />
      </View>
      <View style={styles.heading}>
        <Text variant="Overline" color="fg/accent">{t('notify.step')}</Text>
        <Text variant="Display/L" accessibilityRole="header">{t('notify.title')}</Text>
        <Text variant="Body/M" color="fg/secondary">{t('notify.body')}</Text>
      </View>

      <View
        style={styles.wheel}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={t('notify.wheel')}
        accessibilityValue={{ text: label(TIMES[index]) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => stepBy(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
      >
        {/* Centre row highlight. */}
        <View pointerEvents="none" style={[styles.highlight, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]} />
        <ScrollView
          ref={scroller}
          showsVerticalScrollIndicator={false}
          snapToInterval={ROW}
          decelerationRate="fast"
          onContentSizeChange={() => {
            if (placed.current) return;
            placed.current = true;
            scroller.current?.scrollTo({ y: index * ROW, animated: false });
          }}
          contentContainerStyle={{ paddingVertical: PAD }}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {TIMES.map((time, i) => {
            const d = Math.abs(i - index);
            return (
              <View key={time} style={styles.row}>
                <Text
                  variant={d === 0 ? 'Title/L' : 'Body/L'}
                  color={d === 0 ? 'fg/default' : 'fg/muted'}
                  style={{ opacity: d === 0 ? 1 : d === 1 ? 0.7 : 0.4 }}
                >
                  {label(time)}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      <View style={[styles.fixed, { bottom }]}>
        <Button label={t('notify.continue')} icon={Bell} onPress={submit} loading={busy} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bar: { justifyContent: 'center' },
  skip: { position: 'absolute', right: space[20] },
  heading: { paddingTop: space[12], paddingHorizontal: space[20], gap: space[12] },
  wheel: { height: ROW * VISIBLE, marginTop: space[40], marginHorizontal: space[20] },
  highlight: { position: 'absolute', left: 0, right: 0, top: PAD, height: ROW, borderRadius: radius.md, borderWidth: 1 },
  row: { height: ROW, alignItems: 'center', justifyContent: 'center' },
  fixed: { position: 'absolute', left: space[20], right: space[20] },
});
