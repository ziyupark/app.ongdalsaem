// Direct messages (4.11 Message · 7.5 Send to) — message_threads / messages / start_thread() in
// supabase/migrations/20261029000000_follows_and_messages.sql (+ message_policy in 20261030000000).
import { myUserId, supabase } from '../lib/supabase';
import { toPerson, type Person, type Row } from './foods';

export type Thread = { id: string; other: Person; lastBody: string | null; lastAt: Date; unread: number; isRequest: boolean; iAsked: boolean };
export type Message = { id: string; body: string; mine: boolean; createdAt: Date; seenAt: Date | null };

/** A shared dish travels as a line `ongdalsaem://dish/<id>` inside the body. */
export const DISH_LINK = /ongdalsaem:\/\/dish\/([0-9a-f-]{36})/i;

async function needUid() {
  const id = await myUserId();
  if (!id) throw new Error('Not signed in');
  return id;
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
  const lastBy = new Map<string, Row>();
  const unreadBy = new Map<string, number>();
  // One row per thread (last message + my unread count) from thread_previews(); RLS applies (security invoker).
  const previews = await supabase.rpc('thread_previews', { p_ids: ids });
  if (!previews.error) {
    for (const m of (previews.data ?? []) as Row[]) {
      lastBy.set(m.thread_id, m);
      unreadBy.set(m.thread_id, m.unread ?? 0);
    }
  } else {
    // PGRST202: migration 20261120010000 not applied yet — the earlier two queries.
    const [last, unread] = await Promise.all([
      supabase.from('messages').select('thread_id, body, created_at').in('thread_id', ids).order('created_at', { ascending: false }).limit(400),
      supabase.from('messages').select('thread_id').in('thread_id', ids).neq('sender_id', me).is('seen_at', null),
    ]);
    for (const m of (last.data ?? []) as Row[]) if (!lastBy.has(m.thread_id)) lastBy.set(m.thread_id, m);
    for (const m of (unread.data ?? []) as Row[]) unreadBy.set(m.thread_id, (unreadBy.get(m.thread_id) ?? 0) + 1);
  }
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
