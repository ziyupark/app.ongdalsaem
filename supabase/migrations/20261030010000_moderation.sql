-- Report handling — docs/guides/7.4-report-moderation-guide.pdf · docs/05-behavior.md §6.10
--   * new report reasons (7.4) + optional note + status
--   * the reporter stops seeing the dish right away (hidden_foods)
--   * 3+ different reporters, or a sexual / child-safety report, hides the
--     dish from everyone until the operator reviews it (foods.moderation_state)
--   * moderation_actions = what the operator decided and why (the creator can
--     read actions about their own content — that is the "you were notified")
--   * moderation_queue = open reports, oldest first, with the 24h deadline

-- ---------- reports ---------------------------------------------------------
alter table reports drop constraint if exists reports_reason_check;
alter table reports
  add constraint reports_reason_check check (reason in (
    'sexual', 'child_safety', 'harassment', 'hate_violence', 'copyright',
    'spam', 'unsafe_recipe', 'off_topic', 'other',
    'inappropriate'            -- legacy value from the first app build
  )),
  add column note text check (note is null or char_length(note) <= 200),
  add column comment_id uuid references comments (id) on delete set null,
  add column status text not null default 'open'
    check (status in ('open', 'actioned', 'dismissed')),
  add column resolved_at timestamptz;

create index reports_open_idx on reports (created_at) where status = 'open';

-- ---------- foods: moderation state ----------------------------------------
alter table foods
  add column moderation_state text not null default 'visible'
    check (moderation_state in ('visible', 'hidden_pending', 'removed'));

drop policy "published foods are publicly readable" on foods;

create policy "published foods are publicly readable"
  on foods for select
  using (
    (
      visibility = 'everyone' and status = 'published'
      and moderation_state = 'visible'
      and not exists (
        select 1 from blocks
        where blocks.blocker_id = auth.uid()
          and blocks.blocked_id = foods.creator_id
      )
      and not exists (
        select 1 from hidden_foods
        where hidden_foods.user_id = auth.uid()
          and hidden_foods.food_id = foods.id
      )
    )
    -- the creator still sees their own dish (with the removal notice)
    or auth.uid() = creator_id
  );

-- ---------- on new report: hide for reporter, auto-hide when needed ---------
create or replace function on_report_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  reporters int;
begin
  if new.food_id is null then
    return new;
  end if;

  insert into hidden_foods (user_id, food_id)
  values (new.reporter_id, new.food_id)
  on conflict do nothing;

  select count(distinct reporter_id) into reporters
  from reports
  where food_id = new.food_id and status = 'open';

  if new.reason in ('sexual', 'child_safety') or reporters >= 3 then
    update foods set moderation_state = 'hidden_pending'
    where id = new.food_id and moderation_state = 'visible';
  end if;

  return new;
end;
$$;

create trigger reports_after_insert
  after insert on reports
  for each row execute function on_report_insert();

-- ---------- moderation_actions ---------------------------------------------
create table moderation_actions (
  id uuid primary key default gen_random_uuid(),
  food_id uuid references foods (id) on delete set null,
  comment_id uuid references comments (id) on delete set null,
  target_user_id uuid references profiles (id) on delete cascade,
  action text not null
    check (action in ('keep', 'hide', 'remove', 'warn', 'suspend', 'ban', 'restore')),
  reason text not null,                 -- same values as reports.reason
  note text,                            -- what the creator is told
  suspended_until timestamptz,          -- for 'suspend'
  notified_at timestamptz,
  appeal_status text not null default 'none'
    check (appeal_status in ('none', 'requested', 'upheld', 'reversed')),
  created_at timestamptz not null default now()
);

create index moderation_actions_target_idx on moderation_actions (target_user_id, created_at desc);

alter table moderation_actions enable row level security;

-- Written only by the operator (service role / dashboard). The creator can
-- read the decisions about their own content and ask for an appeal.
create policy "creators can read actions about them"
  on moderation_actions for select
  using (target_user_id = auth.uid());

create policy "creators can request an appeal"
  on moderation_actions for update
  using (target_user_id = auth.uid() and appeal_status = 'none')
  with check (target_user_id = auth.uid() and appeal_status = 'requested');

revoke update on moderation_actions from authenticated;
grant update (appeal_status) on moderation_actions to authenticated;

-- ---------- operator queue (dashboard only) --------------------------------
create view moderation_queue as
  select
    r.id as report_id, r.created_at, r.created_at + interval '24 hours' as due_at,
    r.reason, r.note, r.food_id, r.comment_id, r.reported_user_id, r.reporter_id,
    f.name as food_name, f.moderation_state,
    (select count(distinct r2.reporter_id) from reports r2
      where r2.food_id = r.food_id and r2.status = 'open') as open_reporters
  from reports r
  left join foods f on f.id = r.food_id
  where r.status = 'open'
  order by (r.reason in ('child_safety', 'sexual')) desc, r.created_at;

revoke all on moderation_queue from anon, authenticated;
