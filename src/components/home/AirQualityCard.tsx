import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { airGrade, barPosition, compareGrades, format, staleHours, type AirCopy, type AirGrade } from '../../lib/airQuality';
import { loadAirBarGlow } from '../../lib/optionalNative';
import type { AirState } from '../../lib/useAir';
import { elevation, gradients, radius, space, useTheme } from '../../theme';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { Wind } from '../icons/ongdal';
import { Text } from '../Text';
import { AIR_BAR, airColorAt, knobX } from './airBar';

type Props = {
  copy: AirCopy;
  /** Language of `copy` — its Text uses that language's font. */
  lang: string;
  air: AirState;
  onAllowLocation: () => void;
  allowing?: boolean;
  onRetry: () => void;
};

const Glow = loadAirBarGlow()?.default ?? null;
const STOPS = gradients['Gradient/Air quality'];
/** Squirrel face per grade (Figma Air Quality Card 1284:1087, exported @3x). */
const FACE: Record<AirGrade, number> = {
  good: require('../../../assets/air/good.png'),
  normal: require('../../../assets/air/normal.png'),
  bad: require('../../../assets/air/bad.png'),
  veryBad: require('../../../assets/air/very-bad.png'),
};

/**
 * Home · Air quality card (Figma Air Quality Card 1284:1087 · docs/04-screens/02-home.md 4b) — under the Weather card,
 * the same glass surface. Head ("Air quality" ··· "As of 6:00 PM") → divider → [squirrel face · grade (Title/L) ··· PM10 ·
 * PM2.5] → gradient bar with a haloed knob at the reading → one line (status + yesterday) in a bg/default box.
 * No AQI number, no fixed heights, no line limits: text wraps at any size. Every state shows text — never an empty card.
 */
export function AirQualityCard({ copy, lang, air, onAllowLocation, allowing, onRetry }: Props) {
  const { color } = useTheme();
  const [barW, setBarW] = useState(0);
  const reading = air.status === 'ready' ? air.reading : null;
  const grade = reading ? airGrade(reading) : null;
  const time = reading ? new Date(reading.observedAt).toLocaleTimeString(lang, { hour: 'numeric', minute: '2-digit' }) : null;

  const head = (
    <View style={styles.head}>
      <View style={styles.title}>
        <Icon icon={Wind} size={16} color="fg/muted" />
        <Text variant="Body/S Strong" color="fg/muted" lang={lang}>{copy.labels.title}</Text>
      </View>
      {time && grade ? <Text variant="Caption" color="fg/muted" lang={lang}>{format(copy.labels.basedAt, { time })}</Text> : null}
    </View>
  );
  const divider = <View style={[styles.divider, { backgroundColor: color('border/default') }]} />;

  const body = (() => {
    if (air.status === 'loading') {
      return (
        <View style={styles.block} accessibilityLiveRegion="polite">
          <Text variant="Body/M" color="fg/secondary" lang={lang}>{copy.labels.loading}</Text>
          <View style={[styles.skeleton, { backgroundColor: color('bg/muted') }]} />
        </View>
      );
    }
    if (air.status === 'off' || !reading || !grade) {
      const s = air.status === 'off' ? copy.states.locationDenied : copy.states.noData;
      const press = air.status === 'off' ? onAllowLocation : onRetry;
      return (
        <View style={styles.block}>
          <Text variant="Body/M" lang={lang}>{s.text}</Text>
          {s.button ? <Button label={s.button} variant="Outline" size="S" wrap lang={lang} loading={air.status === 'off' && allowing} onPress={press} style={styles.button} /> : null}
        </View>
      );
    }

    const g = copy.grades[grade];
    const yGrade = reading.yesterday ? airGrade(reading.yesterday) : null;
    const writing = [g.status, yGrade ? copy.compare[compareGrades(grade, yGrade)] : null].filter(Boolean).join(' ');
    const stale = staleHours(reading.observedAt, Date.now());
    const value = (v: number | null) => (v == null ? '—' : format(copy.labels.value, { value: Math.round(v) }));
    const p = barPosition(reading) ?? 0;

    return (
      <View style={styles.main}>
        <View style={styles.top}>
          <View style={styles.values}>
            <View style={styles.gradeRow}>
              <View style={styles.faceBox}>
                <Image source={FACE[grade]} contentFit="contain" style={styles.face} accessibilityIgnoresInvertColors />
              </View>
              <Text variant="Title/L" lang={lang} style={styles.grade}>{g.label}</Text>
            </View>
            <View style={styles.pm}>
              {([['pm10', reading.pm10], ['pm25', reading.pm25]] as const).map(([k, v]) => (
                <View key={k} style={styles.value} accessible accessibilityLabel={`${copy.labels[k]} ${value(v)}`}>
                  <Text variant="Caption" color="fg/muted" lang={lang}>{copy.labels[k]}</Text>
                  <Text variant="Body/M Strong" lang={lang}>{value(v)}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.bar} onLayout={(e) => setBarW(e.nativeEvent.layout.width)} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {barW > 0 && Glow ? <Glow width={barW} position={p} /> : null}
            {barW > 0 && !Glow ? (
              <>
                <LinearGradient colors={STOPS.map((s) => s.color) as unknown as [string, string, ...string[]]} locations={STOPS.map((s) => s.offset) as unknown as [number, number, ...number[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.line} />
                <View style={[styles.knob, { left: knobX(barW, p) - AIR_BAR.knob, backgroundColor: color('static/white'), borderColor: color('border/default'), shadowColor: airColorAt(p) }]} />
              </>
            ) : null}
          </View>
        </View>

        <View style={[styles.writing, { backgroundColor: color('bg/default') }]}>
          <Text variant="Body/S" lang={lang}>{writing}</Text>
          {stale != null ? <Text variant="Caption" color="fg/warning" lang={lang}>{format(copy.states.stale.text, { hours: stale })}</Text> : null}
        </View>
      </View>
    );
  })();

  return (
    <View style={[styles.card, elevation['Elevation/3 Float'], { borderColor: color('bg/subtle') }]}>
      <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: color('glass/surface') }]} />
      {head}
      {divider}
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  // Figma 1284:906 — glass surface, radius 2xl, padding 16 20 20, gap 10.
  card: { borderRadius: radius['2xl'], borderWidth: 1, paddingHorizontal: space[20], paddingTop: space[16], paddingBottom: space[20], gap: space[10], overflow: 'hidden', alignSelf: 'stretch' },
  // Title (wind · "Air quality", gap 3) left, "As of 6:00 PM" right — wraps under it when it doesn't fit.
  head: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: space[12], rowGap: space[2] },
  title: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  divider: { height: 1, alignSelf: 'stretch' },
  block: { gap: space[8], alignItems: 'flex-start' },
  // [values → 2 → bar] → 4 → writing box.
  main: { gap: space[4] },
  top: { gap: space[2] },
  // Face + grade left, PM10 · PM2.5 right (gap 16); the pair moves under them when both don't fit. The grade wraps
  // between words ("Very / Unhealthy"), never inside one.
  values: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: space[24], rowGap: space[8] },
  gradeRow: { flexDirection: 'row', alignItems: 'center', gap: space[6], flexShrink: 1 },
  faceBox: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center' },
  face: { width: 48, height: 48 },
  grade: { flexShrink: 1 },
  pm: { flexGrow: 1, flexDirection: 'row', justifyContent: 'flex-end', columnGap: space[16] },
  value: { gap: space[2] },
  bar: { height: AIR_BAR.height },
  line: { position: 'absolute', left: 0, right: 0, top: AIR_BAR.lineY - AIR_BAR.line / 2, height: AIR_BAR.line, borderRadius: radius.full },
  knob: { position: 'absolute', top: AIR_BAR.lineY - AIR_BAR.knob, width: AIR_BAR.knob * 2, height: AIR_BAR.knob * 2, borderRadius: radius.full, borderWidth: 1, shadowOpacity: 0.55, shadowRadius: 9, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
  // Writing box — bg/default, radius sm, padding 6 12 (Figma 6 · 11/6 → nearest tokens).
  writing: { borderRadius: radius.sm, paddingVertical: space[6], paddingHorizontal: space[12], gap: space[2] },
  button: { alignSelf: 'flex-start', maxWidth: '100%' },
  skeleton: { height: 14, width: '60%', borderRadius: radius.sm },
});
