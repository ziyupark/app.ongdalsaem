-- Explore · Our area · Today's vote — one pick a day per person, read back only as counts.
--   * cell   = the voter's 5-char geohash area cell (never the exact point)
--   * mood   = the weather family the question was asked for (rain · snow · clear · grey)
--   * choice = a preset option key from the app (e.g. 'rain.stew') or the voter's own short answer
-- Rows are never readable directly: neighborhood_vote_results() returns counts per choice for the cell and its
-- 8 neighbours (plus your own vote, wherever you cast it, so it always shows as yours).

create table if not exists neighborhood_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cell text not null check (cell ~ '^[0-9b-hjkmnp-z]{5}$'),
  vote_date date not null,
  mood text not null check (mood in ('rain', 'snow', 'clear', 'grey')),
  choice text not null check (char_length(btrim(choice)) between 1 and 40),
  created_at timestamptz not null default now(),
  unique (user_id, vote_date)
);

create index if not exists neighborhood_votes_date_cell_idx on neighborhood_votes (vote_date, cell);

alter table neighborhood_votes enable row level security;

-- Insert your own vote for (about) today — the app sends its local date, so allow one day either side of UTC.
create policy "cast own neighborhood vote" on neighborhood_votes for insert to authenticated
  with check (user_id = auth.uid() and vote_date between current_date - 1 and current_date + 1);
-- No select / update / delete policies: reads go through the counting RPC only.

-- A geohash cell and its 8 neighbours, same precision (wraps at ±180° longitude, clamps at the poles).
create or replace function geohash_cells_around(p_cell text)
returns text[]
language plpgsql immutable set search_path = public as $$
declare
  b32 constant text := '0123456789bcdefghjkmnpqrstuvwxyz';
  cell text := lower(p_cell);
  lat_lo float8 := -90; lat_hi float8 := 90; lon_lo float8 := -180; lon_hi float8 := 180;
  is_lon boolean := true;
  idx int; k int; i int; a int; b int; n int; ch int;
  mid float8; lat float8; lon float8; dlat float8; dlon float8; la float8; lo float8;
  enc text;
  cells text[] := '{}';
begin
  if cell is null or cell !~ '^[0-9b-hjkmnp-z]{1,12}$' then
    return array[cell];
  end if;
  -- decode → the cell's box
  for i in 1..length(cell) loop
    idx := strpos(b32, substr(cell, i, 1)) - 1;
    for k in reverse 4..0 loop
      if is_lon then
        mid := (lon_lo + lon_hi) / 2;
        if (idx >> k) & 1 = 1 then lon_lo := mid; else lon_hi := mid; end if;
      else
        mid := (lat_lo + lat_hi) / 2;
        if (idx >> k) & 1 = 1 then lat_lo := mid; else lat_hi := mid; end if;
      end if;
      is_lon := not is_lon;
    end loop;
  end loop;
  lat := (lat_lo + lat_hi) / 2; lon := (lon_lo + lon_hi) / 2;
  dlat := lat_hi - lat_lo; dlon := lon_hi - lon_lo;
  -- encode the centre of each of the 9 boxes
  for a in -1..1 loop
    for b in -1..1 loop
      la := greatest(-89.9999999, least(89.9999999, lat + a * dlat));
      lo := lon + b * dlon;
      if lo >= 180 then lo := lo - 360; elsif lo < -180 then lo := lo + 360; end if;
      lat_lo := -90; lat_hi := 90; lon_lo := -180; lon_hi := 180;
      is_lon := true; enc := ''; n := 0; ch := 0;
      while length(enc) < length(cell) loop
        if is_lon then
          mid := (lon_lo + lon_hi) / 2;
          if lo >= mid then ch := (ch << 1) | 1; lon_lo := mid; else ch := ch << 1; lon_hi := mid; end if;
        else
          mid := (lat_lo + lat_hi) / 2;
          if la >= mid then ch := (ch << 1) | 1; lat_lo := mid; else ch := ch << 1; lat_hi := mid; end if;
        end if;
        is_lon := not is_lon;
        n := n + 1;
        if n = 5 then enc := enc || substr(b32, ch + 1, 1); n := 0; ch := 0; end if;
      end loop;
      if not enc = any(cells) then cells := cells || enc; end if;
    end loop;
  end loop;
  return cells;
end;
$$;

-- Counts per (weather family, choice) for p_date in p_cell and its neighbours; `mine` marks your own pick.
-- Own answers that differ only in case / outer spaces count together.
create or replace function neighborhood_vote_results(p_cell text, p_date date)
returns table (mood text, choice text, votes bigint, mine boolean)
language sql stable security definer set search_path = public as $$
  select v.mood,
         min(btrim(v.choice)) as choice,
         count(*)::bigint as votes,
         coalesce(bool_or(v.user_id = auth.uid()), false) as mine
  from neighborhood_votes v
  where v.vote_date = p_date
    and (v.cell = any(geohash_cells_around(p_cell)) or v.user_id = auth.uid())
  group by v.mood, lower(btrim(v.choice));
$$;

revoke all on function neighborhood_vote_results(text, date) from public, anon;
grant execute on function neighborhood_vote_results(text, date) to authenticated;
