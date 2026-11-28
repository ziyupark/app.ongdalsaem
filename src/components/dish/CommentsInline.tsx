import { Image } from 'expo-image';
import { ArrowRight } from '../icons/ongdal';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { addComment, deleteComment, fetchComments, updateComment, type Comment } from '../../services/foods';
import { isObjectionable, reportComment } from '../../services/moderation';
import { radius, space, text, useTheme, FONT_SCALE_MAX } from '../../theme';
import { Icon } from '../Icon';
import { Text } from '../Text';
import { CommentRow, EditingBar } from './CommentRow';
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

/**
 * 7.1 Comments (Figma 601:12935, below the action bar): "Comments · n" · list · Comment Composer.
 * Each comment's `more-horizontal` (or hold): mine → Edit (text goes back into the composer) · Delete; others → Report
 * (+ Delete on my own dish).
 */
export function CommentsInline({ foodId, allowComments, me, dishOwnerId, onCountChange }: Props) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const [items, setItems] = useState<Comment[] | null>(null);
  const [all, setAll] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [reporting, setReporting] = useState<Comment | null>(null);
  const [editing, setEditing] = useState<Comment | null>(null);
  const input = useRef<React.ComponentRef<typeof TextInput>>(null);

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
      if (editing) {
        await updateComment(editing.id, body);
        setItems((p) => (p ?? []).map((x) => (x.id === editing.id ? { ...x, body } : x)));
        setEditing(null);
        setDraft('');
        return;
      }
      const c = await addComment(foodId, body);
      setDraft('');
      update([c, ...(items ?? [])]);
    } catch (e) {
      Alert.alert(isObjectionable(e) ? t('moderation.objectionable') : t('dish.commentsError'));
    } finally {
      setSending(false);
    }
  };

  const startEdit = (c: Comment) => {
    setEditing(c);
    setDraft(c.body);
    setTimeout(() => input.current?.focus(), 0);
  };
  const cancelEdit = () => { setEditing(null); setDraft(''); };

  const remove = (c: Comment) => {
    Alert.alert(t('dish.deleteCommentTitle'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('dish.delete'), style: 'destructive', onPress: async () => {
        try {
          await deleteComment(c.id);
          if (editing?.id === c.id) cancelEdit();
          update((items ?? []).filter((x) => x.id !== c.id));
        } catch { Alert.alert(t('settings.saveFailed')); }
      } },
    ]);
  };

  const onMore = (c: Comment) => {
    const mine = !!me && c.author.id === me.id;
    const opts: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [{ text: t('common.cancel'), style: 'cancel' }];
    if (mine) {
      opts.push({ text: t('post.edit'), onPress: () => startEdit(c) });
      opts.push({ text: t('dish.delete'), style: 'destructive', onPress: () => remove(c) });
    } else {
      opts.push({ text: t('report.send'), style: 'destructive', onPress: () => setReporting(c) });
      if (me && dishOwnerId === me.id) opts.push({ text: t('dish.delete'), style: 'destructive', onPress: () => remove(c) });
    }
    Alert.alert(c.author.handle ?? c.author.name, undefined, opts);
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
          <CommentRow key={c.id} name={c.author.handle ?? c.author.name} avatarUrl={c.author.avatarUrl} createdAt={c.createdAt} body={c.body} onMore={() => onMore(c)} />
        ))}
        {!all && list.length > PREVIEW ? (
          <Pressable accessibilityRole="button" onPress={() => setAll(true)}>
            <Text variant="Body/S Strong" color="fg/muted">{t('dish.seeAllComments', { n: list.length })}</Text>
          </Pressable>
        ) : null}
      </View>
      {allowComments || editing ? (
        <View style={{ backgroundColor: color('bg/default') }}>
        {editing ? <EditingBar label={t('dish.editingComment')} onCancel={cancelEdit} /> : null}
        <View style={[styles.composer, { backgroundColor: color('bg/default') }]}>
          <Avatar url={me?.avatarUrl ?? null} name={me?.name ?? ''} />
          <View style={[styles.field, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
            <TextInput maxFontSizeMultiplier={FONT_SCALE_MAX}
              ref={input}
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
  avatar: { width: 40, height: 40, borderRadius: radius.full, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  composer: { flexDirection: 'row', alignItems: 'center', gap: space[10], paddingHorizontal: space[20], paddingTop: space[10], paddingBottom: space[20] },
  field: { flex: 1, height: 42, borderRadius: radius.full, borderWidth: 1, paddingHorizontal: space[20], justifyContent: 'center' }, // Comment Composer Field 287:327
  input: { padding: 0 },
  off: { paddingHorizontal: space[20], paddingBottom: space[20] },
});
