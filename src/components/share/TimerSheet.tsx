import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, space, text, useTheme } from '../../theme';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { Input } from '../Input';
import { Text } from '../Text';

const PRESETS = [1, 2, 5, 10, 15];
export const MAX_TIMER_SEC = 99 * 60 + 59;

/** Card entrance: fade in while growing slightly (0.94 → 1). */
const popIn = () => {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ scale: 0.94 }] },
    animations: { opacity: withTiming(1, { duration: 200 }), transform: [{ scale: withTiming(1, { duration: 200 }) }] },
  };
};

export const formatTimer = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

type Props = {
  visible: boolean;
  stepNo: number;
  stepText: string;
  /** Overrides "STEP n · TIMER" (5.1 + Add timer). */
  overline?: string;
  /** 5.1 new timer: no "No timer" button. */
  hideNoTimer?: boolean;
  /** 5.1b Add timer (669:11033): eyebrow only (no step text) + a "Food Name" field (timer Input 665:19235). */
  foodName?: boolean;
  initialSec?: number;
  onClose: () => void;
  /** undefined = "No timer". `name` = the typed food name (5.1b). */
  onSet: (sec: number | undefined, name?: string) => void;
};

/** 8.2c Set timer (Figma 346:7187) — centred dialog card (bg/default, radius xl, max 360 wide): STEP n · TIMER, min : sec boxes (120×72), Quick pick chips, No timer / Set m:ss timer. */
export function TimerSheet({ visible, stepNo, stepText, overline, hideNoTimer, foodName, initialSec, onClose, onSet }: Props) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [min, setMin] = useState('');
  const [sec, setSec] = useState('');
  const [focus, setFocus] = useState<'min' | 'sec' | null>('min');
  const [name, setName] = useState('');

  // The keyboard lifts the card into the middle of the space left above it (200 ms); a card taller than that scrolls inside.
  const kb = useSharedValue(0);
  useEffect(() => {
    if (!visible) return;
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (e) => { kb.value = withTiming(e.endCoordinates.height, { duration: 200 }); });
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => { kb.value = withTiming(0, { duration: 200 }); });
    return () => { show.remove(); hide.remove(); kb.value = 0; };
  }, [visible, kb]);
  const bottomInset = insets.bottom;
  const lift = useAnimatedStyle(() => ({ paddingBottom: Math.max(kb.value, bottomInset) + space[20] }));

  useEffect(() => {
    if (!visible) return;
    const s = initialSec ?? 0;
    setMin(s ? String(Math.floor(s / 60)).padStart(2, '0') : '');
    setSec(s ? String(s % 60).padStart(2, '0') : '');
    setFocus(foodName ? null : 'min');
    setName('');
  }, [visible, initialSec, foodName]);

  const total = Math.min(MAX_TIMER_SEC, (Number(min) || 0) * 60 + Math.min(59, Number(sec) || 0));
  const digits = (v: string) => v.replace(/\D/g, '').slice(0, 2);
  const { lineHeight: _lh, ...bigText } = text['Display/M'];

  const box = (which: 'min' | 'sec', value: string, set: (v: string) => void) => (
    <View style={styles.unit}>
      <View style={[styles.field, { backgroundColor: color('bg/default'), borderColor: color(focus === which ? 'border/focus' : 'border/default'), borderWidth: focus === which ? 1.5 : 1 }]}>
        <TextInput
          accessibilityLabel={t(which === 'min' ? 'share.timerMin' : 'share.timerSec')}
          value={value}
          onChangeText={(v) => set(digits(v))}
          onFocus={() => setFocus(which)}
          onBlur={() => setFocus((f) => (f === which ? null : f))}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="00"
          placeholderTextColor={color('fg/disabled')}
          selectionColor={color('fg/accent')}
          autoFocus={!foodName && which === 'min'}
          style={[bigText, styles.big, { color: color('fg/default') }]}
        />
      </View>
      <Text variant="Caption" color="fg/muted">{t(which === 'min' ? 'share.timerMin' : 'share.timerSec')}</Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {visible ? (
        <>
          <Animated.View entering={FadeIn.duration(200)} style={[StyleSheet.absoluteFill, { backgroundColor: color('overlay/scrim') }]}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} style={StyleSheet.absoluteFill} onPress={onClose} />
          </Animated.View>
          <Animated.View style={[styles.center, { paddingTop: insets.top + space[20] }, lift]} pointerEvents="box-none">
            <Animated.View entering={popIn} style={[styles.card, { backgroundColor: color('bg/default') }]}>
              <ScrollView bounces={false} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={styles.scroll}>
                {/* Empty space inside the card only lowers the keyboard (taps outside close it). */}
                <Pressable accessible={false} onPress={Keyboard.dismiss} style={styles.body}>
                  <View style={styles.head}>
                    <Text variant="Overline" color="fg/accent">{overline ?? t('share.timerHead', { n: stepNo })}</Text>
                    {foodName ? null : <Text variant="Title/M" numberOfLines={2}>{stepText || t('share.stepPlaceholder')}</Text>}
                  </View>
                  {foodName ? (
                    <Input label={t('timer.foodName')} placeholder={t('timer.foodNamePlaceholder')} value={name} onChangeText={setName} maxLength={40} returnKeyType="next" autoFocus />
                  ) : null}
                  <View style={styles.time}>
                    {box('min', min, setMin)}
                    <Text variant="Display/M" color="fg/muted" style={styles.colon}>:</Text>
                    {box('sec', sec, setSec)}
                  </View>
                  <Text variant="Caption" color="fg/muted" style={styles.textCenter}>{t('share.timerHint')}</Text>
                  <View style={styles.presets}>
                    <Text variant="Overline" color="fg/muted">{t('share.quickPick')}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.chips}>
                      {PRESETS.map((m) => (
                        <Chip key={m} label={t('share.minutesChip', { n: m })} selected={total === m * 60} onPress={() => { setMin(String(m).padStart(2, '0')); setSec('00'); }} />
                      ))}
                    </ScrollView>
                  </View>
                  <View style={styles.actions}>
                    {hideNoTimer ? null : <Button label={t('share.noTimer')} variant="Ghost" onPress={() => onSet(undefined)} />}
                    <Button label={total > 0 ? t('share.setTimer', { time: formatTimer(total) }) : t('share.setTimerEmpty')} disabled={total <= 0} onPress={() => onSet(total, foodName ? name.trim() || undefined : undefined)} style={styles.flex} />
                  </View>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </Animated.View>
        </>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'center', alignItems: 'center', paddingHorizontal: space[20] },
  card: { width: '100%', maxWidth: 360, flexShrink: 1, borderRadius: radius.xl, overflow: 'hidden' },
  scroll: { flexGrow: 0 },
  body: { padding: space[20], gap: space[20] },
  head: { gap: space[4] },
  time: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: space[12] },
  unit: { alignItems: 'center', gap: space[6] },
  field: { width: 120, height: 72, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  big: { width: '100%', textAlign: 'center', padding: 0 },
  colon: { marginTop: 21 },
  textCenter: { textAlign: 'center' },
  presets: { gap: space[10] },
  chips: { gap: space[8] },
  actions: { flexDirection: 'row', gap: space[8] },
  flex: { flex: 1 },
});
