-- 8.2 Details "Cooking method" (optional, several, Home-cooked only) — used by the Home air quality card
-- (docs/05-behavior.md §6.11): bad air → simmer · steam · boil · quick dishes, clean air → grill · stir-fry · pan-fry.
alter table foods
  add column if not exists cooking_methods text[] not null default '{}'
    check (cooking_methods <@ array['grill', 'stirfry', 'panfry', 'simmer', 'steam', 'boil', 'quick']::text[]);

-- 4.2 Tag page "method:<key>" (e.g. 끓이는 요리 보기) filters with cooking_methods @> '{simmer}'.
create index if not exists foods_cooking_methods_idx on foods using gin (cooking_methods);
