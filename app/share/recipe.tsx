import { router } from 'expo-router';
import { Check, Flame, GripVertical, Minus, Plus, Timer, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Chip } from '../../src/components/Chip';
import { Icon } from '../../src/components/Icon';
import { SortableList } from '../../src/components/share/SortableList';
import { formatTimer, TimerSheet } from '../../src/components/share/TimerSheet';
import { Text } from '../../src/components/Text';
import { TopBar } from '../../src/components/TopBar';
import { updateShareDraft, useShareDraft, type Difficulty, type DraftIngredient, type DraftStep } from '../../src/lib/shareDraft';
import { radius, space, text, useTheme } from '../../src/theme';

const MAX_INGREDIENTS = 30;
const MAX_STEPS = 20;
const MAX_NAME = 40;
const MAX_AMOUNT = 20;
const MAX_STEP = 300;
const MAX_KCAL = 5;
const SERVINGS_MIN = 1;
const SERVINGS_MAX = 10;
/** Cook time chips in minutes — 60 reads "60+ min". */
const COOK_MINUTES = [10, 20, 30, 60] as const;
const DIFFICULTIES: { key: Difficulty; label: string }[] = [
  { key: 'easy', label: 'dish.difficultyEasy' },
  { key: 'medium', label: 'dish.difficultyMedium' },
  { key: 'hard', label: 'dish.difficultyHard' },
];

// iOS TextInput mis-centres text when lineHeight is set — keep font, size and tracking only.
const { lineHeight: _lh, ...fieldText } = text['Body/M'];

/** Timer sheet target: an existing step (index) or the step being written in the add row ('new'). */
type TimerTarget = number | 'new' | null;

/** 8.2a Recipe (Figma 204:6723) — Ingredients table, Steps table (+ 8.2c timer), Calories. Saved into the share draft as you type. */
export default function RecipeEditor() {
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const d = useShareDraft();

  // Ingredient add row / inline edit (index = editing that row).
  const [ingEdit, setIngEdit] = useState<number | null>(null);
  const [ingName, setIngName] = useState('');
  const [ingAmount, setIngAmount] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);

  // Step add row / inline edit.
  const [stepEdit, setStepEdit] = useState<number | null>(null);
  const [stepText, setStepText] = useState('');
  const [stepTimer, setStepTimer] = useState<number | undefined>(undefined);
  const [stepFocused, setStepFocused] = useState(false);
  const [timerFor, setTimerFor] = useState<TimerTarget>(null);

  const ings = d.ingredients;
  // 8.2a drag-to-reorder: hold ⋮⋮ and drag. Taps that end a drag must not open the editor.
  const [dragging, setDragging] = useState(false);
  const dragEnded = useRef(0);
  const onDragChange = (v: boolean) => { setDragging(v); if (!v) dragEnded.current = Date.now(); };
  const tapOk = () => !dragging && Date.now() - dragEnded.current > 300;
  const move = <T,>(list: T[], from: number, to: number, key: 'ingredients' | 'steps') => {
    const n = [...list];
    const [x] = n.splice(from, 1);
    n.splice(to, 0, x);
    updateShareDraft({ [key]: n } as never);
  };
  const steps = d.steps;

  // ---- ingredients
  const commitIngredient = () => {
    const name = ingName.trim();
    if (!name) return;
    const item: DraftIngredient = { name, amount: ingAmount.trim() };
    if (ingEdit != null) updateShareDraft({ ingredients: ings.map((x, i) => (i === ingEdit ? item : x)) });
    else if (ings.length < MAX_INGREDIENTS) updateShareDraft({ ingredients: [...ings, item] });
    setIngEdit(null);
    setIngName('');
    setIngAmount('');
  };
  const editIngredient = (i: number) => {
    setIngEdit(i);
    setIngName(ings[i].name);
    setIngAmount(ings[i].amount);
  };
  const removeIngredient = (i: number) => {
    updateShareDraft({ ingredients: ings.filter((_, k) => k !== i) });
    if (ingEdit === i) { setIngEdit(null); setIngName(''); setIngAmount(''); }
  };

  // ---- steps
  const commitStep = () => {
    const body = stepText.trim();
    if (!body) return;
    const item: DraftStep = stepTimer ? { text: body, timerSec: stepTimer } : { text: body };
    if (stepEdit != null) updateShareDraft({ steps: steps.map((x, i) => (i === stepEdit ? item : x)) });
    else if (steps.length < MAX_STEPS) updateShareDraft({ steps: [...steps, item] });
    setStepEdit(null);
    setStepText('');
    setStepTimer(undefined);
  };
  const editStep = (i: number) => {
    setStepEdit(i);
    setStepText(steps[i].text);
    setStepTimer(steps[i].timerSec);
  };
  const removeStep = (i: number) => {
    updateShareDraft({ steps: steps.filter((_, k) => k !== i) });
    if (stepEdit === i) { setStepEdit(null); setStepText(''); setStepTimer(undefined); }
  };
  const applyTimer = (sec: number | undefined) => {
    if (typeof timerFor === 'number') updateShareDraft({ steps: steps.map((x, i) => (i === timerFor ? { text: x.text, ...(sec ? { timerSec: sec } : {}) } : x)) });
    else setStepTimer(sec);
    setTimerFor(null);
  };

  const timerStepNo = typeof timerFor === 'number' ? timerFor + 1 : stepEdit != null ? stepEdit + 1 : steps.length + 1;
  const timerStepText = typeof timerFor === 'number' ? steps[timerFor]?.text ?? '' : stepText;
  const timerInitial = typeof timerFor === 'number' ? steps[timerFor]?.timerSec : stepTimer;

  const done = () => {
    // Keep what's still typed in the add rows instead of dropping it.
    commitIngredient();
    commitStep();
    router.back();
  };

  const field = (focused: boolean) => ({ backgroundColor: color('bg/subtle'), borderColor: color(focused ? 'border/focus' : 'border/default'), borderWidth: focused ? 1.5 : 1 });

  const ingredientInputs = (
    <>
      <View style={[styles.nameField, field(nameFocused)]}>
        <TextInput
          accessibilityLabel={t('share.ingredientName')}
          value={ingName}
          onChangeText={setIngName}
          maxLength={MAX_NAME}
          placeholder={t('share.ingredientPlaceholder')}
          placeholderTextColor={color('fg/muted')}
          selectionColor={color('border/focus')}
          onFocus={() => setNameFocused(true)}
          onBlur={() => setNameFocused(false)}
          returnKeyType="next"
          style={[fieldText, styles.input, { color: color('fg/default') }]}
        />
      </View>
      <View style={[styles.amountField, field(amountFocused)]}>
        <TextInput
          accessibilityLabel={t('share.ingredientAmount')}
          value={ingAmount}
          onChangeText={setIngAmount}
          maxLength={MAX_AMOUNT}
          placeholder={t('share.amountPlaceholder')}
          placeholderTextColor={color('fg/muted')}
          selectionColor={color('border/focus')}
          onFocus={() => setAmountFocused(true)}
          onBlur={() => setAmountFocused(false)}
          returnKeyType="done"
          onSubmitEditing={commitIngredient}
          style={[fieldText, styles.input, { color: color('fg/default') }]}
        />
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={t('share.addIngredient')} disabled={!ingName.trim()} onPress={commitIngredient} hitSlop={space[10]} style={styles.icon18}>
        <Icon icon={Check} size={18} color={ingName.trim() ? 'fg/accent' : 'fg/disabled'} />
      </Pressable>
    </>
  );

  const stepInputs = (no: number) => (
    <>
      <View style={styles.wrap40}>
        <Icon icon={Plus} size={16} color="fg/accent" />
      </View>
      <View style={styles.wrap40}>
        <View style={[styles.number, { backgroundColor: color('bg/muted') }]}>
          <Text variant="Caption Strong">{String(no)}</Text>
        </View>
      </View>
      <View style={styles.inputCell}>
        <View style={[styles.stepField, field(stepFocused)]}>
          <TextInput
            accessibilityLabel={t('share.stepLabel', { n: no })}
            value={stepText}
            onChangeText={setStepText}
            maxLength={MAX_STEP}
            multiline
            placeholder={t('share.stepPlaceholder')}
            placeholderTextColor={color('fg/muted')}
            selectionColor={color('border/focus')}
            onFocus={() => setStepFocused(true)}
            onBlur={() => setStepFocused(false)}
            style={[fieldText, styles.input, { color: color('fg/default') }]}
          />
        </View>
        {stepTimer ? (
          <TimerPill sec={stepTimer} onPress={() => setTimerFor('new')} />
        ) : (
          <Pressable accessibilityRole="button" onPress={() => setTimerFor('new')} style={styles.addTimer}>
            <Icon icon={Timer} size={14} color="fg/accent" />
            <Text variant="Caption Strong" color="fg/accent">{t('share.addTimer')}</Text>
          </Pressable>
        )}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={t('share.addStep')} disabled={!stepText.trim()} onPress={commitStep} hitSlop={space[10]} style={[styles.wrap40, styles.w18]}>
        <Icon icon={Check} size={18} color={stepText.trim() ? 'fg/accent' : 'fg/disabled'} />
      </Pressable>
    </>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: color('bg/subtle') }]}>
      <TopBar title={t('share.recipe')} onBack={done} backLabel={t('common.back')} />
      <ScrollView scrollEnabled={!dragging} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}>
        <View style={styles.intro}>
          <Text variant="Body/S" color="fg/secondary">{t('share.recipeIntro')}</Text>
          <Text variant="Body/S" color="fg/secondary">{t('share.recipeHow')}</Text>
        </View>

        <View style={styles.section}>
          <Text variant="Overline" color="fg/muted">{t('share.ingredientsCount', { count: ings.length })}</Text>
          <View style={[styles.table, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
            <View style={[styles.header, { backgroundColor: color('bg/muted'), borderBottomColor: color('border/default') }]}>
              <View style={styles.w16} />
              <Text variant="Overline" color="fg/muted" style={styles.flex}>{t('share.colIngredient')}</Text>
              <Text variant="Overline" color="fg/muted" style={styles.w104}>{t('share.colAmount')}</Text>
              <View style={styles.w18} />
            </View>
            <SortableList
              data={ings}
              keyOf={(_, i) => `ing-${i}`}
              onReorder={(from, to) => move(ings, from, to, 'ingredients')}
              onDragChange={onDragChange}
              activeBackground={color('bg/default')}
              renderItem={(ing, i, handle) =>
                ingEdit === i ? (
                  <View style={[styles.addRow, { backgroundColor: color('bg/default'), borderBottomWidth: 1, borderBottomColor: color('border/default') }]}>
                    <Icon icon={GripVertical} size={16} color="fg/muted" />
                    {ingredientInputs}
                  </View>
                ) : (
                  handle(<Pressable accessibilityRole="button" accessibilityHint={t('share.tapToEdit')} onPress={() => tapOk() && editIngredient(i)} style={[styles.ingRow, { borderBottomColor: color('border/default') }]}>
                    <Icon icon={GripVertical} size={16} color="fg/muted" />
                    <Text variant="Body/M" numberOfLines={1} style={styles.flex}>{ing.name}</Text>
                    <Text variant="Body/M Strong" numberOfLines={1} style={styles.w104}>{ing.amount}</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel={t('share.remove', { name: ing.name })} onPress={() => removeIngredient(i)} hitSlop={space[10]} style={styles.icon18}>
                      <Icon icon={X} size={18} color="fg/secondary" />
                    </Pressable>
                  </Pressable>)
                )
              }
            />
            {ingEdit == null && ings.length < MAX_INGREDIENTS ? (
              <View style={[styles.addRow, { backgroundColor: color('bg/default') }]}>
                <Icon icon={Plus} size={16} color="fg/accent" />
                {ingredientInputs}
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="Overline" color="fg/muted">{t('share.stepsCount', { count: steps.length })}</Text>
          <View style={[styles.table, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
            <View style={[styles.header, { backgroundColor: color('bg/muted'), borderBottomColor: color('border/default') }]}>
              <View style={styles.w16} />
              <View style={styles.w24}><Text variant="Overline" color="fg/muted">#</Text></View>
              <Text variant="Overline" color="fg/muted" style={styles.flex}>{t('share.colStep')}</Text>
              <View style={styles.w18} />
            </View>
            <SortableList
              data={steps}
              keyOf={(_, i) => `step-${i}`}
              onReorder={(from, to) => move(steps, from, to, 'steps')}
              onDragChange={onDragChange}
              activeBackground={color('bg/default')}
              renderItem={(st, i, handle) =>
                stepEdit === i ? (
                  <View style={[styles.stepAdd, { backgroundColor: color('bg/default'), borderBottomWidth: 1, borderBottomColor: color('border/default') }]}>
                    {stepInputs(i + 1)}
                  </View>
                ) : (
                  handle(<Pressable accessibilityRole="button" accessibilityHint={t('share.tapToEdit')} onPress={() => tapOk() && editStep(i)} style={[styles.stepRow, { borderBottomColor: color('border/default') }]}>
                    <View style={[styles.wrap24, styles.w16]}><Icon icon={GripVertical} size={16} color="fg/muted" /></View>
                    <View style={[styles.number, { backgroundColor: color('bg/inverse') }]}>
                      <Text variant="Caption Strong" color="fg/inverse">{String(i + 1)}</Text>
                    </View>
                    <View style={styles.textCell}>
                      <Text variant="Body/M">{st.text}</Text>
                      {st.timerSec ? <TimerPill sec={st.timerSec} onPress={() => setTimerFor(i)} /> : null}
                    </View>
                    <Pressable accessibilityRole="button" accessibilityLabel={t('share.removeStep', { n: i + 1 })} onPress={() => removeStep(i)} hitSlop={space[10]} style={[styles.wrap24, styles.w18]}>
                      <Icon icon={X} size={18} color="fg/secondary" />
                    </Pressable>
                  </Pressable>)
                )
              }
            />
            {stepEdit == null && steps.length < MAX_STEPS ? (
              <View style={[styles.stepAdd, { backgroundColor: color('bg/default') }]}>{stepInputs(steps.length + 1)}</View>
            ) : null}
          </View>
        </View>

        <View style={styles.calories}>
          <View style={styles.calHead}>
            <Text variant="Body/S Strong">{t('share.servingsLabel')}</Text>
            <Text variant="Caption" color="fg/muted">{t('share.optional')}</Text>
          </View>
          <View style={[styles.stepper, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('share.fewerServings')} disabled={d.servings <= SERVINGS_MIN} onPress={() => updateShareDraft({ servings: Math.max(SERVINGS_MIN, d.servings - 1) })} hitSlop={space[10]}>
              <Icon icon={Minus} size={18} color={d.servings <= SERVINGS_MIN ? 'fg/disabled' : 'fg/default'} />
            </Pressable>
            <Text variant="Body/M Strong" style={styles.stepperValue}>{t('dish.serves', { n: d.servings })}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('share.moreServings')} disabled={d.servings >= SERVINGS_MAX} onPress={() => updateShareDraft({ servings: Math.min(SERVINGS_MAX, d.servings + 1) })} hitSlop={space[10]}>
              <Icon icon={Plus} size={18} color={d.servings >= SERVINGS_MAX ? 'fg/disabled' : 'fg/default'} />
            </Pressable>
          </View>
        </View>

        <View style={styles.calories}>
          <View style={styles.calHead}>
            <Text variant="Body/S Strong">{t('share.cookTimeLabel')}</Text>
            <Text variant="Caption" color="fg/muted">{t('share.optional')}</Text>
          </View>
          <View style={styles.chips}>
            {COOK_MINUTES.map((m) => (
              <Chip key={m} label={t(m === 60 ? 'dish.minutesPlus' : 'dish.minutes', { n: m })} selected={d.cookMinutes === m} onPress={() => updateShareDraft({ cookMinutes: d.cookMinutes === m ? null : m })} />
            ))}
          </View>
        </View>

        <View style={styles.calories}>
          <View style={styles.calHead}>
            <Text variant="Body/S Strong">{t('share.difficultyLabel')}</Text>
            <Text variant="Caption" color="fg/muted">{t('share.optional')}</Text>
          </View>
          <View style={styles.chips}>
            {DIFFICULTIES.map((x) => (
              <Chip key={x.key} label={t(x.label)} selected={d.difficulty === x.key} onPress={() => updateShareDraft({ difficulty: d.difficulty === x.key ? null : x.key })} />
            ))}
          </View>
        </View>

        <View style={styles.calories}>
          <View style={styles.calHead}>
            <Text variant="Body/S Strong">{t('share.caloriesLabel')}</Text>
            <Text variant="Caption" color="fg/muted">{t('share.caloriesHint')}</Text>
          </View>
          <View style={[styles.calField, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
            <Icon icon={Flame} size={18} />
            <TextInput
              accessibilityLabel={t('share.caloriesLabel')}
              value={d.calories}
              onChangeText={(v) => updateShareDraft({ calories: v.replace(/\D/g, '').slice(0, MAX_KCAL) })}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={color('fg/muted')}
              selectionColor={color('border/focus')}
              style={[fieldText, styles.input, styles.flex, { color: color('fg/default') }]}
            />
            <Text variant="Body/M Strong" color="fg/muted">kcal</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.cta, { backgroundColor: color('bg/default'), borderTopColor: color('border/default'), paddingBottom: Math.max(insets.bottom, space[12]) }]}>
        <Button label={t('share.recipeDone', { ing: ings.length, steps: steps.length })} onPress={done} />
      </View>

      <TimerSheet
        visible={timerFor != null}
        stepNo={timerStepNo}
        stepText={timerStepText}
        initialSec={timerInitial}
        onClose={() => setTimerFor(null)}
        onSet={applyTimer}
      />
    </View>
  );
}

function TimerPill({ sec, onPress }: { sec: number; onPress: () => void }) {
  const { color } = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.pill, { backgroundColor: color('bg/accent-subtle') }]}>
      <Icon icon={Timer} size={14} color="fg/accent" />
      <Text variant="Caption Strong" color="fg/accent">{formatTimer(sec)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingTop: space[12], paddingHorizontal: space[20], gap: space[24] },
  intro: { gap: space[12] },
  section: { gap: space[8] },
  table: { borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden' },
  header: { height: 34, flexDirection: 'row', alignItems: 'center', gap: space[10], paddingLeft: space[12], paddingRight: space[14], borderBottomWidth: 1 },
  ingRow: { height: 48, flexDirection: 'row', alignItems: 'center', gap: space[10], paddingLeft: space[12], paddingRight: space[14], borderBottomWidth: 1 },
  addRow: { height: 60, flexDirection: 'row', alignItems: 'center', gap: space[10], paddingLeft: space[12], paddingRight: space[14] },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space[10], paddingLeft: space[12], paddingRight: space[14], paddingVertical: space[14], borderBottomWidth: 1 },
  stepAdd: { flexDirection: 'row', alignItems: 'flex-start', gap: space[10], paddingLeft: space[12], paddingRight: space[14], paddingVertical: space[14] },
  nameField: { flex: 1, height: 40, borderRadius: radius.md, paddingHorizontal: space[12], justifyContent: 'center' },
  amountField: { width: 104, height: 40, borderRadius: radius.md, paddingHorizontal: space[12], justifyContent: 'center' },
  stepField: { borderRadius: radius.md, paddingHorizontal: space[12], paddingVertical: space[10], minHeight: 44 },
  input: { padding: 0 },
  inputCell: { flex: 1, gap: space[8] },
  textCell: { flex: 1, gap: space[6] },
  number: { width: 24, height: 24, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  wrap24: { height: 24, alignItems: 'center', justifyContent: 'center' },
  wrap40: { height: 40, alignItems: 'center', justifyContent: 'center' },
  icon18: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  w16: { width: 16 },
  w18: { width: 18 },
  w24: { width: 24, alignItems: 'center' },
  w104: { width: 104 },
  flex: { flex: 1 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: space[4], paddingLeft: space[8], paddingRight: space[10], paddingVertical: 3, borderRadius: radius.full, alignSelf: 'flex-start' },
  addTimer: { flexDirection: 'row', alignItems: 'center', gap: space[4], alignSelf: 'flex-start' },
  calories: { gap: space[6] },
  calHead: { flexDirection: 'row', alignItems: 'center', gap: space[6] },
  calField: { height: 48, flexDirection: 'row', alignItems: 'center', gap: space[6], paddingHorizontal: space[16], borderRadius: radius.full, borderWidth: 1 },
  stepper: { height: 48, flexDirection: 'row', alignItems: 'center', gap: space[12], paddingHorizontal: space[16], borderRadius: radius.full, borderWidth: 1 },
  stepperValue: { flex: 1, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[6] },
  cta: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: space[16], paddingHorizontal: space[20], borderTopWidth: 1 },
});
