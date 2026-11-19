-- UGC safety for App Review 1.2 (pre-launch review, 2026-11-19)
--   F1  objectionable-word filter: banned_terms + a trigger on every public text a user writes
--       (comments, answers, questions, messages, profile name / @handle / bio, dish name / description)
--   F2  reports can point at a direct message (message_id) or just a person (profile report = reported_user_id only)
--   F3  report handling per target: a comment / answer / question report no longer hides the whole dish;
--       3 reporters (or 1 established sexual / child-safety reporter) hide that comment / answer / question
--   F4  every new report pings the operator (report-alert Edge Function → webhook / email), via pg_net + vault
--       (same vault secrets as 20261108000000_daily_pick_push.sql: project_url, service_role_key)
-- Like 20261120000000, the input checks run only for signed-in callers (auth.uid() is not null), so the dashboard,
-- SQL editor, seed files and the service role are not filtered.

-- =============================================================================================================
-- F1 · objectionable-word filter
-- =============================================================================================================
-- mode 'word'      → whole-word match on the lower-cased text (Latin-script languages: avoids "class" ⊃ "ass")
-- mode 'substring' → match anywhere after removing spaces / punctuation / digits (Korean, Japanese, Chinese, Thai,
--                    and phrases people split with dots or spaces: "씨.발", "ㅅ ㅂ")
-- Operators add or remove rows from the dashboard; the app never reads this table.
create table if not exists banned_terms (
  term text primary key check (term = lower(term) and char_length(term) between 1 and 60),
  mode text not null default 'word' check (mode in ('word', 'substring')),
  lang text,
  created_at timestamptz not null default now()
);
alter table banned_terms enable row level security;
-- no policies: dashboard / service role only
revoke all on banned_terms from anon, authenticated;

create or replace function filter_squash(t text)
returns text language sql immutable set search_path = public as $$
  select regexp_replace(lower(coalesce(t, '')), '[[:space:][:punct:][:digit:]_]+', '', 'g');
$$;

create or replace function has_banned_term(t text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(t, '') <> '' and exists (
    select 1 from banned_terms b
    where (b.mode = 'word' and lower(t) ~ ('(^|[^[:alnum:]])' || regexp_replace(b.term, '([.^$*+?()\[\]{}|\\-])', '\\\1', 'g') || '($|[^[:alnum:]])'))
       or (b.mode = 'substring' and strpos(filter_squash(t), filter_squash(b.term)) > 0)
  );
$$;
revoke all on function has_banned_term(text) from public, anon, authenticated;

-- ugc_filter('col1', 'col2', …): refuses the row when one of the named text columns holds a banned term.
-- On UPDATE only columns that changed are checked (an old dish isn't locked by a term added later).
create or replace function ugc_filter()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  i int := 0;
  val text;
  old_val text;
begin
  if auth.uid() is null then
    return new;
  end if;
  while i < tg_nargs loop
    execute format('select ($1).%I::text', tg_argv[i]) into val using new;
    if tg_op = 'UPDATE' then
      execute format('select ($1).%I::text', tg_argv[i]) into old_val using old;
    end if;
    if (tg_op = 'INSERT' or val is distinct from old_val) and has_banned_term(val) then
      raise exception 'objectionable_content' using errcode = 'P0001', hint = tg_argv[i];
    end if;
    i := i + 1;
  end loop;
  return new;
end;
$$;

drop trigger if exists ugc_filter on comments;
create trigger ugc_filter before insert or update of body on comments
  for each row execute function ugc_filter('body');
drop trigger if exists ugc_filter on answers;
create trigger ugc_filter before insert or update of body on answers
  for each row execute function ugc_filter('body');
drop trigger if exists ugc_filter on questions;
create trigger ugc_filter before insert or update of body on questions
  for each row execute function ugc_filter('body');
drop trigger if exists ugc_filter on messages;
create trigger ugc_filter before insert on messages
  for each row execute function ugc_filter('body');
drop trigger if exists ugc_filter on profiles;
create trigger ugc_filter before insert or update of display_name, username, bio on profiles
  for each row execute function ugc_filter('display_name', 'username', 'bio');
drop trigger if exists ugc_filter on foods;
create trigger ugc_filter before insert or update of name, description on foods
  for each row execute function ugc_filter('name', 'description');

-- Starter list: the common slurs and sexual / abusive words in the app's 9 languages. Operators extend it.
insert into banned_terms (term, mode, lang) values
  -- en
  ('fuck', 'word', 'en'), ('fucking', 'word', 'en'), ('fucker', 'word', 'en'), ('motherfucker', 'word', 'en'),
  ('shit', 'word', 'en'), ('bullshit', 'word', 'en'), ('bitch', 'word', 'en'), ('cunt', 'word', 'en'),
  ('asshole', 'word', 'en'), ('dickhead', 'word', 'en'), ('pussy', 'word', 'en'), ('whore', 'word', 'en'),
  ('slut', 'word', 'en'), ('nigger', 'substring', 'en'), ('nigga', 'word', 'en'), ('faggot', 'substring', 'en'),
  ('fag', 'word', 'en'), ('retard', 'word', 'en'), ('kys', 'word', 'en'), ('kill yourself', 'substring', 'en'),
  ('rape', 'word', 'en'),
  -- ko
  ('씨발', 'substring', 'ko'), ('시발', 'substring', 'ko'), ('씨빨', 'substring', 'ko'),
  ('ㅅㅂ', 'substring', 'ko'), ('ㅆㅂ', 'substring', 'ko'), ('병신', 'substring', 'ko'), ('븅신', 'substring', 'ko'),
  ('ㅂㅅ', 'substring', 'ko'), ('좆', 'substring', 'ko'), ('개새끼', 'substring', 'ko'), ('개새기', 'substring', 'ko'),
  ('지랄', 'substring', 'ko'), ('ㅈㄹ', 'substring', 'ko'), ('미친놈', 'substring', 'ko'), ('미친년', 'substring', 'ko'),
  ('엠창', 'substring', 'ko'), ('느금마', 'substring', 'ko'), ('니애미', 'substring', 'ko'), ('니미럴', 'substring', 'ko'),
  ('창녀', 'substring', 'ko'), ('섹스', 'substring', 'ko'), ('보지털', 'substring', 'ko'), ('자지털', 'substring', 'ko'),
  ('자살해', 'substring', 'ko'), ('한남충', 'substring', 'ko'),
  ('김치녀', 'substring', 'ko'), ('틀딱', 'substring', 'ko'), ('짱깨', 'substring', 'ko'), ('쪽바리', 'substring', 'ko'),
  -- es
  ('puta', 'word', 'es'), ('puto', 'word', 'es'), ('mierda', 'word', 'es'), ('pendejo', 'word', 'es'),
  ('cabrón', 'word', 'es'), ('cabron', 'word', 'es'), ('coño', 'word', 'es'), ('maricón', 'word', 'es'),
  ('maricon', 'word', 'es'), ('gilipollas', 'word', 'es'), ('hijo de puta', 'substring', 'es'),
  -- pt-BR
  ('caralho', 'word', 'pt'), ('porra', 'word', 'pt'), ('viado', 'word', 'pt'), ('foder', 'word', 'pt'),
  ('fodase', 'word', 'pt'), ('buceta', 'word', 'pt'), ('cuzão', 'word', 'pt'), ('arrombado', 'word', 'pt'),
  ('filho da puta', 'substring', 'pt'),
  -- id
  ('bangsat', 'word', 'id'), ('kontol', 'word', 'id'), ('memek', 'word', 'id'), ('ngentot', 'word', 'id'),
  ('bajingan', 'word', 'id'), ('jancok', 'word', 'id'),
  -- ja
  ('死ね', 'substring', 'ja'), ('殺すぞ', 'substring', 'ja'), ('きちがい', 'substring', 'ja'),
  ('キチガイ', 'substring', 'ja'), ('まんこ', 'substring', 'ja'), ('ちんこ', 'substring', 'ja'), ('クソ野郎', 'substring', 'ja'),
  -- th
  ('เหี้ย', 'substring', 'th'), ('ควย', 'substring', 'th'), ('เย็ด', 'substring', 'th'), ('สัส', 'substring', 'th'),
  ('ไอ้สัตว์', 'substring', 'th'),
  -- vi
  ('địt', 'word', 'vi'), ('đụ', 'word', 'vi'), ('lồn', 'word', 'vi'), ('cặc', 'word', 'vi'), ('đéo', 'word', 'vi'),
  ('đĩ', 'word', 'vi'), ('đm', 'word', 'vi'), ('vcl', 'word', 'vi'),
  -- zh-TW
  ('幹你娘', 'substring', 'zh'), ('操你媽', 'substring', 'zh'), ('操你妈', 'substring', 'zh'), ('雞掰', 'substring', 'zh'),
  ('機掰', 'substring', 'zh'), ('王八蛋', 'substring', 'zh'), ('婊子', 'substring', 'zh'), ('去死', 'substring', 'zh')
on conflict (term) do nothing;

-- =============================================================================================================
-- F2 · reports on a direct message or a person
-- =============================================================================================================
alter table reports add column if not exists message_id uuid references messages (id) on delete set null;

-- Duplicate check now includes the message, and only a dish report hides the dish for the reporter.
create or replace function reports_skip_duplicate()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from reports r
    where r.reporter_id = new.reporter_id and r.status = 'open'
      and r.food_id is not distinct from new.food_id
      and r.comment_id is not distinct from new.comment_id
      and r.question_id is not distinct from new.question_id
      and r.answer_id is not distinct from new.answer_id
      and r.message_id is not distinct from new.message_id
      and r.reported_user_id is not distinct from new.reported_user_id
  ) then
    if new.food_id is not null and new.comment_id is null then
      insert into hidden_foods (user_id, food_id) values (new.reporter_id, new.food_id) on conflict do nothing;
    end if;
    return null;
  end if;
  return new;
end;
$$;

-- =============================================================================================================
-- F3 · comments and answers can be hidden by reports, like dishes and questions
-- =============================================================================================================
alter table comments add column if not exists moderation_state text not null default 'visible'
  check (moderation_state in ('visible', 'hidden_pending', 'removed'));
alter table answers add column if not exists moderation_state text not null default 'visible'
  check (moderation_state in ('visible', 'hidden_pending', 'removed'));

-- Owners can't flip their own moderation_state back (the columns the app writes stay writable).
revoke update on comments from anon, authenticated;
grant update (body) on comments to authenticated;
revoke update on answers from anon, authenticated;
grant update (body) on answers to authenticated;

drop policy "comments are readable with their food" on comments;
create policy "comments are readable with their food"
  on comments for select
  using (
    exists (
      select 1 from foods
      where foods.id = comments.food_id
        and (
          (foods.visibility = 'everyone' and foods.status = 'published' and foods.moderation_state = 'visible')
          or (select auth.uid()) = foods.creator_id
        )
    )
    and not is_blocked_between((select auth.uid()), comments.user_id)
    and (comments.moderation_state = 'visible' or comments.user_id = (select auth.uid()))
  );

drop policy "answers are readable" on answers;
create policy "answers are readable" on answers for select
  using (
    exists (select 1 from questions q where q.id = answers.question_id)
    and not is_blocked_between((select auth.uid()), answers.author_id)
    and (answers.moderation_state = 'visible' or answers.author_id = (select auth.uid()))
  );

-- One report → the right target. A comment report carries the dish id (for the operator's context) but no longer
-- hides the dish; messages and profiles are only queued (the reporter can block, which hides both ways at once).
create or replace function on_report_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  reporters int;
  established boolean;
  severe boolean;
begin
  select created_at < now() - interval '24 hours' into established from profiles where id = new.reporter_id;
  severe := new.reason in ('sexual', 'child_safety') and coalesce(established, false);

  if new.comment_id is not null then
    select count(distinct reporter_id) into reporters from reports where comment_id = new.comment_id and status = 'open';
    if severe or reporters >= 3 then
      update comments set moderation_state = 'hidden_pending' where id = new.comment_id and moderation_state = 'visible';
    end if;
  elsif new.answer_id is not null then
    select count(distinct reporter_id) into reporters from reports where answer_id = new.answer_id and status = 'open';
    if severe or reporters >= 3 then
      update answers set moderation_state = 'hidden_pending' where id = new.answer_id and moderation_state = 'visible';
    end if;
  elsif new.question_id is not null then
    select count(distinct reporter_id) into reporters
    from reports where question_id = new.question_id and answer_id is null and status = 'open';
    if severe or reporters >= 3 then
      update questions set moderation_state = 'hidden_pending' where id = new.question_id and moderation_state = 'visible';
    end if;
  elsif new.food_id is not null then
    insert into hidden_foods (user_id, food_id) values (new.reporter_id, new.food_id) on conflict do nothing;
    select count(distinct reporter_id) into reporters
    from reports where food_id = new.food_id and comment_id is null and status = 'open';
    if severe or reporters >= 3 then
      update foods set moderation_state = 'hidden_pending' where id = new.food_id and moderation_state = 'visible';
    end if;
  end if;
  return new;
end;
$$;

-- Operator queue: every target, oldest first, severe reasons on top.
drop view if exists moderation_queue;
create view moderation_queue as
  select
    r.id as report_id, r.created_at, r.created_at + interval '24 hours' as due_at,
    r.reason, r.note,
    case
      when r.comment_id is not null then 'comment'
      when r.answer_id is not null then 'answer'
      when r.question_id is not null then 'question'
      when r.message_id is not null then 'message'
      when r.food_id is not null then 'dish'
      else 'profile'
    end as target,
    r.food_id, r.comment_id, r.question_id, r.answer_id, r.message_id, r.reported_user_id, r.reporter_id,
    f.name as food_name, f.moderation_state,
    coalesce(c.body, a.body, m.body, q.body) as reported_text
  from reports r
  left join foods f on f.id = r.food_id
  left join comments c on c.id = r.comment_id
  left join answers a on a.id = r.answer_id
  left join questions q on q.id = r.question_id
  left join messages m on m.id = r.message_id
  where r.status = 'open'
  order by (r.reason in ('child_safety', 'sexual')) desc, r.created_at;

revoke all on moderation_queue from anon, authenticated;

-- =============================================================================================================
-- F4 · tell the operator about every report (report-alert Edge Function)
-- =============================================================================================================
create extension if not exists pg_net with schema extensions;

create or replace function notify_report()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    perform net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/report-alert',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
      ),
      body := jsonb_build_object('report_id', new.id)
    );
  exception when others then
    -- a missing secret or pg_net hiccup must never block the report itself
    raise warning 'notify_report: %', sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists reports_notify on reports;
create trigger reports_notify
  after insert on reports
  for each row execute function notify_report();
