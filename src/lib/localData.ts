// What a device keeps for the signed-in person (AsyncStorage), cleared when they leave.
// Keys are the ones the modules use (lib/cache · community/Nearby · services/activity · lib/useHere · lib/mealPlan ·
// lib/shopping · lib/fridge · lib/shareDraft).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetRecipeCandidates } from '../services/foods';
import { resetFridge } from './fridge';
import { resetMealPlan } from './mealPlan';
import { resetShareDraft } from './shareDraft';
import { resetShopping } from './shopping';
import { resetHere } from './useHere';

/** Copies of server data and personal history — the next person on this phone must not see them. */
const ON_SIGN_OUT = ['community.recentSearches', 'ongdalsaem.activitySeenAt'];
/** Deleting the account also removes what was only on this phone. Device settings (language, map app,
 *  running timers) stay. */
const ON_DELETE = [...ON_SIGN_OUT, 'here.last', 'ongdalsaem.mealPlan', 'ongdalsaem.shopping', 'ongdalsaem.fridge', 'ongdalsaem.customMoods'];

export async function clearLocalUserData(reason: 'signOut' | 'deleteAccount') {
  try {
    const list = reason === 'signOut' ? ON_SIGN_OUT : ON_DELETE;
    const keys = await AsyncStorage.getAllKeys();
    const gone = keys.filter((k) => k.startsWith('cache.') || list.includes(k));
    if (gone.length) await AsyncStorage.multiRemove(gone);
  } catch {
    // best effort
  }
  // The app keeps copies in memory too — without this, re-joining in the same session showed the old lists / city.
  resetHere();
  resetShareDraft();
  resetRecipeCandidates();
  if (reason === 'deleteAccount') {
    resetMealPlan();
    resetShopping();
    resetFridge();
  }
}
