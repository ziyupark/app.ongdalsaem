-- ongdalsaem — Profile initialization on signup (Phase 28)
--
-- `username` was `not null unique`. Phase 28 §10 explicitly says not to
-- invent a username-generation scheme, and full username onboarding is a
-- later phase — so a profile must be able to exist with no username yet.
-- Multiple NULLs never violate a unique constraint in Postgres, so this is
-- safe to relax without touching the unique constraint itself.
alter table profiles alter column username drop not null;

-- Reliably create exactly one profile row per new auth user, regardless of
-- which client/flow created them (Phase 28 §9). Runs as the function owner
-- (security definer) because the invoking context around an auth.users
-- insert has no direct grants on public.profiles otherwise — this is
-- Supabase's own documented pattern for this trigger.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();
