-- Security hardening (pre-launch review S1 · S4 · S5 · S7 · S8, plus the quota tables S3 / P8 use).
-- Every check below that guards user input runs only for signed-in callers (auth.uid() is not null), so the
-- dashboard / SQL editor / seed files and the service role keep working as before.
--
--   S1  profiles: only the public card columns are readable by others; the owner reads the rest via my_profile()
--   S1  blocking hides content both ways (docs 6.10 "양쪽에서 사라지고"), food_eaten_counts follows dish visibility
--   S1  profiles: the 30-day @handle limit and handle_changed_at are enforced on the server
--   S4  storage: size / type limits, avatars can no longer be listed by everyone
--   S5  foods: the place label follows the 9.5 Shared precision at sharing time (neighborhood / city / country)
--   S7  apple_tokens: Sign in with Apple refresh tokens (service role only) so account deletion can revoke them
--   S8  reports: duplicates ignored, the single-report instant hide needs a reporter account older than 24 h
--   S8  length limits, per-user write rate limits, image URLs must point at the caller's own storage folder
--   S3  api_quota + take_quota(): per-user and global request caps for Edge Functions (service role only)

-- =============================================================================================================
-- S1 · profiles: public card columns only
-- =============================================================================================================
-- Column privileges: others (and the owner, through the table) can read only these. Filters on other columns
-- would need SELECT on them too, and the app filters profiles by id only.
revoke select on table profiles from anon, authenticated;
grant select (id, username, display_name, avatar_url, bio, city, country, created_at) on table profiles to anon, authenticated;

-- The owner's full row (settings, diet, onboarding state) — always auth.uid(), never a caller-supplied id.
create or replace function my_profile()
returns setof profiles
language sql stable security definer set search_path = public as $$
  select * from profiles where id = auth.uid();
$$;
revoke all on function my_profile() from public, anon;
grant execute on function my_profile() to authenticated;

-- Server-side rules for owner edits: bio length, avatar URL, @handle 30-day limit (9.2).
create or replace function profiles_owner_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.bio is distinct from old.bio and new.bio is not null and char_length(new.bio) > 80 then
    raise exception 'bio_too_long' using errcode = '22001';
  end if;

  if new.avatar_url is distinct from old.avatar_url and new.avatar_url is not null
     and not is_own_storage_url(new.avatar_url, 'avatars', new.id) then
    raise exception 'invalid_image_url' using errcode = '42501';
  end if;

  if new.username is distinct from old.username then
    -- null = the dev-only "reset onboarding"; a new handle inside the 30 days is refused
    if new.username is not null and old.handle_changed_at is not null
       and old.handle_changed_at > now() - interval '30 days' then
      raise exception 'handle-cooldown' using errcode = 'P0001';
    end if;
    -- a handle the user picked starts the 30 days now (the server's clock, not the phone's)
    new.handle_changed_at := case when new.handle_auto_generated then old.handle_changed_at else now() end;
  else
    new.handle_changed_at := old.handle_changed_at;
  end if;
  return new;
end;
$$;

-- =============================================================================================================
-- S8 helpers (used by the guards in this file)
-- =============================================================================================================
-- A public URL of an object in `bucket` inside `owner`'s folder of this Supabase project.
create or replace function is_own_storage_url(url text, bucket text, owner uuid)
returns boolean language sql immutable set search_path = public as $$
  select url ~ ('^https://[a-z0-9-]+\.supabase\.(co|in)/storage/v1/object/public/' || bucket || '/'
                || owner::text || '/[A-Za-z0-9._-]+$');
$$;

-- Every element's `field` (jsonb array of objects) is at most `max_len` characters.
create or replace function jsonb_fields_within(arr jsonb, field text, max_len int)
returns boolean language sql immutable set search_path = public as $$
  select coalesce(bool_and(char_length(coalesce(e ->> field, '')) <= max_len), true)
  from jsonb_array_elements(case when jsonb_typeof(arr) = 'array' then arr else '[]'::jsonb end) e;
$$;

create or replace function texts_within(arr text[], max_len int)
returns boolean language sql immutable set search_path = public as $$
  select coalesce(bool_and(char_length(x) <= max_len), true) from unnest(coalesce(arr, '{}')) x;
$$;

drop trigger if exists profiles_owner_guard on profiles;
create trigger profiles_owner_guard
  before update on profiles
  for each row execute function profiles_owner_guard();

-- =============================================================================================================
-- S1 · blocking works both ways (docs 05-behavior 6.10)
-- =============================================================================================================
drop policy "published foods are publicly readable" on foods;
create policy "published foods are publicly readable"
  on foods for select
  using (
    (
      visibility = 'everyone' and status = 'published'
      and moderation_state = 'visible'
      and not is_blocked_between((select auth.uid()), foods.creator_id)
      and not exists (
        select 1 from hidden_foods
        where hidden_foods.user_id = (select auth.uid())
          and hidden_foods.food_id = foods.id
      )
    )
    or (select auth.uid()) = creator_id
  );

drop policy "comments are readable with their food" on comments;
create policy "comments are readable with their food"
  on comments for select
  using (
    exists (
      select 1 from foods
      where foods.id = comments.food_id
        and (
          (foods.visibility = 'everyone' and foods.status = 'published' and foods.moderation_state = 'visible')
          or (select auth.uid()) = foods.creator_id
        )
    )
    and not is_blocked_between((select auth.uid()), comments.user_id)
  );

drop policy "users can create their own comments" on comments;
create policy "users can create their own comments"
  on comments for insert
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from foods
      where foods.id = comments.food_id
        and (foods.allow_comments or foods.creator_id = (select auth.uid()))
        and not is_blocked_between((select auth.uid()), foods.creator_id)
    )
  );

drop policy "food images follow their food's visibility" on food_images;
create policy "food images follow their food's visibility"
  on food_images for select
  using (
    exists (
      select 1 from foods
      where foods.id = food_images.food_id
        and (
          (
            foods.visibility = 'everyone' and foods.status = 'published'
            and foods.moderation_state = 'visible'
            and not is_blocked_between((select auth.uid()), foods.creator_id)
            and not exists (
              select 1 from hidden_foods
              where hidden_foods.user_id = (select auth.uid())
                and hidden_foods.food_id = foods.id
            )
          )
          or foods.creator_id = (select auth.uid())
        )
    )
  );

drop policy "open questions are readable" on questions;
create policy "open questions are readable" on questions for select
  using (
    (
      moderation_state = 'visible' and expires_at > now()
      and not is_blocked_between((select auth.uid()), questions.author_id)
    )
    or author_id = (select auth.uid())
  );

drop policy "answers are readable" on answers;
create policy "answers are readable" on answers for select
  using (
    exists (select 1 from questions q where q.id = answers.question_id)
    and not is_blocked_between((select auth.uid()), answers.author_id)
  );

create or replace function nearby_questions(p_geohash text, p_limit int default 20)
returns setof questions
language sql stable security definer set search_path = public as $$
  select q.*
  from questions q
  join question_areas a on a.question_id = q.id
  where left(a.geohash, 4) = left(lower(p_geohash), 4)
    and q.table_id is null
    and q.moderation_state = 'visible'
    and q.expires_at > now()
    and not is_blocked_between(auth.uid(), q.author_id)
  order by q.answer_count = 0 desc, q.created_at desc
  limit least(greatest(p_limit, 1), 50);
$$;

create or replace function nearby_questions_wide(p_geohash text, p_limit int default 20)
returns setof questions
language sql stable security definer set search_path = public as $$
  select q.*
  from questions q
  join question_areas a on a.question_id = q.id
  where left(a.geohash, 3) = left(lower(p_geohash), 3)
    and q.table_id is null
    and q.moderation_state = 'visible'
    and q.expires_at > now()
    and not is_blocked_between(auth.uid(), q.author_id)
  order by q.answer_count = 0 desc, q.created_at desc
  limit least(greatest(p_limit, 1), 50);
$$;

create or replace function area_questions(
  p_geohash text,
  p_chars int default 4,
  p_category text default null,
  p_query text default null,
  p_limit int default 20,
  p_offset int default 0
) returns setof questions
language sql stable security definer set search_path = public as $$
  select q.*
  from questions q
  join question_areas a on a.question_id = q.id
  where left(a.geohash, least(greatest(p_chars, 3), 4)) = left(lower(p_geohash), least(greatest(p_chars, 3), 4))
    and q.table_id is null
    and q.moderation_state = 'visible'
    and q.expires_at > now()
    and (p_category is null or q.category = p_category)
    and (coalesce(p_query, '') = ''
         or q.body ilike '%' || replace(replace(replace(p_query, '\', '\\'), '%', '\%'), '_', '\_') || '%')
    and not is_blocked_between(auth.uid(), q.author_id)
  order by q.answer_count = 0 desc, q.created_at desc, q.id
  limit least(greatest(p_limit, 1), 50)
  offset greatest(p_offset, 0);
$$;

-- =============================================================================================================
-- S1 · "I ate this" totals only for dishes the caller may see
-- =============================================================================================================
create or replace view food_eaten_counts as
  select l.food_id, count(*) as count
  from food_eaten_logs l
  join foods f on f.id = l.food_id
  where (f.visibility = 'everyone' and f.status = 'published' and f.moderation_state = 'visible')
     or f.creator_id = auth.uid()
  group by l.food_id;

-- =============================================================================================================
-- S4 · storage limits
-- =============================================================================================================
-- The app uploads JPEGs resized to 1440 px (dishes, questions) and 512 px (avatars).
update storage.buckets
  set file_size_limit = 5 * 1024 * 1024, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
  where id = 'food-illustrations';
update storage.buckets
  set file_size_limit = 2 * 1024 * 1024, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
  where id = 'avatars';

-- Public URLs never needed this policy (public buckets skip RLS); it only let anyone list every avatar.
drop policy if exists "avatars are publicly readable" on storage.objects;
drop policy if exists "users can read their own avatar objects" on storage.objects;
create policy "users can read their own avatar objects"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- =============================================================================================================
-- S5 · the place label follows 9.5 Shared precision (docs 08-share: "설정 9.5 Shared precision을 그대로 따른다")
-- =============================================================================================================
-- Existing dishes: apply each cook's current setting once (before the trigger, which keeps it fixed afterwards).
update foods f
  set region_precision = coalesce(p.shared_precision, 'city'),
      neighborhood = case when coalesce(p.shared_precision, 'city') = 'neighborhood' then f.neighborhood end,
      city = case when coalesce(p.shared_precision, 'city') = 'country' then null else f.city end
  from profiles p
  where p.id = f.creator_id;

create or replace function foods_apply_precision()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    select coalesce(shared_precision, 'city') into new.region_precision from profiles where id = new.creator_id;
    new.region_precision := coalesce(new.region_precision, 'city');
  else
    new.region_precision := old.region_precision;   -- the setting at the time of sharing
  end if;
  if new.region_precision <> 'neighborhood' then
    new.neighborhood := null;
  end if;
  if new.region_precision = 'country' then
    new.city := null;
  end if;
  return new;
end;
$$;

drop trigger if exists foods_apply_precision on foods;
create trigger foods_apply_precision
  before insert or update of region_precision, neighborhood, city on foods
  for each row execute function foods_apply_precision();

-- =============================================================================================================
-- S8 · input limits (same numbers as the app's fields) and own-folder image URLs
-- =============================================================================================================
create or replace function foods_input_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if tg_op = 'INSERT' or new.name is distinct from old.name then
    if char_length(btrim(new.name)) not between 1 and 60 then raise exception 'name_length' using errcode = '22001'; end if;
  end if;
  if (tg_op = 'INSERT' or new.description is distinct from old.description)
     and char_length(coalesce(new.description, '')) > 150 then
    raise exception 'description_length' using errcode = '22001';
  end if;
  if tg_op = 'INSERT' or new.ingredients is distinct from old.ingredients then
    if jsonb_typeof(new.ingredients) <> 'array' or jsonb_array_length(new.ingredients) > 30
       or not jsonb_fields_within(new.ingredients, 'name', 40)
       or not jsonb_fields_within(new.ingredients, 'amount', 20) then
      raise exception 'ingredients_invalid' using errcode = '22001';
    end if;
  end if;
  if tg_op = 'INSERT' or new.steps is distinct from old.steps then
    if jsonb_typeof(new.steps) <> 'array' or jsonb_array_length(new.steps) > 20
       or not jsonb_fields_within(new.steps, 'text', 300) then
      raise exception 'steps_invalid' using errcode = '22001';
    end if;
  end if;
  if tg_op = 'INSERT' or new.mood_tags is distinct from old.mood_tags or new.meal_type is distinct from old.meal_type then
    if cardinality(new.mood_tags) > 10 or cardinality(new.meal_type) > 10
       or not texts_within(new.mood_tags, 40) or not texts_within(new.meal_type, 40) then
      raise exception 'tags_invalid' using errcode = '22001';
    end if;
  end if;
  if (tg_op = 'INSERT' or new.city is distinct from old.city or new.country is distinct from old.country)
     and (char_length(coalesce(new.city, '')) > 100 or char_length(coalesce(new.country, '')) > 100) then
    raise exception 'place_length' using errcode = '22001';
  end if;
  if (tg_op = 'INSERT' or new.image_url is distinct from old.image_url)
     and new.image_url is not null and not is_own_storage_url(new.image_url, 'food-illustrations', new.creator_id) then
    raise exception 'invalid_image_url' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists foods_input_guard on foods;
create trigger foods_input_guard
  before insert or update on foods
  for each row execute function foods_input_guard();

create or replace function food_images_input_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null and (tg_op = 'INSERT' or new.image_url is distinct from old.image_url)
     and not is_own_storage_url(new.image_url, 'food-illustrations', new.user_id) then
    raise exception 'invalid_image_url' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists food_images_input_guard on food_images;
create trigger food_images_input_guard
  before insert or update on food_images
  for each row execute function food_images_input_guard();

create or replace function comments_input_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null and char_length(btrim(new.body)) not between 1 and 300 then
    raise exception 'comment_length' using errcode = '22001';
  end if;
  return new;
end;
$$;

drop trigger if exists comments_input_guard on comments;
create trigger comments_input_guard
  before insert or update of body on comments
  for each row execute function comments_input_guard();

-- questions are written by ask_question() (security definer); auth.uid() is still the asker there.
create or replace function questions_input_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null and new.image_url is not null
     and (tg_op = 'INSERT' or new.image_url is distinct from old.image_url)
     and not is_own_storage_url(new.image_url, 'food-illustrations', new.author_id) then
    raise exception 'invalid_image_url' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists questions_input_guard on questions;
create trigger questions_input_guard
  before insert or update of image_url on questions
  for each row execute function questions_input_guard();

-- =============================================================================================================
-- S8 · per-user write rate limits
-- =============================================================================================================
-- rate_guard(user column, window, max[, window, max]) — counts the caller's rows in each window.
-- Limits sit well above normal use; only scripted floods hit them.
create or replace function rate_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  n int;
  i int := 1;
begin
  if me is null then
    return new;
  end if;
  while i + 1 < tg_nargs loop
    execute format('select count(*) from %I.%I where %I = $1 and created_at > now() - $2::interval',
                   tg_table_schema, tg_table_name, tg_argv[0])
      into n using me, tg_argv[i];
    if n >= tg_argv[i + 1]::int then
      raise exception 'rate_limited' using errcode = 'P0001';
    end if;
    i := i + 2;
  end loop;
  return new;
end;
$$;

create index if not exists comments_user_created_idx on comments (user_id, created_at desc);
create index if not exists messages_sender_created_idx on messages (sender_id, created_at desc);
create index if not exists foods_creator_created_idx on foods (creator_id, created_at desc);
create index if not exists reports_reporter_created_idx on reports (reporter_id, created_at desc);
create index if not exists questions_author_created_idx on questions (author_id, created_at desc);
create index if not exists answers_author_created_idx on answers (author_id, created_at desc);
create index if not exists follows_follower_created_idx on follows (follower_id, created_at desc);
create index if not exists likes_user_created_idx on likes (user_id, created_at desc);

drop trigger if exists rate_guard on comments;
create trigger rate_guard before insert on comments
  for each row execute function rate_guard('user_id', '1 minute', '10', '1 day', '300');
drop trigger if exists rate_guard on messages;
create trigger rate_guard before insert on messages
  for each row execute function rate_guard('sender_id', '1 minute', '30', '1 day', '1000');
drop trigger if exists rate_guard on foods;
create trigger rate_guard before insert on foods
  for each row execute function rate_guard('creator_id', '1 hour', '20', '1 day', '60');
drop trigger if exists rate_guard on reports;
create trigger rate_guard before insert on reports
  for each row execute function rate_guard('reporter_id', '1 hour', '10', '1 day', '30');
drop trigger if exists rate_guard on questions;
create trigger rate_guard before insert on questions
  for each row execute function rate_guard('author_id', '1 hour', '10', '1 day', '30');
drop trigger if exists rate_guard on answers;
create trigger rate_guard before insert on answers
  for each row execute function rate_guard('author_id', '1 minute', '10', '1 day', '200');
drop trigger if exists rate_guard on follows;
create trigger rate_guard before insert on follows
  for each row execute function rate_guard('follower_id', '1 minute', '30', '1 day', '500');
drop trigger if exists rate_guard on likes;
create trigger rate_guard before insert on likes
  for each row execute function rate_guard('user_id', '1 minute', '60', '1 day', '1000');
drop trigger if exists rate_guard on support_tickets;
create trigger rate_guard before insert on support_tickets
  for each row execute function rate_guard('user_id', '1 hour', '5', '1 day', '10');

-- =============================================================================================================
-- S8 · reports: no duplicates, instant hide needs an established reporter
-- =============================================================================================================
-- Reporting the same thing again while the first report is open is ignored (the insert returns no row, no error).
create or replace function reports_skip_duplicate()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from reports r
    where r.reporter_id = new.reporter_id and r.status = 'open'
      and r.food_id is not distinct from new.food_id
      and r.comment_id is not distinct from new.comment_id
      and r.question_id is not distinct from new.question_id
      and r.answer_id is not distinct from new.answer_id
      and r.reported_user_id is not distinct from new.reported_user_id
  ) then
    -- the reporter still stops seeing the dish (same as the first report)
    if new.food_id is not null then
      insert into hidden_foods (user_id, food_id) values (new.reporter_id, new.food_id) on conflict do nothing;
    end if;
    return null;
  end if;
  return new;
end;
$$;

drop trigger if exists reports_skip_duplicate on reports;
create trigger reports_skip_duplicate
  before insert on reports
  for each row execute function reports_skip_duplicate();

-- Same as 20261030010000, except a single sexual / child_safety report hides the dish for everyone only when the
-- reporter's account is older than 24 hours (a brand-new account still counts toward the 3-reporter rule, and
-- the dish is always hidden for the reporter at once).
create or replace function on_report_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  reporters int;
  established boolean;
begin
  if new.food_id is null then
    return new;
  end if;

  insert into hidden_foods (user_id, food_id)
  values (new.reporter_id, new.food_id)
  on conflict do nothing;

  select count(distinct reporter_id) into reporters
  from reports
  where food_id = new.food_id and status = 'open';

  select created_at < now() - interval '24 hours' into established from profiles where id = new.reporter_id;

  if (new.reason in ('sexual', 'child_safety') and coalesce(established, false)) or reporters >= 3 then
    update foods set moderation_state = 'hidden_pending'
    where id = new.food_id and moderation_state = 'visible';
  end if;

  return new;
end;
$$;

-- =============================================================================================================
-- S7 · Sign in with Apple refresh tokens (for revocation on account deletion)
-- =============================================================================================================
create table if not exists apple_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  refresh_token text not null,
  updated_at timestamptz not null default now()
);
alter table apple_tokens enable row level security;
-- no policies: only the service role (Edge Functions) reads or writes it
revoke all on apple_tokens from anon, authenticated;

-- =============================================================================================================
-- S3 · request quotas for Edge Functions (service role only)
-- =============================================================================================================
create table if not exists api_quota (
  bucket text not null,
  window_start timestamptz not null,
  n int not null default 0,
  primary key (bucket, window_start)
);
alter table api_quota enable row level security;
revoke all on api_quota from anon, authenticated;

-- Takes one unit from `bucket` for the current minute / hour / day (UTC). false = the cap is reached.
create or replace function take_quota(p_bucket text, p_window text, p_cap int)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v int;
begin
  if p_window not in ('minute', 'hour', 'day') then
    raise exception 'bad window';
  end if;
  insert into api_quota as q (bucket, window_start, n)
  values (p_bucket, date_trunc(p_window, now()), 1)
  on conflict (bucket, window_start) do update set n = q.n + 1 where q.n < p_cap
  returning n into v;
  return v is not null and v <= p_cap;
end;
$$;

-- Gives a unit back (when a second quota refused the same request).
create or replace function give_back_quota(p_bucket text, p_window text)
returns void language sql security definer set search_path = public as $$
  update api_quota set n = greatest(n - 1, 0)
  where bucket = p_bucket and window_start = date_trunc(p_window, now());
$$;

revoke all on function take_quota(text, text, int) from public, anon, authenticated;
revoke all on function give_back_quota(text, text) from public, anon, authenticated;
grant execute on function take_quota(text, text, int) to service_role;
grant execute on function give_back_quota(text, text) to service_role;
grant select, insert, update, delete on api_quota, apple_tokens to service_role;

select cron.unschedule(jobid) from cron.job where jobname = 'api-quota-cleanup';
select cron.schedule('api-quota-cleanup', '23 4 * * 0', $$ delete from api_quota where window_start < now() - interval '3 days' $$);

-- =============================================================================================================
-- S2 · OpenWeather goes through the `weather` Edge Function (the key leaves the app); its shared cache
-- =============================================================================================================
create table if not exists owm_cache (
  key text primary key,
  body jsonb not null,
  created_at timestamptz not null default now()
);
alter table owm_cache enable row level security;
-- no policies: only the Edge Function (service role) uses it
revoke all on owm_cache from anon, authenticated;
grant select, insert, update, delete on owm_cache to service_role;
create index if not exists owm_cache_created_idx on owm_cache (created_at);

select cron.unschedule(jobid) from cron.job where jobname = 'owm-cache-cleanup';
select cron.schedule('owm-cache-cleanup', '41 4 * * *', $$ delete from owm_cache where created_at < now() - case when key like 'geo|%' then interval '31 days' else interval '1 day' end $$);
