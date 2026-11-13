import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library/legacy';
import { router } from 'expo-router';
import { Camera, Check, ChevronDown, Flag } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Linking, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Icon } from '../../src/components/Icon';
import { FlowTopBar } from '../../src/components/share/FlowTopBar';
import { Text } from '../../src/components/Text';
import { Toast } from '../../src/components/Toast';
import { CHALLENGE_PHOTOS, getShareDraft, resetShareDraft, updateShareDraft, useShareDraft, type DraftPhoto } from '../../src/lib/shareDraft';
import { FIXED_BUTTON_BOTTOM, radius, space, useTheme, withAlpha } from '../../src/theme';

const MAX_PHOTOS = 10;
const PAGE = 60;
const GAP = 2;

type Perm = 'checking' | 'granted' | 'denied';

/**
 * 8.1 Pick photos (Figma 23:1201) — in-app album grid, up to 10, numbered in tap order; first = cover.
 * A challenge entry (draft.challenge) takes one photo: tapping another photo swaps it, no numbers, "Joining: …" shown.
 */
export default function PickPhotos() {
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const draft = useShareDraft();
  const [perm, setPerm] = useState<Perm>('checking');
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [busy, setBusy] = useState(false);
  const [album, setAlbum] = useState<MediaLibrary.Album | null>(null);
  const cursor = useRef<{ after?: string; hasNext: boolean; loading: boolean }>({ hasNext: true, loading: false });
  const albumRef = useRef<MediaLibrary.Album | null>(null);
  const selected = draft.photos;
  const cell = (width - GAP * 2) / 3;
  const challenge = draft.challenge;
  const max = challenge ? CHALLENGE_PHOTOS : MAX_PHOTOS;
  const [toast, setToast] = useState<string | null>(null);

  // A challenge draft that arrives with several photos keeps only the first.
  useEffect(() => {
    const d = getShareDraft();
    if (d.challenge && d.photos.length > CHALLENGE_PHOTOS) {
      updateShareDraft({ photos: d.photos.slice(0, CHALLENGE_PHOTOS) });
      setToast(t('share.challengeOnePhoto'));
    }
  }, [t]);

  const loadMore = useCallback(async () => {
    const c = cursor.current;
    if (!c.hasNext || c.loading) return;
    c.loading = true;
    try {
      const page = await MediaLibrary.getAssetsAsync({ first: PAGE, after: c.after, album: albumRef.current ?? undefined, mediaType: MediaLibrary.MediaType.photo, sortBy: [[MediaLibrary.SortBy.creationTime, false]] });
      c.after = page.endCursor;
      c.hasNext = page.hasNextPage;
      setAssets((prev) => [...prev, ...page.assets]);
    } finally {
      c.loading = false;
    }
  }, []);

  useEffect(() => {
    (async () => {
      const res = await MediaLibrary.requestPermissionsAsync(false, ['photo']);
      if (res.granted) {
        setPerm('granted');
        loadMore();
      } else setPerm('denied');
    })();
  }, [loadMore]);

  const toggle = (a: MediaLibrary.Asset) => {
    const i = selected.findIndex((p) => p.id === a.id);
    const photo: DraftPhoto = { id: a.id, uri: a.uri, width: a.width, height: a.height, takenAt: a.creationTime ? new Date(a.creationTime) : undefined };
    if (i >= 0) updateShareDraft({ photos: selected.filter((p) => p.id !== a.id) });
    else if (max === 1) updateShareDraft({ photos: [photo] });
    else if (selected.length < max) updateShareDraft({ photos: [...selected, photo] });
  };

  const openCamera = async () => {
    if (selected.length >= max) return;
    try {
      const p = await ImagePicker.requestCameraPermissionsAsync();
      if (!p.granted) return;
      const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 });
      if (r.canceled || !r.assets[0]) return;
      const a = r.assets[0];
      updateShareDraft({ photos: [...selected, { id: `camera-${Date.now()}`, uri: a.uri, fileUri: a.uri, width: a.width, height: a.height, takenAt: new Date() }] });
    } catch {
      Alert.alert(t('share.cameraUnavailable'));
    }
  };

  /** "Recents ⌄" → pick another album (or back to all photos). */
  const switchAlbum = async () => {
    let albums: MediaLibrary.Album[] = [];
    try { albums = (await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true })).filter((a) => a.assetCount > 0).slice(0, 12); } catch { /* none */ }
    const choose = (a: MediaLibrary.Album | null) => {
      albumRef.current = a;
      setAlbum(a);
      cursor.current = { hasNext: true, loading: false };
      setAssets([]);
      loadMore();
    };
    Alert.alert(t('share.albums'), undefined, [
      { text: t('share.recents'), onPress: () => choose(null) },
      ...albums.map((a) => ({ text: `${a.title} · ${a.assetCount}`, onPress: () => choose(a) })),
      { text: t('common.cancel'), style: 'cancel' as const },
    ]);
  };

  /** Tap a selected photo: make it the cover, move it, or remove it. */
  const photoOptions = (i: number) => {
    const move = (to: number) => {
      const next = [...selected];
      const [p] = next.splice(i, 1);
      next.splice(to, 0, p);
      updateShareDraft({ photos: next });
    };
    Alert.alert(t('share.photoN', { n: i + 1 }), undefined, [
      ...(i > 0 ? [{ text: t('share.makeCover'), onPress: () => move(0) }, { text: t('share.moveLeft'), onPress: () => move(i - 1) }] : []),
      ...(i < selected.length - 1 ? [{ text: t('share.moveRight'), onPress: () => move(i + 1) }] : []),
      { text: t('share.removePhotoOption'), style: 'destructive' as const, onPress: () => updateShareDraft({ photos: selected.filter((_, k) => k !== i) }) },
      { text: t('common.cancel'), style: 'cancel' as const },
    ]);
  };

  const close = () => {
    const leave = () => { resetShareDraft(); router.back(); };
    if (selected.length === 0 && !draft.editId) return leave();
    Alert.alert(t('share.discardTitle'), undefined, [
      { text: t('share.keepEditing'), style: 'cancel' },
      { text: t('share.discard'), style: 'destructive', onPress: leave },
    ]);
  };

  /** Resolve file uris + photo location (cover first) before 8.2 reads them. */
  const next = async () => {
    if (selected.length === 0 || busy) return;
    setBusy(true);
    try {
      const resolved: DraftPhoto[] = await Promise.all(
        selected.map(async (p) => {
          if (p.id.startsWith('camera-') || p.remoteUrl) return p;
          try {
            const info = await MediaLibrary.getAssetInfoAsync(p.id, { shouldDownloadFromNetwork: true });
            return { ...p, fileUri: info.localUri ?? p.uri, location: info.location ?? undefined, takenAt: info.creationTime ? new Date(info.creationTime) : p.takenAt };
          } catch {
            return p;
          }
        }),
      );
      // Edit mode keeps the post's own weather and place; a new post re-detects them from the photos.
      updateShareDraft(draft.editId ? { photos: resolved } : { photos: resolved, context: null, contextState: 'idle' });
      router.push('/share/details');
    } finally {
      setBusy(false);
    }
  };

  const header = (
    <View>
      <View style={styles.titleBlock}>
        <Text variant="Display/M">{t('share.pickTitle')}</Text>
        {challenge ? (
          <View style={[styles.joining, { backgroundColor: color('bg/accent-subtle') }]}>
            <Icon icon={Flag} size={14} color="fg/accent" />
            <Text variant="Caption Strong" color="fg/accent" numberOfLines={1} style={styles.shrink}>{t('share.inChallenge', { name: challenge.title })}</Text>
          </View>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selected}>
        {selected.map((p, i) => (
          <Pressable key={p.id} accessibilityRole="imagebutton" accessibilityLabel={t('share.photoN', { n: i + 1 })} onPress={() => photoOptions(i)} style={styles.thumb}>
            <Image source={{ uri: p.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            {max > 1 ? (
              <View style={[styles.thumbNo, { backgroundColor: color('bg/primary') }]}>
                <Text variant="Caption Strong" color="fg/on-primary">{String(i + 1)}</Text>
              </View>
            ) : null}
          </Pressable>
        ))}
        {selected.length < max ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t('share.camera')} onPress={openCamera} style={[styles.thumb, styles.camera, { borderColor: color('border/strong') }]}>
            <Icon icon={Camera} size={22} color="fg/muted" />
            <Text variant="Caption" color="fg/muted">{t('share.camera')}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
      <View style={styles.albumRow}>
        <Pressable accessibilityRole="button" onPress={switchAlbum} style={styles.albumHead} hitSlop={space[8]}>
          <Text variant="Title/S" numberOfLines={1}>{album?.title ?? t('share.recents')}</Text>
          <Icon icon={ChevronDown} size={18} />
        </Pressable>
        <Text variant="Caption" color="fg/muted">{t(max > 1 ? 'share.pickHint' : 'share.pickHintChallenge')}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: color('bg/default') }]}>
      <FlowTopBar step={1} total={2} onClose={close} action={t('share.next')} onAction={next} actionDisabled={selected.length === 0 || busy} />
      {perm === 'denied' ? (
        <View>
          {header}
          <View style={styles.denied}>
            <Text variant="Body/M" color="fg/secondary" style={styles.center}>{t('share.photosDenied')}</Text>
            <Button label={t('share.openSettings')} variant="Outline" size="M" onPress={() => Linking.openSettings()} />
          </View>
        </View>
      ) : (
        <FlatList
          data={assets}
          keyExtractor={(a) => a.id}
          numColumns={3}
          ListHeaderComponent={header}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={{ gap: GAP, paddingBottom: 140 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          removeClippedSubviews
          renderItem={({ item }) => {
            const n = selected.findIndex((p) => p.id === item.id);
            const on = n >= 0;
            return (
              <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => toggle(item)} style={[{ width: cell, height: cell }, on && { borderWidth: 3, borderColor: color('bg/primary') }]}>
                <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} contentFit="cover" recyclingKey={item.id} />
                {on ? (
                  <View style={[styles.check, styles.checkOn, { backgroundColor: color('bg/primary'), borderColor: color('static/white') }]}>
                    {max > 1 ? <Text variant="Caption Strong" color="fg/on-primary">{String(n + 1)}</Text> : <Icon icon={Check} size={14} color="fg/on-primary" />}
                  </View>
                ) : (
                  <View style={[styles.check, styles.checkOff, { backgroundColor: color('overlay/shade'), borderColor: color('static/white') }]} />
                )}
              </Pressable>
            );
          }}
        />
      )}
      <LinearGradient
        pointerEvents="none"
        colors={[withAlpha(color('bg/subtle'), 0), color('bg/subtle'), color('bg/subtle')]}
        locations={[0, 0.45, 1]}
        style={styles.fade}
      />
      <View style={styles.cta}>
        <Button
          label={selected.length && max > 1 ? t('share.nextCount', { count: selected.length }) : t('share.next')}
          disabled={selected.length === 0}
          loading={busy}
          onPress={next}
        />
      </View>
      <Toast visible={!!toast} message={toast ?? ''} onHide={() => setToast(null)} bottom={FIXED_BUTTON_BOTTOM + 72} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  titleBlock: { paddingTop: space[20], paddingHorizontal: space[20], gap: space[10] },
  joining: { flexDirection: 'row', alignItems: 'center', gap: space[6], alignSelf: 'flex-start', maxWidth: '100%', height: 28, paddingHorizontal: space[10], borderRadius: radius.full },
  shrink: { flexShrink: 1 },
  selected: { gap: space[8], paddingTop: space[20], paddingHorizontal: space[20] },
  thumb: { width: 76, height: 76, borderRadius: radius.md, overflow: 'hidden' },
  thumbNo: { position: 'absolute', top: 6, right: 4, width: 22, height: 22, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  camera: { borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: space[4] },
  albumRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: space[20], paddingHorizontal: space[20], paddingBottom: space[16] },
  albumHead: { flexDirection: 'row', alignItems: 'center', gap: space[6] },
  check: { position: 'absolute', width: 24, height: 24, borderRadius: radius.full, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  // Selected cells carry a 3px border, so the badge sits 3 in from the inner edge (Figma left 95 / top 3).
  checkOn: { top: 3, right: 3 },
  checkOff: { top: 6, right: 6 },
  denied: { alignItems: 'center', gap: space[16], paddingHorizontal: space[40], paddingTop: space[40] },
  center: { textAlign: 'center' },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 130 },
  cta: { position: 'absolute', left: space[20], right: space[20], bottom: FIXED_BUTTON_BOTTOM },
});
