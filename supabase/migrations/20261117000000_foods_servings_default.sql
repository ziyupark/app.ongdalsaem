-- foods.servings already existed (initial schema: nullable, no default), so 20261114000000's "add column if not exists"
-- skipped it. Give it the intended default (2) and range (1–10). Existing rows stay as they are (null = not set).
alter table foods alter column servings set default 2;
alter table foods drop constraint if exists foods_servings_range;
alter table foods add constraint foods_servings_range check (servings is null or servings between 1 and 10);
