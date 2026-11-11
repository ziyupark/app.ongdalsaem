-- 4.10 Community · Challenges — each challenge gets an illustration theme, plus seasonal holiday challenges.
-- theme: chuseok · halloween · christmas · seollal · valentine · diwali · forest (everyday, the default).
alter table challenges add column if not exists theme text not null default 'forest';

-- The everyday starters keep the forest illustration (default). Holiday challenges:
insert into challenges (slug, title, description, rule, tag, country, starts_at, ends_at, theme) values
  ('pumpkin-soup-night', 'Pumpkin Soup Night', 'Carve it, roast it, blend it. A bowl of orange for the spookiest night.',
   'Anything with pumpkin', 'PumpkinSoupNight', null, '2026-10-24 00:00+00', '2026-11-01 15:00+00', 'halloween'),
  ('christmas-bake-off', 'Christmas Bake-Off', 'Stollen, bûche or a tray of cookies — bake something worth sharing.',
   'Baked, festive, shared', 'XmasBakeOff', null, '2026-12-01 00:00+00', '2026-12-26 15:00+00', 'christmas'),
  ('tteokguk-new-year', 'Tteokguk for a New Year', 'One bowl of rice-cake soup and you are a year older. Show us yours.',
   'A bowl of tteokguk', 'TteokgukNewYear', 'KR', '2027-01-30 00:00+00', '2027-02-08 15:00+00', 'seollal'),
  ('valentine-chocolate-box', 'Valentine Chocolate Box', 'Hearts, truffles or a lopsided brownie — made by hand for someone.',
   'Homemade chocolate', 'ChocolateBox', null, '2027-02-07 00:00+00', '2027-02-15 15:00+00', 'valentine'),
  ('songpyeon-shape-off', 'Songpyeon Shape-Off', 'Half-moons under the full moon. The prettiest pleats win.',
   'Handmade songpyeon', 'SongpyeonShapeOff', 'KR', '2027-09-10 00:00+00', '2027-09-17 15:00+00', 'chuseok'),
  ('diwali-sweet-box', 'Diwali Sweet Box', 'Ladoo, barfi, jalebi — a box of sweets for the festival of lights.',
   'Homemade mithai', 'DiwaliSweets', 'IN', '2026-11-03 00:00+00', '2026-11-12 15:00+00', 'diwali')
on conflict (slug) do update set theme = excluded.theme;
