import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { DishActionBar, useActionBarInset } from '../../src/components/dish/DishChrome';
import { type DishViewData } from '../../src/components/dish/DishView';
import { PostView } from '../../src/components/dish/PostView';
import { GlassIconButton, GlassPill } from '../../src/components/GlassIconButton';
import { markEditSaved, resetShareDraft, updateShareDraft, useShareDraft } from '../../src/lib/shareDraft';
import { enterChallenge } from '../../src/services/community';
import { createDish, updateDish, UploadError } from '../../src/services/foods';
import { getMyProfile, type MyProfile } from '../../src/services/profile';
import { space, useTheme } from '../../src/theme';

/** 8.3 Preview (Figma 618:15418) — the post exactly as others will see it, then "Share to ongdalsaem". */
export default function SharePreview() {
  const { color } = useTheme();
  const { t } = useTranslation();
  const d = useShareDraft();
  const bottomInset = useActionBarInset();
  const [me, setMe] = useState<MyProfile | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    getMyProfile().then(setMe).catch(() => setMe(null));
  }, []);

  const view = useMemo<DishViewData>(() => {
    const where = d.type === 'travel' && d.placeName.trim() ? d.placeName.trim() : [d.context?.place?.district, d.context?.place?.city].filter(Boolean).join(', ');
    return {
      photos: d.photos.map((p) => ({ uri: p.uri })),
      name: d.name.trim(),
      mood: d.context?.mood ?? null,
      tempC: d.context?.tempC ?? null,
      acorns: 0,
      comments: 0,
      authorName: me?.username ?? me?.displayName ?? '',
      authorAvatar: me?.avatarUrl ? { uri: me.avatarUrl } : null,
      meta: [where, t('time.justNow')].filter(Boolean).join(' · '),
      caption: d.description.trim(),
      meals: d.meals,
      moods: d.moods,
      ingredients: d.type === 'home' ? d.ingredients : [],
      steps: d.type === 'home' ? d.steps : [],
      calories: d.type === 'home' && /^\d+$/.test(d.calories) ? Number(d.calories) : null,
      servings: d.type === 'home' ? d.servings : null,
      cookMinutes: d.type === 'home' ? d.cookMinutes : null,
      difficulty: d.type === 'home' ? d.difficulty : null,
    };
  }, [d, me, t]);

  const share = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      updateShareDraft({ uploadFailed: null });
      if (d.editId) {
        // Edit mode: UPDATE the post, then back to it (it reloads and shows "Changes saved").
        const editId = d.editId;
        await updateDish(editId, d);
        markEditSaved(editId);
        resetShareDraft();
        return router.dismissTo(`/dish/${editId}`);
      }
      const foodId = await createDish(d);
      if (d.challenge && d.isPublic) await enterChallenge(d.challenge.id, foodId).catch((e) => console.warn('[challenge entry]', e));
      resetShareDraft();
      router.dismissAll();
    } catch (e) {
      console.warn('[share]', e);
      if (e instanceof UploadError) {
        // 8.4 — back to Details with the "1 photo didn't upload" banner; notes stay in the draft.
        updateShareDraft({ uploadFailed: e.index });
        setSharing(false);
        return router.back();
      }
      const reason = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : String(e);
      Alert.alert(t('share.failedTitle'), __DEV__ ? `${t('share.failedBody')}\n\n[dev] ${reason}` : t('share.failedBody'));
      setSharing(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
      <StatusBar style="dark" />
      <PostView
        dish={view}
        given={false}
        saved={false}
        onAcorn={() => undefined}
        onComments={() => undefined}
        onShare={() => undefined}
        onDirect={() => undefined}
        onSave={() => undefined}
        onMore={() => undefined}
        onBack={() => router.back()}
        comments={null}
        bottomInset={bottomInset}
        top={
          // Top bar 8.3 — padding 0 16: back (glass ink 40) · "Preview · not shared yet" pill (centred) · 40 spacer.
          <View style={styles.topBar}>
            <GlassIconButton ink icon={ChevronLeft} accessibilityLabel={t('common.back')} onPress={() => router.back()} />
            <GlassPill ink label={t('share.previewPill')} />
            <View style={styles.spacer} />
          </View>
        }
      />
      <DishActionBar>
        <Button label={d.editId ? t('share.saveChanges') : t('share.shareCta')} loading={sharing} onPress={share} style={styles.flex} />
      </DishActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  spacer: { width: 40, height: 40 },
  topBar: { height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space[16] },
  flex: { flex: 1 },
});
