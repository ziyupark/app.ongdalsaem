import { Plus } from '../icons/ongdal';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { MAX_DIET_TAG_LENGTH } from '../../lib/allergens';
import { elevation, radius, space, text, useTheme, FONT_SCALE_MAX } from '../../theme';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { Text } from '../Text';

const { lineHeight: _lh, ...fieldText } = text['Body/M'];

/** Diet & allergies "Add your own" — same card as 8.2b Add your mood: badge + title/body · field (≤ 20, counter) · Cancel / Add. */
export function AddDietTagDialog({ kind, existing, onCancel, onAdd }: { kind: 'diet' | 'allergy' | null; existing: string[]; onCancel: () => void; onAdd: (label: string) => void }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  useEffect(() => { if (kind) setValue(''); }, [kind]);

  const label = value.trim().replace(/\s+/g, ' ');
  const duplicate = existing.some((e) => e.toLowerCase() === label.toLowerCase());
  const ok = label.length > 0 && !duplicate;
  const k = kind ?? 'diet';

  return (
    <Modal visible={!!kind} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} style={[StyleSheet.absoluteFill, { backgroundColor: color('overlay/scrim') }]} onPress={onCancel} />
        <View style={[styles.card, elevation['Elevation/3 Float'], { backgroundColor: color('bg/subtle') }]}>
          <View style={styles.head}>
            <View style={[styles.badge, { backgroundColor: color('bg/accent-subtle') }]}>
              <Icon icon={Plus} size={20} color="fg/accent" />
            </View>
            <View style={styles.flex}>
              <Text variant="Title/M">{t(`diet.add.${k}Title`)}</Text>
              <Text variant="Body/S" color="fg/secondary">{t(`diet.add.${k}Body`)}</Text>
            </View>
          </View>
          <View style={[styles.field, { backgroundColor: color('bg/default'), borderColor: color(duplicate ? 'fg/destructive' : 'border/focus') }]}>
            <TextInput maxFontSizeMultiplier={FONT_SCALE_MAX}
              accessibilityLabel={t(`diet.add.${k}Title`)}
              value={value}
              onChangeText={setValue}
              maxLength={MAX_DIET_TAG_LENGTH}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => ok && onAdd(label)}
              placeholder={t(`diet.add.${k}Placeholder`)}
              placeholderTextColor={color('fg/muted')}
              selectionColor={color('fg/accent')}
              style={[fieldText, styles.input, { color: color('fg/default') }]}
            />
            <Text variant="Caption" color="fg/muted">{`${label.length} / ${MAX_DIET_TAG_LENGTH}`}</Text>
          </View>
          {duplicate ? <Text variant="Caption" color="fg/destructive">{t('diet.add.duplicate')}</Text> : null}
          <View style={styles.actions}>
            <Button label={t('common.cancel')} variant="Outline" size="M" onPress={onCancel} style={styles.flex} />
            <Button label={t('diet.add.add')} size="M" disabled={!ok} onPress={() => onAdd(label)} style={styles.flex} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', paddingHorizontal: space[20] },
  card: { borderRadius: radius.xl, paddingTop: space[24], paddingBottom: space[20], paddingHorizontal: space[20], gap: space[16] },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: space[12] },
  badge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: space[4] },
  field: { height: 52, flexDirection: 'row', alignItems: 'center', gap: space[8], paddingLeft: space[16], paddingRight: space[14], borderRadius: radius.lg, borderWidth: 1.5 },
  input: { flex: 1, padding: 0 },
  actions: { flexDirection: 'row', gap: space[8] },
});
