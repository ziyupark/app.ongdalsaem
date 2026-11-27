import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { goTab } from '../../src/components/TabBar';
import { ChefHat, ChevronLeft, ChevronRight, Utensils } from '../../src/components/icons/ongdal';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddToPlanSheet } from '../../src/components/profile/WeekPlan';
import { SectionHeader } from '../../src/components/community/Parts';
import { CommentsInline } from '../../src/components/dish/CommentsInline';
import { DishTile } from '../../src/components/dish/DishTile';
import { type DishViewData } from '../../src/components/dish/DishView';
import { PostView } from '../../src/components/dish/PostView';
import { ReportSheet } from '../../src/components/dish/ReportSheet';
import { ShareSheet } from '../../src/components/dish/ShareSheet';
import { Icon } from '../../src/components/Icon';
import { ScreenWash, useScreenInk } from '../../src/components/ScreenHeader';
import { useWashScroll } from '../../src/lib/useWashScroll';
import { InlineBanner } from '../../src/components/InlineBanner';
import { Text } from '../../src/components/Text';
import { Toast } from '../../src/components/Toast';
import { isPresetMeal } from '../../src/lib/tags';
import { timeAgo } from '../../src/lib/time';
import { cached } from '../../src/lib/cache';
import { resetShareDraft, takeEditSaved, updateShareDraft } from '../../src/lib/shareDraft';
import { startTimer } from '../../src/lib/timers';
import {
  ateToday as fetchAteToday, deleteDish, editDraftFrom, fetchCookedFrom, fetchDish, fetchMoreFrom, fetchRecipeAuthor, fetchMyMarks, logEaten, setAcorn, setSaved, unlogEaten, type Dish, type DishSummary, type Person,
} from '../../src/services/foods';
import { getMyProfile, type MyProfile } from '../../src/services/profile';
import { radius, space, useTheme } from '../../src/theme';
import { LoadError } from '../../src/components/LoadError';
import { postPlaceLine } from '../../src/services/location';

// 'error' = offline with no saved copy / server error (Try again); 'missing' = the dish really isn't there.
type State = { kind: 'loading' } | { kind: 'missing' } | { kind: 'error' } | { kind: 'ready'; dish: Dish };

/**
 * 7.1 Post detail (601:12935) · 7.1b Ate it (601:13046) · 7.3 Report/block · 7.4 Share.
 * Comments sit inline below the action bar; `?comments=1` scrolls to them.
 */
export default function PostDetail() {
  const { id, comments: openComments } = useLocalSearchParams<{ id: string; comments?: string }>();
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  // My current weather behind the post: the wash + weather motion, drawn in this (opaque, pushed) screen.
  const wash = useWashScroll();
  const backInk = useScreenInk(0.08);
  const cookInk = useScreenInk(0.2);
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [more, setMore] = useState<DishSummary[]>([]);
  // "I made this": who cooked from this recipe · the recipe this one was cooked from.
  const [cookedBy, setCookedBy] = useState<Awaited<ReturnType<typeof fetchCookedFrom>> | null>(null);
  const [recipeAuthor, setRecipeAuthor] = useState<Person | null>(null);
  const [me, setMe] = useState<MyProfile | null>(null);
  const [given, setGiven] = useState(false);
  const [saved, setSavedState] = useState(false);
  const [acorns, setAcorns] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [eaten, setEaten] = useState(0);
  const [ate, setAte] = useState(false);
  const [toast, setToast] = useState(false);
  // Edit mode: after "Save changes" the post reloads (`reloadKey`) and a "Changes saved" toast shows.
  const [reloadKey, setReloadKey] = useState(0);
  const [savedToast, setSavedToast] = useState(false);
  useFocusEffect(useCallback(() => {
    if (id && takeEditSaved(String(id))) { setReloadKey((k) => k + 1); setSavedToast(true); }
  }, [id]));
  const [offline, setOffline] = useState(false);
  const [sheet, setSheet] = useState<'report' | 'share' | 'plan' | null>(null);
  const [planToast, setPlanToast] = useState(false);
  // Picked ingredients → shopping memo: "Added n" toast; tap → Profile · Diary's shopping memo.
  const [shopToast, setShopToast] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [{ data: dish, stale }, profile] = await Promise.all([cached(`dish.${id}`, () => fetchDish(id)), getMyProfile().catch(() => null)]);
        setOffline(stale);
        if (!alive) return;
        setMe(profile);
        if (!dish) return setState({ kind: 'missing' });
        const [marks, ateNow] = await Promise.all([fetchMyMarks([dish.id]).catch(() => ({ given: new Set<string>(), saved: new Set<string>() })), fetchAteToday(dish.id).catch(() => false)]);
        if (!alive) return;
        setGiven(marks.given.has(dish.id));
        setSavedState(marks.saved.has(dish.id));
        setAte(ateNow);
        setAcorns(dish.acorns);
        setCommentCount(dish.comments);
        setEaten(dish.eaten);
        setState({ kind: 'ready', dish });
        fetchMoreFrom(dish.creator.id, dish.id).then((m) => alive && setMore(m)).catch(() => undefined);
        fetchCookedFrom(dish.id).then((c) => alive && setCookedBy(c)).catch(() => undefined);
        if (dish.cookedFromId) fetchRecipeAuthor(dish.cookedFromId).then((p) => alive && setRecipeAuthor(p)).catch(() => undefined);
        else setRecipeAuthor(null);
      } catch {
        if (alive) setState({ kind: 'error' });
      }
    })();
    return () => { alive = false; };
  }, [id, reloadKey]);

  const dish = state.kind === 'ready' ? state.dish : null;
  const mine = !!dish && !!me && dish.creator.id === me.id;

  const view = useMemo<DishViewData | null>(() => {
    if (!dish) return null;
    const where = dish.placeName ?? postPlaceLine(dish);
    return {
      id: dish.id,
      photos: dish.photos.map((uri) => ({ uri })),
      name: dish.name,
      mood: dish.mood,
      tempC: dish.tempC,
      acorns,
      comments: commentCount,
      authorName: dish.creator.handle ?? dish.creator.name,
      authorAvatar: dish.creator.avatarUrl ? { uri: dish.creator.avatarUrl } : null,
      meta: [where, timeAgo(dish.createdAt, t)].filter(Boolean).join(' · '),
      caption: dish.description,
      meals: dish.meals,
      moods: dish.moods,
      ingredients: dish.ingredients,
      steps: dish.steps,
      calories: dish.calories,
      servings: dish.servings,
      cookMinutes: dish.cookMinutes,
      difficulty: dish.difficulty,
    };
  }, [dish, acorns, commentCount, t]);

  const toggleAcorn = async () => {
    if (!dish) return;
    const on = !given;
    setGiven(on);
    setAcorns((n) => n + (on ? 1 : -1));
    try { await setAcorn(dish.id, on); } catch { setGiven(!on); setAcorns((n) => n + (on ? -1 : 1)); }
  };

  const toggleSave = async () => {
    if (!dish) return;
    const on = !saved;
    setSavedState(on);
    try { await setSaved(dish.id, on); } catch { setSavedState(!on); }
  };

  const undoAte = async () => {
    if (!dish) return;
    setToast(false);
    setAte(false);
    setEaten((n) => Math.max(0, n - 1));
    try { await unlogEaten(dish.id); } catch { setAte(true); setEaten((n) => n + 1); }
  };
  const toggleAte = async () => {
    if (!dish) return;
    if (ate) return undoAte();
    setAte(true);
    setEaten((n) => n + 1);
    try {
      const added = await logEaten(dish);
      if (!added) setEaten((n) => n - 1);
      setToast(true);
    } catch {
      setAte(false);
      setEaten((n) => n - 1);
    }
  };

  const startStep = async (i: number) => {
    if (!dish) return;
    const st = dish.steps[i];
    if (!st?.timerSec) return;
    // The step's text is the timer's name (5.1_0 food name). Pushed over this post, so back returns here.
    await startTimer(st.text, st.timerSec, {
      foodId: dish.id, dishName: dish.name, step: i + 1, stepCount: dish.steps.length, next: dish.steps[i + 1]?.text,
    });
    router.push('/cook-timer');
  };

  const onMore = () => {
    if (!dish) return;
    if (!mine) {
      return Alert.alert(dish.name, undefined, [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('mealPlan.addToPlan'), onPress: () => setSheet('plan') },
        { text: t('report.send'), style: 'destructive', onPress: () => setSheet('report') },
      ]);
    }
    Alert.alert(dish.name, undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('mealPlan.addToPlan'), onPress: () => setSheet('plan') },
      {
        // Edit = the share flow prefilled from this post (?edit=<id>); weather and created_at stay as they were.
        text: t('post.edit'),
        onPress: () => {
          resetShareDraft();
          updateShareDraft(editDraftFrom(dish));
          router.push({ pathname: '/share/pick', params: { edit: dish.id } });
        },
      },
      {
        text: t('dish.delete'),
        style: 'destructive',
        onPress: () =>
          Alert.alert(t('dish.deleteTitle'), t('dish.deleteBody'), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('dish.delete'), style: 'destructive', onPress: async () => { try { await deleteDish(dish.id); router.back(); } catch { Alert.alert(t('dish.deleteFailed')); } } },
          ]),
      },
    ]);
  };

  const onCount = useCallback((n: number) => setCommentCount(n), []);
  const hideToast = useCallback(() => setToast(false), []);
  const hideSavedToast = useCallback(() => setSavedToast(false), []);
  const hidePlanToast = useCallback(() => setPlanToast(false), []);
  const hideShopToast = useCallback(() => setShopToast(0), []);

  if (state.kind !== 'ready' || !view || !dish) {
    return (
      <View style={[styles.root, { backgroundColor: color('bg/default'), paddingTop: insets.top }]}>
        <ScreenWash wash={wash} local motion />
        <View style={styles.backRow}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={space[8]} onPress={() => router.back()}>
            <Icon icon={ChevronLeft} size={24} color={backInk?.strong} />
          </Pressable>
        </View>
        <View style={styles.center}>
          {state.kind === 'loading' ? <ActivityIndicator color={color('fg/muted')} /> : state.kind === 'error' ? (
            <LoadError onRetry={() => { setState({ kind: 'loading' }); setReloadKey((k) => k + 1); }} />
          ) : (
            <>
              <Text variant="Title/S">{t('dish.missingTitle')}</Text>
              <Text variant="Body/S" color="fg/muted">{t('dish.missingBody')}</Text>
            </>
          )}
        </View>
      </View>
    );
  }

  const firstName = dish.creator.name.split(' ')[0];
  // From a post the cook card has no Follow · Message buttons (Profile Header 126:4345).
  const openAuthor = () => (mine ? goTab('profile') : router.push(`/cook/${dish.creator.id}?actions=0`));
  const meal = dish.meals.find(isPresetMeal);

  const actionBar = (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: ate }}
        onPress={toggleAte}
        style={({ pressed }) => [
          styles.ate,
          ate ? { backgroundColor: color('bg/accent-subtle'), borderColor: color('border/accent'), borderWidth: 1 } : { backgroundColor: color('bg/inverse') },
          pressed && { opacity: 0.9 },
        ]}
      >
        <Icon icon={Utensils} size={20} color={ate ? 'fg/accent' : 'fg/inverse'} />
        <Text variant="Button/M" color={ate ? 'fg/accent' : 'fg/inverse'}>{t(ate ? 'dish.youAte' : 'dish.ateThis')}</Text>
        <Text variant="Body/S" color={ate ? 'fg/accent' : 'fg/inverse'} style={styles.dim}>{`· ${eaten}`}</Text>
      </Pressable>
    </>
  );

  const comments = (
    <CommentsInline
      foodId={dish.id}
      allowComments={dish.allowComments || mine}
      me={me ? { id: me.id, name: me.username ?? me.displayName ?? '', avatarUrl: me.avatarUrl } : null}
      dishOwnerId={dish.creator.id}
      onCountChange={onCount}
    />
  );

  const cookedFrom = mine && dish.cookedFromId && recipeAuthor && recipeAuthor.id !== me?.id ? (
    <Pressable accessibilityRole="link" onPress={() => router.push(`/dish/${dish.cookedFromId}`)} style={[styles.fromLink, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
      <Icon icon={ChefHat} size={18} color="fg/accent" />
      <Text variant="Body/S Strong" style={styles.flex} numberOfLines={1}>{t('dish.cookedFromRecipe', { name: recipeAuthor.handle ?? recipeAuthor.name })}</Text>
      <Icon icon={ChevronRight} size={18} color="fg/secondary" />
    </Pressable>
  ) : null;
  const made = cookedBy?.cooks || cookedFrom ? (
    <View style={styles.made}>
      {cookedFrom ? <View style={styles.px}>{cookedFrom}</View> : null}
      {cookedBy?.cooks ? (
        <View style={styles.madeList}>
          <Text variant="Title/M" style={styles.px}>{t('dish.madeBy', { n: cookedBy.cooks })}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.madeRow}>
            {cookedBy.posts.map((p) => (
              <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={p.person.handle ?? p.person.name} onPress={() => router.push(`/dish/${p.id}`)} style={styles.madeItem}>
                <Image source={{ uri: p.photo }} style={[styles.madePhoto, { backgroundColor: color('bg/muted') }]} contentFit="cover" />
                <Text variant="Caption" color="fg/secondary" numberOfLines={1}>{p.person.handle ?? p.person.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  ) : null;

  // More from <name> (601:13045) — py 20 · gap 12: SectionHeader (title + `chevron-right` 20 = See all) → Dish Tile 02 (131) row, gap 8.
  const moreFrom = more.length ? (
    <View style={styles.more}>
      <SectionHeader title={t('dish.moreFrom', { name: firstName })} onMore={openAuthor} moreLabel={t('dish.seeAll')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moreRow}>
        {more.map((m) => <DishTile key={m.id} dish={m} width={131} compact onPress={() => router.push(`/dish/${m.id}`)} />)}
      </ScrollView>
    </View>
  ) : null;

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
      <ScreenWash wash={wash} local motion />
      <PostView
        dish={view}
        given={given}
        saved={saved}
        onAcorn={toggleAcorn}
        onComments={() => undefined}
        onShare={() => setSheet('share')}
        onSave={toggleSave}
        onMore={onMore}
        onAuthor={openAuthor}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
        onStartTimer={startStep}
        onAddedToShopping={setShopToast}
        actionBar={actionBar}
        comments={comments}
        more={made || moreFrom ? <>{made}{moreFrom}</> : null}
        scrollToComments={openComments === '1'}
        onScrollY={wash.onY}
        topInk={cookInk ? { strong: cookInk.strong, muted: cookInk.muted, secondary: cookInk.secondary } : undefined}
        banner={offline ? (
          <InlineBanner text={t('dish.offlineCopy')} />
        ) : undefined}
      />

      <Toast visible={toast} message={t('dish.ateToast')} action={t('dish.undo')} onAction={undoAte} onHide={hideToast} bottom={Math.max(insets.bottom, space[20]) + space[12]} />
      <Toast visible={savedToast} message={t('share.changesSaved')} onHide={hideSavedToast} bottom={Math.max(insets.bottom, space[20]) + space[12]} />

      <Toast visible={shopToast > 0} message={t('shopping.added', { n: shopToast })} onPress={() => { setShopToast(0); goTab('profile', { tab: 'diary', focus: 'shopping', at: String(Date.now()) }); }} onHide={hideShopToast} bottom={Math.max(insets.bottom, space[20]) + space[12]} />
      <Toast visible={planToast} message={t('mealPlan.added')} onHide={hidePlanToast} bottom={Math.max(insets.bottom, space[20]) + space[12]} />
      <AddToPlanSheet visible={sheet === 'plan'} dish={{ id: dish.id, name: dish.name, photo: dish.photo }} onClose={() => setSheet(null)} onAdded={() => { setSheet(null); setPlanToast(true); }} />
      <ShareSheet
        visible={sheet === 'share'}
        dish={{ id: dish.id, name: dish.name, photo: dish.photo, author: dish.creator.handle ?? dish.creator.name, mood: dish.mood, tempC: dish.tempC, meal: meal ? t(`share.meals.${meal}`) : undefined }}
        onClose={() => setSheet(null)}
      />
      {!mine ? (
        <ReportSheet
          visible={sheet === 'report'}
          foodId={dish.id}
          ownerId={dish.creator.id}
          ownerName={firstName}
          onClose={() => setSheet(null)}
          onBlocked={() => router.back()}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backRow: { paddingHorizontal: space[16], paddingVertical: space[12] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[6], paddingHorizontal: space[40] },
  flex: { flex: 1 },
  more: { paddingVertical: space[20], gap: space[12] },
  px: { paddingHorizontal: space[20] },
  made: { paddingTop: space[32], gap: space[16] },
  madeList: { gap: space[10] },
  madeRow: { gap: space[12], paddingHorizontal: space[20] },
  madeItem: { width: 64, alignItems: 'center', gap: space[4] },
  madePhoto: { width: 56, height: 56, borderRadius: radius.full },
  fromLink: { flexDirection: 'row', alignItems: 'center', gap: space[10], paddingHorizontal: space[16], paddingVertical: space[12], borderRadius: radius.lg, borderWidth: 1 },
  moreRow: { gap: space[8], paddingHorizontal: space[20] },
  ate: { flex: 1, height: 52, borderRadius: radius.full, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[8] },
  dim: { opacity: 0.7 },
});
