import { MapPin } from '../icons/ongdal';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { radius, space, useTheme } from '../../theme';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { Text } from '../Text';

/** 2.5 Location card — bg/subtle + 1px border/default, radius 2xl, padding 20, gap 12. */
export function LocationCard({ onChooseCity, onAllowLocation, busy }: { onChooseCity: () => void; onAllowLocation: () => void; busy?: boolean }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={[styles.location, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
      <View style={styles.locationRow}>
        <View style={[styles.pin, { backgroundColor: color('bg/muted') }]}>
          <Icon icon={MapPin} size={22} />
        </View>
        <View style={styles.locationText}>
          <Text variant="Overline" color="fg/muted">{t('home.locationOff.unknown')}</Text>
          <Text variant="Title/M">{t('home.locationOff.where')}</Text>
        </View>
      </View>
      <View style={styles.locationButtons}>
        <Button label={t('home.locationOff.choose')} size="M" onPress={onChooseCity} />
        <Button label={t('home.locationOff.allow')} size="M" variant="Outline" onPress={onAllowLocation} loading={busy} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  location: { borderRadius: radius['2xl'], borderWidth: 1, padding: space[20], gap: space[12], alignSelf: 'stretch' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: space[12] },
  pin: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  locationText: { gap: space[2] },
  locationButtons: { flexDirection: 'row', gap: space[8] },
});
