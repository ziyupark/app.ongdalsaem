-- ongdalsaem — Storage bucket for Food images (Phase 29)
--
-- Bucket name is historical ("food-illustrations" predates the Phase 26
-- imageUrl/imageType media model decision) but stores BOTH drawn
-- illustrations and uploaded photos — the Food data model stays generic
-- (image_url/image_type); this is infrastructure naming only, not a
-- data-model constraint.
--
-- Public bucket: reads (including anonymous Discover browsing of
-- visibility='everyone' foods) go through the public object URL and never
-- touch these policies. Only writes are policy-gated below.

insert into storage.buckets (id, name, public)
values ('food-illustrations', 'food-illustrations', true)
on conflict (id) do nothing;

-- Path convention: {user_id}/{food_id}.{extension} — storage.foldername(name)
-- splits the object path, so [1] is the leading {user_id} segment. This
-- keeps a user from writing into another user's folder.

create policy "users can upload their own food images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'food-illustrations'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can update their own food images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'food-illustrations'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Lets the publish flow clean up an orphaned upload if the `foods` insert
-- that follows it fails (Phase 29 §16).
create policy "users can delete their own food images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'food-illustrations'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
