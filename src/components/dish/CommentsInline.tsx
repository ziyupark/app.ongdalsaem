import { Image } from 'expo-image';
import { ArrowRight } from '../icons/ongdal';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { timeAgo } from '../../lib/time';
import { addComment, deleteComment, fetchComments, type Comment } from '../../services/foods';
import { reportComment } from '../../services/moderation';
import { radius, space, text, useTheme, FONT_SCALE_MAX } from '../../theme';
import { Icon } from '../Icon';
import { Text } from '../Text';
import { ReportSheet } from './ReportSheet';

const MAX_COMMENT = 300;
const PREVIEW = 5;
const { lineHeight: _lh, ...fieldText } = text['Body/M'];

type Props = {
  foodId: string;
  allowComments: boolean;
  me: { id: string; name: string; avatarUrl: string | null } | null;
  dishOwnerId: string;
  onCountChange?: (n: number) => void;
};

/** 7.1 Comments (Figma 601:12935, below the action bar): "Comments · n" · list · Comment Composer. Hold a comment to delete / report. */
export function CommentsInline({ foodId, allowComments, me, dishOwnerId, onCountChange }: Props) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const [items, setItems] = useState<Comment[] | null>(null);
  const [all, setAll] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [reporting, setReporting] = useState<Comment | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await fetchComments(foodId);
      setItems(list);
      onCountChange?.(list.length);
    } catch {
      setItems((p) => p ?? []);
    }
  }, [foodId, onCountChange]);
  useEffect(() => { load(); }, [load]);

  const update = (next: Comment[]) => { setItems(next); onCountChange?.(next.length); };

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const c = await addComment(foodId, body);
      setDraft('');
      update([c, ...(items ?? [])]);
    } catch {
      Alert.alert(t('dish.commentsError'));
    } finally {
      setSending(false);
    }
  };

  const onLong = (c: Comment) => {
    const canDelete = !!me && (c.author.id === me.id || dishOwnerId === me.id);
    if (canDelete) {
      Alert.alert(t('dish.deleteCommentTitle'), undefined, [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('dish.delete'), style: 'destructive', onPress: async () => { try { await deleteComment(c.id); update((items ?? []).filter((x) => x.id !== c.id)); } catch { Alert.alert(t('settings.saveFailed')); } } },
      ]);
    } else {
      setReporting(c);
    }
  };

  const list = items ?? [];
  const shown = all ? list : list.slice(0, PREVIEW);
  const canSend = draft.trim().length > 0 && !sending;

  return (
    <View>
      <View style={[styles.sheet, { backgroundColor: color('bg/default') }]}>
        <Text variant="Title/M">{t('dish.commentsTitle', { n: list.length })}</Text>
        {items != null && list.length === 0 ? <Text variant="Body/S" color="fg/muted">{t('dish.noComments')}</Text> : null}
        {shown.map((c) => (
          <Pressable key={c.id} onLongPress={() => onLong(c)} delayLongPress={350} style={styles.comment}>
            <Avatar url={c.author.avatarUrl} name={c.author.name} />
            <View style={styles.body}>
              <View style={styles.nameRow}>
                <Text variant="Body/S Strong">{c.author.name}</Text>
                <Text variant="Caption" color="fg/disabled">{timeAgo(c.createdAt, t)}</Text>
              </View>
              <Text variant="Body/S" color="fg/secondary">{c.body}</Text>
            </View>
          </Pressable>
        ))}
        {!all && list.length > PREVIEW ? (
          <Pressable accessibilityRole="button" onPress={() => setAll(true)}>
            <Text variant="Body/S Strong" color="fg/muted">{t('dish.seeAllComments', { n: list.length })}</Text>
          </Pressable>
        ) : null}
      </View>
      {allowComments ? (
        <View style={[styles.composer, { backgroundColor: color('bg/default') }]}>
          <Avatar url={me?.avatarUrl ?? null} name={me?.name ?? ''} />
          <View style={[styles.field, { backgroundColor: color('bg/subtle') }]}>
            <TextInput maxFontSizeMultiplier={FONT_SCALE_MAX}
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
          <Pressable accessibilityRole="button" accessibilityLabel={t('dish.sendComment')} disabled={!canSend} onPress={send} hitSlop={space[8]}>
            <Icon icon={ArrowRight} size={22} color={canSend ? 'fg/accent' : 'fg/disabled'} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.off}><Text variant="Body/S" color="fg/muted">{t('dish.commentsOff')}</Text></View>
      )}
      <ReportSheet
        visible={!!reporting}
        title={t('dish.reportCommentTitle')}
        ownerId={reporting?.author.id ?? ''}
        ownerName={reporting?.author.name ?? ''}
        onReport={(reason) => reportComment(reporting!.id, foodId, reporting!.author.id, reason)}
        onClose={() => setReporting(null)}
        onBlocked={() => { setReporting(null); load(); }}
      />
    </View>
  );
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  const { color } = useTheme();
  return (
    <View style={[styles.avatar, { backgroundColor: color('bg/accent-subtle') }]}>
      {url ? <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Text variant="Caption Strong" color="fg/accent">{name.slice(0, 1).toUpperCase()}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { gap: space[16], paddingTop: space[12], paddingHorizontal: space[20], paddingBottom: 18 },
  comment: { flexDirection: 'row', alignItems: 'flex-start', gap: space[10] },
  body: { flex: 1, gap: space[2] },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space[6] },
  avatar: { width: 32, height: 32, borderRadius: radius.full, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  composer: { flexDirection: 'row', alignItems: 'center', gap: space[10], paddingHorizontal: space[16], paddingTop: space[10], paddingBottom: space[20] },
  field: { flex: 1, height: 48, borderRadius: radius.full, paddingHorizontal: space[16], justifyContent: 'center' },
  input: { padding: 0 },
  off: { paddingHorizontal: space[20], paddingBottom: space[20] },
});
