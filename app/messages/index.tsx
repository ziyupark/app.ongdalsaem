import { router, useFocusEffect } from 'expo-router';
import { MessageCircle } from '../../src/components/icons/ongdal';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, EmptyState, ListCard, ListRow } from '../../src/components/community/Parts';
import { Text } from '../../src/components/Text';
import { TopBar } from '../../src/components/TopBar';
import { timeAgo } from '../../src/lib/time';
import { DISH_LINK, fetchInbox, type Thread } from '../../src/services/messages';
import { radius, space, useTheme } from '../../src/theme';

/** Messages inbox — conversations, then requests (people you don't follow yet). */
export default function Inbox() {
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [list, setList] = useState<Thread[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setList(await fetchInbox()); } catch { setList((l) => l ?? []); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const preview = (th: Thread) => {
    if (!th.lastBody) return t('messages.noMessages');
    return DISH_LINK.test(th.lastBody) ? t('messages.sharedDish') : th.lastBody.replace(/\s+/g, ' ');
  };
  const chats = (list ?? []).filter((x) => !x.isRequest);
  const requests = (list ?? []).filter((x) => x.isRequest);

  const section = (title: string, items: Thread[]) => items.length ? (
    <View style={styles.group}>
      <Text variant="Overline" color="fg/muted">{title}</Text>
      <ListCard>
        {items.map((th, i) => (
          <ListRow
            key={th.id}
            last={i === items.length - 1}
            onPress={() => router.push(`/messages/${th.id}`)}
            leading={<Avatar url={th.other.avatarUrl} name={th.other.name} size={44} />}
            title={
              <View style={styles.titleRow}>
                <Text variant={th.unread ? 'Body/M Strong' : 'Body/M'} numberOfLines={1} style={styles.flex}>{th.other.handle ?? th.other.name}</Text>
                <Text variant="Caption" color="fg/muted">{timeAgo(th.lastAt, t)}</Text>
              </View>
            }
            sub={th.iAsked && !th.lastBody ? t('messages.waiting') : preview(th)}
            trailing={th.unread ? <View style={[styles.badge, { backgroundColor: color('fg/accent') }]}><Text variant="Caption Strong" color="fg/inverse">{String(th.unread)}</Text></View> : <View />}
          />
        ))}
      </ListCard>
    </View>
  ) : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: color('bg/default') }]}>
      <TopBar title={t('messages.title')} onBack={() => router.back()} backLabel={t('common.back')} />
      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + space[24] }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
      >
        {list == null ? <ActivityIndicator color={color('fg/muted')} style={styles.loading} /> : list.length ? (
          <>
            {section(t('messages.chats'), chats)}
            {section(t('messages.requests'), requests)}
            {requests.length ? <Text variant="Caption" color="fg/muted">{t('messages.requestsNote')}</Text> : null}
          </>
        ) : (
          <EmptyState icon={MessageCircle} title={t('messages.emptyTitle')} body={t('messages.emptyBody')} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  body: { paddingHorizontal: space[20], paddingTop: space[8], gap: space[20] },
  group: { gap: space[10] },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  badge: { minWidth: 20, height: 20, borderRadius: radius.full, paddingHorizontal: space[6], alignItems: 'center', justifyContent: 'center' },
  loading: { marginTop: space[40] },
});
