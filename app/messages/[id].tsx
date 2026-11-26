import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowRight, ChevronRight, MoreHorizontal } from '../../src/components/icons/ongdal';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../src/components/community/Parts';
import { LoadError } from '../../src/components/LoadError';
import { Icon } from '../../src/components/Icon';
import { Text } from '../../src/components/Text';
import { TopBar } from '../../src/components/TopBar';
import { fetchDish } from '../../src/services/foods';
import { DISH_LINK, fetchMessages, fetchThread, markSeen, sendMessage, subscribeThread, type Message, type Thread } from '../../src/services/messages';
import { ReportSheet } from '../../src/components/dish/ReportSheet';
import { blockUser, isObjectionable, reportMessage } from '../../src/services/moderation';
import { getMyProfile, type MyProfile } from '../../src/services/profile';
import { radius, space, text, useTheme, FONT_SCALE_MAX } from '../../src/theme';

const { lineHeight: _lh, ...field } = text['Body/M'];
const MAX = 1000;

/** 4.11 Message (352:9114) — date pill · bubbles (mine bg/inverse, theirs bg/subtle) · time / Seen · request note · composer. */
export default function ThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const [thread, setThread] = useState<Thread | null | undefined>(undefined);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [me, setMe] = useState<MyProfile | null>(null);
  const [draft, setDraft] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const list = useRef<FlatList<Message>>(null);

  const reload = useCallback(async () => {
    const m = await fetchMessages(id).catch(() => null);
    if (m) setMsgs(m);
    markSeen(id).catch(() => undefined);
  }, [id]);

  // Offline / server error on open: Try again instead of an empty chat with no name.
  const [failed, setFailed] = useState(false);
  const loadThread = useCallback(() => fetchThread(id).then((th) => { setThread(th); setFailed(false); reload(); }).catch(() => setFailed(true)), [id, reload]);
  useEffect(() => {
    loadThread(); // also loads the messages once the thread is there
    getMyProfile().then(setMe).catch(() => undefined);
    return subscribeThread(id, reload);
  }, [id, reload, loadThread]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft('');
    try { await sendMessage(id, body); await reload(); } catch (e) { setDraft(body); Alert.alert(isObjectionable(e) ? t('moderation.objectionable') : t('messages.sendFailed')); } finally { setSending(false); }
  };

  const menu = () => {
    if (!thread) return;
    Alert.alert(thread.other.handle ?? thread.other.name, undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('messages.viewProfile'), onPress: () => router.push(`/cook/${thread.other.id}`) },
      { text: t('messages.report'), onPress: () => setReportOpen(true) },
      { text: t('messages.block'), style: 'destructive', onPress: async () => { try { await blockUser(thread.other.id); router.back(); } catch { Alert.alert(t('settings.saveFailed')); } } },
    ]);
  };

  if (thread === undefined && failed) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, backgroundColor: color('bg/default') }]}>
        <TopBar title="" onBack={() => router.back()} backLabel={t('common.back')} />
        <LoadError onRetry={loadThread} />
      </View>
    );
  }
  if (thread === undefined) return <View style={[styles.center, { backgroundColor: color('bg/default') }]}><ActivityIndicator color={color('fg/muted')} /></View>;
  const name = thread?.other.handle ?? thread?.other.name ?? '';
  const lastMine = [...msgs].reverse().find((m) => m.mine);

  const day = (d: Date) => {
    const today = new Date();
    const y = new Date(today); y.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return t('community.today');
    if (d.toDateString() === y.toDateString()) return t('messages.yesterday');
    return d.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, { paddingTop: insets.top, backgroundColor: color('bg/default') }]}>
      <View>
        <TopBar title={thread?.other.name ?? ''} onBack={() => router.back()} backLabel={t('common.back')} />
        {thread ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t('home.more')} onPress={menu} hitSlop={space[8]} style={styles.more}>
            <Icon icon={MoreHorizontal} size={22} />
          </Pressable>
        ) : null}
      </View>
      <FlatList
        ref={list}
        data={msgs}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.body}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={<RequestNote started={msgs.length > 0} label={t('messages.requestNote')} />}
        renderItem={({ item, index }) => {
          const prev = msgs[index - 1];
          const showDay = !prev || prev.createdAt.toDateString() !== item.createdAt.toDateString();
          const time = item.createdAt.toLocaleTimeString(i18n.language, { hour: 'numeric', minute: '2-digit' });
          const seen = item.mine && item.id === lastMine?.id && item.seenAt;
          return (
            <View>
              {showDay ? (
                <View style={[styles.dayPill, { backgroundColor: color('bg/muted') }]}>
                  <Text variant="Caption" color="fg/secondary">{day(item.createdAt)}</Text>
                </View>
              ) : null}
              <View style={[styles.msg, item.mine ? styles.mine : styles.theirs]}>
                <Bubble m={item} />
                <Text variant="Caption" color="fg/muted">{seen ? `${time} · ${t('messages.seen')}` : time}</Text>
              </View>
            </View>
          );
        }}
      />
      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, space[10]), borderTopColor: color('border/default') }]}>
        <Avatar url={me?.avatarUrl ?? null} name={me?.displayName ?? ''} size={32} />
        <View style={[styles.field, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
          <TextInput maxFontSizeMultiplier={FONT_SCALE_MAX}
            value={draft}
            onChangeText={(v) => setDraft(v.slice(0, MAX))}
            placeholder={t('messages.placeholder', { name })}
            placeholderTextColor={color('fg/muted')}
            multiline
            style={[field, styles.input, { color: color('fg/default') }]}
          />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={t('dish.sendComment')} disabled={!draft.trim() || sending} onPress={send} hitSlop={space[8]}>
          <Icon icon={ArrowRight} size={22} color={draft.trim() ? 'fg/accent' : 'fg/muted'} />
        </Pressable>
      </View>
      {thread ? (
        <ReportSheet
          visible={reportOpen}
          ownerId={thread.other.id}
          ownerName={thread.other.handle ?? thread.other.name}
          title={t('report.messageTitle')}
          onClose={() => setReportOpen(false)}
          onBlocked={() => router.back()}
          onReport={(reason) => reportMessage(thread.other.id, [...msgs].reverse().find((m) => !m.mine)?.id ?? null, reason)}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}

/** Text bubble, or a dish card when the message carries `ongdalsaem://dish/<id>`. */
function Bubble({ m }: { m: Message }) {
  const { color } = useTheme();
  const match = m.body.match(DISH_LINK);
  const textPart = match ? m.body.replace(DISH_LINK, '').trim() : m.body;
  const lines = textPart.split('\n');
  const dishName = match ? lines.pop() ?? '' : '';
  const note = match ? lines.join('\n').trim() : textPart;
  const fg = m.mine ? 'fg/inverse' : 'fg/default';
  return (
    <View style={styles.bubbleCol}>
      {note ? (
        <View style={[styles.bubble, { backgroundColor: color(m.mine ? 'bg/inverse' : 'bg/subtle') }]}>
          <Text variant="Body/M" color={fg}>{note}</Text>
        </View>
      ) : null}
      {match ? <DishCard id={match[1]} fallback={dishName} /> : null}
    </View>
  );
}

function DishCard({ id, fallback }: { id: string; fallback: string }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState(fallback);
  useEffect(() => { fetchDish(id).then((d) => { if (d) { setPhoto(d.photo); setName(d.name); } }).catch(() => undefined); }, [id]);
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(`/dish/${id}`)} style={[styles.dish, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
      <View style={[styles.dishThumb, { backgroundColor: color('bg/muted') }]}>{photo ? <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}</View>
      <View style={{ flex: 1 }}>
        <Text variant="Body/S Strong" numberOfLines={1}>{name}</Text>
        <Text variant="Caption" color="fg/muted">{t('messages.openDish')}</Text>
      </View>
      <Icon icon={ChevronRight} size={18} color="fg/secondary" />
    </Pressable>
  );
}

/** Request note 1219:18051 — only before the chat starts. On the first message it slides up and fades out, then unmounts. */
function RequestNote({ started, label }: { started: boolean; label: string }) {
  const { color } = useTheme();
  const reduce = useReducedMotion();
  // Opened on a chat that already has messages → never shown.
  const [shown, setShown] = useState(!started);
  const p = useSharedValue(started ? 0 : 1);
  useEffect(() => {
    if (!started || !shown) return;
    if (reduce) { setShown(false); return; }
    p.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }, (done) => { if (done) scheduleOnRN(setShown, false); });
  }, [started, shown, reduce, p]);
  const anim = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ translateY: (p.value - 1) * 16 }] }));
  if (!shown) return null;
  return (
    <Animated.View style={[styles.note, { borderColor: color('border/strong') }, anim]}>
      <Text variant="Nav label" color="fg/muted" style={styles.noteText}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  more: { position: 'absolute', right: space[16], top: 15 },
  body: { paddingHorizontal: space[20], paddingTop: space[8], paddingBottom: space[16], gap: space[12] },
  dayPill: { alignSelf: 'center', paddingHorizontal: space[10], paddingVertical: space[2], borderRadius: radius.full, marginBottom: space[12] },
  msg: { gap: space[4], maxWidth: '78%' },
  mine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  theirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubbleCol: { gap: space[6] },
  bubble: { borderRadius: radius.xl, paddingHorizontal: space[14], paddingVertical: space[12] },
  // Request note 1219:18051 — pill 276 wide, 0.8 border/strong, padding 6 15
  note: { alignSelf: 'center', width: 276, marginTop: space[8], paddingVertical: space[6], paddingHorizontal: 15, borderWidth: 0.8, borderRadius: radius.full },
  noteText: { textAlign: 'center' },
  dish: { width: 240, flexDirection: 'row', alignItems: 'center', gap: space[10], padding: space[8], borderRadius: radius.lg, borderWidth: 1 },
  dishThumb: { width: 48, height: 48, borderRadius: radius.md, overflow: 'hidden' },
  composer: { flexDirection: 'row', alignItems: 'center', gap: space[10], paddingHorizontal: space[16], paddingTop: space[10], borderTopWidth: 1 },
  field: { flex: 1, minHeight: 48, borderRadius: radius.full, borderWidth: 1, paddingHorizontal: space[16], justifyContent: 'center' },
  input: { paddingVertical: space[12], maxHeight: 120 },
});
