-- 4.1 Explore · Neighbourhood questions: save (bookmark) a question for later. Same shape and rules as saves (dishes):
-- one row per (user, question), only the owner can read / add / remove their own. Gone with the user or the question.
create table if not exists question_saves (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, question_id)
);

create index if not exists question_saves_question_id_idx on question_saves (question_id);

alter table question_saves enable row level security;

create policy "users can read their own question saves"
  on question_saves for select
  using ((select auth.uid()) = user_id);

create policy "users can create their own question saves"
  on question_saves for insert
  with check ((select auth.uid()) = user_id);

create policy "users can delete their own question saves"
  on question_saves for delete
  using ((select auth.uid()) = user_id);

revoke all on question_saves from anon;
grant select, insert, delete on question_saves to authenticated;
