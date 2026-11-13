import { Image } from 'expo-image';
import { router } from 'expo-router';
import { AlertCircle, ChefHat, ChevronRight, Globe, List, Map as MapIcon, MapPin, Plus, type LucideIcon } from 'lucide-react-native';
import { MessageCircle } from '../../src/components/icons/custom';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Chip } from '../../src/components/Chip';
import { Icon } from '../../src/components/Icon';
import { Input } from '../../src/components/Input';
import { AddMoodDialog } from '../../src/components/share/AddMoodDialog';
import { PhotoOptionsSheet } from '../../src/components/share/PhotoOptionsSheet';
import * as ImagePicker from 'expo-image-picker';
import { FieldHead, FlowTopBar } from '../../src/components/share/FlowTopBar';
import { Text } from '../../src/components/Text';
import { Toggle } from '../../src/components/Toggle';
import { getShareDraft, loadCustomMoods, resetShareDraft, saveCustomMoods, updateShareDraft, useShareDraft } from '../../src/lib/shareDraft';
import { CUSTOM_MOOD_ICON, LANDSCAPES, MEAL_TAGS, MOOD_TAGS, mealTagFor } from '../../src/lib/tags';
import { photoMoment } from '../../src/lib/time';
import { displayTemp } from '../../src/lib/prefs';
import { hasLocationPermission, reverseGeocodeCity, type Coordinates } from '../../src/services/location';
import { fetchCurrentWeather } from '../../src/services/weather';
import { elevation, radius, space, text, useTheme, WEATHER_ICON } from '../../src/theme';
import * as Location from 'expo-location';

const MAX_DESCRIPTION = 150;
const MAX_NAME = 60;

/** Where the dish was: the cover's photo location, else the phone's location (only if already allowed). */
async function detectContext() {
  const d = getShareDraft();
  updateShareDraft({ contextState: 'loading' });
  let coords: Coordinates | undefined = d.photos.find((p) => p.location)?.location;
  let from: 'photo' | 'device' = 'photo';
  if (!coords && (await hasLocationPermission())) {
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      from = 'device';
    } catch {
      coords = undefined;
    }
  }
  if (!coords) return updateShareDraft({ contextState: 'none', context: null });
  const [weather, place] = await Promise.all([fetchCurrentWeather(coords), reverseGeocodeCity(coords)]);
  if (!weather) return updateShareDraft({ contextState: 'none', context: null });
  const takenAt = d.photos[0]?.takenAt ?? new Date();
  updateShareDraft((cur) => ({
    contextState: 'ready',
    context: { mood: weather.mood, tempC: weather.tempC, place: place ?? { city: weather.city, countryCode: weather.countryCode }, takenAt, from, coords },
    meals: cur.meals.length ? cur.meals : [mealTagFor(takenAt)],
  }));
}

/** 8.2 Details (Figma 23:1540): Auto context · Type · Dish name · special · Meal · Mood (+ own) · Recipe · Sharing → 8.3 Preview. */
export default function ShareDetails() {
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const d = useShareDraft();
  const [customs, setCustoms] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [photoSheet, setPhotoSheet] = useState(false);

  useEffect(() => {
    if (d.photos.length === 0) router.back();
    else if (d.contextState === 'idle') detectContext();
    else if (d.meals.length === 0) updateShareDraft({ meals: [mealTagFor(d.photos[0]?.takenAt ?? new Date())] });
    // Run once on entry; later changes come from the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadCustomMoods().then((list) => setCustoms((prev) => Array.from(new Set([...list, ...prev]))));
  }, []);

  const toggleIn = (list: string[], key: string, max = Infinity) =>
    list.includes(key) ? list.filter((k) => k !== key) : list.length >= max ? list : [...list, key];

  const addCustom = useCallback((label: string) => {
    setAdding(false);
    setCustoms((prev) => {
      const next = prev.includes(label) ? prev : [...prev, label];
      saveCustomMoods(next);
      return next;
    });
    updateShareDraft((cur) => ({ moods: cur.moods.includes(label) ? cur.moods : [...cur.moods, label] }));
  }, []);

  const removeCustom = (label: string) => {
    Alert.alert(t('share.deleteMoodTitle', { label }), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('share.deleteMood'),
        style: 'destructive',
        onPress: () => {
          setCustoms((prev) => {
            const next = prev.filter((c) => c !== label);
            saveCustomMoods(next);
            return next;
          });
          updateShareDraft((cur) => ({ moods: cur.moods.filter((m) => m !== label) }));
        },
      },
    ]);
  };

  const close = () => {
    Alert.alert(t('share.discardTitle'), undefined, [
      { text: t('share.keepEditing'), style: 'cancel' },
      {
        text: t('share.discard'),
        style: 'destructive',
        onPress: () => {
          // Edit mode: back to the post, unchanged.
          const editId = getShareDraft().editId;
          resetShareDraft();
          if (editId) router.dismissTo(`/dish/${editId}`);
          else router.dismissAll();
        },
      },
    ]);
  };

  const ready = d.name.trim().length > 0 && d.meals.length > 0 && d.moods.length > 0 && d.contextState !== 'loading';
  const { lineHeight: _lh, ...areaText } = text['Body/M'];

  // ---- Auto context card text
  const ctx = d.context;
  let ctxTitle: string;
  let ctxSub: string;
  let ctxIcon: LucideIcon = MapPin;
  if (d.contextState === 'loading' || d.contextState === 'idle') {
    ctxTitle = t('share.contextLoading');
    ctxSub = t('share.contextLoadingSub');
  } else if (ctx) {
    const where = [ctx.place?.district, ctx.place?.city].filter(Boolean).join(', ');
    ctxTitle = `${t(`home.titleMood.${ctx.mood}`)} ${displayTemp(ctx.tempC)}°${where ? ` · ${where}` : ''}`;
    ctxSub = t(ctx.from === 'photo' ? 'share.contextFromPhoto' : ctx.from === 'place' ? 'share.contextFromPlace' : 'share.contextFromDevice', { when: photoMoment(ctx.takenAt, t) });
    ctxIcon = WEATHER_ICON[ctx.mood];
  } else {
    ctxTitle = t('share.contextNone');
    ctxSub = t('share.contextNoneSub');
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: color('bg/default') }]}>
      <FlowTopBar step={2} total={2} onClose={close} />
      <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 112 + insets.bottom }}>
        <View style={styles.titleBlock}>
          <Text variant="Display/M">{t('share.detailsTitle')}</Text>
        </View>
        <View style={styles.form}>
          {d.uploadFailed != null ? (
            // 8.4 Upload error — photos 72 (r16, the failed one outlined fg/destructive 2) · Inline Banner · Warning.
            <Pressable accessibilityRole="button" onPress={() => setPhotoSheet(true)} style={styles.failed}>
              <View style={styles.failRow}>
                {d.photos.map((p, i) => (
                  <View key={p.id} style={[styles.failThumb, { backgroundColor: color('bg/subtle') }, i === d.uploadFailed && { borderWidth: 2, borderColor: color('fg/destructive') }]}>
                    <Image source={{ uri: p.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  </View>
                ))}
              </View>
              <View style={styles.failNote}>
                <Icon icon={AlertCircle} size={18} color="fg/destructive" />
                <Text variant="Body/S Strong" color="fg/destructive" style={styles.flex}>{t('share.uploadFailed')}</Text>
              </View>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityHint={t('share.contextHint')}
            disabled={d.contextState === 'loading'}
            onPress={() => router.push('/share/place')}
            onLongPress={detectContext}
            style={({ pressed }) => [styles.context, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }, pressed && { opacity: 0.85 }]}
          >
            {d.contextState === 'loading' ? <ActivityIndicator color={color('fg/muted')} /> : <Icon icon={ctxIcon} size={22} />}
            <View style={styles.flex}>
              <Text variant="Body/M Strong" numberOfLines={1}>{ctxTitle}</Text>
              <Text variant="Caption" color="fg/muted" numberOfLines={1}>{ctxSub}</Text>
            </View>
            <Icon icon={ChevronRight} size={18} color="fg/muted" />
          </Pressable>

          <View style={styles.group}>
            <FieldHead title={t('share.type')} hint={t('share.typeHint')} />
            <View style={[styles.segmented, { backgroundColor: color('bg/muted') }]}>
              {([['home', ChefHat], ['travel', MapIcon]] as const).map(([key, icon]) => {
                const on = d.type === key;
                return (
                  <Pressable
                    key={key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    onPress={() => updateShareDraft({ type: key })}
                    style={[styles.segment, on && [{ backgroundColor: color('bg/subtle') }, elevation['Elevation/1 Low']]]}
                  >
                    <Icon icon={icon} size={18} color={on ? 'fg/default' : 'fg/muted'} />
                    <Text variant="Body/M Strong" color={on ? 'fg/default' : 'fg/muted'}>{t(`share.types.${key}`)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Input label={t('share.dishName')} value={d.name} maxLength={MAX_NAME} onChangeText={(name) => updateShareDraft({ name })} placeholder={t('share.dishNamePlaceholder')} returnKeyType="next" />


          <View style={styles.special}>
            <Text variant="Body/S Strong">{t(d.type === 'travel' ? 'share.whereAte' : 'share.special')}</Text>
            <View style={[styles.area, { backgroundColor: color('bg/subtle'), borderColor: color(descFocused ? 'border/focus' : 'border/default'), borderWidth: descFocused ? 2 : 1 }]}>
              <TextInput
                accessibilityLabel={t(d.type === 'travel' ? 'share.whereAte' : 'share.special')}
                value={d.description}
                onChangeText={(description) => updateShareDraft({ description })}
                maxLength={MAX_DESCRIPTION}
                multiline
                placeholder={t(d.type === 'travel' ? 'share.whereAtePlaceholder' : 'share.specialPlaceholder')}
                placeholderTextColor={color('fg/muted')}
                selectionColor={color('border/focus')}
                onFocus={() => setDescFocused(true)}
                onBlur={() => setDescFocused(false)}
                style={[areaText, styles.areaInput, { color: color('fg/default') }]}
              />
            </View>
            <Text variant="Caption" color="fg/muted" style={styles.counter}>{`${d.description.length} / ${MAX_DESCRIPTION}`}</Text>
          </View>

          <View style={styles.group}>
            <FieldHead title={t('share.meal')} hint={t('share.requiredAll')} />
            <View style={styles.chips}>
              {MEAL_TAGS.map((m) => (
                <Chip key={m.key} label={t(`share.meals.${m.key}`)} icon={m.icon} selected={d.meals.includes(m.key)} onPress={() => updateShareDraft({ meals: toggleIn(d.meals, m.key) })} />
              ))}
            </View>
          </View>

          <View style={styles.group}>
            <FieldHead title={t('share.mood')} hint={t('share.requiredAll')} />
            <View style={styles.chips}>
              {MOOD_TAGS.map((m) => (
                <Chip key={m.key} label={t(`share.moods.${m.key}`)} icon={m.icon} selected={d.moods.includes(m.key)} onPress={() => updateShareDraft({ moods: toggleIn(d.moods, m.key) })} />
              ))}
              {customs.map((c) => (
                <Chip key={`c-${c}`} label={c} icon={CUSTOM_MOOD_ICON} selected={d.moods.includes(c)} onPress={() => updateShareDraft({ moods: toggleIn(d.moods, c) })} onLongPress={() => removeCustom(c)} />
              ))}
              <Chip label={t('share.addOwn')} icon={Plus} variant="add" onPress={() => setAdding(true)} />
            </View>
            <Text variant="Caption" color="fg/muted">{t('share.holdToDelete')}</Text>
          </View>

          <View style={styles.group}>
            <FieldHead title={t('share.landscape')} hint={t('share.optionalOne')} />
            <View style={styles.chips}>
              {LANDSCAPES.map((l) => (
                <Chip key={l.key} label={t(`landscape.${l.key}`)} icon={l.icon} selected={d.landscape === l.key} onPress={() => updateShareDraft({ landscape: d.landscape === l.key ? null : l.key })} />
              ))}
            </View>
          </View>

          {d.type === 'home' ? (
            <View style={styles.group}>
              <FieldHead title={t('share.recipe')} hint={t('share.optional')} />
              <View style={[styles.box, { borderColor: color('border/default') }]}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/share/recipe')}
                  style={({ pressed }) => [styles.row, { backgroundColor: color('bg/default') }, pressed && { opacity: 0.85 }]}
                >
                  <Icon icon={List} size={20} />
                  <Text variant="Body/M" style={styles.flex}>{t('share.ingredientsSteps')}</Text>
                  <Text variant="Body/M" color="fg/muted">
                    {d.ingredients.length || d.steps.length ? t('share.recipeSummary', { ing: d.ingredients.length, steps: d.steps.length }) : t('share.recipeAdd')}
                  </Text>
                  <Icon icon={ChevronRight} size={18} color="fg/disabled" />
                </Pressable>
              </View>
            </View>
          ) : null}

          <View style={styles.group}>
            <FieldHead title={t('share.sharing')} hint={t('share.sharingHint')} />
            <View style={[styles.box, { borderColor: color('border/default') }]}>
              <View style={[styles.row, { backgroundColor: color('bg/default'), borderBottomWidth: 1, borderBottomColor: color('border/default') }]}>
                <Icon icon={Globe} size={20} />
                <Text variant="Body/M" style={styles.flex}>{t('share.public')}</Text>
                <Toggle accessibilityLabel={t('share.public')} value={d.isPublic} onValueChange={(isPublic) => updateShareDraft({ isPublic })} />
              </View>
              <View style={[styles.row, { backgroundColor: color('bg/default') }]}>
                <Icon icon={MessageCircle} size={20} />
                <Text variant="Body/M" style={styles.flex}>{t('share.allowComments')}</Text>
                <Toggle accessibilityLabel={t('share.allowComments')} value={d.allowComments} disabled={!d.isPublic} onValueChange={(allowComments) => updateShareDraft({ allowComments })} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.cta, { backgroundColor: color('bg/default'), paddingBottom: Math.max(insets.bottom, space[20]) }]}>
        <Button label={t('share.preview')} disabled={!ready} onPress={() => router.push('/share/preview')} />
      </View>

      <PhotoOptionsSheet
        visible={photoSheet}
        index={d.uploadFailed ?? 0}
        total={d.photos.length}
        onClose={() => setPhotoSheet(false)}
        onRetry={() => { setPhotoSheet(false); router.push('/share/preview'); }}
        onReplace={async () => {
          setPhotoSheet(false);
          const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
          const a = r.canceled ? null : r.assets[0];
          if (!a || d.uploadFailed == null) return;
          const i = d.uploadFailed;
          updateShareDraft({ uploadFailed: null, photos: d.photos.map((p, k) => (k === i ? { id: `lib-${Date.now()}`, uri: a.uri, fileUri: a.uri, width: a.width, height: a.height, takenAt: p.takenAt } : p)) });
        }}
        onRemove={() => {
          setPhotoSheet(false);
          if (d.uploadFailed == null) return;
          const i = d.uploadFailed;
          const photos = d.photos.filter((_, k) => k !== i);
          updateShareDraft({ uploadFailed: null, photos });
          if (photos.length === 0) router.back();
        }}
      />
      <AddMoodDialog visible={adding} existing={[...customs, ...MOOD_TAGS.map((m) => t(`share.moods.${m.key}`))]} onCancel={() => setAdding(false)} onAdd={addCustom} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  titleBlock: { paddingTop: space[20], paddingHorizontal: space[20] },
  form: { paddingTop: space[20], paddingHorizontal: space[20], gap: space[16] },
  failed: { gap: space[10] },
  failRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8] },
  failThumb: { width: 72, height: 72, borderRadius: radius.lg, overflow: 'hidden' },
  failNote: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  context: { flexDirection: 'row', alignItems: 'center', gap: space[12], paddingLeft: space[14], paddingRight: space[12], paddingVertical: space[12], borderRadius: radius.lg, borderWidth: 1 },
  flex: { flex: 1, gap: space[2] },
  group: { gap: space[10] },
  segmented: { flexDirection: 'row', padding: space[4], gap: space[4], borderRadius: radius.full },
  segment: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[6], paddingHorizontal: space[12], paddingVertical: space[10], borderRadius: radius.full },
  special: { gap: space[6] },
  area: { height: 92, borderRadius: radius.input, paddingHorizontal: space[16], paddingVertical: space[12] },
  areaInput: { flex: 1, padding: 0, textAlignVertical: 'top' },
  counter: { textAlign: 'right', paddingRight: space[14] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[6] },
  box: { borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden' },
  row: { height: 56, flexDirection: 'row', alignItems: 'center', gap: space[14], paddingHorizontal: space[16] },
  cta: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: space[12], paddingHorizontal: space[20] },
});
