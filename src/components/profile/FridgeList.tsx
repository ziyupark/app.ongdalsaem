import { X } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { addFridge, removeFridge, useFridge } from '../../lib/fridge';
import { space } from '../../theme';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { Input } from '../Input';
import { Text } from '../Text';

const DAY = 24 * 60 * 60 * 1000;
/** Whole calendar days between when it went in and today (local time). */
function daysSince(iso: string) {
  const a = new Date(iso);
  const b = new Date();
  return Math.round((new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime() - new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()) / DAY);
}

/** Fridge memo — bottom of 6.3 Diary. Saved on this device only. */
export function FridgeList() {
  const { t } = useTranslation();
  const items = useFridge();
  const [name, setName] = useState('');
  const add = () => { addFridge(name); setName(''); };

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <Text variant="Title/M">{t('fridge.title')}</Text>
        <Text variant="Title/M" color="fg/muted">{String(items.length)}</Text>
      </View>
      <View style={styles.form}>
        <View style={styles.flex}>
          <Input value={name} onChangeText={setName} placeholder={t('fridge.placeholder')} returnKeyType="done" onSubmitEditing={add} />
        </View>
        <Button label={t('fridge.add')} onPress={add} disabled={!name.trim()} />
      </View>
      {items.length === 0 ? (
        <Text variant="Body/S" color="fg/muted">{t('fridge.empty')}</Text>
      ) : (
        <View style={styles.list}>
          {items.map((it) => {
            const d = daysSince(it.addedAt);
            return (
              <View key={it.id} style={styles.item}>
                <View style={styles.text}>
                  <Text variant="Body/M" numberOfLines={1}>{it.name}</Text>
                  <Text variant="Caption" color={d > 7 ? 'fg/accent' : 'fg/muted'}>{d <= 0 ? t('fridge.today') : t('fridge.daysAgo', { count: d })}</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel={t('fridge.remove', { name: it.name })} onPress={() => removeFridge(it.id)} hitSlop={space[8]}>
                  <Icon icon={X} size={20} color="fg/muted" />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space[12], paddingTop: space[12] },
  head: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  form: { flexDirection: 'row', alignItems: 'flex-end', gap: space[8] },
  flex: { flex: 1 },
  list: { gap: space[10] },
  item: { flexDirection: 'row', alignItems: 'center', gap: space[12] },
  text: { flex: 1, gap: space[2] },
});
