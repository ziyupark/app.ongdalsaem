import { Canvas, ColorMatrix, Group, Image as SkiaImage, type SkImage } from '@shopify/react-native-skia';
import * as MediaLibrary from 'expo-media-library/legacy';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { RotateCcw } from '../icons/ongdal';
import { AdjustSlider } from './AdjustSlider';
import { CropOverlay } from './CropOverlay';
import { Text } from '../Text';
import { UnderlineTabs } from '../UnderlineTabs';
import {
  ADJUSTS, ASPECTS, NO_ADJUST, NO_EDIT, aspectRatio, colorMatrix, editMatrix, fitCrop, flipH, isNoEdit, loadSkImage,
  orientedSize, prepareSource, renderEdit, rotateCCW, type AdjustKey, type AspectKey, type EditSource, type PhotoEdit, type Rect,
} from '../../lib/photoEdit';
import { getShareDraft, updateShareDraft, type DraftPhoto } from '../../lib/shareDraft';
import { space, useTheme } from '../../theme';

type Tab = 'crop' | 'adjust';
/** Room around the picture on the stage (crop handles stay inside the screen). */
const STAGE_PAD = space[24];

/** Local file of a draft photo (asset → its file in the library, downloading from iCloud when needed). */
async function fileOf(p: DraftPhoto): Promise<string> {
  if (p.fileUri) return p.fileUri;
  if (p.remoteUrl || p.id.startsWith('camera-') || p.id.startsWith('lib-')) return p.uri;
  const info = await MediaLibrary.getAssetInfoAsync(p.id, { shouldDownloadFromNetwork: true });
  return info.localUri ?? p.uri;
}

/** The largest rect of `w × h` proportions centred in the box. */
function fitIn(box: { w: number; h: number }, w: number, h: number): Rect {
  const s = Math.min(box.w / w, box.h / h);
  return { x: (box.w - w * s) / 2, y: (box.h - h * s) / 2, w: w * s, h: h * s };
}

/** 8.1a Edit photo (route `app/share/edit.tsx`) — crop · rotate · flip (Crop tab) and brightness · exposure · contrast · saturation · warmth (Adjust tab). */
export function PhotoEditor() {
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { i } = useLocalSearchParams<{ i: string }>();
  const index = Number(i);
  const photo = getShareDraft().photos[index] as DraftPhoto | undefined;

  const [src, setSrc] = useState<EditSource | null>(photo?.edit?.source ?? null);
  const [image, setImage] = useState<SkImage | null>(null);
  const start = useRef<PhotoEdit>(photo?.edit?.params ?? NO_EDIT).current;
  const [edit, setEdit] = useState<PhotoEdit>(start);
  const [tab, setTab] = useState<Tab>('crop');
  const [tool, setTool] = useState<AdjustKey>('brightness');
  const [stage, setStage] = useState<{ w: number; h: number } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!photo) { router.back(); return; }
    let alive = true;
    (async () => {
      try {
        const s = src ?? (await prepareSource(await fileOf(photo)));
        const img = await loadSkImage(s.uri);
        if (!alive) return;
        setSrc(s);
        setImage(img);
      } catch {
        if (!alive) return;
        Alert.alert(t('share.editLoadFailed'));
        router.back();
      }
    })();
    return () => { alive = false; };
    // Loads once for the photo the screen was opened with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matrix = useMemo(() => colorMatrix(edit.adjust), [edit.adjust]);
  const changed = JSON.stringify(edit) !== JSON.stringify(start);

  const cancel = () => {
    if (!changed) return router.back();
    Alert.alert(t('share.editDiscardTitle'), undefined, [
      { text: t('share.keepEditing'), style: 'cancel' },
      { text: t('share.discard'), style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const done = async () => {
    if (!photo || !src || !image || saving) return;
    if (!changed) return router.back();
    setSaving(true);
    try {
      const original = photo.edit?.original ?? { uri: photo.uri, fileUri: photo.fileUri, width: photo.width, height: photo.height, remoteUrl: photo.remoteUrl };
      let next: DraftPhoto;
      if (isNoEdit(edit)) {
        // Back to the photo as it was (an edited post photo goes back to its uploaded URL).
        const { edit: _drop, ...rest } = photo;
        next = { ...rest, ...original };
      } else {
        const out = await renderEdit(src, edit, image);
        // An edited post photo is a new photo: it uploads on save (the old one leaves storage with editBefore).
        next = { ...photo, uri: out.uri, fileUri: out.uri, width: out.width, height: out.height, remoteUrl: undefined, edit: { source: src, params: edit, original } };
      }
      const photos = getShareDraft().photos.slice();
      photos[index] = next;
      updateShareDraft({ photos });
      router.back();
    } catch {
      setSaving(false);
      Alert.alert(t('share.editSaveFailed'));
    }
  };

  // ── Stage geometry ──
  const oriented = src ? orientedSize(src, edit.rot) : null;
  const box = stage ? { w: stage.w - STAGE_PAD * 2, h: stage.h - STAGE_PAD * 2 } : null;
  // Crop tab: the whole picture with the crop frame on top · Adjust tab: just the cropped picture.
  const shown = tab === 'crop' ? { ...edit, crop: { x: 0, y: 0, w: 1, h: 1 } } : edit;
  const dest = oriented && box ? fitIn(box, shown.crop.w * oriented.w, shown.crop.h * oriented.h) : null;
  const destOnStage = dest ? { ...dest, x: dest.x + STAGE_PAD, y: dest.y + STAGE_PAD } : null;
  const m = src && destOnStage ? editMatrix(src, shown, destOnStage) : null;

  const setAspect = (a: AspectKey) => {
    if (!oriented) return;
    setEdit((e) => ({ ...e, aspect: a, crop: a === 'free' ? e.crop : fitCrop(aspectRatio(a, oriented), oriented) }));
  };
  const setAdjust = (k: AdjustKey, v: number) => setEdit((e) => ({ ...e, adjust: { ...e.adjust, [k]: v } }));

  const onStage = (e: LayoutChangeEvent) => setStage({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: color('bg/default') }]}>
      <View style={styles.bar}>
        <Pressable accessibilityRole="button" hitSlop={space[10]} onPress={cancel} style={styles.side}>
          <Text variant="Body/M">{t('common.cancel')}</Text>
        </Pressable>
        <Text variant="Title/S">{t('share.editTitle')}</Text>
        <View style={[styles.side, styles.right]}>
          {saving ? (
            <ActivityIndicator color={color('fg/muted')} />
          ) : (
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: !image }} disabled={!image} hitSlop={space[10]} onPress={done}>
              <Text variant="Body/M Strong" color={image ? 'fg/accent' : 'fg/disabled'}>{t('share.editDone')}</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={[styles.stage, { backgroundColor: color('bg/subtle') }]} onLayout={onStage}>
        {image && stage && m && destOnStage ? (
          <>
            <Canvas style={{ width: stage.w, height: stage.h }}>
              <Group clip={{ x: destOnStage.x, y: destOnStage.y, width: destOnStage.w, height: destOnStage.h }}>
                <Group matrix={m}>
                  <SkiaImage image={image} x={0} y={0} width={src!.width} height={src!.height} fit="fill">
                    <ColorMatrix matrix={matrix} />
                  </SkiaImage>
                </Group>
              </Group>
            </Canvas>
            {tab === 'crop' && oriented ? (
              <CropOverlay
                frame={destOnStage}
                crop={edit.crop}
                ratio={aspectRatio(edit.aspect, oriented)}
                onChange={(crop) => setEdit((e) => ({ ...e, crop }))}
              />
            ) : null}
          </>
        ) : (
          <ActivityIndicator color={color('fg/muted')} />
        )}
      </View>

      <UnderlineTabs
        items={[{ key: 'crop', label: t('share.editCrop') }, { key: 'adjust', label: t('share.editAdjust') }]}
        value={tab}
        onChange={setTab}
        contentStyle={styles.tabs}
      />

      <View style={[styles.tools, { paddingBottom: Math.max(insets.bottom, space[20]) }]}>
        {tab === 'crop' ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {ASPECTS.map((a) => (
                <Chip key={a} label={a === 'free' ? t('share.aspectFree') : a === 'original' ? t('share.aspectOriginal') : a} selected={edit.aspect === a} onPress={() => setAspect(a)} />
              ))}
            </ScrollView>
            <View style={styles.actions}>
              <Button label={t('share.editRotate')} icon={RotateCcw} variant="Outline" size="S" disabled={!src} onPress={() => src && setEdit((e) => rotateCCW(e, src))} />
              <Button label={t('share.editFlip')} variant="Outline" size="S" onPress={() => setEdit(flipH)} />
              <Button label={t('share.editReset')} variant="Ghost" size="S" onPress={() => setEdit((e) => ({ ...NO_EDIT, adjust: e.adjust }))} />
            </View>
          </>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {ADJUSTS.map((k) => (
                <Chip key={k} label={t(`share.adjust.${k}`)} selected={tool === k} onPress={() => setTool(k)} />
              ))}
            </ScrollView>
            <View style={styles.slider}>
              <View style={styles.sliderHead}>
                <Text variant="Body/S Strong">{t(`share.adjust.${tool}`)}</Text>
                <View style={styles.sliderHeadEnd}>
                  <Text variant="Body/S Strong" color={edit.adjust[tool] ? 'fg/accent' : 'fg/muted'}>{edit.adjust[tool] > 0 ? `+${edit.adjust[tool]}` : String(edit.adjust[tool])}</Text>
                  <Button label={t('share.editReset')} variant="Ghost" size="S" disabled={ADJUSTS.every((k) => edit.adjust[k] === 0)} onPress={() => setEdit((e) => ({ ...e, adjust: NO_ADJUST }))} />
                </View>
              </View>
              <AdjustSlider value={edit.adjust[tool]} onChange={(v) => setAdjust(tool, v)} accessibilityLabel={t(`share.adjust.${tool}`)} />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bar: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space[20] },
  side: { minWidth: 60, justifyContent: 'center' },
  right: { alignItems: 'flex-end' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  tabs: { paddingHorizontal: space[20], gap: space[24] },
  tools: { paddingTop: space[16], gap: space[16], minHeight: 152 },
  chips: { gap: space[8], paddingHorizontal: space[20] },
  actions: { flexDirection: 'row', gap: space[8], paddingHorizontal: space[20] },
  slider: { paddingHorizontal: space[20], gap: space[4] },
  sliderHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sliderHeadEnd: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
});
