import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { Bell } from '../src/components/icons/ongdal';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AcornIcon } from '../src/components/AcornIcon';
import { Button } from '../src/components/Button';
import { Chip } from '../src/components/Chip';
import { Icon } from '../src/components/Icon';
import { Text } from '../src/components/Text';
import { TopBar } from '../src/components/TopBar';
import { timeAgo } from '../src/lib/time';
import { fetchActivity, follow, lastSeen, markSeen, type Activity } from '../src/services/activity';
import { radius, space, useTheme } from '../src/theme';

type Filter = 'all' | 'activity' | 'forYou';

/** 2.8 Notifications (Figma 356:8637) + 2.8b empty (356:8998). Sections NEW / TODAY / THIS WEEK / EARLIER. */
export default function Notifications() {
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Activity[] | null>(null);
  const [seen, setSeen] = useState<Date>(new Date(0));
  const [filter, setFilter] = useState<Filter>('all');

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [list, s] = await Promise.all([fetchActivity().catch(() => []), lastSeen()]);
        if (!alive) return;
        setSeen(s);
        setItems(list);
        markSeen();
      })();
      return () => { alive = false; };
    }, []),
  );

  // "For you" = weather picks / reminders — not generated yet, so it is the empty state.
  const shown = (items ?? []).filter(() => filter !== 'forYou');
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const sections: { key: string; rows: Activity[] }[] = [
    { key: 'new', rows: shown.filter((a) => a.at > seen) },
    { key: 'today', rows: shown.filter((a) => a.at <= seen && a.at >= startOfDay) },
    { key: 'week', rows: shown.filter((a) => a.at <= seen && a.at < startOfDay && a.at >= weekAgo) },
    { key: 'earlier', rows: shown.filter((a) => a.at <= seen && a.at < weekAgo) },
  ].filter((s) => s.rows.length);

  const toggleFollow = async (a: Extract<Activity, { kind: 'follow' }>) => {
    setItems((prev) => (prev ?? []).map((x) => (x.id === a.id ? { ...a, followingBack: !a.followingBack } : x)));
    try { await follow(a.who.id, !a.followingBack); } catch { setItems((prev) => (prev ?? []).map((x) => (x.id === a.id ? a : x))); }
  };

  const text = (a: Activity) =>
    a.kind === 'acorns'
      ? a.others > 0 ? t('notifications.acornsMany', { name: a.who.name, count: a.others, dish: a.foodName }) : t('notifications.acornsOne', { name: a.who.name, dish: a.foodName })
      : a.kind === 'comment' ? t('notifications.comment', { name: a.who.name, body: a.body }) : t('notifications.follow', { name: a.who.name });

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: color('bg/subtle') }]}>
      <TopBar title={t('notifications.title')} onBack={() => router.back()} backLabel={t('common.back')} />
      {items == null ? (
        <ActivityIndicator color={color('fg/muted')} style={styles.loading} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingTop: space[12], paddingBottom: insets.bottom + space[24], gap: space[8] }}>
          <View style={styles.filters}>
            {(['all', 'activity', 'forYou'] as Filter[]).map((f) => <Chip key={f} label={t(`notifications.filters.${f}`)} selected={filter === f} onPress={() => setFilter(f)} />)}
          </View>
          {sections.length === 0 ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: color('bg/muted') }]}><Icon icon={Bell} size={30} /></View>
              <Text variant="Title/L" style={styles.center}>{t('notifications.emptyTitle')}</Text>
              <Text variant="Body/S" color="fg/secondary" style={styles.center}>{t('notifications.emptyBody')}</Text>
              <Button label={t('notifications.settings')} variant="Outline" size="M" onPress={() => Linking.openSettings()} />
            </View>
          ) : (
            sections.map((s) => (
              <View key={s.key} style={styles.section}>
                <View style={styles.head}><Text variant="Overline" color="fg/muted">{t(`notifications.sections.${s.key}`)}</Text></View>
                {s.rows.map((a) => {
                  const isNew = a.at > seen;
                  return (
                    <Pressable
                      key={a.id}
                      accessibilityRole="button"
                      onPress={() => (a.kind === 'follow' ? router.push(`/cook/${a.who.id}`) : router.push(a.kind === 'comment' ? `/dish/${a.foodId}?comments=1` : `/dish/${a.foodId}`))}
                      style={[styles.row, isNew && { backgroundColor: color('bg/accent-subtle') }]}
                    >
                      <View style={styles.lead}>
                        <View style={[styles.avatar, { backgroundColor: color('bg/accent-subtle') }]}>
                          {a.who.avatarUrl ? <Image source={{ uri: a.who.avatarUrl }} style={StyleSheet.absoluteFill} contentFit="cover" /> : (
                            <Text variant="Caption Strong" color="fg/accent">{a.who.name.slice(0, 1).toUpperCase()}</Text>
                          )}
                        </View>
                        {a.kind === 'acorns' ? (
                          <View style={[styles.badge, { backgroundColor: color('bg/subtle') }]}><AcornIcon size={16} filled /></View>
                        ) : null}
                      </View>
                      <View style={styles.body}>
                        <Text variant="Body/S" numberOfLines={3}>{text(a)}</Text>
                        <View style={styles.meta}>
                          {isNew ? <View style={[styles.dot, { backgroundColor: color('fg/accent') }]} /> : null}
                          <Text variant="Caption" color="fg/muted">{timeAgo(a.at, t)}</Text>
                        </View>
                      </View>
                      {a.kind === 'follow' ? (
                        <Button label={t(a.followingBack ? 'notifications.following' : 'notifications.followBack')} size="S" variant={a.followingBack ? 'Outline' : 'Primary'} onPress={() => toggleFollow(a)} />
                      ) : (
                        <Image source={{ uri: a.photo }} style={styles.thumb} contentFit="cover" />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))
          )}
          {sections.length ? <View style={styles.foot}><Text variant="Caption" color="fg/muted">{t('notifications.foot')}</Text></View> : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { marginTop: space[40] },
  filters: { flexDirection: 'row', gap: space[8], paddingHorizontal: space[20] },
  section: { gap: space[0] },
  head: { paddingTop: space[8], paddingHorizontal: space[20], paddingBottom: space[8] },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[12], paddingHorizontal: space[20], paddingVertical: space[12] },
  lead: { width: 44, height: 44 },
  avatar: { width: 40, height: 40, borderRadius: radius.full, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', left: 24, top: 24, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: space[4] },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space[6] },
  dot: { width: 6, height: 6, borderRadius: radius.full },
  thumb: { width: 44, height: 44, borderRadius: 10 },
  empty: { alignItems: 'center', gap: space[12], paddingTop: 120, paddingHorizontal: space[40], paddingBottom: space[40] },
  emptyIcon: { width: 72, height: 72, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  foot: { paddingTop: space[8], paddingHorizontal: space[20] },
});
