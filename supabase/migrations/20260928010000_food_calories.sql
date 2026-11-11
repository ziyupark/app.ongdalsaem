-- Optional total-calories field, shown on Food Detail directly below the
-- Recipe section (steps). Nullable — every existing food has no value yet,
-- and it stays optional in Create, same as cooking_time_minutes/servings.
alter table foods
  add column calories int;
