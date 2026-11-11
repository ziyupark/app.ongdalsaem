-- Phase 42.5: Account & Onboarding — adds the two new required-by-policy
-- (not required-by-DB) profile fields. `username` already exists and is
-- reused as the Nickname (Phase 28 already deferred "full username
-- onboarding" to a later phase — this is that phase); no display_name
-- column is added since none exists today and nothing in the app reads one
-- (confirmed by grep before writing this migration).
--
-- Both columns are nullable — Phase 28's existing users, and any user who
-- hasn't finished Profile Setup yet, must not be broken by this migration.
-- "Complete" is an application-level concept (useProfileCompletion.ts:
-- username && age_range), not a DB constraint — Gender is optional forever,
-- Age Range is optional at the DB level so an in-progress signup never
-- violates a constraint mid-flow.
alter table profiles
  add column age_range text,
  add column gender text;

-- Stable enum-like values (not a Postgres enum type, matching how
-- foods.difficulty/visibility already do this in the same table set) — the
-- exact set docs/... Phase 42.5 §3 specifies. A future new bucket only ever
-- needs a migration to widen this check, never a data backfill.
alter table profiles
  add constraint profiles_age_range_check
    check (age_range is null or age_range in ('under_18', '18_24', '25_34', '35_44', '45_54', '55_plus'));

-- Gender is deliberately unconstrained beyond "text or null" — Phase 42.5 §4
-- lists example options (female/male/non_binary/prefer_not_to_say) as UI
-- choices, not a closed set the DB must enforce; a future added option (or
-- a user-typed value, if that's ever allowed) should never need a migration.

-- Privacy (Phase 42.5 §5/§27): no new RLS policy needed. profiles already
-- has "profiles are publicly readable" (select, using (true)) from the
-- initial schema — anyone can already read any column on any profile row
-- today (e.g. city/country/favorite_tags are equally public right now).
-- age_range/gender ride on that same existing policy, so the actual privacy
-- guarantee is enforced at the query layer instead: services/foods.ts's
-- `profiles!creator_id(username)` embed (Phase 39) selects `username` only,
-- never `*`, so CreatorInfo/Food Card can't surface these fields even
-- though the column-level grant would technically allow reading them
-- directly. This is a real, known gap — see the Phase 42.5 report's
-- Limitations section — narrowing it further (e.g. a public-safe view)
-- is future work, not done here to avoid touching the existing, working
-- "profiles are publicly readable" policy every other read path relies on.
