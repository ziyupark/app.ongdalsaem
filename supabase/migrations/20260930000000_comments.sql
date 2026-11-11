-- comments — Food Detail's Comments section (FD-01, Figma 218:1512 / 239:2782).
-- `comment_likes` mirrors `likes` itself so a comment's own Like chip works
-- the same way the main Food's Like does.

create table comments (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references foods (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table comment_likes (
  comment_id uuid not null references comments (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

alter table comments enable row level security;
alter table comment_likes enable row level security;

-- comments: a comment is exactly as visible as the food it's attached to —
-- published+everyone, or the food's own creator (same shape as "published
-- foods are publicly readable" on `foods` itself).
create policy "comments are readable with their food"
  on comments for select
  using (
    exists (
      select 1 from foods
      where foods.id = comments.food_id
        and ((foods.visibility = 'everyone' and foods.status = 'published') or auth.uid() = foods.creator_id)
    )
  );

create policy "users can create their own comments"
  on comments for insert
  with check (auth.uid() = user_id);

create policy "users can delete their own comments"
  on comments for delete
  using (auth.uid() = user_id);

-- comment_likes: publicly readable from the start (every viewer needs the
-- true count, not just their own row — same reasoning as
-- 20260925000000_public_like_counts.sql), self-managed writes.
create policy "comment likes are publicly readable"
  on comment_likes for select
  using (true);

create policy "users can create their own comment likes"
  on comment_likes for insert
  with check (auth.uid() = user_id);

create policy "users can delete their own comment likes"
  on comment_likes for delete
  using (auth.uid() = user_id);
