-- 4.1 Global landscape chips (Forest · Sea · Lake · Mountain · Countryside · City) — picked in 8.2 Details (optional).
alter table foods
  add column if not exists landscape text
    check (landscape is null or landscape in ('forest', 'sea', 'lake', 'mountain', 'countryside', 'city'));

create index if not exists foods_landscape_idx on foods (landscape, created_at desc) where landscape is not null;
