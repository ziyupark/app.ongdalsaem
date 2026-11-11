import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { addFridge, removeFridge, useFridge, type FridgeItem, type FridgeZone } from '../../lib/fridge';
import { radius, space, useTheme } from '../../theme';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { Input } from '../Input';
import { Text } from '../Text';

const DAY = 24 * 60 * 60 * 1000;
const ZONES: FridgeZone[] = ['fridge', 'freezer'];
const ROW = 48;

/** Whole calendar days between when it went in and today (local time). */
function daysSince(iso: string) {
  const a = new Date(iso);
  const b = new Date();
  return Math.round((new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime() - new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()) / DAY);
}

/** Fridge memo — bottom of 6.3 Diary. Fridge / freezer, saved on this device only. */
export function FridgeList() {
  const { t } = useTranslation();
  const { color } = useTheme();
  const items = useFridge();
  const [zone, setZone] = useState<FridgeZone>('fridge');
  const [name, setName] = useState('');
  const add = () => { addFridge(name, zone); setName(''); };
  const zoneLabel = (z: FridgeZone) => t(z === 'fridge' ? 'fridge.fridgeZone' : 'fridge.freezerZone');

  // Tap a chip → confirm once → remove.
  const ask = (it: FridgeItem) => Alert.alert(t('fridge.removeAsk', { name: it.name }), undefined, [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('fridge.remove', { name: it.name }), style: 'destructive', onPress: () => removeFridge(it.id) },
  ]);

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <Text variant="Title/M">{t('fridge.title')}</Text>
        <Text variant="Title/M" color="fg/muted">{String(items.length)}</Text>
      </View>

      <View style={styles.row}>
        {ZONES.map((z) => {
          const on = z === zone;
          return (
            <Pressable
              key={z}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => setZone(z)}
              style={[styles.zone, on ? { backgroundColor: color('bg/inverse') } : { backgroundColor: color('bg/subtle'), borderWidth: 1, borderColor: color('border/default') }]}
            >
              <Text variant="Button/M" color={on ? 'fg/inverse' : 'fg/default'}>{zoneLabel(z)}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.row}>
        <View style={styles.flex}>
          <Input height={ROW} value={name} onChangeText={setName} placeholder={t('fridge.placeholder')} returnKeyType="done" onSubmitEditing={add} />
        </View>
        <Button label={t('fridge.add')} size="M" onPress={add} disabled={!name.trim()} style={styles.addBtn} />
      </View>

      {ZONES.map((z) => {
        const list = items.filter((i) => i.zone === z);
        return (
          <View key={z} style={[styles.box, { backgroundColor: color('bg/subtle') }]}>
            <View style={styles.head}>
              <Text variant="Body/M Strong">{zoneLabel(z)}</Text>
              <Text variant="Body/M Strong" color="fg/muted">{String(list.length)}</Text>
            </View>
            {list.length === 0 ? (
              <Text variant="Body/S" color="fg/muted">{t('fridge.empty')}</Text>
            ) : (
              <View style={styles.chips}>
                {list.map((it) => (
                  <Chip
                    key={it.id}
                    label={it.name}
                    borderColor={daysSince(it.addedAt) > 7 ? 'fg/accent' : undefined}
                    accessibilityLabel={t('fridge.remove', { name: it.name })}
                    onPress={() => ask(it)}
                  />
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space[12], paddingTop: space[12] },
  head: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  row: { flexDirection: 'row', gap: space[8] },
  flex: { flex: 1 },
  zone: { flex: 1, height: ROW, borderRadius: radius.input, alignItems: 'center', justifyContent: 'center' },
  addBtn: { height: ROW, borderRadius: radius.input },
  box: { borderRadius: radius.xl, padding: space[16], gap: space[12] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8] },
});
