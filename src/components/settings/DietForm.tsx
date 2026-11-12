import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { ALLERGENS, DIETS, type DietPrefs } from '../../lib/allergens';
import { space } from '../../theme';
import { Chip } from '../Chip';
import { Text } from '../Text';

/** Diet (one or none) + allergies (any) chips — Settings › Diet & allergies and the onboarding step after taste. */
export function DietForm({ value, onChange }: { value: DietPrefs; onChange: (v: DietPrefs) => void }) {
  const { t } = useTranslation();
  const toggle = (a: (typeof ALLERGENS)[number]) =>
    onChange({ ...value, allergies: value.allergies.includes(a) ? value.allergies.filter((x) => x !== a) : ALLERGENS.filter((x) => x === a || value.allergies.includes(x)) });
  return (
    <View style={styles.root}>
      <View style={styles.group}>
        <Text variant="Overline" color="fg/muted">{t('diet.dietLabel')}</Text>
        <View style={styles.wrap}>
          <Chip label={t('diet.none')} selected={!value.diet} onPress={() => onChange({ ...value, diet: null })} />
          {DIETS.map((d) => <Chip key={d} label={t(`diet.diets.${d}`)} selected={value.diet === d} onPress={() => onChange({ ...value, diet: value.diet === d ? null : d })} />)}
        </View>
      </View>
      <View style={styles.group}>
        <Text variant="Overline" color="fg/muted">{t('diet.allergiesLabel')}</Text>
        <View style={styles.wrap}>
          {ALLERGENS.map((a) => <Chip key={a} label={t(`diet.allergens.${a}`)} selected={value.allergies.includes(a)} onPress={() => toggle(a)} />)}
        </View>
      </View>
      <Text variant="Caption" color="fg/muted">{t('diet.note')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space[24] },
  group: { gap: space[10] },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8] },
});
