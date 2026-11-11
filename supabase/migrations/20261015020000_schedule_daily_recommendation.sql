-- Schedules the send-daily-recommendation Edge Function once a day
-- (01-MVP-SPEC.md §25 — "Maximum recommended frequency: 1 notification per
-- day"). NOT runnable as-is: fill in <PROJECT_REF> and
-- <SERVICE_ROLE_KEY> below before running this in the Supabase SQL
-- Editor, and deploy the function first (see
-- supabase/functions/send-daily-recommendation/index.ts's own header
-- comment for the full manual checklist this depends on).
--
-- Needs the pg_cron and pg_net extensions enabled on this project
-- (Database → Extensions in the Supabase dashboard, if the `create
-- extension` calls below are rejected for this plan/role).

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'send-daily-recommendation',
  '0 8 * * *', -- 08:00 UTC daily — adjust to taste; cron.schedule uses UTC.
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-daily-recommendation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- To change the schedule later: select cron.alter_job(job_id, schedule => '...');
-- (find job_id via `select * from cron.job;`)
-- To remove it: select cron.unschedule('send-daily-recommendation');
