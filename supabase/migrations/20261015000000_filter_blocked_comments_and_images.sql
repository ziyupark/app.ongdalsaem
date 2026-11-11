-- Closes a gap left by 20261014000000_filter_blocked_foods.sql and
-- 20261014010000_hidden_foods.sql: those only updated `foods`' own SELECT
-- policy. Two related gaps:
--
-- 1. comments: a comment is exactly as visible as its parent food's
--    creator-blocking status transitively (the EXISTS subquery against
--    `foods` is itself subject to `foods`' own RLS policy under the same
--    role, so a blocked creator's own foods' comments already disappear).
--    But a blocked user's comments LEFT ON SOMEONE ELSE'S (unblocked) food
--    were never filtered — blocking only ever checked the food's creator,
--    never the comment's own author. Add that check explicitly.
--
-- 2. food_images: same transitive-via-foods'-RLS reasoning already covers
--    the block/hidden case for most paths, but this makes it explicit
--    rather than relying on that implicit composition — belt-and-suspenders,
--    same reasoning the original policies' own comments already use.

drop policy "comments are readable with their food" on comments;

create policy "comments are readable with their food"
  on comments for select
  using (
    exists (
      select 1 from foods
      where foods.id = comments.food_id
        and ((foods.visibility = 'everyone' and foods.status = 'published') or auth.uid() = foods.creator_id)
    )
    and not exists (
      select 1 from blocks
      where blocks.blocker_id = auth.uid()
        and blocks.blocked_id = comments.user_id
    )
  );

drop policy "food images follow their food's visibility" on food_images;

create policy "food images follow their food's visibility"
  on food_images for select
  using (
    exists (
      select 1 from foods
      where foods.id = food_images.food_id
        and (
          (
            foods.visibility = 'everyone' and foods.status = 'published'
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
          or foods.creator_id = auth.uid()
        )
    )
  );
