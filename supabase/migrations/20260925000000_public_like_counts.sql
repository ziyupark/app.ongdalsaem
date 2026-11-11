-- Phase 39: Home's Food Card (Phase 38.6) shows each Food's total like count
-- via PostgREST's `likes(count)` embed in services/foods.ts. The only
-- existing SELECT policy on `likes` ("users can read their own likes",
-- 20260921000000_initial_schema.sql) restricts every reader to their own
-- rows — for any user other than the row's own owner, that embed would
-- silently return 0 or 1 instead of the true total, since RLS filters rows
-- before the aggregate runs.
--
-- `likes` rows carry no sensitive content beyond "user X liked food Y" on an
-- already-public Food, and Postgres OR's multiple permissive SELECT
-- policies together, so this does not remove the existing "own likes"
-- policy — it just makes the table fully readable, matching how `foods`
-- itself already has a public-read policy for published rows.
create policy "likes are publicly readable"
  on likes for select
  using (true);
