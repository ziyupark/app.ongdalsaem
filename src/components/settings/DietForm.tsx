import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';
import { ALLERGENS, DIETS, MAX_DIET_TAGS, type DietPrefs } from '../../lib/allergens';
import { space } from '../../theme';
import { Chip } from '../Chip';
import { Plus } from '../icons/ongdal';
import { Text } from '../Text';
import { AddDietTagDialog } from './AddDietTagDialog';

/**
 * Diet (one or none) + allergies (any) chips — Settings › Diet & allergies and the onboarding step after taste.
 * Each group ends with "Add your own" (dashed Chip · Add): the typed word shows as a selected chip; tap it to remove.
 */
export function DietForm({ value, onChange }: { value: DietPrefs; onChange: (v: DietPrefs) => void }) {
  const { t } = useTranslation();
  const [adding, setAdding] = useState<'diet' | 'allergy' | null>(null);
  const toggle = (a: (typeof ALLERGENS)[number]) =>
    onChange({ ...value, allergies: value.allergies.includes(a) ? value.allergies.filter((x) => x !== a) : ALLERGENS.filter((x) => x === a || value.allergies.includes(x)) });

  const key = adding === 'allergy' ? 'customAllergies' : 'customDiet';
  const existing = adding === 'allergy'
    ? [...value.customAllergies, ...ALLERGENS.map((a) => t(`diet.allergens.${a}`))]
    : [...value.customDiet, ...DIETS.map((d) => t(`diet.diets.${d}`))];
  const add = (label: string) => {
    setAdding(null);
    onChange({ ...value, [key]: [...value[key], label] });
  };
  const remove = (k: 'customDiet' | 'customAllergies', label: string) =>
    Alert.alert(t('diet.add.removeTitle', { label }), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('diet.add.remove'), style: 'destructive', onPress: () => onChange({ ...value, [k]: value[k].filter((x) => x !== label) }) },
    ]);

  return (
    <View style={styles.root}>
      <View style={styles.group}>
        <Text variant="Overline" color="fg/muted">{t('diet.dietLabel')}</Text>
        <View style={styles.wrap}>
          <Chip label={t('diet.none')} selected={!value.diet && !value.customDiet.length} onPress={() => onChange({ ...value, diet: null, customDiet: [] })} />
          {DIETS.map((d) => <Chip key={d} label={t(`diet.diets.${d}`)} selected={value.diet === d} onPress={() => onChange({ ...value, diet: value.diet === d ? null : d })} />)}
          {value.customDiet.map((c) => <Chip key={`c-${c}`} label={c} selected onPress={() => remove('customDiet', c)} accessibilityLabel={t('diet.add.removeTitle', { label: c })} />)}
          {value.customDiet.length < MAX_DIET_TAGS ? <Chip label={t('diet.add.own')} icon={Plus} variant="add" onPress={() => setAdding('diet')} /> : null}
        </View>
      </View>
      <View style={styles.group}>
        <Text variant="Overline" color="fg/muted">{t('diet.allergiesLabel')}</Text>
        <View style={styles.wrap}>
          {ALLERGENS.map((a) => <Chip key={a} label={t(`diet.allergens.${a}`)} selected={value.allergies.includes(a)} onPress={() => toggle(a)} />)}
          {value.customAllergies.map((c) => <Chip key={`c-${c}`} label={c} selected onPress={() => remove('customAllergies', c)} accessibilityLabel={t('diet.add.removeTitle', { label: c })} />)}
          {value.customAllergies.length < MAX_DIET_TAGS ? <Chip label={t('diet.add.own')} icon={Plus} variant="add" onPress={() => setAdding('allergy')} /> : null}
        </View>
      </View>
      <Text variant="Caption" color="fg/muted">{t('diet.note')}</Text>
      <AddDietTagDialog kind={adding} existing={existing} onCancel={() => setAdding(null)} onAdd={add} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space[24] },
  group: { gap: space[10] },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8] },
});
