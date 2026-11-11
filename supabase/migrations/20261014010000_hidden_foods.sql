-- "Hide this post" (per user request) — distinct from blocking the
-- creator (blocks, 20261014000000_filter_blocked_foods.sql): hiding one
-- food only removes that one food from the viewer's feeds, not everything
-- else that creator has posted. Same self-managed pattern as likes/saves.
create table hidden_foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  food_id uuid not null references foods (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, food_id)
);

alter table hidden_foods enable row level security;

create policy "users can read their own hidden foods"
  on hidden_foods for select
  using (auth.uid() = user_id);

create policy "users can create their own hidden foods"
  on hidden_foods for insert
  with check (auth.uid() = user_id);

create policy "users can delete their own hidden foods"
  on hidden_foods for delete
  using (auth.uid() = user_id);

-- Same RLS-layer approach as the blocks filter — one policy change on
-- `foods` covers every query that reads it (services/foods.ts's several
-- independent query builders), rather than filtering in each one.
drop policy "published foods are publicly readable" on foods;

create policy "published foods are publicly readable"
  on foods for select
  using (
    (
      visibility = 'everyone' and status = 'published'
      and not exists (
        select 1 from blocks
        where blocks.blocker_id = auth.uid()
          and blocks.blocked_id = foods.creator_id
      )
      and not exists (
        select 1 from hidden_foods
        where hidden_foods.user_id = auth.uid()
          and hidden_foods.food_id = foods.id
      )
    )
    or auth.uid() = creator_id
  );
