import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import { airGrade, AIR_GRADES, compareGrades, format, staleHours, type AirCopy, type AirGrade, type AirLine } from '../../lib/airQuality';
import type { AirState } from '../../lib/useAir';
import { elevation, radius, space, useTheme, type ColorToken } from '../../theme';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { Wind } from '../icons/ongdal';
import { Text } from '../Text';

type Props = {
  copy: AirCopy;
  /** Language of `copy` — its Text uses that language's font even when the app is in another one. */
  lang: string;
  air: AirState;
  /** Chosen line (null while the dish pool is still loading — at most a few seconds, then the fallback). */
  line: AirLine | null;
  onAllowLocation: () => void;
  allowing?: boolean;
  onRetry: () => void;
  onAction: (line: AirLine) => void;
};

const GRADE_COLOR: Record<AirGrade, ColorToken> = { good: 'air/good', normal: 'air/normal', bad: 'air/bad', veryBad: 'air/very-bad' };

/**
 * Home · Air quality card (docs/04-screens/02-home.md 블록 4b) — under the Weather card, the same glass surface.
 * Head (wind icon · "대기질") → grade (Title/L) + status → 4-step grade bar → PM10 · PM2.5 (µg/m³) → yesterday line →
 * divider → home-cooking line + action button → source · measured time (+ stale note). No AQI number, no fixed heights,
 * no line limits: text wraps at any size (large text · smallest iPhone). Every state shows text — never an empty card.
 */
export function AirQualityCard({ copy, lang, air, line, onAllowLocation, allowing, onRetry, onAction }: Props) {
  const { color } = useTheme();
  const reading = air.status === 'ready' ? air.reading : null;
  const grade = reading ? airGrade(reading) : null;

  const head = (
    <View style={styles.head}>
      <Icon icon={Wind} size={16} color="fg/muted" />
      <Text variant="Body/S Strong" color="fg/muted" lang={lang}>{copy.labels.title}</Text>
    </View>
  );

  const body = (() => {
    if (air.status === 'loading') {
      return (
        <View style={styles.block} accessibilityLiveRegion="polite">
          <Text variant="Body/M" color="fg/secondary" lang={lang}>{copy.labels.loading}</Text>
          <View style={[styles.skeleton, { backgroundColor: color('bg/muted') }]} />
        </View>
      );
    }
    if (air.status === 'off') {
      const s = copy.states.locationDenied;
      return (
        <View style={styles.block}>
          <Text variant="Body/M" lang={lang}>{s.text}</Text>
          {s.button ? <Button label={s.button} variant="Outline" size="S" wrap lang={lang} loading={allowing} onPress={onAllowLocation} style={styles.button} /> : null}
        </View>
      );
    }
    if (!reading || !grade) {
      const s = copy.states.noData;
      return (
        <View style={styles.block}>
          <Text variant="Body/M" lang={lang}>{s.text}</Text>
          {s.button ? <Button label={s.button} variant="Outline" size="S" wrap lang={lang} onPress={onRetry} style={styles.button} /> : null}
        </View>
      );
    }

    const g = copy.grades[grade];
    const yGrade = reading.yesterday ? airGrade(reading.yesterday) : null;
    const compare = yGrade ? copy.compare[compareGrades(grade, yGrade)] : null;
    const stale = staleHours(reading.observedAt, Date.now());
    const time = new Date(reading.observedAt).toLocaleTimeString(lang, { hour: 'numeric', minute: '2-digit' });
    const value = (v: number | null) => (v == null ? '—' : format(copy.labels.value, { value: Math.round(v) }));
    const footer = [format(copy.labels.source, { source: copy.sources[reading.source] ?? reading.source }), format(copy.labels.basedAt, { time })].join(' · ');

    return (
      <>
        <View style={styles.block}>
          <Text variant="Title/L" lang={lang}>{g.label}</Text>
          <Text variant="Body/M" color="fg/secondary" lang={lang}>{g.status}</Text>
        </View>

        <View style={styles.bar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {AIR_GRADES.map((k) => (
            <View key={k} style={[styles.segment, { backgroundColor: color(GRADE_COLOR[k]), opacity: k === grade ? 1 : 0.25 }, k === grade && styles.segmentOn]} />
          ))}
        </View>

        <View style={styles.values}>
          <View style={styles.value} accessible accessibilityLabel={`${copy.labels.pm10} ${value(reading.pm10)}`}>
            <Text variant="Caption" color="fg/muted" lang={lang}>{copy.labels.pm10}</Text>
            <Text variant="Body/M Strong" lang={lang}>{value(reading.pm10)}</Text>
          </View>
          <View style={styles.value} accessible accessibilityLabel={`${copy.labels.pm25} ${value(reading.pm25)}`}>
            <Text variant="Caption" color="fg/muted" lang={lang}>{copy.labels.pm25}</Text>
            <Text variant="Body/M Strong" lang={lang}>{value(reading.pm25)}</Text>
          </View>
        </View>

        {compare ? <Text variant="Body/S" color="fg/secondary" lang={lang}>{compare}</Text> : null}

        <View style={[styles.divider, { backgroundColor: color('border/default') }]} />

        {line ? (
          <View style={styles.block}>
            <Text variant="Body/M" lang={lang}>{line.text}</Text>
            <Button label={line.button} variant="Outline" size="S" wrap lang={lang} onPress={() => onAction(line)} style={styles.button} />
          </View>
        ) : (
          <View style={[styles.skeleton, { backgroundColor: color('bg/muted') }]} />
        )}

        <View style={styles.footer}>
          <Text variant="Caption" color="fg/muted" lang={lang}>{footer}</Text>
          {stale != null ? <Text variant="Caption" color="fg/warning" lang={lang}>{format(copy.states.stale.text, { hours: stale })}</Text> : null}
        </View>
      </>
    );
  })();

  return (
    <View style={[styles.card, elevation['Elevation/3 Float'], { borderColor: color('bg/subtle') }]}>
      <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: color('glass/surface') }]} />
      {head}
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  // Same surface as the Weather Card (glass/surface + blur, 1px bg/subtle edge, Elevation/3, radius 2xl); padding 18 20 16, gap 12.
  card: { borderRadius: radius['2xl'], borderWidth: 1, paddingHorizontal: space[20], paddingTop: 18, paddingBottom: space[16], gap: space[12], overflow: 'hidden', alignSelf: 'stretch' },
  head: { flexDirection: 'row', alignItems: 'center', gap: space[6] },
  block: { gap: space[8], alignItems: 'flex-start' },
  bar: { flexDirection: 'row', alignItems: 'center', gap: space[4] },
  segment: { flex: 1, height: 6, borderRadius: radius.full },
  segmentOn: { height: 10 },
  values: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space[24], rowGap: space[8] },
  value: { gap: space[2] },
  divider: { height: 1, alignSelf: 'stretch' },
  button: { alignSelf: 'flex-start', maxWidth: '100%' },
  footer: { gap: space[2] },
  skeleton: { height: 14, width: '60%', borderRadius: radius.sm },
});
