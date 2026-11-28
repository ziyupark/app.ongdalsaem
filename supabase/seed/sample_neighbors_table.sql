-- ongdalsaem — SAMPLE DATA (dev only): 4.4 Neighbors' Table for Sat Nov 28 and Sun Nov 29, 2026 (KST).
-- Run after sample_posts_v2.sql (needs the sample cooks Minji · Jae). Safe to re-run (fixed ids, on conflict do nothing).
-- 15 public dishes in Mapo, Seoul, geohash cell wydm1 (the area the test devices post from): 9 on Nov 28, 6 on Nov 29.
-- Fixed dates on purpose: until Nov 29 begins the Nov 29 plates show up as a separate table dated Sunday, above
-- Today's table; on Nov 29 they become Today's table and the Nov 28 plates become Yesterday's table.
-- Removed with the sample cooks by supabase/seed/sample_posts_cleanup.sql.

insert into foods (id, creator_id, image_url, image_type, name, description, weather_condition, temperature_c,
                   temperature_tags, mood_tags, meal_type, city, country, neighborhood, geohash6, landscape,
                   dish_type, place_name, visibility, status, ingredients, steps, calories, created_at, taken_at)
select v.id::uuid, v.creator::uuid,
       'https://images.unsplash.com/photo-' || v.photo || '?auto=format&fit=crop&w=1080&q=80', 'photo',
       v.name, v.descr, v.weather, v.temp,
       array[case when v.temp <= 4 then 'cold' when v.temp <= 12 then 'cool' when v.temp <= 20 then 'mild' when v.temp <= 27 then 'warm' else 'hot' end],
       v.moods, v.meals, 'Seoul', 'KR', null, v.cell, null,
       'home', null, 'everyone', 'published', '[]'::jsonb, '[]'::jsonb, v.kcal, v.at::timestamptz, v.at::timestamptz
from (values
  -- Sat Nov 28 (today's table)
  ('b0000000-0000-4000-8000-000000000101', 'a0000000-0000-4000-8000-000000000001', '1506084868230-bb9d95c24759', 'Pancakes before the rain', 'Grey sky, warm stack.', 'cloudy', 6, array['cozy'], array['breakfast'], 'wydm1p', 420, '2026-11-28 07:40+09'),
  ('b0000000-0000-4000-8000-000000000102', 'a0000000-0000-4000-8000-000000000002', '1589047133481-02b4a5327d89', 'Steamed mandu, frozen batch', 'Last ten from Sunday''s folding.', 'cloudy', 6, array['nostalgic'], array['breakfast'], 'wydm1n', 380, '2026-11-28 08:50+09'),
  ('b0000000-0000-4000-8000-000000000103', 'a0000000-0000-4000-8000-000000000001', '1718777791239-c473e9ce7376', 'Namul bibimbap, small bowl', 'Clearing out the side-dish boxes.', 'overcast', 7, array['calm'], array['lunch'], 'wydm1r', 540, '2026-11-28 10:20+09'),
  ('b0000000-0000-4000-8000-000000000104', 'a0000000-0000-4000-8000-000000000002', '1787273846279-c81fbc3b9c2a', 'Kimchi fried rice', 'Old kimchi, one egg, five minutes.', 'overcast', 8, array['energized'], array['lunch'], 'wydm1q', 610, '2026-11-28 12:10+09'),
  ('b0000000-0000-4000-8000-000000000105', 'a0000000-0000-4000-8000-000000000001', '1558220831-9ad8f955fb9b', 'Anchovy noodle soup', 'The broth did all the work.', 'overcast', 8, array['comforting'], array['lunch'], 'wydm1p', 450, '2026-11-28 13:30+09'),
  ('b0000000-0000-4000-8000-000000000106', 'a0000000-0000-4000-8000-000000000002', '1538220856186-0be0e085984d', 'French toast, 4 PM', 'Stale bread, good butter.', 'cloudy', 8, array['cozy'], array['snack'], 'wydm1j', 330, '2026-11-28 15:40+09'),
  ('b0000000-0000-4000-8000-000000000107', 'a0000000-0000-4000-8000-000000000001', '1777113310299-c3e41dec4e0f', 'Kimchi jjigae for two', 'A friend came over, so: double.', 'cloudy', 7, array['together','hearty'], array['dinner'], 'wydm1m', 430, '2026-11-28 17:20+09'),
  ('b0000000-0000-4000-8000-000000000108', 'a0000000-0000-4000-8000-000000000002', '1604632910985-5a738e3237d2', 'Pan-fried dumplings', 'Crispy bottoms, soft tops.', 'cloudy', 6, array['together'], array['dinner'], 'wydm1n', 520, '2026-11-28 18:50+09'),
  ('b0000000-0000-4000-8000-000000000109', 'a0000000-0000-4000-8000-000000000001', '1612927601601-6638404737ce', 'Late ramen with a soft egg', 'Six and a half minutes, as always.', 'cloudy', 5, array['comforting'], array['snack'], 'wydm1p', 560, '2026-11-28 20:10+09'),
  -- Sun Nov 29
  ('b0000000-0000-4000-8000-000000000110', 'a0000000-0000-4000-8000-000000000002', '1647093953000-9065ed6f85ef', 'Fried rice with a crispy egg', 'Sunday starts with leftovers.', 'clear', 4, array['energized'], array['breakfast'], 'wydm1q', 590, '2026-11-29 08:00+09'),
  ('b0000000-0000-4000-8000-000000000111', 'a0000000-0000-4000-8000-000000000001', '1590301157890-4810ed352733', 'Sunday bibimbap', 'Every colour in the fridge.', 'clear', 5, array['fresh'], array['breakfast'], 'wydm1r', 560, '2026-11-29 09:40+09'),
  ('b0000000-0000-4000-8000-000000000112', 'a0000000-0000-4000-8000-000000000002', '1511910849309-0dffb8785146', 'Beef noodle soup', 'Simmered while I cleaned.', 'clear', 7, array['hearty'], array['lunch'], 'wydm1j', 690, '2026-11-29 12:20+09'),
  ('b0000000-0000-4000-8000-000000000113', 'a0000000-0000-4000-8000-000000000001', '1606091484089-089fa86fad4f', 'Cacio e pepe for one', 'Pepper, cheese, pasta water. Done.', 'clear', 8, array['calm'], array['lunch'], 'wydm1m', 640, '2026-11-29 14:00+09'),
  ('b0000000-0000-4000-8000-000000000114', 'a0000000-0000-4000-8000-000000000002', '1526318896980-cf78c088247c', 'Miso butter ramen', 'Cold night, extra butter.', 'clear', 3, array['cozy','hearty'], array['dinner'], 'wydm1n', 780, '2026-11-29 18:10+09'),
  ('b0000000-0000-4000-8000-000000000115', 'a0000000-0000-4000-8000-000000000001', '1612966893103-790e549a2ab1', 'Fresh tagliatelle', 'Rolled by hand, eaten too fast.', 'clear', 3, array['together'], array['dinner'], 'wydm1p', 720, '2026-11-29 19:30+09')
) as v(id, creator, photo, name, descr, weather, temp, moods, meals, cell, kcal, at)
on conflict (id) do nothing;

-- cover photo as the first gallery image (7.1 reads food_images)
insert into food_images (food_id, user_id, image_url, image_type, display_order)
select id, creator_id, image_url, 'photo', 0 from foods where id::text like 'b0000000-0000-4000-8000-0000000001%'
on conflict (food_id, display_order) do nothing;
