-- 9.3 Deactivate account — the account is switched off now and deleted for good 30 days later.
--
--   profiles.deactivated_at — when the owner deactivated the account (null = active). Not readable by others
--                             (the public column grant from 20261120000000 doesn't include it).
--   deactivate_own_account()  — sets it for auth.uid() only. The app then signs out.
--   reactivate_own_account()  — clears it; the app calls it after every sign-in, so signing in again within the
--                               30 days keeps the account.
--   purge-deactivated-accounts — Edge Function, once a day by pg_cron: every account deactivated more than 30 days
--                               ago is deleted like delete-account (Apple token revoked, photos removed, auth user
--                               deleted → every row cascades). Uses the same Vault secrets as send-daily-recommendation
--                               (project_url · service_role_key, see 20261108000000_daily_pick_push.sql).

alter table profiles add column if not exists deactivated_at timestamptz;

create index if not exists profiles_deactivated_at_idx on profiles (deactivated_at) where deactivated_at is not null;

create or replace function deactivate_own_account()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  update profiles set deactivated_at = coalesce(deactivated_at, now()) where id = auth.uid();
end;
$$;

create or replace function reactivate_own_account()
returns boolean language plpgsql security definer set search_path = public as $$
declare
  was boolean;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  update profiles set deactivated_at = null where id = auth.uid() and deactivated_at is not null;
  get diagnostics was = row_count;
  return was;
end;
$$;

revoke execute on function deactivate_own_account() from public, anon;
revoke execute on function reactivate_own_account() from public, anon;
grant execute on function deactivate_own_account() to authenticated;
grant execute on function reactivate_own_account() to authenticated;

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.unschedule(jobid) from cron.job where jobname = 'purge-deactivated-accounts';

select cron.schedule(
  'purge-deactivated-accounts',
  '17 3 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/purge-deactivated-accounts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
