import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NearbyFeed, type Area } from '../src/components/community/Nearby';
import { TopBar } from '../src/components/TopBar';
import { space, useTheme } from '../src/theme';

const AREAS: Area[] = ['all', 'near', 'area', 'weather'];

/** Explore · Our area → See all (or a search from Explore): the full Nearby list (3.1–3.6). */
export default function NearbyFeedScreen() {
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string; area?: string }>();
  const area = AREAS.includes(params.area as Area) ? (params.area as Area) : 'all';

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: color('bg/default') }]}>
      <TopBar title={t('community.ourArea')} onBack={() => router.back()} backLabel={t('common.back')} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + space[24] }}>
        <NearbyFeed initialQuery={params.q ?? ''} initialArea={area} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
