import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, MapPin, MoreHorizontal, Search, X, type LucideIcon } from '../icons/ongdal';
import { Bookmark, MessageCircle } from '../icons/ongdal';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { displayTemp } from '../../lib/prefs';
import { timeAgo } from '../../lib/time';
import type { CardDish, CookCard, Question, ViralItem } from '../../services/community';
import { iconRing, iconStroke, radius, space, text, useTheme, withAlpha, FONT_SCALE_MAX } from '../../theme';
import { AcornIcon } from '../AcornIcon';
import { Button } from '../Button';
import { DishTile } from '../dish/DishTile';
import { fetchMyMarks, setAcorn } from '../../services/foods';
import { Icon } from '../Icon';
import { Text } from '../Text';
import { postPlace } from '../../services/location';
import { myUserId } from '../../lib/supabase';
import { reportQuestion } from '../../services/community';
import { ReportSheet } from '../dish/ReportSheet';

const FLAGS: Record<string, number> = {
  CA: require('../../../assets/flags/CA.png'), CN: require('../../../assets/flags/CN.png'), DE: require('../../../assets/flags/DE.png'), ES: require('../../../assets/flags/ES.png'),
  FR: require('../../../assets/flags/FR.png'), GB: require('../../../assets/flags/GB.png'), IE: require('../../../assets/flags/IE.png'),
  IN: require('../../../assets/flags/IN.png'), IT: require('../../../assets/flags/IT.png'), JP: require('../../../assets/flags/JP.png'),
  KR: require('../../../assets/flags/KR.png'), MX: require('../../../assets/flags/MX.png'), TH: require('../../../assets/flags/TH.png'),
  US: require('../../../assets/flags/US.png'), VN: require('../../../assets/flags/VN.png'),
  AU: require('../../../assets/flags/AU.png'), BR: require('../../../assets/flags/BR.png'), CL: require('../../../assets/flags/CL.png'),
  IR: require('../../../assets/flags/IR.png'), NZ: require('../../../assets/flags/NZ.png'), SE: require('../../../assets/flags/SE.png'),
};
/** Flag image for an ISO country code (20×14 assets), or undefined. */
export const flagSource = (code: string) => FLAGS[code.toUpperCase()];

/** Flag Tag — 20×14 flag (r3) in a 36×24 pill. No fill (Figma removed it). */
export function FlagTag({ code }: { code: string }) {
  const src = FLAGS[code.toUpperCase()];
  if (!src) return null;
  return (
    <View style={styles.flagTag}>
      <Image source={src} style={styles.flag} contentFit="cover" />
    </View>
  );
}

/** Country display name from an ISO code, in the app language. */
export function countryName(code: string, lang: string) {
  try {
    return new Intl.DisplayNames([lang], { type: 'region' }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/**
 * SectionHeader — Title/L, px 20. Title row, right end: optional Badge (pill) then, with `onMore`, a "See more" chevron
 * (ChevronRight 20 · fg/muted by default · 44×44 touch). `moreLabel` = its accessibility label (default "See more").
 */
export function SectionHeader({ title, eyebrow, onMore, moreLabel, badge, moreColor = 'fg/muted', moreSize = 20 }: {
  title: string; eyebrow?: string; onMore?: () => void; moreLabel?: string; badge?: string;
  /** Chevron override — 4.1 Explore uses fg/default (and 24 on Special days). */
  moreColor?: 'fg/muted' | 'fg/default'; moreSize?: 20 | 24;
}) {
  const { color } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.sh}>
      {eyebrow ? <Text variant="Overline" color="fg/accent">{eyebrow}</Text> : null}
      {/* Title row — Title · [Badge (pill bg/subtle · Caption Strong fg/secondary)] · [>], centred on the title, gap 8. */}
      <View style={styles.shTitleRow}>
        <Text variant="Title/L" numberOfLines={1} style={styles.flexShrink}>{title}</Text>
        <View style={styles.flex} />
        {badge ? (
          <View style={[styles.shBadge, { backgroundColor: color('bg/subtle') }]}>
            <Text variant="Caption Strong" color="fg/secondary" numberOfLines={1}>{badge}</Text>
          </View>
        ) : null}
        {onMore ? (
          <Pressable accessibilityRole="button" accessibilityLabel={moreLabel ?? t('following.seeMore')} hitSlop={space[12]} onPress={onMore}>
            <Icon icon={ChevronRight} size={moreSize} color={moreColor} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/** Search Field 48 — bg/muted pill, search 18, clear X; focus ring border/focus. */
export function SearchField({ value, onChangeText, placeholder, onFocus, onBlur, onSubmit, focused, autoFocus }: {
  value: string; onChangeText: (v: string) => void; placeholder: string; onFocus?: () => void; onBlur?: () => void; onSubmit?: () => void; focused?: boolean; autoFocus?: boolean;
}) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const { lineHeight: _lh, ...field } = text['Body/M'];
  return (
    <View style={[styles.search, { backgroundColor: color('bg/muted'), borderColor: focused ? color('border/focus') : 'transparent' }]}>
      <Icon icon={Search} size={18} color="fg/secondary" />
      <TextInput maxFontSizeMultiplier={FONT_SCALE_MAX}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color('fg/muted')}
        onFocus={onFocus}
        onBlur={onBlur}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        autoFocus={autoFocus}
        autoCorrect={false}
        style={[field, styles.flex, { color: color('fg/default') }]}
      />
      {value ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.clear')} hitSlop={space[8]} onPress={() => onChangeText('')}>
          <Icon icon={X} size={18} color="fg/secondary" />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Byline "Cozy · Dinner" from a dish's first mood and meal. */
export function useByline() {
  const { t, i18n } = useTranslation();
  return (d: CardDish, withPlace = false) => {
    const mood = d.moods[0] ? (i18n.exists(`share.moods.${d.moods[0]}`) ? t(`share.moods.${d.moods[0]}`) : d.moods[0]) : null;
    const meal = d.meals[0] ? (i18n.exists(`share.meals.${d.meals[0]}`) ? t(`share.meals.${d.meals[0]}`) : d.meals[0]) : null;
    const place = withPlace ? (({ district, city }) => district ?? city)(postPlace(d, i18n.language)) : null;
    return [mood, meal, place].filter(Boolean).join(' · ') || (d.creator.handle ?? d.creator.name);
  };
}

/** Two-column grid of Food Cards (gap 16, px 20). */
/** 2-column Dish Tile grid (670:20058) — 4.2 Tag, 4.3 Country, 3.x Nearby: x20 · gap 16 · rows 20. Byline = the tile's own "Comfort · Dinner". */
export function FoodGrid({ dishes, width, onOpen }: { dishes: CardDish[]; width: number; byline?: (d: CardDish) => string; onOpen: (d: CardDish) => void }) {
  const w = (width - space[20] * 2 - space[16]) / 2;
  // Acorn Tag = give / take-back toggle (my marks + my changes since load, so counts move at once).
  const [given, setGiven] = useState<Set<string>>(new Set());
  const [delta, setDelta] = useState<Record<string, number>>({});
  const ids = dishes.map((d) => d.id).join(',');
  useEffect(() => {
    if (!ids) return;
    let alive = true;
    fetchMyMarks(ids.split(',')).then((m) => { if (alive) { setGiven(m.given); setDelta({}); } }).catch(() => undefined);
    return () => { alive = false; };
  }, [ids]);
  const givenRef = useRef(given);
  givenRef.current = given;
  // One handler per dish id that lives across renders and always calls the latest onOpen with the latest dish,
  // so the memoized tiles don't re-render just because the parent passed a new arrow function.
  const latest = useRef({ onOpen, dishes });
  latest.current = { onOpen, dishes };
  const handlers = useRef(new Map<string, { press: () => void; acorn: () => void }>()).current;
  const handlersOf = (id: string) => {
    let f = handlers.get(id);
    if (!f) {
      f = {
        press: () => { const d = latest.current.dishes.find((x) => x.id === id); if (d) latest.current.onOpen(d); },
        acorn: () => {
          const on = !givenRef.current.has(id);
          const apply = (sign: number) => {
            setGiven((s) => { const n = new Set(s); if (on === sign > 0) n.add(id); else n.delete(id); return n; });
            setDelta((d) => ({ ...d, [id]: (d[id] ?? 0) + (on ? 1 : -1) * sign }));
          };
          apply(1);
          setAcorn(id, on).catch(() => apply(-1));
        },
      };
      handlers.set(id, f);
    }
    return f;
  };
  return (
    <View style={styles.grid}>
      {dishes.map((d) => {
        const h = handlersOf(d.id);
        return <DishTile key={d.id} dish={d} width={w} onPress={h.press} given={given.has(d.id)} acorns={d.acorns + (delta[d.id] ?? 0)} onAcorn={h.acorn} />;
      })}
    </View>
  );
}

/**
 * Food Card · Row (12:384 · 4.1 1113:25996) — 80 thumb r16 · 14 · [Overline eyebrow → 4 → (Title/S → 3 → Caption)] ·
 * bookmark 24 fg/default. Text fg/default (4.1 instances).
 */
export function FoodRow({ dish, eyebrow, byline, saved, onSave, onPress, onMore }: { dish: CardDish; eyebrow: string; byline: string; saved?: boolean; onSave?: () => void; onPress: () => void; onMore?: () => void }) {
  const { color } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={dish.name} onPress={onPress} style={styles.row}>
      <Image source={{ uri: dish.photo }} style={[styles.rowThumb, { backgroundColor: color('bg/muted') }]} contentFit="cover" transition={150} />
      <View style={[styles.flex, styles.rowMeta]}>
        <Text variant="Overline" numberOfLines={1}>{eyebrow}</Text>
        <View style={styles.rowName}>
          <Text variant="Title/S" numberOfLines={1}>{dish.name}</Text>
          <Text variant="Caption" numberOfLines={1}>{byline}</Text>
        </View>
      </View>
      {onSave ? (
        <Pressable accessibilityRole="button" accessibilityState={{ selected: !!saved }} hitSlop={space[10]} onPress={onSave}>
          <Bookmark size={24} strokeWidth={iconStroke(24)} absoluteStrokeWidth color={color('fg/default')} fill={saved ? color('fg/default') : 'none'} />
        </Pressable>
      ) : null}
      {onMore ? <MoreButton onPress={onMore} /> : null}
    </Pressable>
  );
}

/** ⋯ 20 (fg/muted) — opens the report / block sheet for someone else's post. */
export function MoreButton({ onPress, color: tone = 'fg/muted' }: { onPress: () => void; color?: 'fg/muted' | 'fg/on-photo' }) {
  const { t } = useTranslation();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={t('home.more')} hitSlop={space[12]} onPress={onPress}>
      <Icon icon={MoreHorizontal} size={20} color={tone} />
    </Pressable>
  );
}

/** My user id (null until known / signed out) — so ⋯ (report · block) is never offered on my own posts. */
export function useMyId() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => { myUserId().then(setId).catch(() => undefined); }, []);
  return id;
}

export type ReportTarget = { kind: 'dish' | 'question'; id: string; owner: { id: string; name: string; handle?: string | null } };

/**
 * One report / block sheet for a screen (7.3 ReportSheet): `open(target)` from any card's ⋯. Reporting a dish or a
 * question; "Block" calls `onBlocked(ownerId)` so the screen reloads — RLS (is_blocked_between) then leaves that
 * cook's posts and questions out of every section.
 */
export function useReportMenu(onBlocked: (ownerId: string) => void) {
  const { t } = useTranslation();
  const [target, setTarget] = useState<ReportTarget | null>(null);
  const close = useCallback(() => setTarget(null), []);
  const sheet = (
    <ReportSheet
      visible={!!target}
      title={target?.kind === 'question' ? t('questions.reportTitle') : undefined}
      foodId={target?.kind === 'dish' ? target.id : undefined}
      ownerId={target?.owner.id ?? ''}
      ownerName={target?.owner.handle ?? target?.owner.name ?? ''}
      onClose={close}
      onBlocked={() => { const who = target?.owner.id; setTarget(null); if (who) onBlocked(who); }}
      onReport={target?.kind === 'question' ? (reason) => reportQuestion(target.id, target.owner.id, reason) : undefined}
    />
  );
  return { open: setTarget, sheet };
}

/** Photo card with Card scrim (Country Card 280×180 r32 / Story Card 350×400). */
/** `scrim`: 'story' = bottom half fades to ink (Story Card); 'bottom' = 120 pt fade to ink at the bottom only (Country Card). */
export function PhotoCard({ photo, width, height, children, onPress, label, style, scrim = 'story' }: { photo: string; width: number; height: number; children: ReactNode; onPress: () => void; label: string; style?: StyleProp<ViewStyle>; scrim?: 'story' | 'bottom' }) {
  const { color } = useTheme();
  const ink = color('static/ink');
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.photoCard, { width, height, backgroundColor: color('bg/muted') }, style]}>
      <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      {scrim === 'bottom' ? (
        <LinearGradient colors={[withAlpha(ink, 0), withAlpha(ink, 0.7)]} style={styles.bottomScrim} pointerEvents="none" />
      ) : (
        <LinearGradient colors={[withAlpha(ink, 0), withAlpha(ink, 0.82)]} locations={[0.5, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      )}
      {children}
    </Pressable>
  );
}

/** Avatar circle with initial fallback. */
export function Avatar({ url, name, size = 32 }: { url: string | null; name: string; size?: number }) {
  const { color } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: radius.full, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: color('bg/accent-subtle') }}>
      {url ? <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Text variant="Caption Strong" color="fg/accent">{name.slice(0, 1).toUpperCase()}</Text>}
    </View>
  );
}

/** Overlapping faces (members / participants). */
export function Faces({ people, size = 24 }: { people: { id: string; avatarUrl: string | null; name: string }[]; size?: number }) {
  const { color } = useTheme();
  return (
    <View style={styles.faces}>
      {people.map((p, i) => (
        <View key={p.id || i} style={[{ marginLeft: i ? -size / 3 : 0, borderRadius: radius.full, borderWidth: 1.5, borderColor: color('bg/default') }]}>
          <Avatar url={p.avatarUrl} name={p.name} size={size} />
        </View>
      ))}
    </View>
  );
}

/** Question Card — author · place · time · category pill / body / answers · me too. */
/** `style` overrides the card box (Explore · Our area: its shared box — no border, 2xl). `showImage`: 4:5 photo, full card width. */
/** Question Card — avatar · name · place · time → question → photo (showImage) → answers. No category badge or Me too (4.1). */
export function QuestionCard({ q, onPress, showImage, style }: { q: Question; onPress?: () => void; showImage?: boolean; style?: StyleProp<ViewStyle> }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  return (
    <Pressable accessibilityRole="button" disabled={!onPress} onPress={onPress} style={[styles.qCard, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }, style]}>
      <View style={styles.qTop}>
        <Avatar url={q.author.avatarUrl} name={q.author.name} size={32} />
        <View style={styles.flex}>
          <Text variant="Body/S Strong" numberOfLines={1}>{q.author.handle ?? q.author.name}</Text>
          <View style={styles.qPlace}>
            {q.place || q.range ? <Icon icon={MapPin} size={12} color="fg/muted" /> : null}
            {/* `range`: a question from a wider range than your cell (Our area) — its district / city, set apart. */}
            <Text variant="Caption" color="fg/muted" numberOfLines={1}>
              {q.range ? <Text variant="Caption Strong" color="fg/secondary">{q.range}</Text> : null}
              {q.range ? ' · ' : ''}
              {[q.range ? null : q.place, timeAgo(q.createdAt, t)].filter(Boolean).join(' · ')}
            </Text>
          </View>
        </View>
      </View>
      <Text variant="Body/M">{q.body}</Text>
      {showImage && q.imageUrl ? <Image source={{ uri: q.imageUrl }} style={styles.qImage} contentFit="cover" /> : null}
      {/* Action Count 288:7681 (3.8 card 1242:10017) — message-circle 24 · count Body/S Strong fg/default, gap 6. */}
      <View style={styles.qFoot}>
        <View style={styles.qStat} accessible accessibilityLabel={t('ask.answers', { count: q.answers })}>
          <Icon icon={MessageCircle} size={24} />
          <Text variant="Body/S Strong">{String(q.answers)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

/** Cook row (4.6 / suggested) — avatar 40 · handle · "City · weather temp" · acorns · Follow / Following. */
export function CookRow({ cook, onPress, onFollow, last }: { cook: CookCard; onPress: () => void; onFollow: () => void; last?: boolean }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const weather = cook.mood ? `${t(`weather.${cook.mood}`).toLowerCase()}${cook.tempC != null ? ` ${displayTemp(cook.tempC)}°` : ''}` : null;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.cookRow, !last && { borderBottomWidth: 1, borderBottomColor: color('border/default') }]}>
      <Avatar url={cook.avatarUrl} name={cook.name} size={40} />
      <View style={[styles.flex, { gap: space[2] }]}>
        <Text variant="Body/M Strong" numberOfLines={1}>{cook.handle ?? cook.name}</Text>
        <Text variant="Caption" color="fg/muted" numberOfLines={1}>{[cook.city, weather].filter(Boolean).join(' · ')}</Text>
        <View style={styles.qStat}>
          <AcornIcon size={14} filled />
          <Text variant="Caption Strong">{t('profile.acorns', { count: cook.acorns })}</Text>
        </View>
      </View>
      <FollowButton following={cook.following} onPress={onFollow} />
    </Pressable>
  );
}

/** Follow / Following — Button S (Cook Row: Primary → Secondary when following; Cook Card: Outline). */
export function FollowButton({ following, onPress, outline }: { following: boolean; onPress: () => void; outline?: boolean }) {
  const { t } = useTranslation();
  return <Button label={t(following ? 'cook.following' : 'cook.follow')} size="S" variant={following ? 'Secondary' : outline ? 'Outline' : 'Primary'} onPress={onPress} style={outline ? styles.stretch : undefined} />;
}

/** Grouped list surface — bg/subtle, r24, rows separated by border/default. */
export function ListCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { color } = useTheme();
  return <View style={[styles.listCard, { backgroundColor: color('bg/subtle') }, style]}>{children}</View>;
}

/** List row with leading tile, title, sub, trailing slot or chevron. */
export function ListRow({ leading, title, sub, trailing, onPress, last, muted }: { leading?: ReactNode; title: ReactNode; sub?: string; trailing?: ReactNode; onPress?: () => void; last?: boolean; muted?: boolean }) {
  // Table Row / list rows: padding 12 14 12 12, gap 12.
  const { color } = useTheme();
  return (
    <Pressable accessibilityRole="button" disabled={!onPress} onPress={onPress} style={[styles.listRow, !last && { borderBottomWidth: 1, borderBottomColor: color('border/default') }]}>
      {leading}
      <View style={[styles.flex, { gap: space[2] }]}>
        {typeof title === 'string' ? <Text variant="Title/S" color={muted ? 'fg/secondary' : 'fg/default'} numberOfLines={1}>{title}</Text> : title}
        {sub ? <Text variant="Caption" color="fg/muted" numberOfLines={2}>{sub}</Text> : null}
      </View>
      {trailing ?? (onPress ? <Icon icon={ChevronRight} size={18} /> : null)}
    </Pressable>
  );
}

/**
 * Empty state. size L (3.2 / 3.3): 88 orb bg/subtle + border, icon 36, Display/M, Body/M, gap 14, padding 48 40.
 * size M (4.4b / 4.4c): 72 orb bg/muted, icon 30, Title/L, Body/S, gap 12, padding 40 40 32.
 */
export function EmptyState({ icon, title, body, children, size = 'M' }: { icon: LucideIcon; title: string; body?: string; children?: ReactNode; size?: 'L' | 'M' }) {
  const { color } = useTheme();
  const L = size === 'L';
  return (
    <View style={[styles.empty, L ? styles.emptyL : styles.emptyM]}>
      <View style={[L ? styles.orbL : styles.orbM, { backgroundColor: color(L ? 'bg/subtle' : 'bg/muted') }, L && { borderWidth: iconRing, borderColor: color('border/default') }]}>
        <Icon icon={icon} size={L ? 36 : 30} />
      </View>
      <Text variant={L ? 'Display/M' : 'Title/L'} style={styles.center}>{title}</Text>
      {body ? <Text variant={L ? 'Body/M' : 'Body/S'} color="fg/secondary" style={styles.center}>{body}</Text> : null}
      {children}
    </View>
  );
}

/** Viral badge (4.1 / 4.7) — pill p4 10 · radius full · Caption Strong fg/inverse: rising = bg/kick, editor pick = bg/inverse. */
export function ViralBadge({ item }: { item: Pick<ViralItem, 'kind' | 'growth'> }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const rising = item.kind === 'rising';
  return (
    <View style={[styles.viralBadge, { backgroundColor: color(rising ? 'bg/kick' : 'bg/inverse') }]}>
      <Text variant="Caption Strong" color="fg/inverse" numberOfLines={1}>
        {rising ? t('viral.rising', { n: (item.growth ?? 0).toLocaleString() }) : t('viral.editor')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  viralBadge: { flexShrink: 1, paddingHorizontal: space[10], paddingVertical: space[4], borderRadius: radius.full },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  flagTag: { paddingHorizontal: space[8], paddingVertical: space[4], borderRadius: radius.full, alignSelf: 'flex-start' },
  flag: { width: 20, height: 14, borderRadius: 3 },
  sh: { paddingHorizontal: space[20] },
  shTitleRow: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  flexShrink: { flexShrink: 1 },
  shBadge: { flexShrink: 1, paddingHorizontal: space[10], paddingVertical: space[4], borderRadius: radius.full },
  search: { height: 48, borderRadius: radius.full, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: space[10], paddingHorizontal: space[16] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space[16], rowGap: space[20], paddingHorizontal: space[20] },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[14] },
  rowThumb: { width: 80, height: 80, borderRadius: radius.lg },
  rowMeta: { gap: space[4] },
  rowName: { gap: 3 },
  photoCard: { borderRadius: radius['2xl'], overflow: 'hidden' },
  bottomScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 },
  faces: { flexDirection: 'row', alignItems: 'center' },
  qCard: { borderRadius: radius.lg, borderWidth: 1, padding: space[16], gap: space[12] },
  qTop: { flexDirection: 'row', alignItems: 'center', gap: space[10] },
  qPlace: { flexDirection: 'row', alignItems: 'center', gap: space[4] },
  qImage: { width: '100%', aspectRatio: 4 / 5, borderRadius: radius.md }, // 4:5 like the post photos
  qFoot: { flexDirection: 'row', gap: space[16] },
  qStat: { flexDirection: 'row', alignItems: 'center', gap: space[6] },
  cookRow: { flexDirection: 'row', alignItems: 'center', gap: space[12], paddingLeft: space[16], paddingRight: space[14], paddingVertical: space[12] },
  stretch: { alignSelf: 'stretch' },
  listCard: { borderRadius: radius.lg, overflow: 'hidden' },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: space[12], paddingLeft: space[12], paddingRight: space[14], paddingVertical: space[12] },
  empty: { alignItems: 'center', paddingHorizontal: space[40] },
  emptyL: { gap: space[14], paddingTop: 48 },
  emptyM: { gap: space[12], paddingTop: space[40], paddingBottom: space[32] },
  orbL: { width: 88, height: 88, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  orbM: { width: 72, height: 72, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
});
