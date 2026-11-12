import { ArrowRight, Check, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { moveCheckedToFridge, removeShopping, toggleShopping, useShopping } from '../../lib/shopping';
import { radius, space, useTheme } from '../../theme';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { Text } from '../Text';

/** Shopping list — 6.3 Diary, under the fridge. Tap to check (struck through); "Bought → fridge" moves checked items in. */
export function ShoppingList() {
  const { t } = useTranslation();
  const { color } = useTheme();
  const items = useShopping();
  const checked = items.filter((i) => i.checked).length;

  return (
    <View style={[styles.box, { backgroundColor: color('bg/subtle') }]}>
      <View style={styles.head}>
        <Text variant="Body/M Strong">{t('shopping.title')}</Text>
        <Text variant="Body/M Strong" color="fg/muted">{String(items.length)}</Text>
      </View>
      {items.length === 0 ? (
        <Text variant="Body/S" color="fg/muted">{t('shopping.empty')}</Text>
      ) : (
        <View>
          {items.map((it, i) => (
            <View key={it.id} style={[styles.row, i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: color('border/default') }]}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: it.checked }}
                accessibilityLabel={it.name}
                onPress={() => toggleShopping(it.id)}
                style={styles.check}
              >
                <View style={[styles.box20, it.checked ? { backgroundColor: color('bg/inverse') } : { borderWidth: 1.5, borderColor: color('border/strong') }]}>
                  {it.checked ? <Icon icon={Check} size={14} color="fg/inverse" /> : null}
                </View>
                <Text variant="Body/M" color={it.checked ? 'fg/muted' : 'fg/default'} numberOfLines={1} style={[styles.flex, it.checked && styles.struck]}>{it.name}</Text>
                {it.amount ? <Text variant="Body/S Strong" color={it.checked ? 'fg/muted' : 'fg/secondary'} style={it.checked ? styles.struck : null}>{it.amount}</Text> : null}
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={t('shopping.remove', { name: it.name })} onPress={() => removeShopping(it.id)} hitSlop={space[10]}>
                <Icon icon={X} size={18} color="fg/secondary" />
              </Pressable>
            </View>
          ))}
        </View>
      )}
      {items.length ? (
        <Button label={t('shopping.toFridge', { n: checked })} icon={ArrowRight} size="M" disabled={checked === 0} onPress={moveCheckedToFridge} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.xl, padding: space[16], gap: space[12] },
  head: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[12], minHeight: 48 },
  check: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space[12], paddingVertical: space[10] },
  box20: { width: 20, height: 20, borderRadius: radius.xs, alignItems: 'center', justifyContent: 'center' },
  struck: { textDecorationLine: 'line-through' },
  flex: { flex: 1 },
});
