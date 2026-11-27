-- Settings "Diet & allergies" · onboarding step: tags the user types in ("Add your own") next to the fixed chips.
-- Each tag is a word to stay away from — dishes with it in the name or ingredients are left out of picks and search,
-- and a custom allergy also shows in the post-detail allergy warning (matching runs on the device: src/lib/allergens.ts).
-- Up to 20 tags per list, each 1–20 characters.
create or replace function diet_tags_ok(tags text[])
returns boolean language sql immutable set search_path = public as $$
  select cardinality(tags) <= 20
     and not exists (select 1 from unnest(tags) t where t is null or char_length(btrim(t)) not between 1 and 20);
$$;

alter table profiles
  add column if not exists custom_diet text[] not null default '{}' check (diet_tags_ok(custom_diet)),
  add column if not exists custom_allergies text[] not null default '{}' check (diet_tags_ok(custom_allergies));
