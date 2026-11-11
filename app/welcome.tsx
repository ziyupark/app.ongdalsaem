import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { Text } from '../src/components/Text';
import { markWelcomeLetterSeen } from '../src/lib/flags';
import { radius, space, useTheme } from '../src/theme';

/** What the app does, one card each (2×2). Images reuse the weather / holiday assets. */
const FEATURES = [
  { key: 'weather', image: require('../assets/weather3d/weather3d_clear.png'), fit: 'contain' },
  { key: 'nearby', image: require('../assets/holidays/food/samgyeopsal.jpg'), fit: 'cover' },
  { key: 'timer', image: require('../assets/holidays/food/pasta_day.jpg'), fit: 'cover' },
  { key: 'holidays', image: require('../assets/holidays/chuseok.jpg'), fit: 'cover' },
] as const;

/** Onboarding 0 — value intro before sign-in. Shown once (local flag); `replay` reopens it from Settings. */
export default function Welcome() {
  const insets = useSafeAreaInsets();
  const { color, scheme } = useTheme();
  const { t } = useTranslation();

  useEffect(() => { markWelcomeLetterSeen(); }, []);

  const { replay } = useLocalSearchParams<{ replay?: string }>();
  const next = () => (replay ? router.back() : router.replace('/sign-in'));

  const bottom = Math.max(insets.bottom, space[24]) + space[10];

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default'), paddingTop: insets.top }]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={{ paddingBottom: 56 + space[24] + bottom }}>
        <View style={styles.heading}>
          <Text variant="Display/L" accessibilityRole="header">{t('welcome.introTitle')}</Text>
          <Text variant="Body/M" color="fg/secondary">{t('welcome.introBody')}</Text>
        </View>
        <View style={styles.grid}>
          {FEATURES.map((f) => (
            <View
              key={f.key}
              accessible
              accessibilityLabel={`${t(`welcome.features.${f.key}`)}. ${t(`welcome.features.${f.key}Body`)}`}
              style={[styles.card, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}
            >
              <View style={[styles.media, { backgroundColor: color('bg/muted') }]}>
                <Image source={f.image} style={StyleSheet.absoluteFill} contentFit={f.fit} accessibilityIgnoresInvertColors />
              </View>
              <View style={styles.cardText}>
                <Text variant="Body/M Strong" numberOfLines={2}>{t(`welcome.features.${f.key}`)}</Text>
                <Text variant="Body/S" color="fg/muted" numberOfLines={3}>{t(`welcome.features.${f.key}Body`)}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.fixed, { bottom }]}>
        <Button label={t('welcome.start')} onPress={next} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  heading: { paddingTop: space[40], paddingHorizontal: space[20], gap: space[12] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[12], paddingTop: space[32], paddingHorizontal: space[20] },
  card: { width: '47%', flexGrow: 1, borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  media: { aspectRatio: 4 / 3 },
  cardText: { padding: space[12], gap: space[4] },
  fixed: { position: 'absolute', left: space[20], right: space[20] },
});
