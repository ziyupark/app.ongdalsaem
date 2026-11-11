-- Phase 44 — "I Ate This": a personal eating diary, separate from
-- likes/saves (which signal interest in a food) and separate from "My
-- Foods" (foods the user created). A user may log the same food on
-- multiple different dates — only an exact duplicate of the SAME food on
-- the SAME date is rejected at the DB level, guarding against an
-- accidental double-submit while a request is in flight (the UI also
-- disables the button while pending; this is the safety net underneath
-- that, not the primary defense).
--
-- Deletion behavior (deliberate choice — NOT the food_images/comments
-- `on delete cascade` default): food_images/comments/likes/saves all
-- cascade-delete because they're only meaningful alongside a live food.
-- A diary entry is different — it's the user's own personal record of
-- what they ate, and should survive even if the original food post is
-- later deleted by its creator. So `food_id` is nullable with
-- `on delete set null`, and `food_name_snapshot`/`food_image_snapshot`
-- are captured once at insert time (from the Food already loaded in the
-- app when the user taps "I Ate This") so the diary entry still displays
-- something meaningful after the live food is gone.
--
-- eaten_at is a plain `date`, not `timestamptz` — it represents "which
-- calendar day the user is logging this for," not an instant, so there is
-- no local/UTC boundary math to get wrong (contrast getYesterdaysFood's
-- timestamptz range-boundary approach, which is correct for an instant
-- field like created_at but wrong for this one). The client computes the
-- device's local YYYY-MM-DD string directly and sends it as-is; Postgres
-- never has to re-derive a calendar day from a stored instant.
create table food_eaten_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  food_id uuid references foods (id) on delete set null,
  food_name_snapshot text not null,
  food_image_snapshot text,
  eaten_at date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, food_id, eaten_at)
);

-- Leading column user_id serves both "all my logs" and "my logs in a date
-- range" (Food Diary, grouped-by-date); eaten_at desc matches the diary's
-- natural most-recent-first order.
create index food_eaten_logs_user_id_eaten_at_idx on food_eaten_logs (user_id, eaten_at desc);
-- Postgres doesn't auto-index the referencing side of a FK — this backs
-- the `on delete set null` cascade's lookup when a food is deleted.
create index food_eaten_logs_food_id_idx on food_eaten_logs (food_id);

alter table food_eaten_logs enable row level security;

-- Personal diary — owner-only read, same template as `saves` (not the
-- public-read template `likes`/`comment_likes` use), since this is never
-- meant to be a public signal.
create policy "users can read their own eating logs"
  on food_eaten_logs for select
  using (auth.uid() = user_id);

-- Insert requires the caller to both own the new row AND be allowed to
-- see the referenced food under its own visibility rules right now — the
-- exact two-branch check foods' own SELECT policy uses (20260921000000),
-- so a private or inaccessible food can never be logged by bypassing that
-- boundary from the client.
create policy "users can log eating their own or visible foods"
  on food_eaten_logs for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from foods
      where foods.id = food_id
        and (
          (foods.visibility = 'everyone' and foods.status = 'published')
          or foods.creator_id = auth.uid()
        )
    )
  );

-- Update is only ever used by the app to change eaten_at (edit the logged
-- date) — RLS can't restrict to a single column, so this is defense in
-- depth against reassigning a row to another user, not a column guard.
create policy "users can update their own eating logs"
  on food_eaten_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete their own eating logs"
  on food_eaten_logs for delete
  using (auth.uid() = user_id);
