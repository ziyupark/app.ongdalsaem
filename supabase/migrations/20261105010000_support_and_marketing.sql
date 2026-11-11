-- Help & policies (9.9): support tickets (9.9a) and marketing consent (9.9e)
-- docs/04-screens/09-settings.md · docs/guides/9.9-help-policies-guide.pdf
--   * support_tickets: the user sends a message from the app; only they can
--     read their own tickets. App version / OS / language are attached.
--     Kept 3 years after closing (privacy policy §4).
--   * marketing consent lives on profiles; every change is logged with its
--     date so the "agreed on …" line and the 2-year re-check can be shown.

-- ---------- support tickets -------------------------------------------------
create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles (id) on delete set null,
  topic text not null check (topic in ('bug', 'account', 'report_content', 'other')),
  message text not null check (char_length(message) between 5 and 1000),
  screenshot_url text,
  reply_email text check (reply_email is null or reply_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  app_version text check (char_length(app_version) <= 40),
  os text check (char_length(os) <= 40),
  language text check (char_length(language) <= 20),
  status text not null default 'open' check (status in ('open', 'answered', 'closed')),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
create index support_tickets_user_idx on support_tickets (user_id, created_at desc);
create index support_tickets_open_idx on support_tickets (created_at) where status = 'open';

alter table support_tickets enable row level security;

create policy "send a ticket" on support_tickets for insert
  with check (user_id = auth.uid() and status = 'open' and closed_at is null);
create policy "read own tickets" on support_tickets for select
  using (user_id = auth.uid());
-- no update / delete for users; the operator works from the dashboard

-- ---------- marketing consent ----------------------------------------------
alter table profiles
  add column marketing_ads boolean not null default false,
  add column marketing_night_ads boolean not null default false,
  add column marketing_consented_at timestamptz,
  add constraint profiles_night_ads_needs_ads check (not marketing_night_ads or marketing_ads);

create table marketing_consent_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles (id) on delete cascade,
  ads boolean not null,
  night_ads boolean not null,
  changed_at timestamptz not null default now()
);
create index marketing_consent_log_user_idx on marketing_consent_log (user_id, changed_at desc);

alter table marketing_consent_log enable row level security;
create policy "read own consent log" on marketing_consent_log for select
  using (user_id = auth.uid());

create or replace function log_marketing_consent()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.marketing_ads is distinct from old.marketing_ads
     or new.marketing_night_ads is distinct from old.marketing_night_ads then
    new.marketing_consented_at := case when new.marketing_ads then now() else null end;
    insert into marketing_consent_log (user_id, ads, night_ads)
    values (new.id, new.marketing_ads, new.marketing_night_ads);
  end if;
  return new;
end;
$$;

create trigger profiles_marketing_consent
  before update of marketing_ads, marketing_night_ads on profiles
  for each row execute function log_marketing_consent();
