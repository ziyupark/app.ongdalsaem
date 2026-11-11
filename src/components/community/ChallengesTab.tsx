import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { Check, ChevronRight, Flag, Soup, Upload } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { THEME_ICON, THEME_MOOD, themeImage, type ThemeKey } from '../../lib/holidays';
import { resetShareDraft, updateShareDraft } from '../../lib/shareDraft';
import {
  fetchChallengeEntries, fetchChallengeFaces, fetchChallenges, setChallengeJoined, timeLeft, type Challenge,
} from '../../services/community';
import type { DishSummary, Person } from '../../services/foods';
import { radius, space, useTheme } from '../../theme';
import { Button } from '../Button';
import { DishTile } from '../dish/DishTile';
import { Icon } from '../Icon';
import { MoodGradient } from '../MoodGradient';
import { Text } from '../Text';
import { Avatar, EmptyState, FlagTag, SectionHeader } from './Parts';

/**
 * 4.10 Community · Challenges (Figma 678:… "4.10 Community · Challenges").
 * This week's challenge (hero, themed illustration, one clear action) → Your challenges (progress) → Top entries
 * → Coming up (seasonal, join early) → Recently ended → How it works.
 * Each challenge carries a theme (chuseok · halloween · christmas · seollal · valentine · diwali · forest) that picks its illustration.
 */
export function ChallengesTab() {
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const [list, setList] = useState<Challenge[] | null>(null);
  const [faces, setFaces] = useState<Person[]>([]);
  const [top, setTop] = useState<DishSummary[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const featured = useMemo(() => {
    const running = (list ?? []).filter((c) => c.phase === 'running');
    // The one closing soonest — joined ones first, so "this week" is the one you're cooking for.
    return [...running].sort((a, b) => Number(b.joined) - Number(a.joined) || a.endsAt.getTime() - b.endsAt.getTime())[0] ?? null;
  }, [list]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      fetchChallenges()
        .then(async (l) => {
          if (!alive) return;
          setList(l);
          const f = l.filter((c) => c.phase === 'running').sort((a, b) => Number(b.joined) - Number(a.joined) || a.endsAt.getTime() - b.endsAt.getTime())[0];
          if (!f) return;
          const [people, entries] = await Promise.all([fetchChallengeFaces(f.id).catch(() => []), fetchChallengeEntries(f.id, 30).catch(() => [])]);
          if (!alive) return;
          setFaces(people);
          setTop([...entries].sort((a, b) => b.acorns - a.acorns).slice(0, 4));
        })
        .catch(() => alive && setList([]));
      return () => { alive = false; };
    }, []),
  );

  const patch = (id: string, p: Partial<Challenge>) => setList((l) => (l ? l.map((c) => (c.id === id ? { ...c, ...p } : c)) : l));
  const join = async (c: Challenge) => {
    if (busy) return;
    setBusy(c.id);
    patch(c.id, { joined: true, participants: c.participants + 1 });
    try { await setChallengeJoined(c.id, true); } catch { patch(c.id, { joined: false, participants: c.participants }); Alert.alert(t('settings.saveFailed')); } finally { setBusy(null); }
  };
  const postEntry = (c: Challenge) => {
    resetShareDraft();
    updateShareDraft({ challenge: { id: c.id, tag: c.tag }, description: `#${c.tag} `, isPublic: true });
    router.push('/share/pick');
  };

  if (list == null) return <ActivityIndicator color={color('fg/muted')} style={styles.loading} />;
  if (!list.length) return <EmptyState icon={Flag} title={t('challenge.emptyTitle')} body={t('challenge.emptyBody')} />;

  const mine = list.filter((c) => c.joined && c.phase !== 'ended' && c.id !== featured?.id);
  const soon = list.filter((c) => c.phase === 'soon');
  const others = list.filter((c) => c.phase === 'running' && c.id !== featured?.id && !c.joined);
  const ended = list.filter((c) => c.phase === 'ended').sort((a, b) => b.endsAt.getTime() - a.endsAt.getTime());
  const day = (d: Date) => d.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' });
  const tileW = (width - space[20] * 2 - 16) / 2;

  return (
    <View>
      {/* This week's challenge — 350×460 hero, radius 32: theme illustration + scrim, live pill · flag, overline rule, Display/M title, faces, CTA. */}
      {featured ? (
        <View style={[styles.section, styles.px]}>
          <SectionHeader eyebrow={t('challenge.seasonal')} title={t('challenge.featured')} />
          <Pressable accessibilityRole="button" accessibilityLabel={featured.title} onPress={() => router.push(`/challenge/${featured.slug}`)} style={styles.hero}>
            <Image source={themeImage(featured.theme)} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
            <LinearGradient colors={['transparent', color('overlay/scrim-strong')]} locations={[0.35, 1]} style={StyleSheet.absoluteFill} />
            <View style={styles.heroTop}>
              <View style={[styles.pill, { backgroundColor: color('glass/surface') }]}>
                <View style={[styles.dot, { backgroundColor: color('fg/accent') }]} />
                <Text variant="Caption Strong">{`${t('challenge.live')} · ${t('challenge.left', { time: timeLeft(featured.endsAt) })}`}</Text>
              </View>
              {featured.country ? <FlagTag code={featured.country} /> : null}
            </View>
            <View style={styles.flex} />
            <View style={styles.heroBody}>
              {featured.rule ? <Text variant="Overline" color="fg/on-photo-secondary" numberOfLines={1}>{featured.rule}</Text> : null}
              <Text variant="Display/M" color="fg/on-photo" numberOfLines={2}>{featured.title}</Text>
              {featured.description ? <Text variant="Body/S" color="fg/on-photo-secondary" numberOfLines={2}>{featured.description}</Text> : null}
              <View style={styles.faces}>
                <View style={styles.faceRow}>
                  {faces.slice(0, 3).map((p, i) => (
                    <View key={p.id} style={[styles.face, { marginLeft: i ? -8 : 0, borderColor: color('static/white') }]}><Avatar url={p.avatarUrl} name={p.name} size={24} /></View>
                  ))}
                </View>
                <Text variant="Caption Strong" color="fg/on-photo">{`${t('challenge.cooking', { n: featured.participants.toLocaleString(i18n.language) })} · ${t('challenge.entriesN', { n: featured.entries })}`}</Text>
              </View>
              {featured.entered ? (
                <Button label={t('challenge.entered')} variant="Glass" size="M" icon={Check} disabled onPress={() => undefined} />
              ) : featured.joined ? (
                <Button label={t('challenge.postEntry')} variant="Kick" size="M" icon={Upload} onPress={() => postEntry(featured)} />
              ) : (
                <Button label={t('challenge.join')} variant="White" size="M" loading={busy === featured.id} onPress={() => join(featured)} />
              )}
            </View>
          </Pressable>
        </View>
      ) : null}

      {/* Your challenges — joined and still open: did I post yet? */}
      {mine.length ? (
        <View style={[styles.section, styles.px]}>
          <SectionHeader title={t('challenge.yours')} />
          <View style={styles.rows}>
            {mine.map((c) => (
              <ChallengeRow
                key={c.id}
                c={c}
                sub={c.entered ? t('challenge.entered') : c.phase === 'soon' ? t('challenge.starts', { day: day(c.startsAt) }) : t('challenge.notYet', { when: day(c.endsAt) })}
                done={c.entered}
                action={!c.entered && c.phase === 'running' ? { label: t('challenge.post'), onPress: () => postEntry(c) } : undefined}
              />
            ))}
          </View>
        </View>
      ) : null}

      {/* Top entries of this week's challenge — most acorns first. */}
      {featured && top.length ? (
        <View style={styles.section}>
          <View style={styles.px}>
            <SectionHeader title={t('challenge.topEntries')} action={t('dish.seeAll')} onAction={() => router.push(`/challenge/${featured.slug}`)} />
          </View>
          <View style={styles.grid}>
            {top.map((d) => <DishTile key={d.id} dish={d} width={tileW} onPress={() => router.push(`/dish/${d.id}`)} />)}
          </View>
        </View>
      ) : null}

      {/* More running now + coming up — 168×220 themed cards, join early. */}
      {others.length || soon.length ? (
        <View style={styles.section}>
          <View style={styles.px}><SectionHeader title={t('challenge.comingUp')} action={t('dish.seeAll')} onAction={() => router.push('/challenges')} /></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {[...others, ...soon].map((c) => (
              <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={c.title} onPress={() => router.push(`/challenge/${c.slug}`)} style={styles.card}>
                <ThemeArt theme={c.theme} />
                <LinearGradient colors={['transparent', color('overlay/scrim-strong')]} locations={[0.3, 1]} style={StyleSheet.absoluteFill} />
                <View style={[styles.badge, { backgroundColor: color('glass/surface') }]}><Icon icon={THEME_ICON[c.theme as ThemeKey] ?? Soup} size={18} /></View>
                <View style={styles.flex} />
                <Text variant="Overline" color="fg/on-photo-secondary" numberOfLines={1}>
                  {c.phase === 'soon' ? t('challenge.starts', { day: day(c.startsAt) }).toUpperCase() : t('challenge.left', { time: timeLeft(c.endsAt) }).toUpperCase()}
                </Text>
                <Text variant="Title/M" color="fg/on-photo" numberOfLines={2}>{c.title}</Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={c.joined || busy === c.id}
                  onPress={() => join(c)}
                  style={[styles.smallBtn, { backgroundColor: c.joined ? color('glass/surface') : color('bg/subtle') }]}
                >
                  {c.joined ? <Icon icon={Check} size={14} /> : null}
                  <Text variant="Caption Strong">{c.joined ? t('challenge.joined') : c.phase === 'soon' ? t('challenge.joinEarly') : t('challenge.join')}</Text>
                </Pressable>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {ended.length ? (
        <View style={[styles.section, styles.px]}>
          <SectionHeader title={t('challenge.recentlyEnded')} />
          <View style={styles.rows}>
            {ended.slice(0, 3).map((c) => (
              <ChallengeRow key={c.id} c={c} sub={`${t('challenge.endedOn', { date: day(c.endsAt) })} · ${t('challenge.entriesN', { n: c.entries })}`} muted />
            ))}
          </View>
        </View>
      ) : null}

      {/* How it works — Join · Cook · Post. */}
      <View style={[styles.section, styles.px]}>
        <SectionHeader title={t('challenge.howItWorks')} />
        <View style={[styles.how, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
          {(['join', 'cook', 'post'] as const).map((k, i) => (
            <View key={k} style={styles.howStep}>
              <View style={[styles.howNo, { backgroundColor: color('bg/inverse') }]}><Text variant="Caption Strong" color="fg/inverse">{i + 1}</Text></View>
              <Text variant="Body/S Strong">{t(`challenge.how.${k}`)}</Text>
              <Text variant="Caption" color="fg/muted" style={styles.center}>
                {k === 'join' ? t('challenge.howJoin') : k === 'cook' ? featured?.rule ?? t('challenge.howCookFallback') : t('challenge.howPost', { tag: featured?.tag ?? 'ongdalsaem' })}
              </Text>
            </View>
          ))}
        </View>
        <Text variant="Caption" color="fg/muted">{t('challenge.footnote')}</Text>
      </View>
    </View>
  );
}

/** Theme illustration, or its mood wash when there's no picture (Diwali). */
function ThemeArt({ theme }: { theme: string }) {
  const src = themeImage(theme);
  return theme === 'diwali' || !src
    ? <MoodGradient mood={THEME_MOOD[theme as ThemeKey] ?? 'clear'} style={StyleSheet.absoluteFill} />
    : <Image source={src} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />;
}

function ChallengeRow({ c, sub, done, muted, action }: { c: Challenge; sub: string; done?: boolean; muted?: boolean; action?: { label: string; onPress: () => void } }) {
  const { color } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={c.title} onPress={() => router.push(`/challenge/${c.slug}`)} style={[styles.row, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
      <View style={[styles.thumb, muted && styles.muted]}><ThemeArt theme={c.theme} /></View>
      <View style={styles.flex}>
        <Text variant="Title/S" numberOfLines={1}>{c.title}</Text>
        <View style={styles.subRow}>
          {done ? <Icon icon={Check} size={14} color="fg/done" /> : null}
          <Text variant="Caption" color={done ? 'fg/done' : 'fg/muted'} numberOfLines={1}>{sub}</Text>
        </View>
      </View>
      {action ? (
        <Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={space[6]} style={[styles.rowBtn, { backgroundColor: color('bg/inverse') }]}>
          <Text variant="Caption Strong" color="fg/inverse">{action.label}</Text>
        </Pressable>
      ) : <Icon icon={ChevronRight} size={20} color="fg/muted" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: space[40] },
  section: { paddingTop: space[32], gap: space[12] },
  px: { paddingHorizontal: space[20] },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  hero: { height: 460, borderRadius: radius['2xl'], overflow: 'hidden', padding: space[20] },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: space[6], paddingHorizontal: space[10], height: 28, borderRadius: radius.full },
  dot: { width: 6, height: 6, borderRadius: 3 },
  heroBody: { gap: space[8] },
  faces: { flexDirection: 'row', alignItems: 'center', gap: space[8], paddingTop: space[4], paddingBottom: space[8] },
  faceRow: { flexDirection: 'row' },
  face: { borderWidth: 1.5, borderRadius: radius.full },
  rows: { gap: space[10] },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[12], padding: space[12], borderRadius: radius.xl, borderWidth: 1 },
  thumb: { width: 56, height: 56, borderRadius: radius.lg, overflow: 'hidden' },
  muted: { opacity: 0.6 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: space[4], paddingTop: space[2] },
  rowBtn: { height: 32, paddingHorizontal: space[14], borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 20, paddingHorizontal: space[20] },
  carousel: { gap: space[12], paddingHorizontal: space[20] },
  card: { width: 168, height: 220, borderRadius: radius.xl, overflow: 'hidden', padding: space[16], gap: space[6] },
  badge: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: space[4], alignSelf: 'flex-start', height: 30, paddingHorizontal: space[12], borderRadius: radius.full, marginTop: space[4] },
  how: { flexDirection: 'row', borderRadius: radius.xl, borderWidth: 1, paddingVertical: space[16], paddingHorizontal: space[8] },
  howStep: { flex: 1, alignItems: 'center', gap: space[6], paddingHorizontal: space[4] },
  howNo: { width: 24, height: 24, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
});
