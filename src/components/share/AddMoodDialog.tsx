import { Sparkles } from '../icons/ongdal';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { CUSTOM_MOOD_ICON, MAX_CUSTOM_MOOD_LENGTH } from '../../lib/tags';
import { elevation, radius, space, text, useTheme } from '../../theme';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { Icon } from '../Icon';
import { Text } from '../Text';

const IDEAS = ['homesick', 'postRun'] as const;
const { lineHeight: _lh, ...fieldText } = text['Body/M'];

/** 8.2b Add your mood (Figma 368:9031): badge + title/body · field (≤ 20, counter) · Try ideas · "On your dish" preview · Cancel / Add mood. */
export function AddMoodDialog({ visible, existing, onCancel, onAdd }: { visible: boolean; existing: string[]; onCancel: () => void; onAdd: (label: string) => void }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  useEffect(() => { if (visible) setValue(''); }, [visible]);

  const label = value.trim().replace(/\s+/g, ' ');
  const duplicate = existing.some((e) => e.toLowerCase() === label.toLowerCase());
  const ok = label.length > 0 && !duplicate;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} style={[StyleSheet.absoluteFill, { backgroundColor: color('overlay/scrim') }]} onPress={onCancel} />
        <View style={[styles.card, elevation['Elevation/3 Float'], { backgroundColor: color('bg/subtle') }]}>
          <View style={styles.head}>
            <View style={[styles.badge, { backgroundColor: color('bg/accent-subtle') }]}>
              <Icon icon={Sparkles} size={20} color="fg/accent" />
            </View>
            <View style={styles.flex}>
              <Text variant="Title/M">{t('share.addMoodTitle')}</Text>
              <Text variant="Body/S" color="fg/secondary">{t('share.addMoodBody')}</Text>
            </View>
          </View>
          <View style={[styles.field, { backgroundColor: color('bg/default'), borderColor: color(duplicate ? 'fg/destructive' : 'border/focus') }]}>
            <TextInput
              accessibilityLabel={t('share.addMoodLabel')}
              value={value}
              onChangeText={setValue}
              maxLength={MAX_CUSTOM_MOOD_LENGTH}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => ok && onAdd(label)}
              placeholder={t('share.addMoodPlaceholder')}
              placeholderTextColor={color('fg/muted')}
              selectionColor={color('fg/accent')}
              style={[fieldText, styles.input, { color: color('fg/default') }]}
            />
            <Text variant="Caption" color="fg/muted">{`${label.length} / ${MAX_CUSTOM_MOOD_LENGTH}`}</Text>
          </View>
          {duplicate ? <Text variant="Caption" color="fg/destructive">{t('share.addMoodDuplicate')}</Text> : null}
          <View style={styles.ideas}>
            <Text variant="Caption Strong" color="fg/muted">{t('share.addMoodTry')}</Text>
            {IDEAS.map((k) => <Chip key={k} label={t(`share.moodIdeas.${k}`)} onPress={() => setValue(t(`share.moodIdeas.${k}`))} />)}
          </View>
          <View style={[styles.preview, { backgroundColor: color('bg/default') }]}>
            <Text variant="Caption" color="fg/muted" style={styles.flex}>{t('share.addMoodPreview')}</Text>
            {label ? <Chip label={label} icon={CUSTOM_MOOD_ICON} selected static /> : null}
          </View>
          <View style={styles.actions}>
            <Button label={t('common.cancel')} variant="Outline" size="M" onPress={onCancel} style={styles.flex} />
            <Button label={t('share.addMoodAdd')} size="M" disabled={!ok} onPress={() => onAdd(label)} style={styles.flex} />
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
  ideas: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space[6] },
  preview: { flexDirection: 'row', alignItems: 'center', gap: space[10], paddingLeft: space[14], paddingRight: space[10], paddingVertical: space[10], borderRadius: radius.lg, minHeight: 56 },
  actions: { flexDirection: 'row', gap: space[8] },
});
