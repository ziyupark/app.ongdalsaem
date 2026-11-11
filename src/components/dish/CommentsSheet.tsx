import { Image } from 'expo-image';
import { ArrowRight } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { timeAgo } from '../../lib/time';
import { addComment, deleteComment, fetchComments, type Comment } from '../../services/foods';
import { reportComment } from '../../services/moderation';
import { radius, space, text, useTheme } from '../../theme';
import { Icon } from '../Icon';
import { Text } from '../Text';

const MAX_COMMENT = 300;
const SHEET_TOP = 240;

type Props = {
  foodId: string;
  visible: boolean;
  allowComments: boolean;
  me: { id: string; name: string; avatarUrl: string | null } | null;
  /** The dish's cook may remove any comment on it. */
  dishOwnerId: string;
  onClose: () => void;
  /** New total after a comment is posted. */
  onCountChange?: (n: number) => void;
};

/** 7.2 Comments sheet (Figma 26:537): Dim scrim · sheet from y 240, radius 28, grabber, "Comments · n", list · Comment Composer at the bottom. */
export function CommentsSheet({ foodId, visible, allowComments, me, dishOwnerId, onClose, onCountChange }: Props) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [items, setItems] = useState<Comment[] | null>(null);
  const [error, setError] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const list = await fetchComments(foodId);
      setItems(list);
      onCountChange?.(list.length);
    } catch {
      setError(true);
    }
  }, [foodId, onCountChange]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const c = await addComment(foodId, body);
      setDraft('');
      setItems((prev) => {
        const next = [c, ...(prev ?? [])];
        onCountChange?.(next.length);
        return next;
      });
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  };

  /** Long-press: delete (mine, or I cooked this dish) · report (someone else's). */
  const onLong = (c: Comment) => {
    const canDelete = !!me && (c.author.id === me.id || dishOwnerId === me.id);
    if (canDelete) {
      Alert.alert(t('dish.deleteCommentTitle'), undefined, [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('dish.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteComment(c.id);
              setItems((prev) => {
                const next = (prev ?? []).filter((x) => x.id !== c.id);
                onCountChange?.(next.length);
                return next;
              });
            } catch {
              setError(true);
            }
          },
        },
      ]);
    } else {
      Alert.alert(t('dish.reportCommentTitle'), undefined, [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('report.send'), style: 'destructive', onPress: () => reportComment(c.id, foodId, c.author.id, 'harassment').then(() => Alert.alert(t('report.thanksTitle'))).catch(() => Alert.alert(t('report.failed'))) },
      ]);
    }
  };

  const canSend = draft.trim().length > 0 && !sending;
  const { lineHeight: _lh, ...fieldText } = text['Body/M'];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {visible ? (
        <>
          <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={[StyleSheet.absoluteFill, { backgroundColor: color('overlay/scrim') }]}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} style={StyleSheet.absoluteFill} onPress={onClose} />
          </Animated.View>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav} pointerEvents="box-none">
            <Animated.View
              entering={SlideInDown.duration(260)}
              exiting={SlideOutDown.duration(200)}
              style={[styles.sheet, { height: height - SHEET_TOP, backgroundColor: color('bg/default') }]}
            >
              <View style={styles.inner}>
                <View style={styles.grabWrap}>
                  <View style={[styles.grabber, { backgroundColor: color('bg/emphasis') }]} />
                </View>
                <Text variant="Title/M">{t('dish.commentsTitle', { n: items?.length ?? 0 })}</Text>
                {items == null && !error ? (
                  <ActivityIndicator color={color('fg/muted')} style={styles.loading} />
                ) : error && !items ? (
                  <Pressable onPress={load} style={styles.empty}>
                    <Text variant="Body/S" color="fg/muted">{t('dish.commentsError')}</Text>
                  </Pressable>
                ) : (
                  <FlatList
                    data={items ?? []}
                    keyExtractor={(c) => c.id}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text variant="Body/S" color="fg/muted">{t('dish.noComments')}</Text>}
                    renderItem={({ item }) => (
                      <Pressable onLongPress={() => onLong(item)} delayLongPress={350} style={styles.comment}>
                        <Avatar url={item.author.avatarUrl} name={item.author.name} />
                        <View style={styles.body}>
                          <View style={styles.nameRow}>
                            <Text variant="Body/S Strong">{item.author.name}</Text>
                            <Text variant="Caption" color="fg/disabled">{timeAgo(item.createdAt, t)}</Text>
                          </View>
                          <Text variant="Body/S" color="fg/secondary">{item.body}</Text>
                        </View>
                      </Pressable>
                    )}
                  />
                )}
              </View>
              {allowComments ? (
                <View style={[styles.composer, { borderTopColor: color('border/default'), paddingBottom: Math.max(insets.bottom, space[10]) + space[6] }]}>
                  <Avatar url={me?.avatarUrl ?? null} name={me?.name ?? ''} />
                  <View style={[styles.field, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
                    <TextInput
                      value={draft}
                      onChangeText={setDraft}
                      maxLength={MAX_COMMENT}
                      placeholder={t('dish.commentPlaceholder')}
                      placeholderTextColor={color('fg/muted')}
                      selectionColor={color('border/focus')}
                      returnKeyType="send"
                      onSubmitEditing={send}
                      style={[fieldText, styles.input, { color: color('fg/default') }]}
                    />
                  </View>
                  <Pressable accessibilityRole="button" accessibilityLabel={t('dish.sendComment')} accessibilityState={{ disabled: !canSend }} disabled={!canSend} onPress={send} hitSlop={space[8]}>
                    <Icon icon={ArrowRight} size={22} color={canSend ? 'fg/accent' : 'fg/disabled'} />
                  </Pressable>
                </View>
              ) : (
                <View style={[styles.off, { borderTopColor: color('border/default'), paddingBottom: Math.max(insets.bottom, space[10]) + space[6] }]}>
                  <Text variant="Body/S" color="fg/muted">{t('dish.commentsOff')}</Text>
                </View>
              )}
            </Animated.View>
          </KeyboardAvoidingView>
        </>
      ) : null}
    </Modal>
  );
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  const { color } = useTheme();
  return (
    <View style={[styles.avatar, { backgroundColor: color('bg/accent-subtle') }]}>
      {url ? <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="cover" /> : (
        <Text variant="Caption Strong" color="fg/accent">{name.slice(0, 1).toUpperCase()}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  inner: { flex: 1, gap: space[16], paddingHorizontal: space[20], paddingTop: space[12] },
  grabWrap: { alignItems: 'center' },
  grabber: { width: 40, height: 5, borderRadius: 3 },
  loading: { marginTop: space[24] },
  empty: { paddingVertical: space[8] },
  list: { gap: space[16], paddingBottom: space[16] },
  comment: { flexDirection: 'row', alignItems: 'flex-start', gap: space[10] },
  body: { flex: 1, gap: space[2] },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space[6] },
  avatar: { width: 32, height: 32, borderRadius: radius.full, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  composer: { flexDirection: 'row', alignItems: 'center', gap: space[10], paddingTop: space[10], paddingHorizontal: space[16], borderTopWidth: 1 },
  field: { flex: 1, height: 48, borderRadius: radius.full, borderWidth: 1, paddingHorizontal: space[16], justifyContent: 'center' },
  input: { padding: 0 },
  off: { alignItems: 'center', paddingTop: space[14], borderTopWidth: 1 },
});
