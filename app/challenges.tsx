import { router, useFocusEffect } from 'expo-router';
import { Trophy } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, FlagTag, ListCard, ListRow } from '../src/components/community/Parts';
import { Image } from 'expo-image';
import { MoodGradient } from '../src/components/MoodGradient';
import { themeImage } from '../src/lib/holidays';
import { Text } from '../src/components/Text';
import { TopBar } from '../src/components/TopBar';
import { fetchChallenges, timeLeft, type Challenge } from '../src/services/community';
import { radius, space, useTheme, type WeatherMood } from '../src/theme';

const THUMB_MOOD: Record<Challenge['phase'], WeatherMood> = { running: 'rain', soon: 'clear', ended: 'rain' };

/** 4.9 Food challenges · All (484:10315) — You're in · Running · Starting soon · Ended. */
export default function Challenges() {
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const [list, setList] = useState<Challenge[] | null>(null);
  useFocusEffect(useCallback(() => { fetchChallenges().then(setList).catch(() => setList([])); }, []));

  const groups: { key: string; items: Challenge[] }[] = list
    ? [
        { key: 'youreIn', items: list.filter((c) => c.joined && c.phase !== 'ended') },
        { key: 'running', items: list.filter((c) => !c.joined && c.phase === 'running') },
        { key: 'soon', items: list.filter((c) => !c.joined && c.phase === 'soon') },
        { key: 'ended', items: list.filter((c) => c.phase === 'ended').reverse() },
      ].filter((g) => g.items.length)
    : [];

  const sub = (c: Challenge) => {
    if (c.phase === 'ended') return t('challenge.endedSub', { date: c.endsAt.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' }), n: c.entries.toLocaleString() });
    if (c.phase === 'soon') return t('challenge.soonSub', { day: c.startsAt.toLocaleDateString(i18n.language, { weekday: 'short' }) });
    return t('challenge.runningSub', { time: timeLeft(c.endsAt), n: c.participants.toLocaleString() });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: color('bg/default') }]}>
      <TopBar title={t('challenge.listTitle')} onBack={() => router.back()} backLabel={t('common.back')} />
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + space[24] }]}>
        {list == null ? <ActivityIndicator color={color('fg/muted')} style={styles.loading} /> : groups.length ? groups.map((g) => (
          <View key={g.key} style={styles.group}>
            <Text variant="Overline" color="fg/muted">{t(`challenge.groups.${g.key}`)}</Text>
            <ListCard>
              {g.items.map((c, i) => (
                <ListRow
                  key={c.id}
                  last={i === g.items.length - 1}
                  muted={c.phase === 'ended'}
                  onPress={() => router.push(`/challenge/${c.slug}`)}
                  leading={
                    <View style={[styles.thumb, c.phase === 'ended' && styles.dim]}>
                      {c.theme === 'diwali' ? <MoodGradient mood={THUMB_MOOD[c.phase]} style={StyleSheet.absoluteFill} /> : <Image source={themeImage(c.theme)} style={StyleSheet.absoluteFill} contentFit="cover" />}
                      {c.country ? <FlagTag code={c.country} /> : null}
                    </View>
                  }
                  title={
                    <View style={styles.titleRow}>
                      <Text variant="Title/S" numberOfLines={1} style={styles.shrink}>{c.title}</Text>
                      {c.joined && c.phase === 'running' && c.endsAt.getTime() - Date.now() < 3 * 864e5 ? (
                        <View style={[styles.closing, { backgroundColor: color('bg/accent-subtle') }]}>
                          <Text variant="Caption Strong" color="fg/accent">{t('challenge.closing')}</Text>
                        </View>
                      ) : null}
                    </View>
                  }
                  sub={sub(c)}
                />
              ))}
            </ListCard>
          </View>
        )) : <EmptyState icon={Trophy} title={t('challenge.emptyTitle')} body={t('challenge.emptyBody')} />}
        <Text variant="Caption" color="fg/muted">{t('challenge.footnote')}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { paddingHorizontal: space[20], paddingTop: space[12], gap: space[24] },
  group: { gap: space[10] },
  thumb: { width: 56, height: 56, borderRadius: radius.lg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  dim: { opacity: 0.5 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  shrink: { flexShrink: 1 },
  closing: { paddingHorizontal: space[6], paddingVertical: space[2], borderRadius: radius.xs },
  loading: { marginTop: space[40] },
});
