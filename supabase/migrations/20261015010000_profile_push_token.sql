-- Stores the device's Expo push token (01-MVP-SPEC.md §25 Notifications).
-- A separate table rather than a column on `profiles` — `profiles` is
-- publicly readable ("profiles are publicly readable", using (true)), and
-- a push token is sensitive enough (it lets anyone holding it send that
-- user arbitrary native notifications) that it must stay owner-only, not
-- ride along on a fully public row. One row per user (not per device,
-- matching notifications_enabled's own MVP-simple single-flag shape) — a
-- user reinstalling on a new device simply upserts over it.
create table push_tokens (
  user_id uuid primary key references profiles (id) on delete cascade,
  token text not null,
  updated_at timestamptz not null default now()
);

alter table push_tokens enable row level security;

create policy "users can read their own push token"
  on push_tokens for select
  using (auth.uid() = user_id);

create policy "users can upsert their own push token"
  on push_tokens for insert
  with check (auth.uid() = user_id);

create policy "users can update their own push token"
  on push_tokens for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete their own push token"
  on push_tokens for delete
  using (auth.uid() = user_id);
