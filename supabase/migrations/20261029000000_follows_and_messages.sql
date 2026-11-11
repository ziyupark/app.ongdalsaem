-- =========================================================================
-- follows + direct messages — docs/06-data-model.md (Follow · Thread · Message)
-- Screens: 4.5 Following · 4.9 Cooks in your weather · 4.8 Follow/Message ·
-- 4.11 Message (docs/04-screens/04-community.md).
-- Rules (docs/05-behavior.md, 04-community 4.11):
--   * anyone can follow anyone except across a block (either direction)
--   * anyone can start a thread; if the recipient doesn't follow the sender,
--     the thread is a *request* for the recipient until they reply
--   * blocking hides the thread and stops new messages both ways
-- =========================================================================

-- ---------- follows ------------------------------------------------------
create table follows (
  follower_id uuid not null references profiles (id) on delete cascade,
  followee_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index follows_followee_idx on follows (followee_id, created_at desc);

-- true when either user has blocked the other
create or replace function is_blocked_between(a uuid, b uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

alter table follows enable row level security;

-- Follow lists and counts are public (profile "Following · N"), like profiles.
create policy "follows are publicly readable"
  on follows for select using (true);

create policy "users can follow others"
  on follows for insert
  with check (follower_id = auth.uid() and not is_blocked_between(follower_id, followee_id));

create policy "users can unfollow"
  on follows for delete using (follower_id = auth.uid());

-- Blocking someone also removes follows in both directions.
create or replace function remove_follows_on_block()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from follows
  where (follower_id = new.blocker_id and followee_id = new.blocked_id)
     or (follower_id = new.blocked_id and followee_id = new.blocker_id);
  return new;
end;
$$;

create trigger blocks_remove_follows
  after insert on blocks
  for each row execute function remove_follows_on_block();

-- ---------- threads ------------------------------------------------------
-- One thread per pair; member_a < member_b keeps the pair unique.
create table message_threads (
  id uuid primary key default gen_random_uuid(),
  member_a uuid not null references profiles (id) on delete cascade,
  member_b uuid not null references profiles (id) on delete cascade,
  -- the member who still has to accept (reply to) the thread; null = accepted
  request_for uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  check (member_a < member_b),
  unique (member_a, member_b)
);

create index message_threads_a_idx on message_threads (member_a, last_message_at desc);
create index message_threads_b_idx on message_threads (member_b, last_message_at desc);

alter table message_threads enable row level security;

create policy "members can read their threads"
  on message_threads for select
  using (auth.uid() in (member_a, member_b) and not is_blocked_between(member_a, member_b));

-- Threads are only created through start_thread() (security definer), so no
-- insert/update/delete policies for clients.

create or replace function start_thread(other uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  a uuid := least(me, other);
  b uuid := greatest(me, other);
  thread uuid;
begin
  if me is null or other is null or me = other then
    raise exception 'invalid thread members';
  end if;
  if is_blocked_between(me, other) then
    raise exception 'blocked';
  end if;

  select id into thread from message_threads where member_a = a and member_b = b;
  if thread is null then
    insert into message_threads (member_a, member_b, request_for)
    values (
      a, b,
      -- a request for `other` unless they already follow me
      case when exists (select 1 from follows where follower_id = other and followee_id = me)
           then null else other end
    )
    returning id into thread;
  end if;
  return thread;
end;
$$;

grant execute on function start_thread(uuid) to authenticated;

-- ---------- messages -----------------------------------------------------
create table messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references message_threads (id) on delete cascade,
  sender_id uuid not null references profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  seen_at timestamptz
);

create index messages_thread_idx on messages (thread_id, created_at desc);

alter table messages enable row level security;

create policy "members can read messages"
  on messages for select
  using (exists (
    select 1 from message_threads t
    where t.id = thread_id
      and auth.uid() in (t.member_a, t.member_b)
      and not is_blocked_between(t.member_a, t.member_b)
  ));

create policy "members can send messages"
  on messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from message_threads t
      where t.id = thread_id
        and auth.uid() in (t.member_a, t.member_b)
        and not is_blocked_between(t.member_a, t.member_b)
    )
  );

-- Only the recipient may mark a message seen (seen_at is the only change).
create policy "recipients can mark messages seen"
  on messages for update
  using (
    sender_id <> auth.uid()
    and exists (
      select 1 from message_threads t
      where t.id = thread_id and auth.uid() in (t.member_a, t.member_b)
    )
  )
  with check (sender_id <> auth.uid());

-- Keep thread ordering fresh, and accept a request when the recipient replies.
create or replace function on_message_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update message_threads
     set last_message_at = new.created_at,
         request_for = case when request_for = new.sender_id then null else request_for end
   where id = new.thread_id;
  return new;
end;
$$;

create trigger messages_after_insert
  after insert on messages
  for each row execute function on_message_insert();

-- Recipients may only touch seen_at (never body/sender).
revoke update on messages from anon, authenticated;
grant update (seen_at) on messages to authenticated;

-- The client hides seen receipts while a thread is still a request
-- (request_for is set) — docs 4.11.
