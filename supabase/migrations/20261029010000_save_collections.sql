-- =========================================================================
-- save collections — docs/06-data-model.md (Collection)
-- Screens: 7.8 Save to collection · 7.8b New collection · 6.2 Saved
-- (docs/04-screens/07-dish.md, 06-profile.md).
-- Rules:
--   * "All saved" is not a row — it is every row in `saves` (always on)
--   * a dish can sit in many collections; it must be saved first
--   * removing a save removes it from every collection (cascade below)
--   * weather groups (Rainy · Snowy · Clear) are computed from foods, not stored
-- Collections are private to their owner.
-- =========================================================================

create table collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- same name twice for one owner would be confusing in 7.8
create unique index collections_owner_name_idx on collections (owner_id, lower(btrim(name)));

create trigger collections_set_updated_at
  before update on collections
  for each row execute function set_updated_at();

create table collection_items (
  collection_id uuid not null references collections (id) on delete cascade,
  save_id uuid not null references saves (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, save_id)
);

create index collection_items_save_idx on collection_items (save_id);

alter table collections enable row level security;
alter table collection_items enable row level security;

create policy "owners can read their collections"
  on collections for select using (owner_id = auth.uid());
create policy "owners can create collections"
  on collections for insert with check (owner_id = auth.uid());
create policy "owners can rename collections"
  on collections for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners can delete collections"
  on collections for delete using (owner_id = auth.uid());

-- An item links one of *my* collections to one of *my* saves.
create policy "owners can read their collection items"
  on collection_items for select
  using (exists (select 1 from collections c where c.id = collection_id and c.owner_id = auth.uid()));

create policy "owners can add to their collections"
  on collection_items for insert
  with check (
    exists (select 1 from collections c where c.id = collection_id and c.owner_id = auth.uid())
    and exists (select 1 from saves s where s.id = save_id and s.user_id = auth.uid())
  );

create policy "owners can remove from their collections"
  on collection_items for delete
  using (exists (select 1 from collections c where c.id = collection_id and c.owner_id = auth.uid()));

-- Bump the collection's updated_at when its contents change (6.2 sort order).
create or replace function touch_collection()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update collections set updated_at = now()
   where id = coalesce(new.collection_id, old.collection_id);
  return coalesce(new, old);
end;
$$;

create trigger collection_items_touch
  after insert or delete on collection_items
  for each row execute function touch_collection();
