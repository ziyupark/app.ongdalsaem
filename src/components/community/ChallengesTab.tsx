import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTabFocusEffect } from '../TabBar';
import { Flag, Soup } from '../icons/ongdal';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { THEME_ICON, THEME_MOOD, themeImage, type ThemeKey } from '../../lib/holidays';
import { startChallengeDraft, takeChallengeEntered } from '../../lib/shareDraft';
import {
  fetchChallengeEntries, fetchChallengeFaces, fetchChallenges, fetchViralBites, setChallengeJoined, timeLeft, type Challenge, type ViralItem,
} from '../../services/community';
import type { DishSummary, Person } from '../../services/foods';
import { elevation, radius, space, useTheme, type ColorToken } from '../../theme';
import { Icon } from '../Icon';
import { MoodGradient } from '../MoodGradient';
import { Text } from '../Text';
import { LoadError } from '../LoadError';
import { Avatar, EmptyState, FlagTag, PhotoCard, SectionHeader, ViralBadge } from './Parts';
import { AcornTag, WeatherTag } from '../PhotoTags';

/** Latest entries on the tab — a 3 × 3 grid. */
const ENTRIES = 9;
const COLS = 3;

/** This week's challenge: the running one closing soonest (joined first). */
const pickFeatured = (l: Challenge[]) =>
  [...l.filter((c) => c.phase === 'running')].sort((a, b) => Number(b.joined) - Number(a.joined) || a.endsAt.getTime() - b.endsAt.getTime())[0] ?? null;

/**
 * 4.10 Community · Challenges (826:15539) · 4.10b Joined (826:16426) — one screen:
 * This week's challenge (hero 400, no navigation) → Join challenge (→ upload, one photo) / You're in! → Ends in · Entries
 * → Latest entries (3-column photos → post) → Coming up (Join early, in place) → Recently ended (→ 4.10c).
 * `onJoinY` reports where the Join button sits (for 4.10c's "back to the Join button").
 */
export function ChallengesTab({ onJoinY }: { onJoinY?: (y: number) => void }) {
  return (
    <View>
      <ChallengesBody onJoinY={onJoinY} />
      <ViralBites />
    </View>
  );
}

const VIRAL_CARDS = 3;

/**
 * Viral Bites on the Challenges tab (Figma 1113:25966) — p32 · gap 6: SectionHeader "Viral Bites" → full-width Country
 * Cards 350×180 stacked, gap 12 (r32, p 14 18, 120 pt ink fade at the bottom): flag (18, 12) + viral badge (62, 12) on top;
 * at the bottom Display/M name → Weather Tag · Acorn Tag. Editor's picks first, then rising dishes; card → 4.7.
 * Hidden when there is nothing (or it failed) — the challenges above don't depend on it.
 */
function ViralBites() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [items, setItems] = useState<ViralItem[]>([]);
  useTabFocusEffect(useCallback(() => {
    let alive = true;
    fetchViralBites().then((l) => alive && setItems(l.filter((v) => v.photo).slice(0, VIRAL_CARDS))).catch(() => undefined);
    return () => { alive = false; };
  }, []));
  if (!items.length) return null;
  return (
    <View style={styles.viral}>
      <SectionHeader title={t('community.viralBites')} />
      <View style={styles.viralList}>
        {items.map((v) => (
          <PhotoCard key={v.key} photo={v.photo!} width={width - space[20] * 2} height={180} label={v.name} onPress={() => router.push({ pathname: '/viral/[name]', params: { name: v.name } })} style={styles.viralCard} scrim="bottom">
            <View style={styles.viralTop}>
              {v.country ? <FlagTag code={v.country} /> : null}
              <ViralBadge item={v} />
            </View>
            <Text variant="Display/M" color="fg/on-photo" numberOfLines={1}>{v.name}</Text>
            <View style={styles.viralTags}>
              {v.cover?.mood && v.cover.tempC != null ? <WeatherTag mood={v.cover.mood} tempC={v.cover.tempC} condition={t(`weather.${v.cover.mood}`)} /> : <View />}
              {v.cover ? <AcornTag count={v.cover.acorns} /> : null}
            </View>
          </PhotoCard>
        ))}
      </View>
    </View>
  );
}

function ChallengesBody({ onJoinY }: { onJoinY?: (y: number) => void }) {
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const [list, setList] = useState<Challenge[] | null>(null);
  const [faces, setFaces] = useState<Person[]>([]);
  const [entries, setEntries] = useState<DishSummary[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const featured = useMemo(() => (list ? pickFeatured(list) : null), [list]);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Refetch on every focus — after posting an entry the button, count and Latest entries are fresh at once.
  useTabFocusEffect(
    useCallback(() => {
      let alive = true;
      const just = takeChallengeEntered();
      fetchChallenges()
        .then(async (l) => {
          if (!alive) return;
          const fixed = just ? l.map((c) => (c.id === just && !c.entered ? { ...c, entered: true, joined: true } : c)) : l;
          setList(fixed);
          setFailed(false);
          const f = pickFeatured(fixed);
          if (!f) return;
          const [people, latest] = await Promise.all([fetchChallengeFaces(f.id).catch(() => []), fetchChallengeEntries(f.id, ENTRIES).catch(() => [])]);
          if (!alive) return;
          setFaces(people);
          setEntries(latest);
        })
        .catch(() => alive && setFailed(true));
      return () => { alive = false; };
    }, [attempt]),
  );

  const patch = (id: string, p: Partial<Challenge>) => setList((l) => (l ? l.map((c) => (c.id === id ? { ...c, ...p } : c)) : l));
  /** Join early (coming up) — reserves a place right here. */
  const reserve = async (c: Challenge) => {
    if (busy || c.joined) return;
    setBusy(c.id);
    patch(c.id, { joined: true, participants: c.participants + 1 });
    try { await setChallengeJoined(c.id, true); } catch { patch(c.id, { joined: false, participants: c.participants }); Alert.alert(t('settings.saveFailed')); } finally { setBusy(null); }
  };
  /** Join a running challenge = post its one-photo entry. */
  const enter = (c: Challenge) => {
    startChallengeDraft(c);
    router.push('/share/pick');
  };

  if (list == null && failed) return <LoadError onRetry={() => { setFailed(false); setAttempt((n) => n + 1); }} />;
  if (list == null) return <ActivityIndicator color={color('fg/muted')} style={styles.loading} />;
  if (!list.length) return <EmptyState icon={Flag} title={t('challenge.emptyTitle')} body={t('challenge.emptyBody')} />;

  const coming = [...list.filter((c) => c.phase === 'running' && c.id !== featured?.id), ...list.filter((c) => c.phase === 'soon')];
  const ended = list.filter((c) => c.phase === 'ended').sort((a, b) => b.endsAt.getTime() - a.endsAt.getTime());
  const day = (d: Date) => d.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' });
  const tile = (width - space[20] * 2 - space[8] * (COLS - 1)) / COLS;
  const n = (v: number) => v.toLocaleString(i18n.language);

  return (
    <View>
      {featured ? (
        <>
          {/* Group · Title (1269:18120, pt 22 · pb 3) → Group · This week's challenge (826:15999, pt 6 → pt 6) → Challenge Hero 350×400;
              title x20 = hero x20 (SectionHeader has its own px20). */}
          <View style={styles.featured}>
            <SectionHeader title={t('challenge.featured')} />
            <View style={styles.heroWrap}>
              <ChallengeHero
                c={featured}
                faces={faces}
                pill={{ dot: 'fg/success', text: `${t('challenge.live')} · ${t('challenge.left', { time: timeLeft(featured.endsAt) })}`, color: 'fg/default' }}
              />
            </View>
          </View>

          {/* Frame 18 — p20: Join challenge (bg/primary = ink in light mode, inverts in dark; Elevation/2) → 4.10b You're in! (bg/kick, fg/default). */}
          <View style={styles.cta} onLayout={(e) => onJoinY?.(e.nativeEvent.layout.y)}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: featured.entered }}
              disabled={featured.entered}
              onPress={() => enter(featured)}
              style={({ pressed }) => [styles.join, elevation['Elevation/2 Raised'], { backgroundColor: color(featured.entered ? 'bg/kick' : 'bg/primary') }, pressed && styles.pressed]}
            >
              <Text variant="Button/L" color={featured.entered ? 'fg/default' : 'fg/on-primary'}>{t(featured.entered ? 'challenge.youreInCta' : 'challenge.join')}</Text>
            </Pressable>
          </View>

          {/* Frame 19 — px20 · gap 10: Ends in · Entries → Latest entries (count) → 3-column photos. */}
          <View style={styles.block}>
            <View style={styles.stats}>
              <Stat value={timeLeft(featured.endsAt)} label={t('challenge.endsIn')} />
              <Stat value={n(featured.entries)} label={t('challenge.entriesLabel')} />
            </View>
            <View style={styles.entriesHead}>
              <Text variant="Title/M" style={styles.flex}>{t('challenge.latestEntries')}</Text>
              <Text variant="Body/S" color="fg/muted">{n(featured.entries)}</Text>
            </View>
            {entries.length ? (
              <EntryGrid entries={entries} size={tile} />
            ) : <Text variant="Body/S" color="fg/muted">{t('challenge.noEntries')}</Text>}
          </View>
        </>
      ) : null}

      {/* Group · Coming up (826:16078) — pt 32 · gap 12: Inset (pt 22 · pb 3) header (more → all) → 168×220 Challenge Cards; Join early in place. */}
      {/* No running challenge (4.10 No Challenge 1269:18199): Coming up is first and starts right under the tabs (no pt 32). */}
      {coming.length ? (
        <View style={[styles.section, !featured && styles.sectionFirst]}>
          {/* Inset 826:16079 — pt 22 · pb 3 around the header (only Coming up has it). */}
          <View style={styles.comingHead}>
            <SectionHeader title={t('challenge.comingUp')} onMore={() => router.push('/challenges')} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {coming.map((c) => {
              const soon = c.phase === 'soon';
              const done = soon ? c.joined : c.entered;
              return (
                <ChallengeCard
                  key={c.id}
                  c={c}
                  overline={(soon ? t('challenge.starts', { day: day(c.startsAt) }) : t('challenge.left', { time: timeLeft(c.endsAt) })).toUpperCase()}
                  action={{
                    label: done ? t(soon ? 'challenge.joined' : 'challenge.youreInCta') : t(soon ? 'challenge.joinEarly' : 'challenge.join'),
                    done,
                    busy: busy === c.id,
                    onPress: () => (soon ? reserve(c) : enter(c)),
                  }}
                />
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {/* Recently ended — p32 · gap 12: header (more → the latest ended, 4.10c) → cards (→ that challenge's 4.10c). */}
      {ended.length ? (
        <View style={styles.section}>
          <SectionHeader title={t('challenge.recentlyEnded')} onMore={() => router.push(`/challenge/${ended[0].slug}`)} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {ended.map((c) => (
              <ChallengeCard
                key={c.id}
                c={c}
                overline={t('challenge.endedOn', { date: day(c.endsAt) }).toUpperCase()}
                note={t('challenge.entriesN', { n: n(c.entries) })}
                onPress={() => router.push(`/challenge/${c.slug}`)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Challenge Hero 350×400 — r32, p20, gap 8: theme art + scrim; pill (dot · Caption Strong) · flag on top; at the bottom
 * Overline rule → Display/M title → Body/S description → faces (24, −8, static/white 1.5) · "N cooking · N dishes".
 */
export function ChallengeHero({ c, faces, pill, onPress }: {
  c: Challenge;
  faces: Person[];
  pill: { dot: ColorToken; text: string; color: ColorToken };
  onPress?: () => void;
}) {
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const n = (v: number) => v.toLocaleString(i18n.language);
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={c.title} disabled={!onPress} onPress={onPress} style={styles.hero}>
      <ThemeArt theme={c.theme} />
      <LinearGradient colors={['transparent', color('overlay/scrim-strong')]} locations={[0.35, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.heroTop}>
        <View style={[styles.pill, { backgroundColor: color('glass/surface') }]}>
          <View style={[styles.dot, { backgroundColor: color(pill.dot) }]} />
          <Text variant="Caption Strong" color={pill.color}>{pill.text}</Text>
        </View>
        {c.country ? <FlagTag code={c.country} /> : null}
      </View>
      <View style={styles.flex} />
      {c.rule ? <Text variant="Overline" color="fg/on-photo-secondary" numberOfLines={1}>{c.rule}</Text> : null}
      <Text variant="Display/M" color="fg/on-photo" numberOfLines={2}>{c.title}</Text>
      {c.description ? <Text variant="Body/S" color="fg/on-photo-secondary" numberOfLines={2}>{c.description}</Text> : null}
      <View style={styles.faces}>
        {faces.length ? (
          <View style={styles.faceRow}>
            {faces.slice(0, 3).map((p, i) => (
              <View key={p.id} style={[styles.face, i > 0 && styles.faceOverlap, { borderColor: color('static/white') }]}><Avatar url={p.avatarUrl} name={p.name} size={24} /></View>
            ))}
          </View>
        ) : null}
        <Text variant="Caption Strong" color="fg/on-photo">{`${t('challenge.cooking', { n: n(c.participants) })} · ${t('challenge.entriesN', { n: n(c.entries) })}`}</Text>
      </View>
    </Pressable>
  );
}

/** Stat — r12, bg/subtle + 0.5 border/strong, 61 high: Title/M value over Caption fg/muted label. */
export function Stat({ value, label }: { value: string; label: string }) {
  const { color } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: color('bg/subtle'), borderColor: color('border/strong') }]}>
      <Text variant="Title/M">{value}</Text>
      <Text variant="Caption" color="fg/muted">{label}</Text>
    </View>
  );
}

/** Latest entries — square photos (r12, gap 8); tap → the post. */
export function EntryGrid({ entries, size }: { entries: DishSummary[]; size: number }) {
  const { color } = useTheme();
  return (
    <View style={styles.grid}>
      {entries.map((e) => (
        <Pressable key={e.id} accessibilityRole="imagebutton" accessibilityLabel={e.name} onPress={() => router.push(`/dish/${e.id}`)}>
          <Image source={{ uri: e.photo }} style={[styles.entry, { width: size, height: size, backgroundColor: color('bg/muted') }]} contentFit="cover" transition={150} recyclingKey={e.id} />
        </Pressable>
      ))}
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

/**
 * Challenge Card 168×220 — r24, p16, gap 6: theme art + scrim, glass badge 36 → Overline → Title/M → pill (30, bg/subtle;
 * done = bg/kick). Coming up: the pill is the action, the card itself doesn't move. Ended: the card opens 4.10c, the pill
 * is a plain note.
 */
function ChallengeCard({ c, overline, action, note, onPress }: {
  c: Challenge;
  overline: string;
  action?: { label: string; done: boolean; busy: boolean; onPress: () => void };
  note?: string;
  onPress?: () => void;
}) {
  const { color } = useTheme();
  const body = (
    <>
      <ThemeArt theme={c.theme} />
      <LinearGradient colors={['transparent', color('overlay/scrim-strong')]} locations={[0.3, 1]} style={StyleSheet.absoluteFill} />
      <View style={[styles.badge, { backgroundColor: color('glass/surface') }]}><Icon icon={THEME_ICON[c.theme as ThemeKey] ?? Soup} size={18} /></View>
      <View style={styles.flex} />
      <Text variant="Overline" color="fg/on-photo-secondary" numberOfLines={1}>{overline}</Text>
      <Text variant="Title/M" color="fg/on-photo" numberOfLines={2}>{c.title}</Text>
      {action ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: action.done || action.busy }}
          disabled={action.done || action.busy}
          onPress={action.onPress}
          hitSlop={space[6]}
          style={[styles.smallBtn, { backgroundColor: color(action.done ? 'bg/kick' : 'bg/subtle') }]}
        >
          <Text variant="Caption Strong">{action.label}</Text>
        </Pressable>
      ) : note ? (
        <View style={[styles.smallBtn, { backgroundColor: color('bg/subtle') }]}>
          <Text variant="Caption Strong">{note}</Text>
        </View>
      ) : null}
    </>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" accessibilityLabel={c.title} onPress={onPress} style={styles.card}>{body}</Pressable>
  ) : (
    <View style={styles.card}>{body}</View>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: space[40] },
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  // 4.10 (826:15539): Group · Title pt 22 → title → pb 3 + pt 6 + pt 6 = 15 → hero.
  featured: { paddingTop: 22, gap: 15 },
  heroWrap: { paddingHorizontal: space[20] },
  hero: { height: 400, borderRadius: radius['2xl'], overflow: 'hidden', padding: space[20], gap: space[8] },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: space[6], paddingHorizontal: space[10], height: 28, borderRadius: radius.full },
  dot: { width: space[6], height: space[6], borderRadius: radius.full },
  faces: { flexDirection: 'row', alignItems: 'center', gap: space[8], paddingTop: space[4], paddingBottom: space[8] },
  faceRow: { flexDirection: 'row' },
  face: { borderWidth: 1.5, borderRadius: radius.full },
  faceOverlap: { marginLeft: -space[8] },
  cta: { padding: space[20] },
  join: { height: 46, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space[20] },
  block: { paddingHorizontal: space[20], gap: space[10] },
  stats: { flexDirection: 'row', gap: space[8], paddingTop: space[4] },
  stat: { flex: 1, height: 61, borderRadius: radius.md, borderWidth: 0.5, alignItems: 'center', justifyContent: 'center', gap: space[8], paddingHorizontal: space[20] },
  entriesHead: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8] },
  entry: { borderRadius: radius.md },
  section: { paddingTop: space[32], gap: space[12] },
  comingHead: { paddingTop: 22, paddingBottom: 3 },
  sectionFirst: { paddingTop: 0 },
  carousel: { gap: space[12], paddingHorizontal: space[20] },
  card: { width: 168, height: 220, borderRadius: radius.xl, overflow: 'hidden', padding: space[16], gap: space[6] },
  badge: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  viral: { paddingTop: space[32], gap: space[6] },
  viralList: { paddingHorizontal: space[20], gap: space[12] },
  viralCard: { paddingHorizontal: 18, paddingVertical: space[14], justifyContent: 'flex-end', gap: space[10] },
  viralTop: { position: 'absolute', left: 18, top: space[12], right: 18, flexDirection: 'row', alignItems: 'center', gap: space[8] },
  viralTags: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: space[4], alignSelf: 'flex-start', height: 30, paddingHorizontal: space[12], borderRadius: radius.full, marginTop: space[4] },
});
