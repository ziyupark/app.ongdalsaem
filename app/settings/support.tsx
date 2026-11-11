import * as Application from 'expo-application';
import { router } from 'expo-router';
import { AlertCircle, Mail } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Chip } from '../../src/components/Chip';
import { Icon } from '../../src/components/Icon';
import { SettingsScreen } from '../../src/components/settings/Settings';
import { Text } from '../../src/components/Text';
import { NATIVE_NAMES, type AppLanguage } from '../../src/i18n';
import { mailSupport, SUPPORT_EMAIL } from '../../src/lib/support';
import { fetchAccount, sendSupportTicket } from '../../src/services/settings';
import { radius, space, text, useTheme } from '../../src/theme';

const TOPICS = ['bug', 'account', 'report_content', 'other'] as const;
const MAX = 1000;
const MIN = 5;
const { lineHeight: _lh, ...areaText } = text['Body/M'];

/** 9.8a Contact support (Figma 497:10459) → support_tickets. */
export default function Support() {
  const { color } = useTheme();
  const { t, i18n } = useTranslation();
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>('bug');
  const [msg, setMsg] = useState('');
  const [email, setEmail] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  useEffect(() => { fetchAccount().then((a) => setEmail(a.email)).catch(() => undefined); }, []);

  const version = `${Application.nativeApplicationVersion ?? '1.0.0'} (${Application.nativeBuildVersion ?? '0'})`;
  const os = `${Platform.OS === 'ios' ? 'iOS' : 'Android'} ${Platform.Version}`;
  const ok = msg.trim().length >= MIN;

  const send = async () => {
    if (!ok || sending) return;
    setSending(true);
    try {
      await sendSupportTicket({ topic, message: msg, replyEmail: email ?? undefined, language: i18n.language });
      Alert.alert(t('support.thanks'));
      router.back();
    } catch {
      Alert.alert(t('support.failed'), undefined, [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('support.email', { email: SUPPORT_EMAIL }), onPress: () => mailSupport(`ongdalsaem ${version} · ${os}`) },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <SettingsScreen title={t('settings.contact')} footer={<Button label={t('support.send')} disabled={!ok} loading={sending} onPress={send} />}>
      <View style={styles.group}>
        <Text variant="Title/S">{t('support.about')}</Text>
        <View style={styles.chips}>
          {TOPICS.map((k) => <Chip key={k} label={t(`support.topics.${k}`)} selected={topic === k} onPress={() => setTopic(k)} />)}
        </View>
      </View>
      <View style={styles.group}>
        <View style={[styles.area, { backgroundColor: color('bg/default'), borderColor: color('border/focus') }]}>
          <TextInput
            accessibilityLabel={t('support.message')}
            value={msg}
            onChangeText={setMsg}
            maxLength={MAX}
            multiline
            placeholder={t('support.placeholder')}
            placeholderTextColor={color('fg/muted')}
            selectionColor={color('border/focus')}
            style={[areaText, styles.input, { color: color('fg/default') }]}
          />
        </View>
        <Text variant="Caption" color="fg/muted" style={styles.right}>{`${msg.length} / ${MAX}`}</Text>
      </View>
      <View style={[styles.note, { backgroundColor: color('bg/accent-subtle') }]}>
        <Icon icon={AlertCircle} size={18} color="fg/accent" />
        <Text variant="Body/S" color="fg/secondary" style={styles.flex}>
          {t('support.attach', { version, os, lang: NATIVE_NAMES[i18n.language as AppLanguage] ?? 'English' })}{email ? ` ${t('support.replyTo', { email })}` : ''}
        </Text>
      </View>
      <Pressable accessibilityRole="link" onPress={() => mailSupport(`ongdalsaem ${version} · ${os}`)} style={styles.mail}>
        <Icon icon={Mail} size={16} color="fg/accent" />
        <Text variant="Body/S Strong" color="fg/accent">{t('support.email', { email: SUPPORT_EMAIL })}</Text>
      </Pressable>
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  group: { gap: space[10] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8] },
  area: { height: 180, borderRadius: radius.lg, borderWidth: 1.5, paddingHorizontal: space[16], paddingVertical: space[14] },
  input: { flex: 1, padding: 0, textAlignVertical: 'top' },
  right: { textAlign: 'right' },
  note: { flexDirection: 'row', gap: space[10], padding: space[14], borderRadius: radius.md },
  flex: { flex: 1 },
  mail: { flexDirection: 'row', alignItems: 'center', gap: space[6] },
});
