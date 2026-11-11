// Direct messages (4.11 Message · 7.5 Send to) — message_threads / messages / start_thread() in
// supabase/migrations/20261029000000_follows_and_messages.sql (+ message_policy in 20261030000000).
import { supabase } from '../lib/supabase';
import { toPerson, type Person, type Row } from './foods';

export type Thread = { id: string; other: Person; lastBody: string | null; lastAt: Date; unread: number; isRequest: boolean; iAsked: boolean };
export type Message = { id: string; body: string; mine: boolean; createdAt: Date; seenAt: Date | null };
export type Relation = 'mutual' | 'following' | 'follower';
export type Target = Person & { relation: Relation };

/** A shared dish travels as a line `ongdalsaem://dish/<id>` inside the body. */
export const DISH_LINK = /ongdalsaem:\/\/dish\/([0-9a-f-]{36})/i;

async function needUid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('Not signed in');
  return data.user.id;
}

export async function fetchInbox(): Promise<Thread[]> {
  const me = await needUid();
  const { data, error } = await supabase
    .from('message_threads')
    .select('id, member_a, member_b, request_for, last_message_at, a:profiles!member_a(id, display_name, username, avatar_url), b:profiles!member_b(id, display_name, username, avatar_url)')
    .or(`member_a.eq.${me},member_b.eq.${me}`)
    .order('last_message_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  const rows = data as Row[];
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [last, unread] = await Promise.all([
    supabase.from('messages').select('thread_id, body, created_at').in('thread_id', ids).order('created_at', { ascending: false }).limit(400),
    supabase.from('messages').select('thread_id').in('thread_id', ids).neq('sender_id', me).is('seen_at', null),
  ]);
  const lastBy = new Map<string, Row>();
  for (const m of (last.data ?? []) as Row[]) if (!lastBy.has(m.thread_id)) lastBy.set(m.thread_id, m);
  const unreadBy = new Map<string, number>();
  for (const m of (unread.data ?? []) as Row[]) unreadBy.set(m.thread_id, (unreadBy.get(m.thread_id) ?? 0) + 1);
  return rows
    .filter((r) => lastBy.has(r.id) || r.request_for !== me) // empty threads someone opened at me stay hidden
    .map((r) => ({
      id: r.id,
      other: toPerson(r.member_a === me ? r.b : r.a),
      lastBody: lastBy.get(r.id)?.body ?? null,
      lastAt: new Date(lastBy.get(r.id)?.created_at ?? r.last_message_at),
      unread: unreadBy.get(r.id) ?? 0,
      isRequest: r.request_for === me,
      iAsked: r.request_for != null && r.request_for !== me,
    }));
}

export async function hasUnreadMessages() {
  try {
    const me = await needUid();
    const { count } = await supabase.from('messages').select('id', { count: 'exact', head: true }).neq('sender_id', me).is('seen_at', null);
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

/** Opens (or creates) the 1:1 thread. Throws `messages_restricted` / `blocked` from the RPC. */
export async function startThread(otherId: string): Promise<string> {
  const { data, error } = await supabase.rpc('start_thread', { other: otherId });
  if (error) throw Object.assign(new Error(error.message), { code: /messages_restricted/.test(error.message) ? 'restricted' : /blocked/.test(error.message) ? 'blocked' : error.code });
  return data as string;
}

export async function fetchThread(threadId: string): Promise<Thread | null> {
  const list = await fetchInbox();
  const hit = list.find((t) => t.id === threadId);
  if (hit) return hit;
  // A fresh thread with no messages yet (opened by me).
  const me = await needUid();
  const { data } = await supabase
    .from('message_threads')
    .select('id, member_a, member_b, request_for, last_message_at, a:profiles!member_a(id, display_name, username, avatar_url), b:profiles!member_b(id, display_name, username, avatar_url)')
    .eq('id', threadId)
    .maybeSingle();
  if (!data) return null;
  const r = data as Row;
  return { id: r.id, other: toPerson(r.member_a === me ? r.b : r.a), lastBody: null, lastAt: new Date(r.last_message_at), unread: 0, isRequest: r.request_for === me, iAsked: r.request_for != null && r.request_for !== me };
}

export async function fetchMessages(threadId: string): Promise<Message[]> {
  const me = await needUid();
  const { data, error } = await supabase.from('messages').select('id, body, sender_id, created_at, seen_at').eq('thread_id', threadId).order('created_at').limit(300);
  if (error) throw error;
  return (data as Row[]).map((m) => ({ id: m.id, body: m.body, mine: m.sender_id === me, createdAt: new Date(m.created_at), seenAt: m.seen_at ? new Date(m.seen_at) : null }));
}

export async function sendMessage(threadId: string, body: string) {
  const me = await needUid();
  const { error } = await supabase.from('messages').insert({ thread_id: threadId, sender_id: me, body: body.trim().slice(0, 1000) });
  if (error) throw error;
}

export async function markSeen(threadId: string) {
  const me = await needUid();
  await supabase.from('messages').update({ seen_at: new Date().toISOString() }).eq('thread_id', threadId).neq('sender_id', me).is('seen_at', null);
}

/** Live updates for one thread (new messages / seen). Returns unsubscribe. */
export function subscribeThread(threadId: string, onChange: () => void) {
  const ch = supabase
    .channel(`thread:${threadId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` }, onChange)
    .subscribe();
  return () => { supabase.removeChannel(ch); };
}

/** 7.5 Send to — people you follow or who follow you, mutuals first. */
export async function fetchSendTargets(): Promise<Target[]> {
  const me = await needUid();
  const [out, inc] = await Promise.all([
    supabase.from('follows').select('p:profiles!followee_id(id, display_name, username, avatar_url)').eq('follower_id', me).limit(200),
    supabase.from('follows').select('p:profiles!follower_id(id, display_name, username, avatar_url)').eq('followee_id', me).limit(200),
  ]);
  const following = new Map(((out.data ?? []) as Row[]).filter((r) => r.p).map((r) => [r.p.id, toPerson(r.p)]));
  const followers = new Map(((inc.data ?? []) as Row[]).filter((r) => r.p).map((r) => [r.p.id, toPerson(r.p)]));
  const all = new Map<string, Target>();
  for (const [id, p] of following) all.set(id, { ...p, relation: followers.has(id) ? 'mutual' : 'following' });
  for (const [id, p] of followers) if (!all.has(id)) all.set(id, { ...p, relation: 'follower' });
  const rank: Record<Relation, number> = { mutual: 0, following: 1, follower: 2 };
  return [...all.values()].sort((a, b) => rank[a.relation] - rank[b.relation] || a.name.localeCompare(b.name));
}

/** Sends the dish (as a link line) + optional note to each person. Returns how many failed. */
export async function sendDish(to: string[], foodId: string, dishName: string, note: string) {
  let failed = 0;
  for (const id of to) {
    try {
      const thread = await startThread(id);
      const body = [note.trim(), `${dishName}\nongdalsaem://dish/${foodId}`].filter(Boolean).join('\n\n');
      await sendMessage(thread, body);
    } catch {
      failed += 1;
    }
  }
  return failed;
}
