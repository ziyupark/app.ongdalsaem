-- 9.3 Deactivate account — while profiles.deactivated_at is set, the account is hidden from everyone else:
-- profile, dishes (+ photos, comments on them), their comments, questions, answers, message threads, follows,
-- acorns, table / challenge memberships and challenge entries. The owner still reads their own rows (they are
-- signed out anyway, and signing in again clears deactivated_at → everything is back as it was).
--
--   deactivated_ids() — every deactivated account (security definer: profiles rows of deactivated accounts are
--                       hidden from other users below). Policies call it as `(select deactivated_ids())` so it
--                       runs once per query, not once per row.
--   is_blocked_between(a, b) — now also true when a ≠ b and either side is deactivated. Every "blocked" check
--                       (foods · food_images · comments · questions · answers · nearby/area questions · threads ·
--                       messages · start_thread · follow) therefore hides a deactivated account the same way a block does.

create or replace function deactivated_ids()
returns uuid[]
language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(id), '{}') from profiles where deactivated_at is not null;
$$;
revoke execute on function deactivated_ids() from public, anon;
grant execute on function deactivated_ids() to anon, authenticated;

create or replace function is_blocked_between(a uuid, b uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  ) or (
    a is distinct from b and exists (
      select 1 from profiles where id in (a, b) and deactivated_at is not null
    )
  );
$$;

-- Profiles: a deactivated profile is "not found" for others (6.1 other cook → missing state).
drop policy "profiles are publicly readable" on profiles;
create policy "profiles are publicly readable"
  on profiles for select
  using (deactivated_at is null or id = (select auth.uid()));

-- Rows that point at a person and are read with their profile embedded.
drop policy "follows are publicly readable" on follows;
create policy "follows are publicly readable"
  on follows for select
  using (not (follower_id = any ((select deactivated_ids()))) and not (followee_id = any ((select deactivated_ids()))));

drop policy "likes are publicly readable" on likes;
create policy "likes are publicly readable"
  on likes for select
  using (not (user_id = any ((select deactivated_ids()))));

drop policy "members are public" on table_members;
create policy "members are public" on table_members for select
  using (not (user_id = any ((select deactivated_ids()))));

drop policy "participants are public" on challenge_participants;
create policy "participants are public" on challenge_participants for select
  using (not (user_id = any ((select deactivated_ids()))));

drop policy "entries are public" on challenge_entries;
create policy "entries are public" on challenge_entries for select
  using (not (user_id = any ((select deactivated_ids()))));
