-- food-illustrations had insert/update/delete policies but no SELECT on storage.objects.
-- Storage needs SELECT for upsert uploads and for remove() (it reads the rows it deletes),
-- so deleting a dish could not clean up its files. Public reads still go through the public URL.

create policy "users can read their own food image objects"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'food-illustrations'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
