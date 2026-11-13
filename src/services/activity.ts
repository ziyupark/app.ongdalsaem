// 2.8 Notifications — built from real activity on my dishes (acorns, comments) + new followers.
// There is no notifications table yet; "new" = after the last time the screen was opened (kept on device).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { myUserId, supabase } from '../lib/supabase';

export type Activity =
  | { kind: 'acorns'; id: string; at: Date; foodId: string; foodName: string; photo: string; who: Who; others: number }
  | { kind: 'comment'; id: string; at: Date; foodId: string; foodName: string; photo: string; who: Who; body: string }
  | { kind: 'follow'; id: string; at: Date; who: Who; followingBack: boolean };
export type Who = { id: string; name: string; avatarUrl: string | null };

const SEEN_KEY = 'ongdalsaem.activitySeenAt';
const DAYS = 30;
type Row = Record<string, any>;
const who = (p: Row | null | undefined, id: string): Who => ({ id, name: p?.username || p?.display_name || '—', avatarUrl: p?.avatar_url ?? null });

export async function lastSeen() {
  const v = await AsyncStorage.getItem(SEEN_KEY).catch(() => null);
  return v ? new Date(v) : new Date(0);
}
export async function markSeen() {
  await AsyncStorage.setItem(SEEN_KEY, new Date().toISOString()).catch(() => undefined);
}

export async function fetchActivity(): Promise<Activity[]> {
  const uid = await myUserId();
  if (!uid) return [];
  const since = new Date(Date.now() - DAYS * 86400000).toISOString();

  const [likes, comments, follows, myFollows] = await Promise.all([
    supabase
      .from('likes')
      .select('id, created_at, user_id, food:foods!inner(id, name, image_url, creator_id), who:profiles!user_id(display_name, username, avatar_url)')
      .eq('food.creator_id', uid)
      .neq('user_id', uid)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('comments')
      .select('id, body, created_at, user_id, food:foods!inner(id, name, image_url, creator_id), who:profiles!user_id(display_name, username, avatar_url)')
      .eq('food.creator_id', uid)
      .neq('user_id', uid)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('follows')
      .select('follower_id, created_at, who:profiles!follower_id(display_name, username, avatar_url)')
      .eq('followee_id', uid)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('follows').select('followee_id').eq('follower_id', uid),
  ]);

  const out: Activity[] = [];
  // Acorns: one row per dish per day ("minji.cooks and 11 others gave acorns…").
  const groups = new Map<string, Row[]>();
  for (const r of (likes.data ?? []) as Row[]) {
    const key = `${r.food.id}-${String(r.created_at).slice(0, 10)}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  for (const [key, rows] of groups) {
    const first = rows[0];
    out.push({ kind: 'acorns', id: `a-${key}`, at: new Date(first.created_at), foodId: first.food.id, foodName: first.food.name, photo: first.food.image_url, who: who(first.who, first.user_id), others: rows.length - 1 });
  }
  for (const r of (comments.data ?? []) as Row[]) {
    out.push({ kind: 'comment', id: `c-${r.id}`, at: new Date(r.created_at), foodId: r.food.id, foodName: r.food.name, photo: r.food.image_url, who: who(r.who, r.user_id), body: r.body });
  }
  const followingIds = new Set(((myFollows.data ?? []) as Row[]).map((r) => r.followee_id as string));
  for (const r of (follows.data ?? []) as Row[]) {
    out.push({ kind: 'follow', id: `f-${r.follower_id}`, at: new Date(r.created_at), who: who(r.who, r.follower_id), followingBack: followingIds.has(r.follower_id) });
  }
  return out.sort((a, b) => +b.at - +a.at);
}

export async function follow(userId: string, on: boolean) {
  const uid = await myUserId();
  if (!uid) throw new Error('Not signed in');
  const { error } = on
    ? await supabase.from('follows').insert({ follower_id: uid, followee_id: userId })
    : await supabase.from('follows').delete().eq('follower_id', uid).eq('followee_id', userId);
  if (error && error.code !== '23505') throw error;
}

/** Badge dot on the Home bell. */
export async function hasUnread() {
  const [list, seen] = await Promise.all([fetchActivity().catch(() => []), lastSeen()]);
  return list.some((a) => a.at > seen);
}
