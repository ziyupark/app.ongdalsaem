import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { timeAgo } from '../../lib/time';
import { space } from '../../theme';
import { Avatar } from '../community/Parts';
import { Icon } from '../Icon';
import { MoreHorizontal, X } from '../icons/ongdal';
import { Text } from '../Text';

type Props = {
  name: string;
  avatarUrl: string | null;
  createdAt: Date;
  body: string;
  onMore: () => void;
};

/**
 * Comment 132:4846 — Avatar 40 · 10 · [username (no @) Body/M Strong · 6 · time Caption fg/disabled] → 2 → body Body/Comment (14.8/18),
 * + `more-horizontal` 18 fg/muted on the right of the name row (mine → Edit · Delete, others → Report). Hold = same menu.
 * Used by 7.1 comments and 3.8 answers.
 */
export function CommentRow({ name, avatarUrl, createdAt, body, onMore }: Props) {
  const { t } = useTranslation();
  return (
    <Pressable onLongPress={onMore} delayLongPress={350} style={styles.comment}>
      <Avatar url={avatarUrl} name={name} size={40} />
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <View style={styles.nameTime}>
            <Text variant="Body/M Strong" numberOfLines={1} style={styles.shrink}>{name}</Text>
            <Text variant="Caption" color="fg/disabled">{timeAgo(createdAt, t)}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t('home.more')} onPress={onMore} hitSlop={space[12]}>
            <Icon icon={MoreHorizontal} size={18} color="fg/muted" />
          </Pressable>
        </View>
        <Text variant="Body/Comment">{body}</Text>
      </View>
    </Pressable>
  );
}

/** Above the Comment Composer while editing: "Editing comment" Caption fg/muted · `x` 16 (cancel). */
export function EditingBar({ label, onCancel }: { label: string; onCancel: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.editing}>
      <Text variant="Caption" color="fg/muted" style={styles.shrink}>{label}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.cancel')} onPress={onCancel} hitSlop={space[12]}>
        <Icon icon={X} size={16} color="fg/muted" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  comment: { flexDirection: 'row', alignItems: 'flex-start', gap: space[10] },
  body: { flex: 1, gap: space[2] },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: space[6] },
  nameTime: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space[6] },
  shrink: { flexShrink: 1 },
  editing: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[10], paddingHorizontal: space[20], paddingTop: space[10] },
});
