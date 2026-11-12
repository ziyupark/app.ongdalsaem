import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FestiveCard } from '../src/components/community/FestiveCard';
import { TopBar } from '../src/components/TopBar';
import { upcomingFestive } from '../src/lib/holidays';
import { space, useTheme } from '../src/theme';

const GAP = space[12];

/**
 * All holidays — opened from the 4.1 "Holidays around the world" more button. Every holiday by its next date, soonest
 * first, as a 2-column grid of the same Festive Cards (keeping their 168:196 shape). Each card opens its tag.
 */
export default function Holidays() {
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const festive = useMemo(() => upcomingFestive(), []);
  const cardW = (width - space[20] * 2 - GAP) / 2;

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: color('bg/default') }]}>
      <TopBar title={t('community.festiveTitle')} onBack={() => router.back()} backLabel={t('common.back')} />
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + space[24] }]}>
        <View style={styles.grid}>
          {festive.map((h) => <FestiveCard key={h.key} h={h} width={cardW} height={Math.round((cardW * 196) / 168)} />)}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { paddingHorizontal: space[20], paddingTop: space[12], gap: space[12] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
});
