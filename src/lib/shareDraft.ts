// In-memory draft shared by 8.1 Pick → 8.2 Details → 8.3 Preview. Cleared on share or discard.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import type { Place } from '../services/location';
import type { EditSource, PhotoEdit } from './photoEdit';
import type { WeatherMood } from '../theme';

export type DraftPhoto = {
  /** Media-library asset id, or `camera-<ts>` for a new shot. */
  id: string;
  /** Display uri (ph:// or file://). */
  uri: string;
  /** Local file uri used for upload (resolved when leaving 8.1). */
  fileUri?: string;
  width: number;
  height: number;
  takenAt?: Date;
  location?: { latitude: number; longitude: number };
  /** Edit mode: a photo already on the post (public URL) — kept as is, never re-uploaded. */
  remoteUrl?: string;
  /**
   * 8.1a Edit photo: `uri` / `fileUri` then point at the edited JPEG. `source` = the upright photo the edit is drawn
   * from, `params` = the edit (re-opening starts from them), `original` = the photo's fields before editing.
   */
  edit?: { source: EditSource; params: PhotoEdit; original: Pick<DraftPhoto, 'uri' | 'fileUri' | 'width' | 'height' | 'remoteUrl'> };
};

type DraftContext = {
  mood: WeatherMood;
  tempC: number;
  place: Place | null;
  takenAt: Date;
  /** 'photo' = location came from the photo, 'device' = from the phone right now. */
  from: 'photo' | 'device' | 'place';
  /** Where — only a ~1 km geohash cell of it is stored (3.6 Within 1 km). */
  coords?: { latitude: number; longitude: number };
};

export type DraftIngredient = { name: string; amount: string };
export type DraftStep = { text: string; timerSec?: number };
export type Difficulty = 'easy' | 'medium' | 'hard';

export type ShareDraft = {
  photos: DraftPhoto[];
  context: DraftContext | null;
  contextState: 'idle' | 'loading' | 'ready' | 'none';
  type: 'home' | 'travel';
  name: string;
  placeName: string;
  description: string;
  meals: string[];
  moods: string[];
  isPublic: boolean;
  allowComments: boolean;
  /** 8.2a Recipe (home-cooked only). Calories kept as typed text, parsed on share. */
  ingredients: DraftIngredient[];
  steps: DraftStep[];
  calories: string;
  /** 8.2a servings (1–10), cook time in minutes (60 = 60+) and difficulty — all optional. */
  servings: number;
  cookMinutes: number | null;
  difficulty: Difficulty | null;
  /** 8.2d: the cook picked the place by hand → weather_source 'place-edited'. */
  placeEdited: boolean;
  /** 8.4: index of the photo that failed to upload on the last try (null = none). */
  uploadFailed: number | null;
  /** 4.10 "Join challenge": the shared dish is entered into this challenge (one photo only — see CHALLENGE_PHOTOS). */
  challenge: { id: string; tag: string; title: string } | null;
  /** Optional landscape (forest / sea / …). */
  landscape: string | null;
  /** 7.1 "I made this": the recipe post this dish was cooked from (saved as cooked_from_id). */
  cookedFromId: string | null;
  /** Edit mode: the post being edited (null = a new post). Weather, temperature and created_at stay as they were. */
  editId: string | null;
  /** Edit mode: the post's photo URLs before editing (photos taken off are removed from storage on save). */
  editBefore: string[];
};

const empty = (): ShareDraft => ({
  photos: [], context: null, contextState: 'idle', type: 'home', name: '', placeName: '', description: '',
  meals: [], moods: [], isPublic: true, allowComments: true, ingredients: [], steps: [], calories: '', servings: 2, cookMinutes: null, difficulty: null, placeEdited: false, uploadFailed: null, challenge: null, landscape: null, cookedFromId: null, editId: null, editBefore: [],
});

/** A challenge entry is a single photo. */
export const CHALLENGE_PHOTOS = 1;

/** Start a challenge entry: a fresh draft tagged #tag, public, entered into the challenge on share. */
export function startChallengeDraft(c: { id: string; tag: string; title: string }) {
  draft = { ...empty(), challenge: { id: c.id, tag: c.tag, title: c.title }, description: `#${c.tag} `, isPublic: true };
  emit();
}

// ---- Challenge entry posted: the Challenges tab reads this once to refresh and show "You're in!". ----
let enteredChallenge: string | null = null;
export function markChallengeEntered(id: string) {
  enteredChallenge = id;
}
/** The challenge just entered (once), or null. */
export function takeChallengeEntered() {
  const id = enteredChallenge;
  enteredChallenge = null;
  return id;
}

let draft = empty();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function getShareDraft() {
  return draft;
}
export function updateShareDraft(patch: Partial<ShareDraft> | ((d: ShareDraft) => Partial<ShareDraft>)) {
  draft = { ...draft, ...(typeof patch === 'function' ? patch(draft) : patch) };
  emit();
}
export function resetShareDraft() {
  draft = empty();
  emit();
}
export function useShareDraft() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, getShareDraft);
}

// ---- "Add your own" moods — remembered on this device so they come back next time (8.2b). ----
const CUSTOM_KEY = 'ongdalsaem.customMoods';
export async function loadCustomMoods(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_KEY);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}
export async function saveCustomMoods(list: string[]) {
  try {
    await AsyncStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
  } catch {
    // Not critical — the tag still works for this post.
  }
}

// ---- Edit mode: tell the post detail screen that its post was just saved (it reloads and shows "Changes saved"). ----
let savedEdit: string | null = null;
export function markEditSaved(foodId: string) {
  savedEdit = foodId;
}
/** True once for `foodId` after its edit was saved. */
export function takeEditSaved(foodId: string) {
  if (savedEdit !== foodId) return false;
  savedEdit = null;
  return true;
}
