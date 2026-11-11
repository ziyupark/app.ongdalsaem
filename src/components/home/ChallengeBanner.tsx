import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { resetShareDraft, updateShareDraft } from '../../lib/shareDraft';
import { timeLeft, type Challenge } from '../../services/community';
import { radius, space, useTheme } from '../../theme';
import { FlagTag } from '../community/Parts';
import { Text } from '../Text';

/** 2.1c Home · In a challenge (484:11596) — flag · title · "2d 22h left · post your entry" · Post. */
export function ChallengeBanner({ c }: { c: Challenge }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const post = () => {
    resetShareDraft();
    updateShareDraft({ challenge: { id: c.id, tag: c.tag }, description: `#${c.tag} `, isPublic: true });
    router.push('/share/pick');
  };
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(`/challenge/${c.slug}`)} style={[styles.card, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
      {c.country ? <FlagTag code={c.country} /> : null}
      <View style={styles.flex}>
        <Text variant="Body/S Strong" numberOfLines={1}>{c.title}</Text>
        <Text variant="Caption" color="fg/accent" numberOfLines={1}>{t('challenge.bannerSub', { time: timeLeft(c.endsAt) })}</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={post} style={[styles.post, { backgroundColor: color('bg/inverse') }]}>
        <Text variant="Button/M" color="fg/inverse">{t('challenge.post')}</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { flexDirection: 'row', alignItems: 'center', gap: space[10], paddingLeft: space[8], paddingRight: space[8], paddingVertical: space[8], borderRadius: radius.lg, borderWidth: 1 },
  post: { height: 36, paddingHorizontal: space[16], borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
});
