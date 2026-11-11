-- ongdalsaem — Initial schema (Phase 27)
-- Source of truth: docs/03-DB-SCHEMA.md
--
-- Scope decision (confirmed with the user during Phase 27): ingredients/steps
-- stay as jsonb on `foods`, and weather/temperature/mood/meal tags stay as
-- text[] on `foods` — matching docs/03-DB-SCHEMA.md §10 exactly. No
-- food_ingredients / food_steps / food_tags child tables are created.
--
-- `weather_cache` is not yet described in docs/03-DB-SCHEMA.md — its shape
-- here is a reasonable minimum for Phase 27's stated purpose ("database
-- structure needed for future weather integration"), not a documented spec.
-- See the Phase 27 report for the follow-up note on syncing the doc.

create extension if not exists pgcrypto;

-- Shared trigger: keep `updated_at` current on every UPDATE.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =========================================================================
-- profiles — docs/03-DB-SCHEMA.md §2
-- =========================================================================

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  avatar_url text,
  city text,
  country text,
  favorite_tags text[] not null default '{}',
  language text not null default 'en',
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- foods — docs/03-DB-SCHEMA.md §3
-- =========================================================================

create table foods (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references profiles (id) on delete cascade,

  image_url text,
  image_type text not null default 'illustration'
    check (image_type in ('illustration', 'photo')),

  name text not null,
  description text,

  ingredients jsonb not null default '[]',
  steps jsonb not null default '[]',

  cooking_time_minutes int,
  servings int,
  difficulty text
    check (difficulty is null or difficulty in ('easy', 'medium', 'hard')),

  weather_condition text,
  temperature_c numeric,

  weather_tags text[] not null default '{}',
  temperature_tags text[] not null default '{}',
  mood_tags text[] not null default '{}',
  meal_type text[] not null default '{}',

  city text,
  country text,

  visibility text not null default 'everyone'
    check (visibility in ('everyone', 'only_me')),
  status text not null default 'published'
    check (status in ('draft', 'published')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Published foods always have an image (07-FOOD-UI-ARCHITECTURE.md §8.1:
  -- "발행된 Food는 Placeholder 상태를 갖지 않는다"). Drafts may lack one —
  -- this is exactly what backs "Save as Draft on illustration failure"
  -- (User Flow §35 / docs/03-DB-SCHEMA.md §3's `status` note).
  constraint foods_published_requires_image
    check (status = 'draft' or image_url is not null)
);

create trigger foods_set_updated_at
  before update on foods
  for each row
  execute function set_updated_at();

-- =========================================================================
-- likes — docs/03-DB-SCHEMA.md §4
-- =========================================================================

create table likes (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references foods (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, food_id)
);

-- =========================================================================
-- saves — docs/03-DB-SCHEMA.md §5
-- =========================================================================

create table saves (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references foods (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, food_id)
);

-- =========================================================================
-- reports — docs/03-DB-SCHEMA.md §6
-- =========================================================================

create table reports (
  id uuid primary key default gen_random_uuid(),
  food_id uuid references foods (id) on delete set null,
  reported_user_id uuid references profiles (id) on delete set null,
  reporter_id uuid not null references profiles (id) on delete cascade,
  reason text not null
    check (reason in ('inappropriate', 'spam', 'copyright', 'harassment', 'other')),
  created_at timestamptz not null default now()
);

-- =========================================================================
-- blocks — docs/03-DB-SCHEMA.md §7
-- (not in Phase 27's own table list, but still documented + required by
-- Settings → "Blocked Users" — kept per docs/03-DB-SCHEMA.md §1/§9)
-- =========================================================================

create table blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references profiles (id) on delete cascade,
  blocked_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);

-- =========================================================================
-- weather_cache — Phase 27 §9 (undocumented shape, see header note)
-- =========================================================================

create table weather_cache (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  country text not null,
  weather_condition text,
  temperature_c numeric,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 hour'),
  unique (city, country)
);

-- =========================================================================
-- Indexes — Phase 27 §10
-- =========================================================================

-- user food lookup (getMyFoods)
create index foods_creator_id_idx on foods (creator_id);
-- public food discovery (getFoods)
create index foods_visibility_status_idx on foods (visibility, status);
-- city/location lookup
create index foods_city_country_idx on foods (city, country);
-- created_at ordering (feeds)
create index foods_created_at_idx on foods (created_at desc);

-- likes: food_id for "likes on this food", (user_id, food_id) unique above
-- already covers "likes by this user"
create index likes_food_id_idx on likes (food_id);

-- saves: food_id for "saves on this food", (user_id, food_id) unique above
-- already covers getSavedFoods(userId)
create index saves_food_id_idx on saves (food_id);

-- =========================================================================
-- Row Level Security — Phase 27 §11
-- =========================================================================

alter table profiles enable row level security;
alter table foods enable row level security;
alter table likes enable row level security;
alter table saves enable row level security;
alter table reports enable row level security;
alter table blocks enable row level security;
alter table weather_cache enable row level security;

-- profiles: public profile info is readable by anyone; users manage their own row.
create policy "profiles are publicly readable"
  on profiles for select
  using (true);

create policy "users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- foods: published+everyone foods are public; creators always see/manage their own.
create policy "published foods are publicly readable"
  on foods for select
  using (
    (visibility = 'everyone' and status = 'published')
    or auth.uid() = creator_id
  );

create policy "users can create their own foods"
  on foods for insert
  with check (auth.uid() = creator_id);

create policy "users can update their own foods"
  on foods for update
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

create policy "users can delete their own foods"
  on foods for delete
  using (auth.uid() = creator_id);

-- likes: users manage only their own like records.
create policy "users can read their own likes"
  on likes for select
  using (auth.uid() = user_id);

create policy "users can create their own likes"
  on likes for insert
  with check (auth.uid() = user_id);

create policy "users can delete their own likes"
  on likes for delete
  using (auth.uid() = user_id);

-- saves: users manage only their own save records.
create policy "users can read their own saves"
  on saves for select
  using (auth.uid() = user_id);

create policy "users can create their own saves"
  on saves for insert
  with check (auth.uid() = user_id);

create policy "users can delete their own saves"
  on saves for delete
  using (auth.uid() = user_id);

-- reports: users can file reports and see their own; nobody reads others'.
create policy "users can read their own reports"
  on reports for select
  using (auth.uid() = reporter_id);

create policy "users can create their own reports"
  on reports for insert
  with check (auth.uid() = reporter_id);

-- blocks: same self-managed pattern as likes/saves (docs/03-DB-SCHEMA.md §9).
create policy "users can read their own blocks"
  on blocks for select
  using (auth.uid() = blocker_id);

create policy "users can create their own blocks"
  on blocks for insert
  with check (auth.uid() = blocker_id);

create policy "users can delete their own blocks"
  on blocks for delete
  using (auth.uid() = blocker_id);

-- weather_cache: shared system data — publicly readable, writes are
-- backend-only (no insert/update/delete policy means only service_role,
-- which bypasses RLS, can write).
create policy "weather cache is publicly readable"
  on weather_cache for select
  using (true);
