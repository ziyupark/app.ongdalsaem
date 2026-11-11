import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Camera, MapPin, X } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { Chip } from '../src/components/Chip';
import { Icon } from '../src/components/Icon';
import { Text } from '../src/components/Text';
import { TopBar } from '../src/components/TopBar';
import { useHere } from '../src/lib/useHere';
import { askQuestion, QUESTION_CATEGORIES, type QuestionCategory } from '../src/services/community';
import { radius, space, text, useTheme } from '../src/theme';

const MIN = 5;
const MAX = 200;
const { lineHeight: _lh, ...field } = text['Body/L'] ?? text['Body/M'];

/** 3.7 Ask the neighborhood (469:11315) · 3.7b Location off (502:12559). */
export default function Ask() {
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { here, allow } = useHere();
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<QuestionCategory>('where_to_eat');
  const [photo, setPhoto] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [asking, setAsking] = useState(false);
  const area = here.place?.district ?? here.place?.city ?? '';
  const ok = body.trim().length >= MIN && !!here.cell;

  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!r.canceled && r.assets[0]) setPhoto(r.assets[0].uri);
  };

  const post = async () => {
    if (!ok || sending || !here.cell) return;
    setSending(true);
    try {
      const id = await askQuestion({
        body, category, geohash: here.cell, imageUri: photo,
        neighborhood: here.place?.district ?? null, city: here.place?.city ?? null, country: here.place?.countryCode ?? null,
      });
      router.replace(`/question/${id}`);
    } catch {
      Alert.alert(t('ask.failed'));
    } finally {
      setSending(false);
    }
  };

  if (here.status === 'off') {
    return (
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + space[12], backgroundColor: color('bg/default') }]}>
        <TopBar title={t('ask.title')} onBack={() => router.back()} backLabel={t('common.back')} />
        {/* 3.7b — orb 72 bg/subtle, map-pin 30, Title/L, Body/S, from 96 below the bar. */}
        <View style={styles.off}>
          <View style={[styles.offOrb, { backgroundColor: color('bg/subtle') }]}><Icon icon={MapPin} size={30} color="fg/secondary" /></View>
          <Text variant="Title/L" style={styles.centerText}>{t('ask.locationTitle')}</Text>
          <Text variant="Body/S" color="fg/secondary" style={styles.centerText}>{t('ask.locationBody')}</Text>
        </View>
        <View style={styles.px}>
          <Button label={t('ask.turnOn')} size="L" loading={asking} onPress={async () => { setAsking(true); await allow(); setAsking(false); }} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, { paddingTop: insets.top, backgroundColor: color('bg/default') }]}>
      <TopBar title={t('ask.title')} onBack={() => router.back()} backLabel={t('common.back')} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={[styles.area, { backgroundColor: color('bg/subtle') }]}>
          <Icon icon={MapPin} size={16} />
          <Text variant="Caption Strong" color="fg/secondary">{t('ask.areaShows', { area: area || '—' })}</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/settings/privacy')} style={[styles.change, { backgroundColor: color('bg/default') }]}>
            <Text variant="Caption Strong" color="fg/accent">{t('ask.change')}</Text>
          </Pressable>
        </View>

        <View style={[styles.box, { backgroundColor: color('bg/subtle'), borderColor: color('border/focus') }]}>
          <TextInput
            value={body}
            onChangeText={(v) => setBody(v.slice(0, MAX))}
            placeholder={t('ask.placeholder')}
            placeholderTextColor={color('fg/muted')}
            multiline
            autoFocus
            maxLength={MAX}
            style={[field, styles.input, { color: color('fg/default') }]}
          />
          {photo ? (
            <View>
              <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" />
              <Pressable accessibilityRole="button" accessibilityLabel={t('common.clear')} onPress={() => setPhoto(null)} style={[styles.remove, { backgroundColor: color('overlay/scrim') }]}>
                <Icon icon={X} size={14} color="fg/on-photo" />
              </Pressable>
            </View>
          ) : null}
          <View style={styles.boxFoot}>
            <Pressable accessibilityRole="button" onPress={pick} style={[styles.photoBtn, { backgroundColor: color('bg/default'), borderColor: color('border/default') }]}>
              <Icon icon={Camera} size={16} />
              <Text variant="Caption Strong" color="fg/secondary">{t('ask.photo')}</Text>
            </Pressable>
            <Text variant="Caption" color="fg/muted">{`${body.length} / ${MAX}`}</Text>
          </View>
        </View>

        <View style={styles.cat}>
          <Text variant="Title/S">{t('ask.kind')}</Text>
          <View style={styles.wrap}>
            {QUESTION_CATEGORIES.map((c) => <Chip key={c} label={t(`ask.categories.${c}`)} selected={category === c} onPress={() => setCategory(c)} />)}
          </View>
        </View>

        <View style={[styles.note, { backgroundColor: color('bg/accent-subtle') }]}>
          <Text variant="Caption" color="fg/secondary">{t('ask.note')}</Text>
        </View>
      </ScrollView>
      <View style={[styles.px, { paddingBottom: insets.bottom + space[12], paddingTop: space[8] }]}>
        <Button label={t('ask.post')} size="L" disabled={!ok} loading={sending} onPress={post} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  px: { paddingHorizontal: space[20] },
  off: { flex: 1, alignItems: 'center', gap: space[12], paddingTop: 108, paddingHorizontal: space[40] },
  offOrb: { width: 72, height: 72, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  centerText: { textAlign: 'center' },
  body: { paddingHorizontal: space[20], paddingTop: space[12], gap: space[20], paddingBottom: space[20] },
  cat: { gap: space[10] },
  area: { flexDirection: 'row', alignItems: 'center', gap: space[6], alignSelf: 'flex-start', paddingLeft: space[10], paddingRight: space[6], paddingVertical: space[6], borderRadius: radius.full },
  change: { paddingHorizontal: space[8], paddingVertical: space[2], borderRadius: radius.full },
  box: { borderRadius: radius.lg, borderWidth: 1.5, paddingTop: space[16], paddingHorizontal: space[16], paddingBottom: space[12], gap: space[8], minHeight: 183 },
  input: { flex: 1, minHeight: 90, textAlignVertical: 'top', padding: 0 },
  photo: { height: 120, borderRadius: radius.md },
  remove: { position: 'absolute', top: space[6], right: space[6], width: 24, height: 24, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  boxFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  photoBtn: { flexDirection: 'row', alignItems: 'center', gap: space[6], paddingHorizontal: space[10], paddingVertical: space[6], borderRadius: radius.full, borderWidth: 1 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8] },
  note: { borderRadius: radius.md, paddingHorizontal: space[14], paddingVertical: space[12] },
});
