-- Makes blocking actually hide content (per user request) — ReportBlockMenu
-- (src/components/moderation/ReportBlockMenu.tsx) already writes to `blocks`
-- on Block, but until now nothing read that table back: a blocked user's
-- foods still showed up in Home/Discover/Community/Food Detail, everywhere.
--
-- Done at the RLS layer on `foods` itself (one place), not by adding a
-- blocked-ids filter to every service function (services/foods.ts has
-- several independent query builders — getPublicFoodsPage, the paginated
-- fetches, getSavedFoods' nested embed, the single-food fetch — this covers
-- all of them at once, the same "push it to the data layer" approach this
-- project already used for food_eaten_counts).
--
-- Only gates the public "everyone + published" branch — a blocked creator
-- can still read/manage their OWN foods (auth.uid() = creator_id), since
-- blocking only changes what the blocker sees, not the blocked user's own
-- access to their own content. Anonymous (auth.uid() is null) readers are
-- unaffected — "not exists" with a null blocker_id never matches, so nobody
-- anonymous has any blocks to apply.
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
    )
    or auth.uid() = creator_id
  );
