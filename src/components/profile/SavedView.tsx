import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Bookmark } from '../icons/ongdal';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { cached } from '../../lib/cache';
import { displayTemp } from '../../lib/prefs';
import { timeAgo } from '../../lib/time';
import { createCollection, deleteCollection, fetchCollections, fetchSavedDishes, setInCollection, setSaved, type Collection, type SavedDish } from '../../services/foods';
import { elevation, radius, space, text, useTheme, WEATHER_ICON, type WeatherMood, FONT_SCALE_MAX } from '../../theme';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { Text } from '../Text';

const { lineHeight: _lh, ...nameText } = text['Body/M'];

type Filter = { kind: 'all' } | { kind: 'collection'; id: string } | { kind: 'mood'; mood: WeatherMood };

/** 6.2 Profile · Saved (Figma 58:1788) — Collections (+ New) · filter chips · saved rows (unsave with the bookmark, hold to file into a collection). */
export function SavedView({ onOffline }: { onOffline?: (off: boolean) => void }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const [items, setItems] = useState<SavedDish[] | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [filter, setFilter] = useState<Filter>({ kind: 'all' });

  const load = useCallback(async () => {
    try {
      const [sv, cv] = await Promise.all([cached('saved.dishes', fetchSavedDishes), cached('saved.collections', fetchCollections)]);
      setItems(sv.data);
      setCollections(cv.data);
      onOffline?.(sv.stale || cv.stale);
    } catch {
      setItems((prev) => prev ?? []);
      onOffline?.(true);
    }
  }, [onOffline]);
  useEffect(() => { load(); }, [load]);

  const moods = useMemo(() => [...new Set((items ?? []).map((i) => i.mood).filter(Boolean) as WeatherMood[])].slice(0, 4), [items]);
  const shown = (items ?? []).filter((i) =>
    filter.kind === 'all' ? true : filter.kind === 'mood' ? i.mood === filter.mood : i.collectionIds.includes(filter.id),
  );

  // New collection — a centred dialog with a name field (works on iOS and Android; Alert.prompt is iOS-only).
  const [naming, setNaming] = useState(false);
  const [newName, setNewName] = useState('');
  const newCollection = () => { setNewName(''); setNaming(true); };
  const createNamed = async () => {
    const name = newName.trim();
    if (!name) return;
    setNaming(false);
    try { const c = await createCollection(name); setCollections((p) => [...p, c]); } catch { Alert.alert(t('saved.newFailed')); }
  };

  // Hold a collection chip → confirm → delete it (its dishes stay in Saved).
  const removeCollection = (c: Collection) => {
    Alert.alert(t('saved.deleteTitle', { name: c.name }), t('saved.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('saved.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCollection(c.id);
            setCollections((p) => p.filter((x) => x.id !== c.id));
            setItems((p) => (p ?? []).map((x) => ({ ...x, collectionIds: x.collectionIds.filter((y) => y !== c.id) })));
            setFilter((f) => (f.kind === 'collection' && f.id === c.id ? { kind: 'all' } : f));
          } catch {
            Alert.alert(t('saved.deleteFailed'));
          }
        },
      },
    ]);
  };

  const file = (d: SavedDish) => {
    if (!collections.length) return newCollection();
    Alert.alert(t('saved.fileTitle', { name: d.name }), undefined, [
      ...collections.map((c) => {
        const on = d.collectionIds.includes(c.id);
        return {
          text: `${on ? '✓ ' : ''}${c.name}`,
          onPress: async () => {
            try {
              await setInCollection(c.id, d.saveId, !on);
              setItems((p) => (p ?? []).map((x) => (x.saveId === d.saveId ? { ...x, collectionIds: on ? x.collectionIds.filter((y) => y !== c.id) : [...x.collectionIds, c.id] } : x)));
            } catch { Alert.alert(t('settings.saveFailed')); }
          },
        };
      }),
      { text: t('common.cancel'), style: 'cancel' as const },
    ]);
  };

  const unsave = async (d: SavedDish) => {
    setItems((p) => (p ?? []).filter((x) => x.saveId !== d.saveId));
    try { await setSaved(d.id, false); } catch { load(); }
  };

  if (items == null) return <ActivityIndicator color={color('fg/muted')} style={styles.loading} />;

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <Text variant="Title/M" style={styles.flex}>{t('saved.collections')}</Text>
        <Pressable accessibilityRole="button" onPress={newCollection} hitSlop={space[8]}>
          <Text variant="Body/S Strong" color="fg/muted">{t('saved.new')}</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chips}>
        <Chip label={t('home.allChip')} selected={filter.kind === 'all'} onPress={() => setFilter({ kind: 'all' })} />
        {collections.map((c) => <Chip key={c.id} label={c.name} selected={filter.kind === 'collection' && filter.id === c.id} onPress={() => setFilter({ kind: 'collection', id: c.id })} onLongPress={() => removeCollection(c)} />)}
        {moods.map((m) => <Chip key={m} icon={WEATHER_ICON[m]} label={t(`home.titleMood.${m}`)} selected={filter.kind === 'mood' && filter.mood === m} onPress={() => setFilter({ kind: 'mood', mood: m })} />)}
      </ScrollView>
      {shown.length === 0 ? (
        <Text variant="Body/M" color="fg/secondary" style={styles.empty}>{t('profile.empty.saved')}</Text>
      ) : shown.map((d) => (
        <Pressable key={d.saveId} accessibilityRole="button" onPress={() => router.push(`/dish/${d.id}`)} onLongPress={() => file(d)} style={styles.row}>
          <Image source={{ uri: d.photo }} style={[styles.thumb, { backgroundColor: color('bg/muted') }]} contentFit="cover" />
          <View style={styles.text}>
            <Text variant="Overline" color="fg/muted" numberOfLines={1}>
              {d.mood && d.tempC != null ? t('saved.overlineWeather', { w: t(`home.titleMood.${d.mood}`), temp: displayTemp(d.tempC) }) : t('saved.overline')}
            </Text>
            <View>
              <Text variant="Title/S" numberOfLines={1}>{d.name}</Text>
              <Text variant="Caption" color="fg/muted" numberOfLines={1}>{t('saved.byWhen', { cook: d.cook, when: timeAgo(d.savedAt, t) })}</Text>
            </View>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t('saved.unsave')} onPress={() => unsave(d)} hitSlop={space[10]}>
            <Bookmark size={20} strokeWidth={1.6} absoluteStrokeWidth color={color('fg/muted')} fill={color('fg/muted')} />
          </Pressable>
        </Pressable>
      ))}
      {shown.length ? <Text variant="Caption" color="fg/muted">{t('saved.holdHint')}</Text> : null}
      {/* New collection — centred dialog (same card as 8.2b Add your mood): title · name field · Cancel / Save. */}
      <Modal visible={naming} transparent animationType="fade" onRequestClose={() => setNaming(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.dialogWrap}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} style={[StyleSheet.absoluteFill, { backgroundColor: color('overlay/scrim') }]} onPress={() => setNaming(false)} />
          <View style={[styles.dialog, elevation['Elevation/3 Float'], { backgroundColor: color('bg/subtle') }]}>
            <Text variant="Title/M">{t('saved.newTitle')}</Text>
            <View style={[styles.nameField, { backgroundColor: color('bg/default'), borderColor: color('border/default') }]}>
              <TextInput maxFontSizeMultiplier={FONT_SCALE_MAX} value={newName} onChangeText={(v) => setNewName(v.slice(0, 30))} autoFocus placeholder={t('saved.namePlaceholder')} placeholderTextColor={color('fg/muted')} returnKeyType="done" onSubmitEditing={createNamed} style={[nameText, { color: color('fg/default') }]} />
            </View>
            <View style={styles.dialogActions}>
              <Button label={t('common.cancel')} variant="Outline" size="M" onPress={() => setNaming(false)} style={styles.flex} />
              <Button label={t('common.save')} size="M" disabled={!newName.trim()} onPress={createNamed} style={styles.flex} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  dialogWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: space[20] },
  dialog: { borderRadius: radius.xl, paddingTop: space[24], paddingBottom: space[20], paddingHorizontal: space[20], gap: space[16] },
  dialogActions: { flexDirection: 'row', gap: space[12] },
  nameField: { height: 48, borderRadius: radius.full, borderWidth: 1, paddingHorizontal: space[16], justifyContent: 'center' },
  // 6.2: Collections (Title/L · + New) → 24 → filter chips → 16 → saved rows (Food Card · Row, gap 12).
  root: { paddingHorizontal: space[20], paddingTop: space[16], gap: space[12] },
  chipScroll: { marginHorizontal: -space[20], marginTop: space[12], marginBottom: space[4] },
  loading: { marginTop: space[40] },
  head: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  chips: { gap: space[8], paddingHorizontal: space[20] },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[14] },
  thumb: { width: 80, height: 80, borderRadius: radius.lg },
  text: { flex: 1, gap: 3 },
  empty: { textAlign: 'center', paddingTop: space[24] },
});
