-- ongdalsaem — 1.3 Profile setup (docs/04-screens/01-sign-in-setup.md · docs/06-data-model.md User)
--
-- * display_name: the one field 1.3 asks for (1–30 chars, duplicates allowed). Null = onboarding not finished.
-- * username stays the @handle. It is generated from the display name (`jiyu_4821`); the format check is
--   NOT VALID so rows created before this rule are left alone, every new write must match.
-- * handle_auto_generated / handle_changed_at: "Pick your handle?" one-time prompt and the 30-day change limit (9.2).
-- * avatars bucket: profile photos, public read, each user writes only inside `<their uid>/`.

alter table profiles
  add column display_name text
    check (display_name is null or char_length(btrim(display_name)) between 1 and 30),
  add column handle_auto_generated boolean not null default false,
  add column handle_changed_at timestamptz;

alter table profiles
  add constraint profiles_username_format
    check (username is null or username ~ '^[a-z0-9._]{3,20}$') not valid;

-- ---------- storage: avatars ------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "users upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
