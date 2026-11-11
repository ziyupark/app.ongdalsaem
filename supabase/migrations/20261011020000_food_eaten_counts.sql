-- Public "I Ate This" aggregate per food (per user request, shown next to
-- Like on Food Detail). food_eaten_logs itself is deliberately owner-only
-- read (20261011000000_food_eaten_logs.sql: "a personal diary ... never
-- meant to be a public signal"), so embedding food_eaten_logs(count)
-- directly in a foods query would silently only count the *querying
-- user's own* log per food under RLS, not a real total across everyone.
--
-- This view exposes only food_id + count — never which user logged it, or
-- their review — so it's safe to read publicly without weakening
-- food_eaten_logs' own privacy. Views run with their owner's privileges,
-- not the querying role's, so this isn't subject to food_eaten_logs' RLS.
create view food_eaten_counts as
  select food_id, count(*) as count
  from food_eaten_logs
  where food_id is not null
  group by food_id;

-- PostgREST needs an explicit hint to treat this as an embeddable
-- relationship from `foods` (services/foods.ts's
-- `.select("*, food_eaten_counts(count)")`), since a view has no real FK.
comment on view food_eaten_counts is
  '@foreignKey (food_id) references foods(id)';

grant select on food_eaten_counts to anon, authenticated;
