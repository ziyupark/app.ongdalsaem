import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ArrowRight, Check, MoreHorizontal, ThumbsUp } from '../../src/components/icons/ongdal';
import { MessageCircle } from '../../src/components/icons/ongdal';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, EmptyState, QuestionCard } from '../../src/components/community/Parts';
import { LoadError } from '../../src/components/LoadError';
import { ReportSheet } from '../../src/components/dish/ReportSheet';
import { Icon } from '../../src/components/Icon';
import { Text } from '../../src/components/Text';
import { TopBar } from '../../src/components/TopBar';
import { timeAgo } from '../../src/lib/time';
import {
  addAnswer, deleteAnswer, deleteQuestion, fetchAnswers, fetchQuestion, setBestAnswer, setHelpful, type Answer, type Question,
} from '../../src/services/community';
import { isObjectionable, reportAnswer } from '../../src/services/moderation';
import { getMyProfile, type MyProfile } from '../../src/services/profile';
import { radius, space, text, useTheme, FONT_SCALE_MAX } from '../../src/theme';

const MAX = 500;
const { lineHeight: _lh, ...field } = text['Body/M'];

/** 3.8 Question (469:11388) — question card · answers (asker's pick first, Helpful) · composer. */
export default function QuestionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState<Question | null | undefined>(undefined);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [me, setMe] = useState<MyProfile | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [reporting, setReporting] = useState<Answer | null>(null);

  const [failed, setFailed] = useState(false);
  const load = useCallback(async () => {
    try {
      const [question, list] = await Promise.all([fetchQuestion(id), fetchAnswers(id).catch(() => [])]);
      setQ(question);
      setAnswers(list);
      setFailed(false);
    } catch {
      setFailed(true); // offline / server error — keep what is on screen; with nothing yet, show Try again
    }
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { getMyProfile().then(setMe).catch(() => undefined); }, []);

  if (q === undefined && failed) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, backgroundColor: color('bg/default') }]}>
        <TopBar title={t('ask.questionTitle')} onBack={() => router.back()} backLabel={t('common.back')} />
        <LoadError onRetry={load} />
      </View>
    );
  }
  if (q === undefined) return <View style={[styles.center, { backgroundColor: color('bg/default') }]}><ActivityIndicator color={color('fg/muted')} /></View>;

  const sorted = q ? [...answers].sort((a, b) => (a.id === q.bestAnswerId ? -1 : b.id === q.bestAnswerId ? 1 : 0)) : answers;

  const helpful = async (a: Answer) => {
    const on = !a.helpfulByMe;
    setAnswers((l) => l.map((x) => (x.id === a.id ? { ...x, helpfulByMe: on, helpful: x.helpful + (on ? 1 : -1) } : x)));
    try { await setHelpful(a.id, on); } catch { setAnswers((l) => l.map((x) => (x.id === a.id ? a : x))); }
  };
  const send = async () => {
    if (!q || !draft.trim() || sending) return;
    setSending(true);
    try {
      await addAnswer(q.id, draft);
      setDraft('');
      load();
    } catch (e) {
      Alert.alert(isObjectionable(e) ? t('moderation.objectionable') : t('dish.commentsError'));
    } finally {
      setSending(false);
    }
  };
  const answerMenu = (a: Answer) => {
    if (!q) return;
    const opts: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [{ text: t('common.cancel'), style: 'cancel' }];
    if (q.mine && a.author.id !== me?.id) {
      const picked = q.bestAnswerId === a.id;
      opts.push({ text: t(picked ? 'ask.unpick' : 'ask.pick'), onPress: async () => { try { await setBestAnswer(q.id, picked ? null : a.id); setQ({ ...q, bestAnswerId: picked ? null : a.id }); } catch { Alert.alert(t('settings.saveFailed')); } } });
    }
    if (a.author.id === me?.id) opts.push({ text: t('dish.delete'), style: 'destructive', onPress: async () => { try { await deleteAnswer(a.id); load(); } catch { Alert.alert(t('settings.saveFailed')); } } });
    else opts.push({ text: t('report.send'), style: 'destructive', onPress: () => setReporting(a) });
    Alert.alert(a.author.handle ?? a.author.name, undefined, opts);
  };
  const questionMenu = () => {
    if (!q?.mine) return;
    Alert.alert(t('ask.questionTitle'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('post.edit'), onPress: () => router.push({ pathname: '/ask', params: { id: q.id } }) },
      { text: t('dish.delete'), style: 'destructive', onPress: async () => { try { await deleteQuestion(q.id); router.back(); } catch { Alert.alert(t('settings.saveFailed')); } } },
    ]);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, { paddingTop: insets.top, backgroundColor: color('bg/default') }]}>
      <View>
        <TopBar title={t('ask.questionTitle')} onBack={() => router.back()} backLabel={t('common.back')} />
        {q?.mine ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t('home.more')} onPress={questionMenu} hitSlop={space[8]} style={styles.more}>
            <Icon icon={MoreHorizontal} size={22} />
          </Pressable>
        ) : null}
      </View>
      {!q ? <EmptyState icon={MessageCircle} title={t('ask.missing')} /> : (
        <>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <QuestionCard q={q} showImage />
            <Text variant="Overline" color="fg/muted">{t('ask.answersOverline', { count: answers.length })}</Text>
            {sorted.length ? sorted.map((a) => (
              <Pressable key={a.id} onLongPress={() => answerMenu(a)} delayLongPress={350} style={styles.answer}>
                <Avatar url={a.author.avatarUrl} name={a.author.name} size={32} />
                <View style={styles.flex}>
                  <View style={styles.aHead}>
                    <Text variant="Body/S Strong">{a.author.handle ?? a.author.name}</Text>
                    <Text variant="Caption" color="fg/muted" numberOfLines={1} style={styles.shrink}>{[a.place, timeAgo(a.createdAt, t)].filter(Boolean).join(' · ')}</Text>
                    {q.bestAnswerId === a.id ? (
                      <View style={[styles.pick, { backgroundColor: color('bg/done-subtle') }]}>
                        <Icon icon={Check} size={12} color="fg/done" />
                        <Text variant="Caption Strong">{t('ask.askersPick')}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text variant="Body/M">{a.body}</Text>
                  <Pressable accessibilityRole="button" accessibilityState={{ selected: a.helpfulByMe }} disabled={a.author.id === me?.id} onPress={() => helpful(a)} hitSlop={space[6]} style={styles.helpful}>
                    <Icon icon={ThumbsUp} size={16} color={a.helpfulByMe ? 'fg/accent' : 'fg/default'} />
                    <Text variant="Caption Strong" color={a.helpfulByMe ? 'fg/accent' : 'fg/secondary'}>{t('ask.helpful', { n: a.helpful })}</Text>
                  </Pressable>
                </View>
              </Pressable>
            )) : <Text variant="Body/S" color="fg/muted">{t('ask.noAnswers')}</Text>}
          </ScrollView>
          <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom + space[6], 40), borderTopColor: color('border/default') }]}>
            <View style={[styles.field, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
              <TextInput maxFontSizeMultiplier={FONT_SCALE_MAX}
                value={draft}
                onChangeText={(v) => setDraft(v.slice(0, MAX))}
                placeholder={t('ask.answerPlaceholder')}
                placeholderTextColor={color('fg/muted')}
                multiline
                style={[field, styles.input, { color: color('fg/default') }]}
              />
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={t('dish.sendComment')} disabled={!draft.trim() || sending} onPress={send} hitSlop={space[8]}>
              <Icon icon={ArrowRight} size={22} color={draft.trim() ? 'fg/accent' : 'fg/muted'} />
            </Pressable>
          </View>
        </>
      )}
      {q ? (
        <ReportSheet
          visible={!!reporting}
          title={t('ask.reportAnswer')}
          ownerId={reporting?.author.id ?? ''}
          ownerName={reporting?.author.name ?? ''}
          onReport={(reason) => reportAnswer(reporting!.id, q.id, reporting!.author.id, reason)}
          onClose={() => setReporting(null)}
          onBlocked={() => { setReporting(null); load(); }}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1, gap: space[4] },
  shrink: { flexShrink: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  more: { position: 'absolute', right: space[16], top: 15 },
  body: { paddingHorizontal: space[20], paddingTop: space[12], paddingBottom: space[24], gap: space[16] },
  answer: { flexDirection: 'row', gap: space[12] },
  aHead: { flexDirection: 'row', alignItems: 'center', gap: space[6], flexWrap: 'wrap' },
  pick: { flexDirection: 'row', alignItems: 'center', gap: space[4], paddingLeft: space[6], paddingRight: space[8], paddingVertical: space[2], borderRadius: radius.full },
  helpful: { flexDirection: 'row', alignItems: 'center', gap: space[6], alignSelf: 'flex-start', paddingTop: space[2] },
  composer: { flexDirection: 'row', alignItems: 'center', gap: space[10], paddingHorizontal: space[16], paddingTop: space[10], borderTopWidth: 1 }, // Comment Composer 287:334
  field: { flex: 1, minHeight: 48, borderRadius: radius.full, borderWidth: 1, paddingHorizontal: space[20], justifyContent: 'center' },
  input: { paddingVertical: space[12], maxHeight: 120 },
});
