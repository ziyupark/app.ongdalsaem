-- 3.6 Nearby · Within 1 km: a coarse 6-char geohash cell (≈ 1.2 × 0.6 km) of where the dish was.
-- Only the cell is stored — never the exact coordinates.
alter table foods
  add column if not exists geohash6 text check (geohash6 is null or geohash6 ~ '^[0-9b-hjkmnp-z]{6}$');

create index if not exists foods_geohash6_idx on foods (geohash6, created_at desc) where geohash6 is not null;
