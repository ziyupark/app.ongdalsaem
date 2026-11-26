import { Image } from 'expo-image';
import { MoreHorizontal } from '../icons/ongdal';
import { Bookmark, MessageCircle, Share } from '../icons/ongdal';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { radius, space, useTheme, type WeatherMood } from '../../theme';
import { AcornIcon } from '../AcornIcon';
import { Icon } from '../Icon';
import { PhotoCounter, WeatherTag } from '../PhotoTags';
import { Text } from '../Text';

type Pic = number | { uri: string };
export type FeedPostData = {
  id: string; name: string; meta: string; avatar?: Pic; photo: Pic; photoCount: number;
  weather: WeatherMood; tempC: number; acorns: number; comments: number; caption: string;
  /** Real posts: my current acorn / save (acorns excludes mine), so toggling stays exact. */
  given?: boolean; saved?: boolean;
  /** Opens their profile (avatar · name). */
  authorId?: string;
};

/**
 * Feed Post 119:601 (390 wide, padding-bottom 24): Header (avatar 40 · name/meta · more) → Media 350×402 radius 32, 20 in from each side
 * (Weather Tag XL with condition top-left 18 · Photo Counter bottom-left: left 18, bottom 16) → Actions (acorn · comment · share ··· save) → Caption.
 */
export const FeedPost = memo(function FeedPost({ post, onOpen, onAuthor, onComments, onShare, onMore, onAcorn, onSave }: {
  post: FeedPostData; onOpen?: () => void; onAuthor?: () => void; onComments?: () => void; onShare?: () => void; onMore?: () => void;
  /** Persist the toggle; reject to roll back. */
  onAcorn?: (on: boolean) => Promise<void>; onSave?: (on: boolean) => Promise<void>;
}) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const [given, setGiven] = useState(!!post.given);
  const [saved, setSaved] = useState(!!post.saved);
  const toggleGiven = () => {
    const on = !given;
    setGiven(on);
    onAcorn?.(on).catch(() => setGiven(!on));
  };
  const toggleSaved = () => {
    const on = !saved;
    setSaved(on);
    onSave?.(on).catch(() => setSaved(!on));
  };
  const acorns = post.acorns + (given ? 1 : 0);
  return (
    <View style={styles.post}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={post.name} onPress={onAuthor} disabled={!onAuthor} style={styles.author}>
          <View style={[styles.avatar, { backgroundColor: color('bg/accent-subtle') }]}>
            {post.avatar ? (
              <Image source={post.avatar} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <Text variant="Caption Strong" color="fg/accent">{post.name.charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <View style={styles.who}>
            <Text variant="Body/M Strong" numberOfLines={1}>{post.name}</Text>
            <Text variant="Caption" color="fg/muted" numberOfLines={1}>{post.meta}</Text>
          </View>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('home.more')} hitSlop={space[8]} onPress={onMore}>
          <Icon icon={MoreHorizontal} size={24} color="fg/secondary" />
        </Pressable>
      </View>
      <Pressable accessibilityRole="imagebutton" accessibilityLabel={post.caption} onPress={onOpen} style={styles.media}>
        <Image source={post.photo} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={styles.tagTL}>
          <WeatherTag mood={post.weather} tempC={post.tempC} condition={t(`weather.${post.weather}`)} />
        </View>
        {post.photoCount > 1 ? (
          <View style={styles.counterBL}>
            <PhotoCounter label={t('home.photoCount', { n: 1, total: post.photoCount })} />
          </View>
        ) : null}
      </Pressable>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('home.acorns', { count: acorns })} accessibilityState={{ selected: given }} onPress={toggleGiven} style={styles.count}>
          <AcornIcon size={24} filled={!!given} />
          <Text variant="Body/S Strong">{String(acorns)}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('home.comments', { count: post.comments })} onPress={onComments} style={styles.count}>
          <Icon icon={MessageCircle} size={24} />
          <Text variant="Body/S Strong">{String(post.comments)}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('home.share')} onPress={onShare}>
          <Icon icon={Share} size={24} />
        </Pressable>
        <View style={styles.spacer} />
        <Pressable accessibilityRole="button" accessibilityLabel={t('home.save')} accessibilityState={{ selected: saved }} onPress={toggleSaved}>
          <Bookmark size={24} strokeWidth={1.6} absoluteStrokeWidth color={color('fg/default')} fill={saved ? color('fg/default') : 'none'} />
        </Pressable>
      </View>
      <View style={styles.caption}>
        <Text variant="Body/S" numberOfLines={1}>{post.caption}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  post: { paddingBottom: space[24] },
  header: { flexDirection: 'row', alignItems: 'center', gap: space[10], paddingLeft: space[20], paddingRight: space[16], paddingVertical: space[12] },
  avatar: { width: 40, height: 40, borderRadius: radius.full, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  author: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space[10] },
  who: { flex: 1, justifyContent: 'center', gap: space[2] }, // Figma gap 1 → nearest token
  media: { height: 402, marginHorizontal: space[20], borderRadius: radius['2xl'], overflow: 'hidden' }, // Media 119:620 — 350×402, radius 32
  // Media padding 18 18 16 18 (Figma component value)
  tagTL: { position: 'absolute', left: 18, top: 18 },
  counterBL: { position: 'absolute', left: 18, bottom: space[16] },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space[16], paddingTop: space[12], paddingBottom: space[8], paddingHorizontal: space[20] },
  count: { flexDirection: 'row', alignItems: 'center', gap: space[6] },
  spacer: { flex: 1 },
  caption: { paddingHorizontal: space[20] },
});
