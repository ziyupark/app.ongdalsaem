import { router, useLocalSearchParams } from 'expo-router';
import { X } from '../../src/components/icons/ongdal';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../src/components/Icon';
import { Text } from '../../src/components/Text';
import { mailSupport } from '../../src/lib/support';
import { radius, space, useTheme } from '../../src/theme';

/**
 * 9.8c Document sheet (Figma 499:10631) — Terms · Privacy · Location terms · Guidelines · Help center.
 * The documents are written by the team and hosted on the web before launch (docs/04-screens/09-settings.md 9.8c);
 * until they are published the sheet says so instead of showing placeholder legal text.
 */
const DOCS = ['help', 'guidelines', 'terms', 'privacy', 'location'];

export default function Document() {
  const { doc: asked } = useLocalSearchParams<{ doc?: string }>();
  // Deep-linkable: only the documents that exist, anything else shows the privacy policy.
  const doc = DOCS.includes(asked ?? '') ? asked! : 'privacy';
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: color('overlay/scrim') }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} style={StyleSheet.absoluteFill} onPress={() => router.back()} />
      <View style={[styles.sheet, { top: insets.top + 4, backgroundColor: color('bg/default') }]}>
        <View style={styles.grabWrap}><View style={[styles.grabber, { backgroundColor: color('bg/emphasis') }]} /></View>
        <View style={styles.head}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={() => router.back()} style={styles.side}>
            <Icon icon={X} size={22} />
          </Pressable>
          <Text variant="Title/M" numberOfLines={1}>{t(`documents.${doc}`)}</Text>
          <View style={styles.side} />
        </View>
        <View style={[styles.divider, { backgroundColor: color('border/default') }]} />
        <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + space[24] }]}>
          <Text variant="Title/S">{t('documents.pendingTitle')}</Text>
          <Text variant="Body/S" color="fg/secondary">{t('documents.pendingBody')}</Text>
          <Pressable accessibilityRole="link" onPress={() => mailSupport(t(`documents.${doc}`))}>
            <Text variant="Body/S Strong" color="fg/accent">{t('documents.ask')}</Text>
          </Pressable>
          <View style={[styles.lang, { backgroundColor: color('bg/subtle') }]}>
            <Text variant="Caption" color="fg/muted">{t('documents.koreanOfficial')}</Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, overflow: 'hidden' },
  grabWrap: { alignItems: 'center', paddingTop: space[10] },
  grabber: { width: 36, height: 5, borderRadius: radius.full },
  head: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space[12] },
  side: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1 },
  body: { paddingHorizontal: space[20], paddingTop: space[20], gap: space[12] },
  lang: { borderRadius: radius.md, padding: space[12], marginTop: space[8] },
});
