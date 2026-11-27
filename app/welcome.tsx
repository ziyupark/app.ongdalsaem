import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../src/components/Icon';
import { ArrowRight } from '../src/components/icons/ongdal';
import { MoodGradient } from '../src/components/MoodGradient';
import { Text } from '../src/components/Text';
import { markWelcomeLetterSeen } from '../src/lib/flags';
import { radius, space, useTheme } from '../src/theme';

/** Brand 3D / squirrel-acorn (1033:22732) — 120 × 131 frame, the image cropped as in Figma (133.1 % × 122.73 % at −12.78 %, −9.74 %). */
const SQUIRREL = require('../assets/brand/squirrel-acorn-3d.png');

/**
 * 1.1b Welcome letter — 197:6526. Sunset band (Mood/clear, 160 high) behind the status bar → Letter sheet
 * (bg/subtle, top radius 32, pt 10 · px 32 · pb 40, gap 15): grabber row 36 → 16 → squirrel 120×131 → title (Display/L)
 * → letter (3 paragraphs, gap 13) + signature → 40 → Continue (bg/inverse pill 56) → note (Caption).
 * Shown once before sign-in (local flag); `replay` reopens it from 9.8 "A letter from us".
 */
export default function Welcome() {
  const insets = useSafeAreaInsets();
  const { color, scheme } = useTheme();
  const { t } = useTranslation();

  useEffect(() => { markWelcomeLetterSeen(); }, []);

  const { replay } = useLocalSearchParams<{ replay?: string }>();
  const next = () => (replay ? router.back() : router.replace('/sign-in'));
  const paragraphs = t('welcome.letter').split(/\n\s*\n/);

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
      <StatusBar style="light" />
      <View style={styles.band} pointerEvents="none">
        <MoodGradient mood="clear" base={color('bg/default')} />
      </View>
      {/* Block · StatusBar 197:6528 — status bar + 10. */}
      <View style={{ height: insets.top + space[10] }} />
      <View style={[styles.sheet, { backgroundColor: color('bg/subtle') }]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.top}>
            <View style={[styles.grabber, { backgroundColor: color('border/strong') }]} />
          </View>
          <View style={styles.gap16} />
          <View style={styles.squirrel} accessible={false}>
            <Image source={SQUIRREL} style={styles.squirrelImage} contentFit="cover" accessibilityIgnoresInvertColors />
          </View>
          <Text variant="Display/L" accessibilityRole="header" style={styles.center}>{t('welcome.title')}</Text>
          {/* 540:13236 — 364 wide (19 past the sheet's 32 padding on each side), gap 13. */}
          <View style={styles.letter}>
            {paragraphs.map((p, i) => (
              <Text key={i} variant="Body/Letter" color="fg/secondary" style={styles.center}>{p}</Text>
            ))}
            <Text variant="Handwriting" color="fg/accent" style={styles.center}>{t('welcome.signature')}</Text>
          </View>
          <View style={styles.gap40} />
          {/* CTA card 436:10495 — bg/inverse pill 56, px 20, "Continue" Title/M + arrow-right 22, gap 12. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('welcome.cta')}
            onPress={next}
            style={({ pressed }) => [styles.cta, { backgroundColor: color('bg/inverse') }, pressed && styles.pressed]}
          >
            <Text variant="Title/M" color="fg/inverse">{t('welcome.cta')}</Text>
            <Icon icon={ArrowRight} size={22} color="fg/inverse" />
          </Pressable>
          <Text variant="Caption" color="fg/muted" style={styles.center}>{t('welcome.note')}</Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  band: { position: 'absolute', left: 0, right: 0, top: 0, height: 160 },
  sheet: { flex: 1, borderTopLeftRadius: radius['2xl'], borderTopRightRadius: radius['2xl'], overflow: 'hidden' },
  content: { flexGrow: 1, alignItems: 'center', gap: 15, paddingTop: space[10], paddingHorizontal: space[32], paddingBottom: space[40] },
  top: { alignSelf: 'stretch', height: 36 },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: radius.full },
  gap16: { height: space[16] },
  gap40: { height: space[40] },
  squirrel: { width: 120, height: 131, overflow: 'hidden' },
  squirrelImage: { position: 'absolute', width: '133.1%', height: '122.73%', left: '-12.78%', top: '-9.74%' },
  letter: { alignSelf: 'stretch', marginHorizontal: -19, alignItems: 'center', gap: 13 },
  center: { textAlign: 'center' },
  cta: { alignSelf: 'stretch', height: 56, borderRadius: radius.full, paddingHorizontal: space[20], flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[12] },
  pressed: { opacity: 0.85 },
});
