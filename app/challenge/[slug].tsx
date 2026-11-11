import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Check, ChevronLeft, Trophy } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { EmptyState, Faces, FlagTag } from '../../src/components/community/Parts';
import { GlassIconButton } from '../../src/components/GlassIconButton';
import { Icon } from '../../src/components/Icon';
import { MoodGradient } from '../../src/components/MoodGradient';
import { Text } from '../../src/components/Text';
import { resetShareDraft, updateShareDraft } from '../../src/lib/shareDraft';
import { fetchChallenge, fetchChallengeEntries, fetchChallengeFaces, setChallengeJoined, timeLeft, type Challenge } from '../../src/services/community';
import type { DishSummary, Person } from '../../src/services/foods';
import { radius, space, useTheme } from '../../src/theme';

/** 4.10 Challenge (470:10224) · 4.10b Joined (470:11467) · 4.10c Ended (502:12476). */
export default function ChallengeScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [c, setC] = useState<Challenge | null | undefined>(undefined);
  const [entries, setEntries] = useState<DishSummary[]>([]);
  const [faces, setFaces] = useState<Person[]>([]);
  const [busy, setBusy] = useState(false);
  const tile = (width - space[20] * 2 - space[8] * 2) / 3;

  const load = useCallback(async () => {
    const ch = await fetchChallenge(slug).catch(() => null);
    setC(ch);
    if (!ch) return;
    fetchChallengeEntries(ch.id).then(setEntries).catch(() => undefined);
    fetchChallengeFaces(ch.id).then(setFaces).catch(() => undefined);
  }, [slug]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (c === undefined) return <View style={[styles.center, { backgroundColor: color('bg/default') }]}><ActivityIndicator color={color('fg/muted')} /></View>;
  if (c === null) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + space[8], backgroundColor: color('bg/default') }]}>
        <View style={styles.px}><GlassIconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} /></View>
        <EmptyState icon={Trophy} title={t('challenge.missing')} />
      </View>
    );
  }

  const closing = c.phase === 'running' && c.endsAt.getTime() - Date.now() < 3 * 864e5;
  const status = c.phase === 'ended' ? t('challenge.ended') : c.phase === 'soon' ? t('challenge.startsSoon') : closing ? t('challenge.closingSoon') : t('challenge.running');
  const endDay = c.endsAt.toLocaleString(i18n.language, { weekday: 'long', hour: 'numeric', minute: '2-digit' });
  const others = Math.max(0, c.participants - faces.slice(0, 2).length);

  const join = async () => {
    setBusy(true);
    try { await setChallengeJoined(c.id, true); setC({ ...c, joined: true, participants: c.participants + 1 }); }
    catch { Alert.alert(t('settings.saveFailed')); }
    finally { setBusy(false); }
  };
  const leave = () => Alert.alert(t('challenge.leaveTitle'), undefined, [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('challenge.leave'), style: 'destructive', onPress: async () => { try { await setChallengeJoined(c.id, false); setC({ ...c, joined: false, participants: Math.max(0, c.participants - 1) }); } catch { Alert.alert(t('settings.saveFailed')); } } },
  ]);
  const postEntry = () => {
    resetShareDraft();
    updateShareDraft({ challenge: { id: c.id, tag: c.tag }, description: `#${c.tag} `, isPublic: true });
    router.push('/share/pick');
  };

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: c.phase === 'ended' ? insets.bottom + space[24] : 120 }}>
        {/* Hero 390×278 — Weather Mood wash, padding 56 20 24, gap 12: badges · Display/M · Body/M · stats. */}
        <View style={[styles.hero, { paddingTop: insets.top + 2 }]}>
          <MoodGradient mood={c.phase === 'ended' ? 'overcast' : 'rain'} style={StyleSheet.absoluteFill} />
          <View style={styles.badges}>
            <GlassIconButton icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
            {c.country ? <FlagTag code={c.country} /> : null}
            <View style={[styles.status, { backgroundColor: color('bg/default') }]}>
              <Text variant="Caption Strong" color={c.phase === 'ended' ? 'fg/secondary' : 'fg/accent'}>{status}</Text>
            </View>
          </View>
          <Text variant="Display/M">{c.title}</Text>
          {c.description ? <Text variant="Body/M">{c.description}</Text> : null}
          {c.phase !== 'ended' ? (
            <View style={styles.stats}>
              <Stat value={c.phase === 'soon' ? timeLeft(c.startsAt) : timeLeft(c.endsAt)} label={t(c.phase === 'soon' ? 'challenge.startsIn' : 'challenge.endsIn')} />
              <Stat value={c.participants.toLocaleString()} label={t('challenge.cookingLabel')} />
              <Stat value={c.entries.toLocaleString()} label={t('challenge.entriesLabel')} />
            </View>
          ) : null}
        </View>

        <View style={styles.group}>
          {c.joined && c.phase !== 'ended' ? (
            // 4.10b Your progress — bg/done-subtle, check 20 fg/done.
            <Pressable accessibilityRole="button" onLongPress={leave} style={[styles.youreIn, { backgroundColor: color('bg/done-subtle') }]}>
              <Icon icon={Check} size={20} color="fg/done" />
              <View style={styles.flex}>
                <Text variant="Body/S Strong">{t('challenge.youreIn')}</Text>
                <Text variant="Caption" color="fg/secondary">{t('challenge.youreInBody', { tag: c.tag, when: endDay })}</Text>
              </View>
            </Pressable>
          ) : null}

          {faces.length ? (
            <View style={styles.faces}>
              <Faces people={faces} size={28} />
              <Text variant="Body/S" color="fg/secondary" numberOfLines={1} style={styles.flex}>
                {t(c.phase === 'ended' ? 'challenge.othersCooked' : 'challenge.othersCooking', { names: faces.slice(0, 2).map((p) => p.name).join(', '), n: others.toLocaleString() })}
              </Text>
            </View>
          ) : null}

          {c.phase !== 'ended' ? (
            <View style={styles.how}>
              <Text variant="Title/L">{t('challenge.howItWorks')}</Text>
              <View>
                {[
                  ['join', t('challenge.howJoin')],
                  ['cook', c.rule ?? t('challenge.howCookFallback')],
                  ['post', t('challenge.howPost', { tag: c.tag })],
                ].map(([k, v]) => (
                  <View key={k} style={[styles.howRow, { borderBottomColor: color('border/default') }]}>
                    <Text variant="Body/M">{t(`challenge.how.${k}`)}</Text>
                    <Text variant="Body/M Strong" color="fg/secondary" numberOfLines={1} style={styles.howValue}>{v}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.entriesHead}>
            <Text variant="Title/M" style={styles.flex}>{t('challenge.latestEntries')}</Text>
            <Text variant="Body/S" color="fg/muted">{c.entries.toLocaleString()}</Text>
          </View>
          {entries.length ? (
            <View style={styles.entries}>
              {entries.map((e) => (
                <Pressable key={e.id} accessibilityRole="imagebutton" accessibilityLabel={e.name} onPress={() => router.push(`/dish/${e.id}`)}>
                  <Image source={{ uri: e.photo }} style={[{ width: tile, height: tile, borderRadius: radius.md, backgroundColor: color('bg/muted') }]} contentFit="cover" transition={150} />
                </Pressable>
              ))}
            </View>
          ) : <Text variant="Body/S" color="fg/muted">{t('challenge.noEntries')}</Text>}
        </View>
      </ScrollView>

      {c.phase !== 'ended' ? (
        <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom + space[6], 40), backgroundColor: color('bg/default'), borderTopColor: color('border/default') }]}>
          {c.joined ? (
            <Button label={t('challenge.postEntry')} size="L" disabled={c.phase !== 'running'} onPress={postEntry} />
          ) : (
            <Button label={t('challenge.join')} size="L" loading={busy} onPress={join} />
          )}
        </View>
      ) : null}
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const { color } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: color('bg/default') }]}>
      <Text variant="Title/M">{value}</Text>
      <Text variant="Caption" color="fg/muted">{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  px: { paddingHorizontal: space[20] },
  hero: { paddingHorizontal: space[20], paddingBottom: space[24], gap: space[12], overflow: 'hidden' },
  badges: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  status: { paddingHorizontal: space[10], paddingVertical: space[4], borderRadius: radius.full },
  stats: { flexDirection: 'row', gap: space[8], paddingTop: space[4] },
  stat: { flex: 1, borderRadius: radius.md, paddingHorizontal: space[12], paddingVertical: space[10], gap: space[2] },
  group: { paddingTop: space[20], paddingHorizontal: space[20], gap: space[24] },
  youreIn: { flexDirection: 'row', alignItems: 'center', gap: space[12], paddingHorizontal: space[16], paddingVertical: space[14], borderRadius: radius.lg },
  faces: { flexDirection: 'row', alignItems: 'center', gap: space[10] },
  how: { gap: space[8] },
  howRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[16], paddingVertical: space[8], borderBottomWidth: 1 },
  howValue: { flexShrink: 1, textAlign: 'right' },
  entriesHead: { flexDirection: 'row', alignItems: 'center', gap: space[8], marginBottom: -space[16] },
  entries: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8] },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space[20], paddingTop: space[16], borderTopWidth: 1 },
});
