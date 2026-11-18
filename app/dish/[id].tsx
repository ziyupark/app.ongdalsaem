import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { goTab } from '../../src/components/TabBar';
import { StatusBar } from 'expo-status-bar';
import { ChefHat, ChevronLeft, ChevronRight, Timer, Utensils, WifiOff } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { AddToPlanSheet } from '../../src/components/profile/WeekPlan';
import { CommentsInline } from '../../src/components/dish/CommentsInline';
import { DishTile } from '../../src/components/dish/DishTile';
import { type DishViewData } from '../../src/components/dish/DishView';
import { PostView } from '../../src/components/dish/PostView';
import { ReportSheet } from '../../src/components/dish/ReportSheet';
import { ShareSheet } from '../../src/components/dish/ShareSheet';
import { Icon } from '../../src/components/Icon';
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
import { iconRing, radius, space, useTheme } from '../../src/theme';

type State = { kind: 'loading' } | { kind: 'missing' } | { kind: 'ready'; dish: Dish };

/**
 * 7.1 Post detail (601:12935) · 7.1b Ate it (601:13046) · 7.3 Report/block · 7.4 Share.
 * Comments sit inline below the action bar; `?comments=1` scrolls to them.
 */
export default function PostDetail() {
  const { id, comments: openComments } = useLocalSearchParams<{ id: string; comments?: string }>();
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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
        if (alive) setState({ kind: 'missing' });
      }
    })();
    return () => { alive = false; };
  }, [id, reloadKey]);

  const dish = state.kind === 'ready' ? state.dish : null;
  const mine = !!dish && !!me && dish.creator.id === me.id;

  const view = useMemo<DishViewData | null>(() => {
    if (!dish) return null;
    const where = dish.placeName ?? [dish.neighborhood, dish.city].filter(Boolean).join(', ');
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
    await startTimer(st.text.length > 40 ? `${st.text.slice(0, 40)}…` : st.text, st.timerSec, {
      foodId: dish.id, dishName: dish.name, step: i + 1, stepCount: dish.steps.length, next: dish.steps[i + 1]?.text,
    });
    goTab('timer');
  };

  const cookAlong = () => {
    if (!dish) return;
    const first = dish.steps.findIndex((s) => !!s.timerSec);
    if (first >= 0) return startStep(first);
    goTab('timer');
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
        <StatusBar style="auto" />
        <View style={styles.backRow}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={space[8]} onPress={() => router.back()}>
            <Icon icon={ChevronLeft} size={24} />
          </Pressable>
        </View>
        <View style={styles.center}>
          {state.kind === 'loading' ? <ActivityIndicator color={color('fg/muted')} /> : (
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
  const openAuthor = () => (mine ? goTab('profile') : router.push(`/cook/${dish.creator.id}`));
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('dish.cookAlong')}
        onPress={cookAlong}
        style={[styles.cook, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}
      >
        <Icon icon={Timer} size={22} />
      </Pressable>
    </>
  );

  const comments = (
    <CommentsInline
      foodId={dish.id}
      allowComments={dish.allowComments || mine}
      me={me ? { id: me.id, name: me.displayName ?? me.username ?? '', avatarUrl: me.avatarUrl } : null}
      dishOwnerId={dish.creator.id}
      onCountChange={onCount}
    />
  );

  // "I made this" opens the share flow with this recipe's name and ingredients; the new post keeps cooked_from_id.
  const canCookThis = !mine && dish.type === 'home' && dish.ingredients.length > 0;
  const madeThis = () => {
    resetShareDraft();
    updateShareDraft({ type: 'home', name: dish.name, ingredients: dish.ingredients.map((i) => ({ name: i.name, amount: i.amount })), cookedFromId: dish.id });
    router.push('/share/pick');
  };
  const cookedFrom = mine && dish.cookedFromId && recipeAuthor && recipeAuthor.id !== me?.id ? (
    <Pressable accessibilityRole="link" onPress={() => router.push(`/dish/${dish.cookedFromId}`)} style={[styles.fromLink, { backgroundColor: color('bg/subtle'), borderColor: color('border/default') }]}>
      <Icon icon={ChefHat} size={18} color="fg/accent" />
      <Text variant="Body/S Strong" style={styles.flex} numberOfLines={1}>{t('dish.cookedFromRecipe', { name: recipeAuthor.handle ?? recipeAuthor.name })}</Text>
      <Icon icon={ChevronRight} size={18} color="fg/secondary" />
    </Pressable>
  ) : null;
  const made = cookedBy?.cooks || canCookThis || cookedFrom ? (
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
      {canCookThis ? <View style={styles.px}><Button label={t('dish.madeThis')} icon={ChefHat} variant="Outline" size="M" onPress={madeThis} /></View> : null}
    </View>
  ) : null;

  const moreFrom = more.length ? (
    <View style={styles.more}>
      <View style={styles.moreHead}>
        <Text variant="Title/L" style={styles.flex} numberOfLines={1}>{t('dish.moreFrom', { name: firstName })}</Text>
        <Pressable accessibilityRole="button" onPress={openAuthor}>
          <Text variant="Body/S Strong" color="fg/muted">{t('dish.seeAll')}</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moreRow}>
        {more.map((m) => <DishTile key={m.id} dish={m} width={128} onPress={() => router.push(`/dish/${m.id}`)} />)}
      </ScrollView>
    </View>
  ) : null;

  return (
    <View style={[styles.root, { backgroundColor: color('bg/default') }]}>
      <StatusBar style="auto" />
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
        banner={offline ? (
          <View style={[styles.offline, { backgroundColor: color('bg/inverse') }]}>
            <Icon icon={WifiOff} size={18} color="fg/inverse" />
            <Text variant="Body/S Strong" color="fg/inverse" style={styles.flex}>{t('dish.offlineCopy')}</Text>
          </View>
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
  offline: { flexDirection: 'row', alignItems: 'center', gap: space[10], paddingHorizontal: space[16], paddingVertical: space[12], borderRadius: 30 },
  more: { paddingTop: space[32], gap: space[8] },
  px: { paddingHorizontal: space[20] },
  made: { paddingTop: space[32], gap: space[16] },
  madeList: { gap: space[10] },
  madeRow: { gap: space[12], paddingHorizontal: space[20] },
  madeItem: { width: 64, alignItems: 'center', gap: space[4] },
  madePhoto: { width: 56, height: 56, borderRadius: radius.full },
  fromLink: { flexDirection: 'row', alignItems: 'center', gap: space[10], paddingHorizontal: space[16], paddingVertical: space[12], borderRadius: radius.lg, borderWidth: 1 },
  moreHead: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: space[20], gap: space[12] },
  moreRow: { gap: space[16], paddingHorizontal: space[20] },
  ate: { flex: 1, height: 52, borderRadius: radius.full, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[8] },
  dim: { opacity: 0.7 },
  cook: { width: 48, height: 48, borderRadius: radius.full, borderWidth: iconRing, alignItems: 'center', justifyContent: 'center' },
});
