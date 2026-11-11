-- 8.2 Details · Auto context (docs/04-screens/08-share.md).
-- taken_at       — when the cover photo was taken (EXIF / asset creation time), not when it was posted.
-- weather_source — 'auto' = weather + place came from the photo / device; 'place-edited' = the cook changed the place (8.2a).
-- neighborhood   — district shown next to the city ("Mapo, Seoul"). Never coordinates.

alter table foods
  add column if not exists taken_at timestamptz,
  add column if not exists weather_source text not null default 'auto'
    check (weather_source in ('auto', 'place-edited')),
  add column if not exists neighborhood text
    check (neighborhood is null or char_length(neighborhood) <= 60);
