-- ongdalsaem — Delete Account (Settings → Account Actions)
--
-- Every other table (profiles, foods, food_images, likes, saves, reports,
-- blocks) already cascades from auth.users/profiles via the FK constraints
-- in initial_schema.sql and food_images_table.sql, so deleting the
-- auth.users row is sufficient — this function never touches another table
-- itself. Runs as the function owner (security definer) because the
-- calling client's own role has no grants on auth.users otherwise — this is
-- Supabase's own documented pattern for self-service account deletion,
-- used here instead of a service-role key (which must never reach the
-- client). Always deletes auth.uid() only, never a caller-supplied id, so
-- it's safe to expose to any authenticated user.
--
-- Does NOT remove the user's uploaded files from the food-illustrations
-- storage bucket — Postgres can't call the Storage API, and that needs a
-- service-role call this project doesn't have. The client deletes its own
-- storage objects (it already holds that permission via existing storage
-- policies) immediately before calling this function.
create or replace function delete_own_account()
returns void as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function delete_own_account() to authenticated;
