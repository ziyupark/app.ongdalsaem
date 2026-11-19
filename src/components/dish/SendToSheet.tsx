import { Check, Image as ImageIcon } from '../icons/ongdal';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { fetchSendTargets, sendDish, type Target } from '../../services/messages';
import { radius, space, text, useTheme, FONT_SCALE_MAX } from '../../theme';
import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { Avatar, SearchField } from '../community/Parts';
import { Icon } from '../Icon';
import { Text } from '../Text';

const { lineHeight: _lh, ...field } = text['Body/M'];

/** 7.5 Send to (367:9340) — search · people you follow / who follow you (multi-select) · dish card note · optional message · "Send to n". */
export function SendToSheet({ visible, onClose, dish, onSent }: { visible: boolean; onClose: () => void; dish: { id: string; name: string }; onSent?: (n: number) => void }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const [all, setAll] = useState<Target[] | null>(null);
  const [term, setTerm] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setPicked(new Set());
    setNote('');
    setTerm('');
    fetchSendTargets().then(setAll).catch(() => setAll([]));
  }, [visible]);

  const q = term.trim().toLowerCase();
  const list = (all ?? []).filter((p) => !q || p.name.toLowerCase().includes(q) || (p.handle ?? '').toLowerCase().includes(q));
  const toggle = (id: string) => setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const send = async () => {
    if (!picked.size || sending) return;
    setSending(true);
    const failed = await sendDish([...picked], dish.id, dish.name, note);
    setSending(false);
    if (failed) Alert.alert(t('sendTo.someFailed', { n: failed }));
    onSent?.(picked.size - failed);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('sendTo.title')} maxHeightRatio={0.88}>
      {picked.size ? <Text variant="Caption Strong" color="fg/accent" style={styles.selected}>{t('sendTo.selected', { n: picked.size })}</Text> : null}
      <SearchField value={term} onChangeText={setTerm} placeholder={t('sendTo.search')} />
      {all == null ? <ActivityIndicator color={color('fg/muted')} /> : list.length ? (
        <ScrollView style={[styles.list, { backgroundColor: color('bg/subtle') }]} keyboardShouldPersistTaps="handled">
          {list.map((p, i) => {
            const on = picked.has(p.id);
            return (
              <Pressable key={p.id} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => toggle(p.id)} style={[styles.row, i < list.length - 1 && { borderBottomWidth: 1, borderBottomColor: color('border/default') }]}>
                <Avatar url={p.avatarUrl} name={p.name} size={40} />
                <View style={styles.flex}>
                  <Text variant="Body/M Strong" numberOfLines={1}>{p.handle ?? p.name}</Text>
                  <Text variant="Caption" color="fg/muted">{t(`sendTo.relation.${p.relation}`)}</Text>
                </View>
                <View style={[styles.check, on ? { backgroundColor: color('bg/inverse'), borderColor: color('bg/inverse') } : { borderColor: color('border/strong') }]}>
                  {on ? <Icon icon={Check} size={16} color="fg/inverse" /> : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : <Text variant="Body/S" color="fg/muted">{t(q ? 'sendTo.noMatch' : 'sendTo.empty')}</Text>}
      <View style={styles.attach}>
        <Icon icon={ImageIcon} size={16} color="fg/secondary" />
        <Text variant="Caption" color="fg/secondary" numberOfLines={1} style={styles.flex}>{t('sendTo.attached', { name: dish.name })}</Text>
      </View>
      <View style={[styles.noteField, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
        <TextInput maxFontSizeMultiplier={FONT_SCALE_MAX} value={note} onChangeText={(v) => setNote(v.slice(0, 500))} placeholder={t('sendTo.note')} placeholderTextColor={color('fg/muted')} style={[field, { color: color('fg/default') }]} />
      </View>
      <Button label={picked.size ? t('sendTo.send', { n: picked.size }) : t('sendTo.pick')} size="L" disabled={!picked.size} loading={sending} onPress={send} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  selected: { position: 'absolute', right: 0, top: -36 },
  list: { maxHeight: 300, borderRadius: radius.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[12], paddingHorizontal: space[14], paddingVertical: space[10] },
  check: { width: 24, height: 24, borderRadius: radius.full, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  attach: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  noteField: { height: 48, borderRadius: radius.full, borderWidth: 1, paddingHorizontal: space[16], justifyContent: 'center' },
});
