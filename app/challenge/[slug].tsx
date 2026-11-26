import { router, useLocalSearchParams } from 'expo-router';
import { Bell, ChevronLeft, Trophy } from '../../src/components/icons/ongdal';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChallengeHero, EntryGrid, Stat } from '../../src/components/community/ChallengesTab';
import { EmptyState, FlagTag } from '../../src/components/community/Parts';
import { LoadError } from '../../src/components/LoadError';
import { IconButton } from '../../src/components/IconButton';
import { ScreenWash } from '../../src/components/ScreenHeader';
import { goTab, TabBar, useTabBarScroll, type TabKey } from '../../src/components/TabBar';
import { Text } from '../../src/components/Text';
import { useWashScroll } from '../../src/lib/useWashScroll';
import { fetchChallenge, fetchChallengeEntries, fetchChallenges, type Challenge } from '../../src/services/community';
import type { DishSummary } from '../../src/services/foods';
import { space, useTheme } from '../../src/theme';

/** Expanded TabBar height (12:182). */
const TAB_BAR_H = 110;
const ENTRIES = 30;
const COLS = 3;

/** Back to the Challenges tab (focus=join → scrolled to its Join button). */
const toChallenges = (focus?: 'join') =>
  router.dismissTo({ pathname: '/community', params: { tab: 'challenges', at: String(Date.now()), ...(focus ? { focus } : {}) } });

/**
 * 4.10c Challenge · Ended (826:16963) — mood wash · back · bell → flag · Display/M name · Body/M description → Entries ·
 * Cooked → this week's running challenge (pill "Ended {date}"; tap → Challenges tab at its Join button) → Latest entries
 * (3-column photos → post). No Join here. A running / upcoming challenge (old link, notification) opens the Challenges tab.
 */
export default function ChallengeScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const bar = useTabBarScroll();
  const wash = useWashScroll();
  const [c, setC] = useState<Challenge | null | undefined>(undefined);
  const [entries, setEntries] = useState<DishSummary[] | null>(null);
  const [live, setLive] = useState<Challenge | null>(null);

  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    fetchChallenge(String(slug ?? ''))
      .then((ch) => {
        if (!alive) return;
        if (ch && ch.phase !== 'ended') return router.replace({ pathname: '/community', params: { tab: 'challenges' } });
        setC(ch);
        if (!ch) return;
        fetchChallengeEntries(ch.id, ENTRIES).then((l) => alive && setEntries(l)).catch(() => alive && setEntries([]));
        // This week's challenge — the running one closing soonest.
        fetchChallenges()
          .then((l) => alive && setLive(l.filter((x) => x.phase === 'running').sort((a, b) => a.endsAt.getTime() - b.endsAt.getTime())[0] ?? null))
          .catch(() => undefined);
      })
      .catch(() => alive && setFailed(true)); // offline / server error — not "this challenge doesn't exist"
    return () => { alive = false; };
  }, [slug, attempt]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    bar.onY(e.nativeEvent.contentOffset.y);
    wash.onY(e.nativeEvent.contentOffset.y);
  };
  const onTab = (k: TabKey) => goTab(k);
  const tile = (width - space[20] * 2 - space[8] * (COLS - 1)) / COLS;
  const n = (v: number) => v.toLocaleString(i18n.language);
  const endedOn = useMemo(() => (c ? t('challenge.endedOn', { date: c.endsAt.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' }) }) : ''), [c, t, i18n.language]);

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
      <ScreenWash wash={wash} local />
      <ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: TAB_BAR_H + space[24] }}>
        {/* Header · Row — back · bell (Soft 40), px 20. */}
        <View style={styles.bar}>
          <IconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => toChallenges()} />
          <IconButton icon={Bell} accessibilityLabel={t('home.notifications')} onPress={() => router.push('/notifications')} />
        </View>

        {c === undefined && failed ? (
          <LoadError onRetry={() => { setFailed(false); setAttempt((n) => n + 1); }} />
        ) : c === undefined ? (
          <ActivityIndicator color={color('fg/muted')} style={styles.loading} />
        ) : c === null ? (
          <EmptyState icon={Trophy} title={t('challenge.missing')} />
        ) : (
          <>
            {/* Hero — p24 20 · gap 12: flag → Display/M → Body/M. */}
            <View style={styles.hero}>
              {c.country ? <View style={styles.badges}><FlagTag code={c.country} /></View> : null}
              <Text variant="Display/M" accessibilityRole="header">{c.title}</Text>
              {c.description ? <Text variant="Body/M">{c.description}</Text> : null}
            </View>

            {/* Stats — p4 20 0 · gap 8: Entries · Cooked. */}
            <View style={styles.stats}>
              <Stat value={n(c.entries)} label={t('challenge.entriesLabel')} />
              <Stat value={n(c.participants)} label={t('challenge.cookedLabel')} />
            </View>

            {/* This week's challenge — p20 20 0; tap → the Challenges tab, at its Join button. */}
            {live ? (
              <View style={styles.live}>
                <ChallengeHero
                  c={live}
                  faces={[]}
                  pill={{ dot: 'fg/destructive', text: endedOn, color: 'fg/secondary' }}
                  onPress={() => toChallenges('join')}
                />
              </View>
            ) : null}

            {/* Latest entries — p24 20 · gap 10: Title/M · count → 3-column photos. */}
            <View style={styles.entries}>
              <View style={styles.entriesHead}>
                <Text variant="Title/M" style={styles.flex}>{t('challenge.latestEntries')}</Text>
                <Text variant="Body/S" color="fg/muted">{n(c.entries)}</Text>
              </View>
              {entries == null ? (
                <ActivityIndicator color={color('fg/muted')} />
              ) : entries.length ? (
                <EntryGrid entries={entries} size={tile} />
              ) : <Text variant="Body/S" color="fg/muted">{t('challenge.noEntries')}</Text>}
            </View>
          </>
        )}
      </ScrollView>
      <TabBar active="community" progress={bar.progress} onTab={onTab} onCreate={() => router.push('/share/pick')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  loading: { marginTop: space[40] },
  bar: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space[20] },
  hero: { paddingTop: space[24], paddingHorizontal: space[20], paddingBottom: space[24], gap: space[12] },
  badges: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  stats: { flexDirection: 'row', gap: space[8], paddingTop: space[4], paddingHorizontal: space[20] },
  live: { paddingTop: space[20], paddingHorizontal: space[20] },
  entries: { paddingTop: space[24], paddingHorizontal: space[20], gap: space[10] },
  entriesHead: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
});
