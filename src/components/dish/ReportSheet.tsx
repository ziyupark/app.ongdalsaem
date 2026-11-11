import { Ban } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { blockUser, reportDish, REPORT_REASONS, type ReportReason } from '../../services/moderation';
import { gradients, radius, space, useTheme } from '../../theme';
import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { Text } from '../Text';

/** 7.3 Report / block (Figma 26:595): reason radios (9) → Report · Block {name} (destructive outline). */
export function ReportSheet({ visible, foodId, ownerId, ownerName, onClose, onBlocked, onReport, title }: {
  visible: boolean; foodId?: string; ownerId: string; ownerName: string; onClose: () => void; onBlocked: () => void;
  /** Report something other than the dish (a comment, an answer). */
  onReport?: (reason: ReportReason) => Promise<void>;
  title?: string;
}) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (visible) setReason(null); }, [visible]);

  const send = async () => {
    if (!reason || busy) return;
    setBusy(true);
    try {
      if (onReport) await onReport(reason);
      else if (foodId) await reportDish(foodId, ownerId, reason);
      onClose();
      Alert.alert(t('report.thanksTitle'), t('report.thanksBody'));
    } catch {
      Alert.alert(t('report.failed'));
    } finally {
      setBusy(false);
    }
  };

  const block = () =>
    Alert.alert(t('report.blockTitle', { name: ownerName }), t('report.blockBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('report.block'),
        style: 'destructive',
        onPress: async () => {
          try {
            await blockUser(ownerId);
            onClose();
            onBlocked();
          } catch {
            Alert.alert(t('report.failed'));
          }
        },
      },
    ]);

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title ?? t('report.title')} surface="bg/default" grabber="bg/emphasis" gap={space[14]} maxHeightRatio={0.9}>
      <View>
        {REPORT_REASONS.map((r) => {
          const on = reason === r;
          return (
            <Pressable
              key={r}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => setReason(r)}
              style={[styles.option, on ? { backgroundColor: color('bg/accent-subtle'), borderColor: color('border/accent'), borderWidth: 2, height: 58 } : { borderColor: color('border/default'), borderWidth: 1 }]}
            >
              <Radio on={on} />
              <Text variant="Body/M">{t(`report.reasons.${r}`)}</Text>
            </Pressable>
          );
        })}
      </View>
      <Button label={t('report.send')} disabled={!reason} loading={busy} onPress={send} />
      <Pressable accessibilityRole="button" onPress={block} style={({ pressed }) => [styles.block, { borderColor: color('border/strong'), backgroundColor: color('bg/default') }, pressed && { opacity: 0.85 }]}>
        <Ban size={20} strokeWidth={1.5} absoluteStrokeWidth color={color('fg/destructive')} />
        <Text variant="Button/L" color="fg/destructive">{t('report.blockName', { name: ownerName })}</Text>
      </Pressable>
    </BottomSheet>
  );
}

/** Radio 41:512 — 26 circle bg/emphasis; selected = Gradient/Sunset dot (12) inside a white ring. */
function Radio({ on }: { on: boolean }) {
  const { color } = useTheme();
  if (!on) return <View style={[styles.radio, { backgroundColor: color('bg/emphasis') }]} />;
  return (
    <Svg width={26} height={26}>
      <Defs>
        <RadialGradient id="radio" cx="50%" cy="50%" r="50%">
          {gradients['Gradient/Sunset'].map((s) => <Stop key={s.offset} offset={s.offset} stopColor={s.color} />)}
        </RadialGradient>
      </Defs>
      <Circle cx={13} cy={13} r={13} fill={color('bg/muted')} />
      <Circle cx={13} cy={13} r={8} fill="url(#radio)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  option: { height: 56, flexDirection: 'row', alignItems: 'center', gap: space[12], paddingHorizontal: space[16], borderRadius: radius.md, marginBottom: -1 },
  radio: { width: 26, height: 26, borderRadius: radius.full },
  block: { height: 56, borderRadius: radius.full, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[8] },
});
