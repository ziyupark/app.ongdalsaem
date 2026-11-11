-- ongdalsaem — Complete weather_cache's shape (Phase 31 §5/§9)
--
-- weather_cache was created in Phase 27 as "a reasonable minimum... not a
-- documented spec" (see that migration's header) — city/country/condition/
-- temperature/fetched_at/expires_at only. Phase 31's weather model
-- also requires humidity/sunrise/sunset (01-MVP-SPEC.md §23), which this
-- table cannot round-trip without these columns. Purely additive/nullable —
-- safe regardless of existing rows.
--
-- Convention (established here, since no writer existed before this phase):
-- `weather_condition` stores one of the app's own normalized condition keys
-- (src/types/weather.ts WeatherCondition — e.g. "rain", "clear"), never
-- a raw provider code/string. This keeps the shared cache provider-agnostic,
-- matching src/services/weather.ts.
--
-- RLS is unchanged: writes stay backend-only (service_role), per the
-- existing policy comment below — the client only ever reads this table.

alter table weather_cache
  add column humidity integer,
  add column sunrise timestamptz,
  add column sunset timestamptz;
