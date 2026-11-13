import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, space, text, useTheme } from '../../theme';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { Icon } from '../Icon';
import { Text } from '../Text';

export type Difficulty = 'easy' | 'medium' | 'hard';
/** Explore search filters — applied to the search results (3.1 Nearby list). */
export type SearchFilters = { maxMinutes: 15 | 30 | null; difficulty: Difficulty | null; ingredients: string[] };

export const NO_FILTERS: SearchFilters = { maxMinutes: null, difficulty: null, ingredients: [] };
const MAX_INGREDIENTS = 10;
const MAX_NAME = 40;
const TIMES: (15 | 30 | null)[] = [15, 30, null];
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: 'dish.difficultyEasy', medium: 'dish.difficultyMedium', hard: 'dish.difficultyHard' };

export const hasFilters = (f: SearchFilters) => f.maxMinutes != null || f.difficulty != null || f.ingredients.length > 0;

export function filtersFromParams(p: { time?: string; level?: string; ing?: string }): SearchFilters {
  let ingredients: string[] = [];
  try {
    const v = p.ing ? JSON.parse(p.ing) : [];
    if (Array.isArray(v)) ingredients = v.filter((x) => typeof x === 'string').slice(0, MAX_INGREDIENTS);
  } catch {
    // ignore a broken param
  }
  return {
    maxMinutes: p.time === '15' ? 15 : p.time === '30' ? 30 : null,
    difficulty: DIFFICULTIES.includes(p.level as Difficulty) ? (p.level as Difficulty) : null,
    ingredients,
  };
}

/** Small removable pill — selected filters under the search field, ingredients in the popup. */
function Pill({ label, onRemove }: { label: string; onRemove: () => void }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={t('community.removeFilter', { name: label })} onPress={onRemove} style={[styles.pill, { backgroundColor: color('bg/accent-subtle') }]}>
      <Text variant="Caption Strong" color="fg/accent">{label}</Text>
      <Icon icon={X} size={14} color="fg/accent" />
    </Pressable>
  );
}

/** The selected filters as small chips under the search field — tap one to clear it. */
export function FilterChips({ filters, onChange }: { filters: SearchFilters; onChange: (f: SearchFilters) => void }) {
  const { t } = useTranslation();
  if (!hasFilters(filters)) return null;
  return (
    <View style={styles.wrap}>
      {filters.maxMinutes ? <Pill label={t('community.withinMinutes', { n: filters.maxMinutes })} onRemove={() => onChange({ ...filters, maxMinutes: null })} /> : null}
      {filters.difficulty ? <Pill label={t(DIFFICULTY_LABEL[filters.difficulty])} onRemove={() => onChange({ ...filters, difficulty: null })} /> : null}
      {filters.ingredients.map((name) => (
        <Pill key={name} label={name} onRemove={() => onChange({ ...filters, ingredients: filters.ingredients.filter((x) => x !== name) })} />
      ))}
    </View>
  );
}

/** Card entrance: fade in while growing slightly (0.94 → 1) — same as the timer dialog (8.2c). */
const popIn = () => {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ scale: 0.94 }] },
    animations: { opacity: withTiming(1, { duration: 200 }), transform: [{ scale: withTiming(1, { duration: 200 }) }] },
  };
};

/** Filter popup — centred dialog card like the timer dialog: cook time · difficulty · with ingredients, Reset / Apply. */
export function FilterSheet({ visible, initial, onClose, onApply }: { visible: boolean; initial: SearchFilters; onClose: () => void; onApply: (f: SearchFilters) => void }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [f, setF] = useState<SearchFilters>(initial);
  const [typed, setTyped] = useState('');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setF(initial);
    setTyped('');
  }, [visible, initial]);

  // The keyboard lifts the card into the space left above it (200 ms).
  const kb = useSharedValue(0);
  useEffect(() => {
    if (!visible) return;
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (e) => { kb.value = withTiming(e.endCoordinates.height, { duration: 200 }); });
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => { kb.value = withTiming(0, { duration: 200 }); });
    return () => { show.remove(); hide.remove(); kb.value = 0; };
  }, [visible, kb]);
  const bottomInset = insets.bottom;
  const lift = useAnimatedStyle(() => ({ paddingBottom: Math.max(kb.value, bottomInset) + space[20] }));

  const addIngredient = () => {
    const v = typed.trim();
    setTyped('');
    if (!v || f.ingredients.includes(v) || f.ingredients.length >= MAX_INGREDIENTS) return;
    setF({ ...f, ingredients: [...f.ingredients, v] });
  };
  const apply = () => {
    const v = typed.trim();
    const ingredients = v && !f.ingredients.includes(v) && f.ingredients.length < MAX_INGREDIENTS ? [...f.ingredients, v] : f.ingredients;
    onApply({ ...f, ingredients });
  };
  const { lineHeight: _lh, ...fieldText } = text['Body/M'];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {visible ? (
        <>
          <Animated.View entering={FadeIn.duration(200)} style={[StyleSheet.absoluteFill, { backgroundColor: color('overlay/scrim') }]}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} style={StyleSheet.absoluteFill} onPress={onClose} />
          </Animated.View>
          <Animated.View style={[styles.center, { paddingTop: insets.top + space[20] }, lift]} pointerEvents="box-none">
            <Animated.View entering={popIn} style={[styles.card, { backgroundColor: color('bg/default') }]}>
              <ScrollView bounces={false} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={styles.scroll}>
                <Pressable accessible={false} onPress={Keyboard.dismiss} style={styles.body}>
                  <Text variant="Title/M">{t('community.filterTitle')}</Text>

                  <View style={styles.group}>
                    <Text variant="Overline" color="fg/muted">{t('community.filterTime')}</Text>
                    <View style={styles.wrap}>
                      {TIMES.map((m) => (
                        <Chip key={String(m)} label={m ? t('community.withinMinutes', { n: m }) : t('community.anyTime')} selected={f.maxMinutes === m} onPress={() => setF({ ...f, maxMinutes: m })} />
                      ))}
                    </View>
                  </View>

                  <View style={styles.group}>
                    <Text variant="Overline" color="fg/muted">{t('community.filterDifficulty')}</Text>
                    <View style={styles.wrap}>
                      {DIFFICULTIES.map((d) => (
                        <Chip key={d} label={t(DIFFICULTY_LABEL[d])} selected={f.difficulty === d} onPress={() => setF({ ...f, difficulty: f.difficulty === d ? null : d })} />
                      ))}
                    </View>
                  </View>

                  <View style={styles.group}>
                    <Text variant="Overline" color="fg/muted">{t('community.filterIngredients')}</Text>
                    <View style={[styles.field, { backgroundColor: color('bg/subtle'), borderColor: color(focused ? 'border/focus' : 'border/default'), borderWidth: focused ? 1.5 : 1 }]}>
                      <TextInput
                        accessibilityLabel={t('community.filterIngredients')}
                        value={typed}
                        onChangeText={setTyped}
                        maxLength={MAX_NAME}
                        placeholder={t('community.ingredientPlaceholder')}
                        placeholderTextColor={color('fg/muted')}
                        selectionColor={color('border/focus')}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        onSubmitEditing={addIngredient}
                        submitBehavior="submit"
                        returnKeyType="done"
                        autoCorrect={false}
                        style={[fieldText, styles.input, { color: color('fg/default') }]}
                      />
                    </View>
                    {f.ingredients.length ? (
                      <View style={styles.wrap}>
                        {f.ingredients.map((name) => (
                          <Pill key={name} label={name} onRemove={() => setF({ ...f, ingredients: f.ingredients.filter((x) => x !== name) })} />
                        ))}
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.actions}>
                    <Button label={t('community.filterReset')} variant="Ghost" onPress={() => { setF(NO_FILTERS); setTyped(''); }} />
                    <Button label={t('community.filterApply')} onPress={apply} style={styles.flex} />
                  </View>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </Animated.View>
        </>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'center', alignItems: 'center', paddingHorizontal: space[20] },
  card: { width: '100%', maxWidth: 360, flexShrink: 1, borderRadius: radius.xl, overflow: 'hidden' },
  scroll: { flexGrow: 0 },
  body: { padding: space[20], gap: space[20] },
  group: { gap: space[10] },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8] },
  field: { height: 44, borderRadius: radius.md, paddingHorizontal: space[12], justifyContent: 'center' },
  input: { padding: 0 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: space[4], paddingLeft: space[10], paddingRight: space[8], paddingVertical: space[4], borderRadius: radius.full },
  actions: { flexDirection: 'row', gap: space[8] },
  flex: { flex: 1 },
});
