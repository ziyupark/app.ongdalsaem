import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, space, text, useTheme } from '../../theme';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { Input } from '../Input';
import { Text } from '../Text';

const PRESETS = [1, 2, 5, 10, 15];
export const MAX_TIMER_SEC = 99 * 60 + 59;

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

/** 8.2c Set timer (Figma 346:7187) — sheet radius 28: STEP n · TIMER, min : sec boxes (120×72), Quick pick chips, No timer / Set m:ss timer. */
export function TimerSheet({ visible, stepNo, stepText, overline, hideNoTimer, foodName, initialSec, onClose, onSet }: Props) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [min, setMin] = useState('');
  const [sec, setSec] = useState('');
  const [focus, setFocus] = useState<'min' | 'sec' | null>('min');
  const [name, setName] = useState('');

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
          {/* The keyboard opens over the sheet — the sheet stays put (no keyboard avoiding). */}
          <View style={styles.kav} pointerEvents="box-none">
            <Animated.View entering={SlideInDown.duration(260)} style={[styles.sheet, { backgroundColor: color('bg/subtle'), paddingBottom: Math.max(insets.bottom, space[20]) }]}>
              <View style={styles.grabWrap}>
                <View style={[styles.grabber, { backgroundColor: color('border/default') }]} />
              </View>
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
              <Text variant="Caption" color="fg/muted" style={styles.center}>{t('share.timerHint')}</Text>
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
            </Animated.View>
          </View>
        </>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: space[10], paddingHorizontal: space[20], gap: space[20] },
  grabWrap: { alignItems: 'center' },
  grabber: { width: 36, height: 5, borderRadius: radius.full },
  head: { gap: space[4] },
  time: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: space[12] },
  unit: { alignItems: 'center', gap: space[6] },
  field: { width: 120, height: 72, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  big: { width: '100%', textAlign: 'center', padding: 0 },
  colon: { marginTop: 21 },
  center: { textAlign: 'center' },
  presets: { gap: space[10] },
  chips: { gap: space[8] },
  actions: { flexDirection: 'row', gap: space[8] },
  flex: { flex: 1 },
});
