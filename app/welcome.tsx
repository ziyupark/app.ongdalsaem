import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight } from 'lucide-react-native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { Icon } from '../src/components/Icon';
import { Text } from '../src/components/Text';
import { markWelcomeLetterSeen } from '../src/lib/flags';
import { gradients, radius, space, useTheme } from '../src/theme';

const ONGI = require('../assets/ongi/ongi_clear.png');
const ACORN = require('../assets/icons/acorn.svg');

const band = gradients['Gradient/Sunset linear'];

/** 1.1b Welcome letter — 197:6526. Shown once (local flag), no scroll. */
export default function WelcomeLetter() {
  const insets = useSafeAreaInsets();
  const { color } = useTheme();
  const { t } = useTranslation();

  // Entry motion: sheet rises 24 px and fades in over 400 ms.
  const enter = useSharedValue(0);
  useEffect(() => {
    enter.value = withTiming(1, { duration: 400 });
    markWelcomeLetterSeen();
  }, [enter]);
  const sheetStyle = useAnimatedStyle(() => ({ opacity: enter.value, transform: [{ translateY: (1 - enter.value) * 24 }] }));

  const { replay } = useLocalSearchParams<{ replay?: string }>();
  const next = () => (replay ? router.back() : router.replace('/sign-in'));

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
      <StatusBar style="light" />
      <LinearGradient
        colors={band.map((s) => s.color) as unknown as readonly [string, string, ...string[]]}
        locations={band.map((s) => s.offset) as unknown as readonly [number, number, ...number[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.band}
      />
      <View style={{ height: insets.top + space[10] }} />
      <Animated.View style={[styles.sheet, { backgroundColor: color('bg/subtle'), paddingBottom: Math.max(insets.bottom, 0) + 72 - 34 }, sheetStyle]}>
        <View style={styles.top}>
          <View style={[styles.grabber, { backgroundColor: color('border/strong') }]} />
          <Button label={t('welcome.skip')} variant="Ghost" size="S" onPress={next} style={styles.skip} />
        </View>
        <View style={{ height: space[16] }} />
        <Image source={ONGI} style={styles.ongi} contentFit="cover" accessibilityIgnoresInvertColors />
        <View style={{ height: 26 }} />
        <Text variant="Display/M" style={styles.center} accessibilityRole="header">{t('welcome.title')}</Text>
        <View style={{ height: 15 }} />
        <Text variant="Body/M" color="fg/secondary" style={styles.center}>{t('welcome.letter')}</Text>
        <View style={{ height: 15 }} />
        <Text variant="Handwriting" color="fg/accent" style={styles.center}>{t('welcome.signature')}</Text>
        <View style={{ height: 15 }} />
        <View style={styles.ornament} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={[styles.line, { backgroundColor: color('border/strong') }]} />
          <Image source={ACORN} style={styles.acorn} contentFit="contain" />
          <View style={[styles.line, { backgroundColor: color('border/strong') }]} />
        </View>
        <View style={styles.spacer} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('welcome.cta')}
          onPress={next}
          style={({ pressed }) => [styles.cta, { backgroundColor: color('bg/inverse') }, pressed && styles.pressed]}
        >
          <View style={styles.ctaText}>
            <Text variant="Title/M" color="fg/inverse">{t('welcome.cta')}</Text>
          </View>
          <Icon icon={ArrowRight} size={22} color="fg/inverse" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  band: { position: 'absolute', left: 0, right: 0, top: 0, height: 160 },
  // Letter sheet: bg/subtle, top corners radius/2xl, padding 10 32 40 (+ 32 gap above the home indicator).
  sheet: { flex: 1, alignItems: 'center', paddingTop: space[10], paddingHorizontal: space[32], borderTopLeftRadius: radius['2xl'], borderTopRightRadius: radius['2xl'] },
  top: { height: 36, alignSelf: 'stretch' },
  grabber: { position: 'absolute', top: 0, alignSelf: 'center', width: 36, height: 5, borderRadius: radius.full },
  skip: { position: 'absolute', right: 0, top: 0 },
  ongi: { width: 119, height: 119 },
  center: { textAlign: 'center', alignSelf: 'stretch' },
  ornament: { flexDirection: 'row', alignItems: 'center', gap: space[10] },
  line: { width: 56, height: 1 },
  acorn: { width: 16, height: 16 },
  spacer: { flex: 1 },
  // CTA card: bg/inverse, radius/xl, padding 20, gap 12.
  cta: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: space[12], padding: space[20], borderRadius: radius.xl },
  ctaText: { flex: 1 },
  pressed: { opacity: 0.85 },
});
