-- Performance (pre-launch review P2): indexes for the app's real queries, trigram search, one-row-per-thread inbox.

-- ---------- indexes -------------------------------------------------------------------------------------------
-- Dish comments (7.x) and the comment count embedded in every feed card.
create index if not exists comments_food_created_idx on comments (food_id, created_at desc);
-- on_report_insert() counts open reports per dish.
create index if not exists reports_food_open_idx on reports (food_id) where status = 'open';
-- Nearby: `geohash6 like 'wydm9%'` — a prefix match needs pattern ops (the existing index uses the collation).
create index if not exists foods_geohash6_prefix_idx on foods (geohash6 text_pattern_ops) where geohash6 is not null;
-- Comment likes per user (my marks on a dish's comments).
create index if not exists comment_likes_user_idx on comment_likes (user_id, comment_id);

-- Search (`name ilike '%…%'`, description, question body) — trigram indexes.
create extension if not exists pg_trgm with schema extensions;
create index if not exists foods_name_trgm_idx on foods using gin (name extensions.gin_trgm_ops);
create index if not exists foods_description_trgm_idx on foods using gin (description extensions.gin_trgm_ops);
create index if not exists questions_body_trgm_idx on questions using gin (body extensions.gin_trgm_ops);
create index if not exists topic_tables_name_trgm_idx on topic_tables using gin (name extensions.gin_trgm_ops);

-- ---------- inbox: last message + my unread count per thread ---------------------------------------------------
-- Replaces "the newest 400 messages of all my threads" (which could miss quiet threads) and "every unread row".
-- security invoker: the messages RLS (members only, blocks) applies to the caller.
create or replace function thread_previews(p_ids uuid[])
returns table (thread_id uuid, body text, created_at timestamptz, unread int)
language sql stable security invoker set search_path = public as $$
  select distinct on (m.thread_id)
    m.thread_id, m.body, m.created_at,
    (select count(*)::int from messages u
      where u.thread_id = m.thread_id and u.sender_id <> auth.uid() and u.seen_at is null) as unread
  from messages m
  where m.thread_id = any (p_ids[1:100])
  order by m.thread_id, m.created_at desc;
$$;
revoke all on function thread_previews(uuid[]) from public, anon;
grant execute on function thread_previews(uuid[]) to authenticated;
