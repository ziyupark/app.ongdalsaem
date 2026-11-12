-- 4.1 "Viral Bites" section + 4.7 Viral · Detail
--   * viral_picks — editor picks, edited by operators in the Supabase dashboard (service role only).
--     Everyone can read the picks whose window (starts_on … ends_on, inclusive) contains today.
--   * viral_dishes(p_limit) — dish names (case / spaces ignored) whose activity (posts + acorns) per day over the
--     last 3 days beats the per-day average of the 7 days before; at least 3 posts in the last 3 days; highest growth first.

-- ---------- viral_picks ---------------------------------------------------------
create table if not exists viral_picks (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  country_code text check (country_code is null or country_code ~ '^[A-Za-z]{2}$'),
  image_url text,
  note text,
  starts_on date not null default current_date,
  ends_on date not null,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  constraint viral_picks_window check (ends_on >= starts_on)
);

create index if not exists viral_picks_window_idx on viral_picks (starts_on, ends_on, sort);

alter table viral_picks enable row level security;

-- Read: only picks in their window. No insert / update / delete policies → only the service role (dashboard) writes.
drop policy if exists "viral picks in window are public" on viral_picks;
create policy "viral picks in window are public"
  on viral_picks for select
  using (current_date between starts_on and ends_on);

revoke insert, update, delete on viral_picks from anon, authenticated;
grant select on viral_picks to anon, authenticated;

-- ---------- viral_dishes() --------------------------------------------------------
-- security invoker: the foods RLS (blocked cooks, hidden posts) applies to the caller.
create or replace function viral_dishes(p_limit int default 8)
returns table (name text, country_code text, cover_id uuid, cover_url text, growth_pct int, post_count int)
language sql
stable
security invoker
set search_path = public
as $$
  with pub as (
    select f.id, f.name, f.country, f.image_url, f.created_at,
           lower(regexp_replace(btrim(f.name), '\s+', ' ', 'g')) as k
    from foods f
    where f.visibility = 'everyone' and f.status = 'published' and btrim(f.name) <> ''
  ),
  posts as (
    select p.k,
           count(*) filter (where p.created_at >= now() - interval '3 days') as p_recent,
           count(*) filter (where p.created_at <  now() - interval '3 days') as p_prev
    from pub p
    where p.created_at >= now() - interval '10 days'
    group by p.k
  ),
  acorns as (
    select p.k,
           count(*) filter (where l.created_at >= now() - interval '3 days') as a_recent,
           count(*) filter (where l.created_at <  now() - interval '3 days') as a_prev
    from likes l
    join pub p on p.id = l.food_id
    where l.created_at >= now() - interval '10 days'
    group by p.k
  ),
  scored as (
    select ps.k,
           ps.p_recent,
           (ps.p_recent + coalesce(a.a_recent, 0)) / 3.0 as recent_daily,
           (ps.p_prev   + coalesce(a.a_prev, 0))   / 7.0 as prev_daily
    from posts ps
    left join acorns a on a.k = ps.k
    where ps.p_recent >= 3
  ),
  cover as (
    -- the most-acorned (then newest) post of the last 3 days
    select distinct on (p.k) p.k, btrim(p.name) as dish_name, p.id as dish_id, p.image_url
    from pub p
    join scored s on s.k = p.k
    where p.created_at >= now() - interval '3 days'
    order by p.k, (select count(*) from likes l where l.food_id = p.id) desc, p.created_at desc
  ),
  origin as (
    -- the country most of the last 3 days' posts came from
    select distinct on (p.k) p.k, upper(p.country) as cc
    from pub p
    join scored s on s.k = p.k
    where p.created_at >= now() - interval '3 days' and p.country is not null
    group by p.k, upper(p.country)
    order by p.k, count(*) desc
  )
  select c.dish_name,
         o.cc,
         c.dish_id,
         c.image_url,
         -- no activity the week before counts as one event in those 7 days
         round(100 * (s.recent_daily - s.prev_daily) / greatest(s.prev_daily, 1 / 7.0))::int,
         s.p_recent::int
  from scored s
  join cover c on c.k = s.k
  left join origin o on o.k = s.k
  where s.recent_daily > s.prev_daily
  order by 5 desc, s.p_recent desc
  limit greatest(coalesce(p_limit, 8), 0);
$$;

grant execute on function viral_dishes(int) to anon, authenticated;
