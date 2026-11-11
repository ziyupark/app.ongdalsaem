-- Community: Tables (topic spaces), neighborhood questions, food challenges
-- docs/04-screens/04-community.md (4.20–4.22b) · 03-nearby (3.7–3.8) · 06-data-model
--   * topic_tables     = joinable topic spaces (#SoloMeals, #KidsTable …)
--   * table_members    = who joined; joined tables feed the Following tab
--   * table_posts      = a dish shared to a table (by its creator, a member)
--   * questions        = short neighborhood questions (≤200 chars, 7 days)
--   * answers          = replies; the asker can pick one (best_answer_id)
--   * challenges       = period-limited cooking challenges with a tag
--   * challenge_entries= a published dish posted as proof while it runs
--   Eat together (4.23) is Phase 2 and has no tables yet.

-- ---------- topic tables ----------------------------------------------------
create table topic_tables (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null check (char_length(name) <= 40),      -- '#SoloMeals'
  description text check (char_length(description) <= 120),
  rules text check (char_length(rules) <= 300),
  cover_url text,
  created_by uuid references profiles (id) on delete set null, -- null = ongdalsaem
  member_count int not null default 0,
  created_at timestamptz not null default now()
);

create table table_members (
  table_id uuid not null references topic_tables (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (table_id, user_id)
);
create index table_members_user_idx on table_members (user_id);

create table table_posts (
  table_id uuid not null references topic_tables (id) on delete cascade,
  food_id uuid not null references foods (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (table_id, food_id)
);
create index table_posts_table_idx on table_posts (table_id, created_at desc);

alter table topic_tables enable row level security;
alter table table_members enable row level security;
alter table table_posts enable row level security;

create policy "tables are public" on topic_tables for select using (true);

create policy "members are public" on table_members for select using (true);
create policy "join a table" on table_members for insert
  with check (user_id = auth.uid());
create policy "leave a table" on table_members for delete
  using (user_id = auth.uid());

-- foods RLS already hides blocked / hidden / non-visible dishes
create policy "table posts are public" on table_posts for select using (true);
create policy "members post their own dishes" on table_posts for insert
  with check (
    exists (select 1 from table_members m
            where m.table_id = table_posts.table_id and m.user_id = auth.uid())
    and exists (select 1 from foods f
                where f.id = table_posts.food_id and f.creator_id = auth.uid())
  );
create policy "remove own table post" on table_posts for delete
  using (exists (select 1 from foods f
                 where f.id = table_posts.food_id and f.creator_id = auth.uid()));

create or replace function bump_table_member_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update topic_tables set member_count = member_count + 1 where id = new.table_id;
  else
    update topic_tables set member_count = greatest(member_count - 1, 0) where id = old.table_id;
  end if;
  return null;
end;
$$;
create trigger table_members_count
  after insert or delete on table_members
  for each row execute function bump_table_member_count();

-- ---------- neighborhood questions -----------------------------------------
create table questions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles (id) on delete cascade,
  body text not null check (char_length(body) between 5 and 200),
  category text not null default 'other'
    check (category in ('where_to_eat', 'recipe_help', 'ingredients', 'market_deals', 'other')),
  image_url text,
  neighborhood text,                      -- shown label, e.g. 'Mangwon-dong'
  city text,
  country text,
  table_id uuid references topic_tables (id) on delete set null, -- asked inside a table
  best_answer_id uuid,
  answer_count int not null default 0,
  me_too_count int not null default 0,
  moderation_state text not null default 'visible'
    check (moderation_state in ('visible', 'hidden_pending', 'removed')),
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);
create index questions_place_idx on questions (country, city, neighborhood, created_at desc);
create index questions_table_idx on questions (table_id, created_at desc) where table_id is not null;

create table answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  helpful_count int not null default 0,
  created_at timestamptz not null default now()
);
create index answers_question_idx on answers (question_id, created_at);

alter table questions
  add constraint questions_best_answer_fk
  foreign key (best_answer_id) references answers (id) on delete set null;

create table question_me_too (
  question_id uuid not null references questions (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  primary key (question_id, user_id)
);

create table answer_helpful (
  answer_id uuid not null references answers (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  primary key (answer_id, user_id)
);

alter table questions enable row level security;
alter table answers enable row level security;
alter table question_me_too enable row level security;
alter table answer_helpful enable row level security;

create policy "open questions are readable" on questions for select
  using (
    (
      moderation_state = 'visible' and expires_at > now()
      and not exists (select 1 from blocks b
                      where b.blocker_id = auth.uid() and b.blocked_id = questions.author_id)
    )
    or author_id = auth.uid()
  );
create policy "ask a question" on questions for insert
  with check (author_id = auth.uid() and best_answer_id is null);
create policy "asker edits own question" on questions for update
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "asker deletes own question" on questions for delete
  using (author_id = auth.uid());

-- counters and moderation are trigger-managed; the asker may only change these
revoke update on questions from authenticated;
grant update (body, category, image_url, best_answer_id) on questions to authenticated;

create policy "answers are readable" on answers for select
  using (
    exists (select 1 from questions q where q.id = answers.question_id)
    and not exists (select 1 from blocks b
                    where b.blocker_id = auth.uid() and b.blocked_id = answers.author_id)
  );
create policy "answer a question" on answers for insert
  with check (
    author_id = auth.uid()
    and exists (select 1 from questions q
                where q.id = answers.question_id and q.expires_at > now()
                  and q.moderation_state = 'visible')
  );
create policy "delete own answer" on answers for delete using (author_id = auth.uid());

create policy "me too is public" on question_me_too for select using (true);
create policy "add me too" on question_me_too for insert with check (user_id = auth.uid());
create policy "remove me too" on question_me_too for delete using (user_id = auth.uid());

create policy "helpful is public" on answer_helpful for select using (true);
create policy "mark helpful" on answer_helpful for insert with check (user_id = auth.uid());
create policy "unmark helpful" on answer_helpful for delete using (user_id = auth.uid());

-- the picked answer must belong to the same question
create or replace function check_best_answer()
returns trigger language plpgsql as $$
begin
  if new.best_answer_id is not null and not exists (
    select 1 from answers a where a.id = new.best_answer_id and a.question_id = new.id
  ) then
    raise exception 'best_answer_not_in_question';
  end if;
  return new;
end;
$$;
create trigger questions_best_answer_check
  before update of best_answer_id on questions
  for each row execute function check_best_answer();

create or replace function bump_question_counts()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'answers' then
    update questions set answer_count = answer_count + (case when tg_op = 'INSERT' then 1 else -1 end)
    where id = coalesce(new.question_id, old.question_id);
  elsif tg_table_name = 'question_me_too' then
    update questions set me_too_count = me_too_count + (case when tg_op = 'INSERT' then 1 else -1 end)
    where id = coalesce(new.question_id, old.question_id);
  elsif tg_table_name = 'answer_helpful' then
    update answers set helpful_count = helpful_count + (case when tg_op = 'INSERT' then 1 else -1 end)
    where id = coalesce(new.answer_id, old.answer_id);
  end if;
  return null;
end;
$$;
create trigger answers_count after insert or delete on answers
  for each row execute function bump_question_counts();
create trigger me_too_count after insert or delete on question_me_too
  for each row execute function bump_question_counts();
create trigger helpful_count after insert or delete on answer_helpful
  for each row execute function bump_question_counts();

-- reports can point at questions and answers too
alter table reports
  add column question_id uuid references questions (id) on delete set null,
  add column answer_id uuid references answers (id) on delete set null;

-- ---------- food challenges -------------------------------------------------
create table challenges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  title text not null check (char_length(title) <= 40),
  description text check (char_length(description) <= 140),
  rule text check (char_length(rule) <= 200),
  tag text not null check (tag ~ '^[A-Za-z0-9]{2,30}$'),   -- 'MidnightRamyeon'
  country text,                                           -- flag on the card
  cover_url text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  participant_count int not null default 0,
  entry_count int not null default 0,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index challenges_ends_idx on challenges (ends_at);

create table challenge_participants (
  challenge_id uuid not null references challenges (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);
create index challenge_participants_user_idx on challenge_participants (user_id);

create table challenge_entries (
  challenge_id uuid not null references challenges (id) on delete cascade,
  food_id uuid not null references foods (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (challenge_id, food_id)
);
create index challenge_entries_idx on challenge_entries (challenge_id, created_at desc);

alter table challenges enable row level security;
alter table challenge_participants enable row level security;
alter table challenge_entries enable row level security;

create policy "challenges are public" on challenges for select using (true);

create policy "participants are public" on challenge_participants for select using (true);
create policy "join a challenge" on challenge_participants for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from challenges c
                where c.id = challenge_participants.challenge_id and c.ends_at > now())
  );
create policy "leave a challenge" on challenge_participants for delete
  using (user_id = auth.uid());

create policy "entries are public" on challenge_entries for select using (true);
create policy "post an entry while it runs" on challenge_entries for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from challenge_participants p
                where p.challenge_id = challenge_entries.challenge_id and p.user_id = auth.uid())
    and exists (select 1 from challenges c
                where c.id = challenge_entries.challenge_id
                  and now() between c.starts_at and c.ends_at)
    and exists (select 1 from foods f
                where f.id = challenge_entries.food_id and f.creator_id = auth.uid()
                  and f.status = 'published')
  );
create policy "remove own entry" on challenge_entries for delete using (user_id = auth.uid());

create or replace function bump_challenge_counts()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'challenge_participants' then
    update challenges set participant_count = greatest(participant_count + (case when tg_op = 'INSERT' then 1 else -1 end), 0)
    where id = coalesce(new.challenge_id, old.challenge_id);
  else
    update challenges set entry_count = greatest(entry_count + (case when tg_op = 'INSERT' then 1 else -1 end), 0)
    where id = coalesce(new.challenge_id, old.challenge_id);
  end if;
  return null;
end;
$$;
create trigger challenge_participants_count after insert or delete on challenge_participants
  for each row execute function bump_challenge_counts();
create trigger challenge_entries_count after insert or delete on challenge_entries
  for each row execute function bump_challenge_counts();

-- card / detail state: upcoming · running · closing_soon (< 72h left) · ended
create view challenge_cards with (security_invoker = true) as
  select c.*,
    case
      when now() < c.starts_at then 'upcoming'
      when now() >= c.ends_at then 'ended'
      when c.ends_at - now() < interval '72 hours' then 'closing_soon'
      else 'running'
    end as phase,
    exists (select 1 from challenge_participants p
            where p.challenge_id = c.id and p.user_id = auth.uid()) as joined
  from challenges c;

grant select on challenge_cards to anon, authenticated;

-- ---------- seed: official tables ------------------------------------------
insert into topic_tables (slug, name, description, rules) values
  ('solo-meals',   '#SoloMeals',    'Cooking for one, no leftovers',     'One-person portions. Share what you’d cook again.'),
  ('rainy-day',    '#RainyDayFood', 'Warm bowls for grey days',          'Post dishes you made or ate on a rainy day.'),
  ('kids-table',   '#KidsTable',    'Meals little ones actually eat',    'No photos of children’s faces. Note allergens.'),
  ('plant-based',  '#PlantBased',   'Vegan and veggie home cooking',     'No meat, fish or eggs in the main dish.'),
  ('camp-cooking', '#CampCooking',  'One pan, open air',                 'Cook outdoors. Leave no trace.'),
  ('lunch-box',    '#LunchBox',     'Packed lunches that travel well',   'Show the box, not just the dish.')
on conflict (slug) do nothing;
