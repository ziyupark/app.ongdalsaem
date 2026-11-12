-- 7.1 "I made this": a dish cooked from someone else's recipe points at that recipe's post.
-- The original's detail lists who made it; the copy links back. Deleting the original only clears the link.
alter table foods
  add column if not exists cooked_from_id uuid references foods(id) on delete set null;

create index if not exists foods_cooked_from_id_idx on foods (cooked_from_id) where cooked_from_id is not null;
