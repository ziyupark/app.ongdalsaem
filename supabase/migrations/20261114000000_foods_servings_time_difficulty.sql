-- 8.2a Recipe: servings (stepper 1–10, default 2), cook time (10 / 20 / 30 / 60+ minutes) and difficulty. All optional on the form.
alter table foods
  add column if not exists servings int not null default 2 check (servings between 1 and 10),
  add column if not exists cook_minutes int check (cook_minutes > 0),
  add column if not exists difficulty text check (difficulty in ('easy', 'medium', 'hard'));
