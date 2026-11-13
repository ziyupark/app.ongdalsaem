import type React from 'react';
import { Image } from 'expo-image';
import { ChevronLeft, MoreHorizontal } from 'lucide-react-native';
import { Bookmark, MessageCircle, Share } from '../icons/custom';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, space, useTheme } from '../../theme';
import { AcornIcon } from '../AcornIcon';
import { Chip } from '../Chip';
import { Icon } from '../Icon';
import { PhotoCounter, WeatherTag } from '../PhotoTags';
import { Text } from '../Text';
import { DishRecipe, useDishTags, type DishViewData } from './DishView';

type Props = {
  dish: DishViewData;
  given: boolean;
  saved: boolean;
  onAcorn: () => void;
  onComments: () => void;
  onShare: () => void;
  onDirect: () => void;
  onSave: () => void;
  onMore: () => void;
  onAuthor?: () => void;
  onBack: () => void;
  onStartTimer?: (i: number) => void;
  /** Picked ingredients went into the shopping memo. */
  onAddedToShopping?: (n: number) => void;
  /** Action bar · Comments · More from — placed after the recipe (Figma 601:12935). */
  actionBar?: ReactNode;
  comments: ReactNode;
  more?: ReactNode;
  scrollToComments?: boolean;
  /** 6.4b — shown above the cook row (Inline Banner · Neutral). */
  banner?: ReactNode;
  /** 8.3 Preview top bar (back · "Preview · not shared yet"), above the cook row. */
  top?: ReactNode;
  /** Extra space under the content (8.3 fixed share bar). */
  bottomInset?: number;
};

// Media 601:12860 — 370×417 on a 390 frame: 10 in from each side, radius 32.
const MEDIA_HEIGHT = 417;
const MEDIA_INSET = space[10];

/**
 * 7.1 Post detail (Figma 601:12935) — Cook row → photos 370×417 r32 (Weather Tag + counter) → actions → title (Display/L) · caption
 * → tags → recipe → action bar → comments → More from.
 */
export function PostView({ dish, given, saved, onAcorn, onComments, onShare, onDirect, onSave, onMore, onAuthor, onBack, onStartTimer, onAddedToShopping, actionBar, comments, more, scrollToComments, banner, top, bottomInset }: Props) {
  const { width: screenW } = useWindowDimensions();
  const width = screenW - MEDIA_INSET * 2;
  const insets = useSafeAreaInsets();
  const { color } = useTheme();
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const commentsY = useRef(0);
  const tags = useDishTags(dish);
  const total = dish.photos.length;

  useEffect(() => {
    if (!scrollToComments) return;
    const h = setTimeout(() => scroll.current?.scrollTo({ y: Math.max(0, commentsY.current - space[20]), animated: true }), 400);
    return () => clearTimeout(h);
  }, [scrollToComments]);

  const onPage = (e: NativeSyntheticEvent<NativeScrollEvent>) => setPage(Math.round(e.nativeEvent.contentOffset.x / width));

  return (
    <ScrollView ref={scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={{ paddingTop: insets.top, paddingBottom: bottomInset ?? insets.bottom + space[24] }}>
      {top}
      {banner ? <View style={styles.banner}>{banner}</View> : null}
      {top ? null : (
        <View style={styles.backRow}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={space[10]} onPress={onBack}>
            <Icon icon={ChevronLeft} size={24} />
          </Pressable>
        </View>
      )}
      <View style={styles.cook}>
        <Pressable onPress={onAuthor} disabled={!onAuthor} style={[styles.avatar, { backgroundColor: color('bg/accent-subtle') }]}>
          {dish.authorAvatar ? <Image source={dish.authorAvatar} style={StyleSheet.absoluteFill} contentFit="cover" /> : (
            <Text variant="Body/M Strong" color="fg/accent">{dish.authorName.slice(0, 1).toUpperCase()}</Text>
          )}
        </Pressable>
        <Pressable onPress={onAuthor} disabled={!onAuthor} style={styles.who}>
          <Text variant="Body/M Strong" numberOfLines={1}>{dish.authorName}</Text>
          <Text variant="Body/S" color="fg/muted" numberOfLines={1}>{dish.meta}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('home.more')} hitSlop={space[8]} onPress={onMore}>
          <Icon icon={MoreHorizontal} size={24} color="fg/secondary" />
        </Pressable>
      </View>

      <View style={[styles.media, { height: MEDIA_HEIGHT }]}>
        <FlatList
          data={dish.photos}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onPage}
          renderItem={({ item }) => <Image source={item} style={{ width, height: MEDIA_HEIGHT }} contentFit="cover" transition={150} />}
        />
        {dish.mood && dish.tempC != null ? (
          <View pointerEvents="none" style={styles.tagTL}>
            <WeatherTag mood={dish.mood} tempC={dish.tempC} condition={t(`weather.${dish.mood}`)} />
          </View>
        ) : null}
        {total > 1 ? (
          <View pointerEvents="none" style={styles.counterBR}>
            <PhotoCounter label={t('home.photoCount', { n: page + 1, total })} />
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('home.acorns', { count: dish.acorns })} accessibilityState={{ selected: given }} onPress={onAcorn} style={styles.count}>
          <AcornIcon size={24} filled={given} />
          <Text variant="Body/S Strong">{String(dish.acorns)}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('home.comments', { count: dish.comments })} onPress={() => { scroll.current?.scrollTo({ y: Math.max(0, commentsY.current - space[20]), animated: true }); onComments(); }} style={styles.count}>
          <Icon icon={MessageCircle} size={24} />
          <Text variant="Body/S Strong">{String(dish.comments)}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('home.share')} onPress={onShare}>
          <Icon icon={Share} size={24} />
        </Pressable>
        <View style={styles.spacer} />
        <Pressable accessibilityRole="button" accessibilityLabel={t('home.save')} accessibilityState={{ selected: saved }} onPress={onSave}>
          <Bookmark size={24} strokeWidth={1.6} absoluteStrokeWidth color={color('fg/default')} fill={saved ? color('fg/default') : 'none'} />
        </Pressable>
      </View>

      <View style={styles.meta}>
        <View style={styles.px}><Text variant="Display/L">{dish.name}</Text></View>
        {dish.caption ? <View style={styles.px}><Text variant="Body/S">{dish.caption}</Text></View> : null}
      </View>

      {tags.length ? (
        <View style={styles.tags}>
          {tags.map((g) => <Chip key={g.key} label={g.label} icon={g.icon} static />)}
        </View>
      ) : null}

      <DishRecipe dish={dish} onStartTimer={onStartTimer} onAddedToShopping={onAddedToShopping} />

      {actionBar ? <View style={styles.actionBar}>{actionBar}</View> : <View style={{ height: space[24] }} />}
      <View onLayout={(e) => { commentsY.current = e.nativeEvent.layout.y; }}>{comments}</View>
      {more}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  banner: { paddingTop: space[16], paddingHorizontal: space[20], paddingBottom: space[4] },
  cook: { flexDirection: 'row', alignItems: 'center', gap: space[12], paddingLeft: space[16], paddingRight: space[14], paddingVertical: space[12] },
  /** Back sits on its own row above the author avatar; the chevron glyph is optically aligned to the avatar's left edge. */
  backRow: { height: 44, justifyContent: 'center', paddingLeft: space[12] },
  avatar: { width: 48, height: 48, borderRadius: radius.full, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  who: { flex: 1, gap: space[2] },
  media: { marginHorizontal: MEDIA_INSET, borderRadius: radius['2xl'], overflow: 'hidden' },
  tagTL: { position: 'absolute', left: space[20], top: space[16] },
  counterBR: { position: 'absolute', right: space[16], bottom: space[16] },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 18, paddingTop: space[12], paddingBottom: space[8], paddingHorizontal: space[20] },
  count: { flexDirection: 'row', alignItems: 'center', gap: space[6] },
  spacer: { flex: 1 },
  meta: { gap: space[16], paddingTop: space[8], paddingBottom: space[10] },
  px: { paddingHorizontal: space[20] },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8], paddingTop: space[10], paddingHorizontal: space[20], paddingBottom: space[2] },
  actionBar: { flexDirection: 'row', alignItems: 'center', gap: space[10], paddingHorizontal: space[20], paddingVertical: 28 },
});
