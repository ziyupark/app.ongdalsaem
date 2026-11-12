-- Settings "Diet & allergies" · onboarding step after taste. Dishes that clash are left out of Today's pick and search
-- results, and a post detail shows an allergy warning (matching runs on the device: src/lib/allergens.ts).
alter table profiles
  add column if not exists diet text check (diet in ('vegetarian', 'vegan', 'pescatarian')),
  add column if not exists allergies text[] not null default '{}'
    check (allergies <@ array['peanut', 'tree_nut', 'milk', 'egg', 'wheat', 'shellfish', 'fish', 'soy', 'sesame']::text[]);
