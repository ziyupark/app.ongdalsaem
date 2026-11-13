import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { addFridge, removeFridge, useFridge, type FridgeItem, type FridgeZone } from '../../lib/fridge';
import { addShopping, moveCheckedToFridge, removeShopping, toggleShopping, useShopping, type ShoppingItem } from '../../lib/shopping';
import { matchRecipes } from '../../lib/ingredientMatch';
import { fetchRecipeCandidates, type RecipeCandidate } from '../../services/foods';
import { radius, space, useTheme } from '../../theme';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { Input } from '../Input';
import { Text } from '../Text';

const DAY = 24 * 60 * 60 * 1000;
const ZONES: FridgeZone[] = ['fridge', 'freezer'];
/** Top selector: the two fridge zones + the shopping memo (goes to the shopping list, not the fridge). */
type Target = FridgeZone | 'shopping';
const TARGETS: Target[] = [...ZONES, 'shopping'];
const ROW = 48;
const CARD = 140;

/** Whole calendar days between when it went in and today (local time). */
function daysSince(iso: string) {
  const a = new Date(iso);
  const b = new Date();
  return Math.round((new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime() - new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()) / DAY);
}

/** Fridge memo — bottom of 6.3 Diary. Fridge / freezer / shopping memo, saved on this device only. */
export function FridgeList({ focusShopping }: { focusShopping?: string | null } = {}) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const items = useFridge();
  const shopping = useShopping();
  const checked = shopping.filter((i) => i.checked).length;
  const [zone, setZone] = useState<Target>(focusShopping ? 'shopping' : 'fridge');
  useEffect(() => { if (focusShopping) setZone('shopping'); }, [focusShopping]);
  const [name, setName] = useState('');
  const add = () => {
    if (zone === 'shopping') { if (name.trim()) addShopping([{ name }]); }
    else addFridge(name, zone);
    setName('');
  };
  const [recipes, setRecipes] = useState<RecipeCandidate[] | null>(null);
  useEffect(() => {
    let alive = true;
    fetchRecipeCandidates().then((l) => alive && setRecipes(l)).catch(() => alive && setRecipes([]));
    return () => { alive = false; };
  }, []);
  const matches = useMemo(() => (recipes ? matchRecipes(items.map((i) => i.name), recipes) : []), [items, recipes]);
  const zoneLabel = (z: Target) => t(z === 'fridge' ? 'fridge.fridgeZone' : z === 'freezer' ? 'fridge.freezerZone' : 'fridge.shoppingZone');

  // Tap a chip → confirm once → remove.
  const ask = (it: FridgeItem) => Alert.alert(t('fridge.removeAsk', { name: it.name }), undefined, [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('fridge.remove', { name: it.name }), style: 'destructive', onPress: () => removeFridge(it.id) },
  ]);
  // Shopping memo: tap = check / uncheck, long press → confirm once → remove.
  const askShopping = (it: ShoppingItem) => Alert.alert(t('fridge.removeAsk', { name: it.name }), undefined, [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('shopping.remove', { name: it.name }), style: 'destructive', onPress: () => removeShopping(it.id) },
  ]);

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <Text variant="Title/M">{t('fridge.title')}</Text>
        <Text variant="Title/M" color="fg/muted">{String(items.length)}</Text>
      </View>

      <View style={styles.row}>
        {TARGETS.map((z) => {
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
      <View style={[styles.box, { backgroundColor: color('bg/subtle') }]}>
        <View style={styles.head}>
          <Text variant="Body/M Strong">{zoneLabel('shopping')}</Text>
          <Text variant="Body/M Strong" color="fg/muted" style={styles.flex}>{String(shopping.length)}</Text>
          {checked > 0 ? (
            <Pressable accessibilityRole="button" onPress={moveCheckedToFridge} hitSlop={space[10]}>
              <Text variant="Body/S Strong" color="fg/accent">{t('fridge.moveToFridge')}</Text>
            </Pressable>
          ) : null}
        </View>
        {shopping.length === 0 ? (
          <Text variant="Body/S" color="fg/muted">{t('fridge.shoppingEmpty')}</Text>
        ) : (
          <View style={styles.chips}>
            {shopping.map((it) => (
              <Chip
                key={it.id}
                label={it.amount ? `${it.name} ${it.amount}` : it.name}
                struck={it.checked}
                accessibilityLabel={it.name}
                onPress={() => toggleShopping(it.id)}
                onLongPress={() => askShopping(it)}
              />
            ))}
          </View>
        )}
      </View>
      {/* What I can cook with what's in the fridge — public recipes ranked by how many of their ingredients I have. */}
      <View style={[styles.box, { backgroundColor: color('bg/accent-subtle') }]}>
        <Text variant="Body/M Strong">{t('fridge.canCook')}</Text>
        {items.length > 0 && recipes == null ? (
          <ActivityIndicator color={color('fg/muted')} />
        ) : matches.length === 0 ? (
          <Text variant="Body/S" color="fg/muted">{t('fridge.canCookEmpty')}</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
            {matches.map((m) => (
              <Pressable key={m.food.id} accessibilityRole="button" onPress={() => router.push(`/dish/${m.food.id}`)} style={[styles.card, { backgroundColor: color('bg/subtle') }]}>
                {m.food.photo ? (
                  <Image source={{ uri: m.food.photo }} style={[styles.photo, { backgroundColor: color('bg/muted') }]} contentFit="cover" />
                ) : <View style={[styles.photo, { backgroundColor: color('bg/muted') }]} />}
                <View style={styles.cardText}>
                  <Text variant="Body/S Strong" numberOfLines={1}>{m.food.name}</Text>
                  <Text variant="Caption" color="fg/accent">{t('fridge.haveCount', { have: m.have, total: m.total })}</Text>
                  {m.missing.length ? (
                    <Text variant="Caption" color="fg/muted" numberOfLines={1}>{t('fridge.needs', { items: m.missing.slice(0, 2).join(', ') })}</Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
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
  cards: { gap: space[8] },
  card: { width: CARD, borderRadius: radius.lg, overflow: 'hidden' },
  photo: { width: CARD, height: 100 },
  cardText: { padding: space[10], gap: space[2] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8] },
});
