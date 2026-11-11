-- 9.4 "Today's pick" push — weather + one dish, once a day at the time the user chose in Settings.
--
-- push_tokens now carries what the server needs to send at the right local time for the right weather:
--   daily_pick  — the Settings toggle (off = keep the token, send nothing)
--   pick_time   — local wall-clock time from Settings (default 07:30)
--   tz          — IANA time zone of the device, e.g. Asia/Seoul
--   lat / lon   — rounded to 2 decimals (≈ 1.1 km) on the device; never exact GPS
--   place       — the ward/city label shown in the app ("Mapo-gu, Seoul")
--   city        — city name, used for the weather when location is off (city mode, no coordinates)
--   language    — app language (en, ko, ja, zh-TW, es, pt-BR, id, th, vi)
--   temp_unit   — 'C' or 'F'
--   last_sent_on — local date of the last send, so nobody gets two in a day
-- The table stays owner-only (RLS from 20261015010000); the Edge Function reads it with the service role.

alter table push_tokens
  add column if not exists daily_pick boolean not null default true,
  add column if not exists pick_time time not null default '07:30',
  add column if not exists tz text not null default 'UTC',
  add column if not exists lat double precision,
  add column if not exists lon double precision,
  add column if not exists place text,
  add column if not exists city text,
  add column if not exists language text not null default 'en',
  add column if not exists temp_unit text not null default 'C' check (temp_unit in ('C', 'F')),
  add column if not exists last_sent_on date;

-- Coordinates must already be coarse when they arrive.
alter table push_tokens drop constraint if exists push_tokens_coarse_coords;
alter table push_tokens add constraint push_tokens_coarse_coords check (
  (lat is null or lat = round(lat::numeric, 2)::double precision) and
  (lon is null or lon = round(lon::numeric, 2)::double precision)
);

-- Schedule: every 15 minutes the function sends to everyone whose local pick_time fell in the last 15 minutes.
-- Uses two Vault secrets so no key is written into SQL — create them once in the SQL editor:
--   select vault.create_secret('https://<PROJECT_REF>.supabase.co', 'project_url');
--   select vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key');
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.unschedule(jobid) from cron.job where jobname = 'send-daily-recommendation';

select cron.schedule(
  'send-daily-recommendation',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/send-daily-recommendation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
