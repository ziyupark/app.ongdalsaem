-- Dish type (8.3 Home-cooked / Travel), comment switch, privacy & language
-- settings (9.5 · 9.6) — docs/06-data-model.md (Dish · Settings).
--
-- foods.mood_tags / foods.meal_type are already text[] (multi-select in 8.3),
-- and profiles.language already exists, so they are not touched here.

-- ---------- foods ---------------------------------------------------------
alter table foods
  add column dish_type text not null default 'home'
    check (dish_type in ('home', 'travel')),
  -- 8.3e "Where did you eat it?" — Travel only, optional
  add column place_name text
    check (place_name is null or char_length(place_name) <= 60),
  -- 8.3 Sharing › Allow comments
  add column allow_comments boolean not null default true,
  -- 9.5 Shared precision at the time of sharing
  add column region_precision text not null default 'city'
    check (region_precision in ('neighborhood', 'city', 'country'));

-- A travel dish has no recipe: drop place_name for home dishes so the two
-- shapes never mix.
alter table foods
  add constraint foods_place_name_travel_only
    check (dish_type = 'travel' or place_name is null);

-- ---------- profiles ------------------------------------------------------
alter table profiles
  -- 9.6 Use device language (on = follow the phone, `language` is ignored)
  add column use_device_language boolean not null default true,
  -- 9.5 Who sees your new dishes / Allow comments (defaults for 8.3)
  add column default_visibility text not null default 'everyone'
    check (default_visibility in ('everyone', 'only_me')),
  add column default_allow_comments boolean not null default true,
  -- 9.5 Who can message you
  add column message_policy text not null default 'everyone'
    check (message_policy in ('everyone', 'following')),
  -- 9.5 Location
  add column location_enabled boolean not null default true,
  add column shared_precision text not null default 'city'
    check (shared_precision in ('neighborhood', 'city', 'country'));

-- ---------- comments: respect "Allow comments" -----------------------------
drop policy "users can create their own comments" on comments;

create policy "users can create their own comments"
  on comments for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from foods
      where foods.id = comments.food_id
        and (foods.allow_comments or foods.creator_id = auth.uid())
    )
  );

-- ---------- start_thread: respect "Who can message you" --------------------
create or replace function start_thread(other uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  a uuid := least(me, other);
  b uuid := greatest(me, other);
  thread uuid;
  other_follows_me boolean;
begin
  if me is null or other is null or me = other then
    raise exception 'invalid thread members';
  end if;
  if is_blocked_between(me, other) then
    raise exception 'blocked';
  end if;

  other_follows_me := exists (
    select 1 from follows where follower_id = other and followee_id = me
  );

  select id into thread from message_threads where member_a = a and member_b = b;
  if thread is null then
    -- "People I follow": only people they follow may start a new conversation.
    if not other_follows_me and exists (
      select 1 from profiles where id = other and message_policy = 'following'
    ) then
      raise exception 'messages_restricted';
    end if;

    insert into message_threads (member_a, member_b, request_for)
    values (a, b, case when other_follows_me then null else other end)
    returning id into thread;
  end if;
  return thread;
end;
$$;

grant execute on function start_thread(uuid) to authenticated;
