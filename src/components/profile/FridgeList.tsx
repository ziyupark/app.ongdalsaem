import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ComponentProps, type ComponentRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { addFridge, removeFridge, setFridgeZone, useFridge, type FridgeItem, type FridgeZone } from '../../lib/fridge';
import { addShopping, removeShopping, useShopping, type ShoppingItem } from '../../lib/shopping';
import { matchRecipes } from '../../lib/ingredientMatch';
import { fetchRecipeCandidates, type RecipeCandidate } from '../../services/foods';
import { elevation, radius, space, useTheme } from '../../theme';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { Input } from '../Input';
import { RefreshButton } from '../RefreshButton';
import { Text } from '../Text';

const DAY = 24 * 60 * 60 * 1000;
const ZONES: FridgeZone[] = ['fridge', 'freezer'];
/** Top selector: the two fridge zones + the shopping memo (goes to the shopping list, not the fridge). */
type Target = FridgeZone | 'shopping';
const TARGETS: Target[] = [...ZONES, 'shopping'];
const ROW = 48;
const CARD = 140;
/** "What you can cook now" shows this many at a time; the refresh button shows the next ones. */
const PAGE = 5;

/** Long-press this long, then drag a chip to another box. */
const HOLD_MS = 300;

type Host = ComponentRef<typeof View>;
type Rect = { x: number; y: number; w: number; h: number };
type Drag = { kind: 'fridge' | 'shopping'; id: string; name: string; label: string; from: Target; offX: number; offY: number };
type DragEvent = { x: number; y: number; absoluteX: number; absoluteY: number };

/** Chip that can be long-pressed and dragged to another box (fridge ↔ freezer ↔ shopping memo). Tap keeps its own action. */
function DragChip({ dragging, onDragStart, onDragMove, onDragEnd, ...chip }: ComponentProps<typeof Chip> & {
  dragging: boolean;
  onDragStart: (e: DragEvent) => void;
  onDragMove: (e: DragEvent) => void;
  onDragEnd: (e: DragEvent) => void;
}) {
  // The gesture may keep its first callbacks — always call the latest handlers.
  const h = useRef({ onDragStart, onDragMove, onDragEnd });
  h.current = { onDragStart, onDragMove, onDragEnd };
  const pan = usePanGesture({
    activateAfterLongPress: HOLD_MS,
    runOnJS: true,
    onActivate: (e) => h.current.onDragStart(e),
    onUpdate: (e) => h.current.onDragMove(e),
    onDeactivate: (e) => h.current.onDragEnd(e),
  });
  return (
    <GestureDetector gesture={pan}>
      <View style={dragging ? styles.lifted : null}>
        <Chip {...chip} />
      </View>
    </GestureDetector>
  );
}

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
  const ranked = useMemo(() => (recipes ? matchRecipes(items.map((i) => i.name), recipes) : []), [items, recipes]);
  // Refresh: the next PAGE of the ranked list; after the last one, reload the newest posts and start over.
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(ranked.length / PAGE));
  const at = page % pages;
  const matches = ranked.slice(at * PAGE, at * PAGE + PAGE);
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const refresh = () => {
    Haptics.selectionAsync().catch(() => undefined);
    scroller.current?.scrollTo({ x: 0, animated: false });
    if (at + 1 < pages) { setPage(at + 1); return; }
    setPage(0);
    fetchRecipeCandidates(true).then(setRecipes).catch(() => undefined);
  };
  const zoneLabel = (z: Target) => t(z === 'fridge' ? 'fridge.fridgeZone' : z === 'freezer' ? 'fridge.freezerZone' : 'fridge.shoppingZone');

  // Tap a chip → confirm once → remove.
  const ask = (it: FridgeItem) => Alert.alert(t('fridge.removeAsk', { name: it.name }), undefined, [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('fridge.remove', { name: it.name }), style: 'destructive', onPress: () => removeFridge(it.id) },
  ]);
  // Drag & drop between the three boxes: a floating copy follows the finger; the box under it on release takes the item.
  const rootRef = useRef<Host>(null);
  const boxRefs = useRef<Partial<Record<Target, Host | null>>>({});
  const root = useRef({ x: 0, y: 0 });
  const rects = useRef<Partial<Record<Target, Rect>>>({});
  const [drag, setDragState] = useState<Drag | null>(null);
  const [over, setOverState] = useState<Target | null>(null);
  // Mirrored in refs: move / end events can arrive before React re-renders.
  const dragRef = useRef<Drag | null>(null);
  const overRef = useRef<Target | null>(null);
  const setDrag = (d: Drag | null) => { dragRef.current = d; setDragState(d); };
  const setOver = (z: Target | null) => { overRef.current = z; setOverState(z); };
  const gx = useSharedValue(0);
  const gy = useSharedValue(0);
  const ghost = useAnimatedStyle(() => ({ transform: [{ translateX: gx.value }, { translateY: gy.value }] }));
  const boxAt = (x: number, y: number) =>
    TARGETS.find((z) => { const r = rects.current[z]; return !!r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }) ?? null;
  const place = (e: DragEvent, d: Pick<Drag, 'offX' | 'offY'>) => {
    gx.value = e.absoluteX - root.current.x - d.offX;
    gy.value = e.absoluteY - root.current.y - d.offY;
  };
  const dragStart = (d: Omit<Drag, 'offX' | 'offY'>) => (e: DragEvent) => {
    const next = { ...d, offX: e.x, offY: e.y };
    rootRef.current?.measureInWindow((x, y) => { root.current = { x, y }; place(e, next); });
    TARGETS.forEach((z) => boxRefs.current[z]?.measureInWindow((x, y, w, h) => { rects.current[z] = { x, y, w, h }; }));
    setDrag(next);
    setOver(d.from);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
  };
  const dragMove = (e: DragEvent) => {
    const d = dragRef.current;
    if (!d) return;
    place(e, d);
    const z = boxAt(e.absoluteX, e.absoluteY);
    if (z !== overRef.current) { setOver(z); if (z) Haptics.selectionAsync().catch(() => undefined); }
  };
  const dragEnd = (e: DragEvent) => {
    const d = dragRef.current;
    setDrag(null);
    setOver(null);
    if (!d) return;
    const to = boxAt(e.absoluteX, e.absoluteY);
    if (!to || to === d.from) return;
    if (d.kind === 'fridge') {
      if (to === 'shopping') { removeFridge(d.id); addShopping([{ name: d.name }]); }
      else setFridgeZone(d.id, to);
    } else if (to !== 'shopping') {
      removeShopping(d.id);
      addFridge(d.name, to);
    }
  };
  // The box picked in the top selector gets a border/focus ring (same as today's cell in the week strip); while dragging,
  // the box under the finger also fills with bg/accent-subtle.
  const boxStyle = (z: Target) => [styles.box, {
    backgroundColor: color(drag && over === z && z !== drag.from ? 'bg/accent-subtle' : 'bg/subtle'),
    borderColor: z === zone ? color('border/focus') : 'transparent',
  }];

  // Shopping list: same as the fridge boxes — tap → confirm once → remove.
  const askShopping = (it: ShoppingItem) => Alert.alert(t('fridge.removeAsk', { name: it.name }), undefined, [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('shopping.remove', { name: it.name }), style: 'destructive', onPress: () => removeShopping(it.id) },
  ]);

  return (
    <View ref={rootRef} style={styles.root}>
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
              {/* Zone · Shopping list 956:12335: two lines, Button/M with line height 16 (→ 32 in the 48 box), centred. */}
              <Text variant="Button/M" color={on ? 'fg/inverse' : 'fg/default'} numberOfLines={z === 'shopping' ? 2 : 1} leading={z === 'shopping' ? 16 : undefined} style={styles.zoneLabel}>
                {z === 'shopping' ? t('fridge.shoppingZoneTwoLine') : zoneLabel(z)}
              </Text>
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
          <View key={z} ref={(v) => { boxRefs.current[z] = v; }} style={boxStyle(z)}>
            <View style={styles.head}>
              <Text variant="Body/M Strong">{zoneLabel(z)}</Text>
              <Text variant="Body/M Strong" color="fg/muted">{String(list.length)}</Text>
            </View>
            {list.length === 0 ? (
              <Text variant="Body/S" color="fg/muted">{t('fridge.empty')}</Text>
            ) : (
              <View style={styles.chips}>
                {list.map((it) => (
                  <DragChip
                    key={it.id}
                    label={it.name}
                    borderColor={daysSince(it.addedAt) > 7 ? 'fg/accent' : undefined}
                    accessibilityLabel={t('fridge.remove', { name: it.name })}
                    onPress={() => ask(it)}
                    dragging={drag?.id === it.id}
                    onDragStart={dragStart({ kind: 'fridge', id: it.id, name: it.name, label: it.name, from: z })}
                    onDragMove={dragMove}
                    onDragEnd={dragEnd}
                  />
                ))}
              </View>
            )}
          </View>
        );
      })}
      <View ref={(v) => { boxRefs.current.shopping = v; }} style={boxStyle('shopping')}>
        <View style={styles.head}>
          <Text variant="Body/M Strong">{zoneLabel('shopping')}</Text>
          <Text variant="Body/M Strong" color="fg/muted">{String(shopping.length)}</Text>
        </View>
        {shopping.length === 0 ? (
          <Text variant="Body/S" color="fg/muted">{t('fridge.shoppingEmpty')}</Text>
        ) : (
          <View style={styles.chips}>
            {shopping.map((it) => (
              <DragChip
                key={it.id}
                label={it.amount ? `${it.name} ${it.amount}` : it.name}
                accessibilityLabel={t('shopping.remove', { name: it.name })}
                onPress={() => askShopping(it)}
                dragging={drag?.id === it.id}
                onDragStart={dragStart({ kind: 'shopping', id: it.id, name: it.name, label: it.amount ? `${it.name} ${it.amount}` : it.name, from: 'shopping' })}
                onDragMove={dragMove}
                onDragEnd={dragEnd}
              />
            ))}
          </View>
        )}
      </View>
      {/* What I can cook with what's in the fridge — public recipes ranked by how many of their ingredients I have. */}
      <View style={[styles.box, styles.canCookBox, { backgroundColor: color('bg/accent-subtle') }]}>
        {/* Empty (1217:15353): title → 2 → hint, then three dashed placeholder cards (140×190, the size of a real card) in a row that runs off the edge. */}
        <View style={styles.canCookHead}>
          <View style={styles.head}>
            <Text variant="Body/M Strong" style={styles.flex}>{t('fridge.canCook')}</Text>
            {matches.length ? (
              <RefreshButton label={t('fridge.refreshCook')} onPress={refresh} fill="bg/subtle" />
            ) : null}
          </View>
          {matches.length === 0 && !(items.length > 0 && recipes == null) ? <Text variant="Body/S" color="fg/muted">{t('fridge.canCookEmpty')}</Text> : null}
        </View>
        {items.length > 0 && recipes == null ? (
          <ActivityIndicator color={color('fg/muted')} />
        ) : matches.length === 0 ? (
          <View style={styles.placeholders} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.placeholder, { backgroundColor: color('bg/default'), borderColor: color('fg/muted') }]} />
            ))}
          </View>
        ) : (
          <ScrollView ref={scroller} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
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
      {drag ? (
        <Animated.View pointerEvents="none" style={[styles.ghost, elevation['Elevation/2 Raised'], ghost]}>
          <Chip label={drag.label} />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space[12], paddingTop: space[12] },
  head: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  row: { flexDirection: 'row', gap: space[8] },
  flex: { flex: 1 },
  zoneLabel: { textAlign: 'center' },
  zone: { flex: 1, height: ROW, borderRadius: radius.input, alignItems: 'center', justifyContent: 'center' },
  addBtn: { height: ROW, borderRadius: radius.input },
  // 2 ring (always there, transparent when not picked) + 14 padding = the same 16 inset as before.
  box: { borderRadius: radius.xl, borderWidth: 2, borderColor: 'transparent', padding: space[14], gap: space[12], overflow: 'hidden' },
  cards: { gap: space[8] },
  card: { width: CARD, borderRadius: radius.lg, overflow: 'hidden' },
  // Right padding 0: the cards run to the box's right edge.
  canCookBox: { paddingRight: 0 },
  // Title row keeps the old right inset (14) so the refresh button isn't on the edge.
  canCookHead: { gap: space[2], paddingRight: space[14] },
  // Clipped by the box (overflow hidden) so the third card shows only in part, as in Figma.
  placeholders: { flexDirection: 'row', gap: space[8] },
  placeholder: { width: CARD, height: 190, borderRadius: radius.lg, borderWidth: 0.66, borderStyle: 'dashed' },
  photo: { width: CARD, height: 100 },
  cardText: { padding: space[10], gap: space[2] },
  lifted: { opacity: 0.3 },
  ghost: { position: 'absolute', left: 0, top: 0, borderRadius: radius.full },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8] },
});
