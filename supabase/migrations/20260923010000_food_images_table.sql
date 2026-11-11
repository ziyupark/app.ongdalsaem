-- ongdalsaem — Multi-image Food gallery (Phase 38)
--
-- Food : food_images = 1:N. `foods.image_url`/`image_type` are NOT dropped —
-- they stay as a denormalized mirror of the display_order=0 image, so:
--   (a) the existing `foods_published_requires_image` check keeps working
--       unmodified, and
--   (b) any code path that hasn't been updated to read food_images yet
--       (or old mock/seed data with no food_images rows at all) still
--       resolves a single representative image exactly as before.
-- The application layer (createFood in services/foods.ts) is responsible
-- for keeping the mirror in sync at publish time; there is no trigger,
-- because writes only ever happen through that one function.
--
-- Max 10 images per food is enforced declaratively, not with a trigger:
-- display_order is constrained to 0-9 and unique per food, so a 11th row
-- for the same food_id has no valid display_order left to take.

create table food_images (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references foods (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  image_url text not null,
  image_type text not null default 'photo'
    check (image_type in ('illustration', 'photo')),
  display_order int not null
    check (display_order >= 0 and display_order <= 9),
  created_at timestamptz not null default now(),

  unique (food_id, display_order)
);

-- Per-food ordered gallery lookup (getFoodImages) — the unique constraint
-- above already creates this exact index, so no separate index is added.

alter table food_images enable row level security;

-- Read access mirrors `foods`' own policy exactly (public if the parent
-- Food is published+everyone, always visible to its owner) — food_images
-- has no visibility/status of its own, so this is an EXISTS check against
-- the parent row rather than a column comparison.
create policy "food images follow their food's visibility"
  on food_images for select
  using (
    exists (
      select 1 from foods
      where foods.id = food_images.food_id
        and (
          (foods.visibility = 'everyone' and foods.status = 'published')
          or foods.creator_id = auth.uid()
        )
    )
  );

-- Write access requires both: the row's own user_id matches the caller,
-- AND the caller actually owns the parent food — belt-and-suspenders
-- against a food_id/user_id mismatch slipping through client code.
create policy "users can insert images for their own foods"
  on food_images for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from foods where foods.id = food_id and foods.creator_id = auth.uid())
  );

create policy "users can update images for their own foods"
  on food_images for update
  using (
    auth.uid() = user_id
    and exists (select 1 from foods where foods.id = food_id and foods.creator_id = auth.uid())
  );

create policy "users can delete images for their own foods"
  on food_images for delete
  using (
    auth.uid() = user_id
    and exists (select 1 from foods where foods.id = food_id and foods.creator_id = auth.uid())
  );

-- Storage: reusing the existing public `food-illustrations` bucket and its
-- existing policies unchanged — they only check that the leading path
-- segment is the caller's own user id (storage.foldername(name)[1]), which
-- stays true for the new {user_id}/{food_id}/{display_order}.{ext} path
-- convention just as it did for the old {user_id}/{food_id}.{ext} one. No
-- new bucket, no new storage policy needed.
