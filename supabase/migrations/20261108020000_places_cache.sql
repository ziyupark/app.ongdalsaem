-- 2.4 Eat this nearby — cache of Google Places text searches (supabase/functions/places-nearby).
-- One row per (query · language · ~1 km cell · radius · filters); the function reuses it for 24 h (30 min with "Open now").
-- Only the Edge Function (service role) reads or writes it: RLS on, no policies.
create table if not exists places_cache (
  key text primary key,
  places jsonb not null,
  created_at timestamptz not null default now()
);
alter table places_cache enable row level security;
create index if not exists places_cache_created_idx on places_cache (created_at);

-- Old rows are useless after a day; clear them weekly (needs pg_cron, already on for the daily pick push).
select cron.unschedule(jobid) from cron.job where jobname = 'places-cache-cleanup';
select cron.schedule('places-cache-cleanup', '17 4 * * 0', $$ delete from places_cache where created_at < now() - interval '2 days' $$);
