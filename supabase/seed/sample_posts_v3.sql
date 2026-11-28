-- ongdalsaem — SAMPLE DATA v3 (dev only). Run after sample_posts.sql. Safe to re-run (fixed ids, on conflict do nothing).
-- Avatars for the 10 sample cooks + 20 more public dishes (b…0201–0220) · acorns · comments.
-- Photos: Unsplash (free to use under the Unsplash License). Remove with supabase/seed/sample_posts_cleanup.sql.

-- ---------------------------------------------------------------- 1. avatars
update profiles as prof set avatar_url = 'https://images.unsplash.com/photo-' || v.photo || '?auto=format&fit=crop&crop=faces&w=400&h=400&q=80'
from (values
  ('a0000000-0000-4000-8000-000000000001', '1541823709867-1b206113eafd'),
  ('a0000000-0000-4000-8000-000000000002', '1542909168-82c3e7fdca5c'),
  ('a0000000-0000-4000-8000-000000000003', '1569913486515-b74bf7751574'),
  ('a0000000-0000-4000-8000-000000000004', '1532170579297-281918c8ae72'),
  ('a0000000-0000-4000-8000-000000000005', '1548142813-c348350df52b'),
  ('a0000000-0000-4000-8000-000000000006', '1534528741775-53994a69daeb'),
  ('a0000000-0000-4000-8000-000000000007', '1616002411355-49593fd89721'),
  ('a0000000-0000-4000-8000-000000000008', '1500648767791-00dcc994a43e'),
  ('a0000000-0000-4000-8000-000000000009', '1517365830460-955ce3ccd263'),
  ('a0000000-0000-4000-8000-000000000010', '1520813792240-56fc4a3765a7')
) as v(id, photo)
where prof.id = v.id::uuid;

-- ---------------------------------------------------------------- 2. dishes
insert into foods (id, creator_id, image_url, image_type, name, description, weather_condition, temperature_c,
                   temperature_tags, mood_tags, meal_type, city, country, neighborhood, geohash6, landscape,
                   dish_type, place_name, visibility, status, ingredients, steps, calories, servings, created_at, taken_at)
select v.id::uuid, v.creator::uuid,
       'https://images.unsplash.com/photo-' || v.photo || '?auto=format&fit=crop&w=1080&q=80', 'photo',
       v.name, v.descr, v.weather, v.temp,
       array[case when v.temp <= 4 then 'cold' when v.temp <= 12 then 'cool' when v.temp <= 20 then 'mild' when v.temp <= 27 then 'warm' else 'hot' end],
       v.moods, v.meals, v.city, v.country, v.ward, v.cell, v.scape,
       v.kind, v.place, 'everyone', 'published', v.ingredients::jsonb, v.steps::jsonb, v.kcal, v.serv,
       now() - (v.hours || ' hours')::interval, now() - (v.hours || ' hours')::interval
from (values
  ('b0000000-0000-4000-8000-000000000201', 'a0000000-0000-4000-8000-000000000001', '1498654896293-37aacf113fd9', 'Bibimbap with all the banchan', 'Cleared the fridge: six little plates, one big bowl.', 'cloudy', 7, array['calm','hearty'], array['lunch'], 'Seoul', 'KR', 'Mapo-gu', 'wydjxu', null, 'home', null,
   '[{"name": "Rice", "amount": "1 bowl"}, {"name": "Spinach namul", "amount": "a handful"}, {"name": "Bean sprouts", "amount": "a handful"}, {"name": "Egg", "amount": "1"}, {"name": "Gochujang", "amount": "1 tbsp"}, {"name": "Sesame oil", "amount": "1 tsp"}]', '[{"text": "Warm the rice and the namul."}, {"text": "Fry the egg, keep the yolk runny.", "timer_sec": 180}, {"text": "Top with gochujang and sesame oil, then mix hard."}]', 620, 1, '0.8'),
  ('b0000000-0000-4000-8000-000000000202', 'a0000000-0000-4000-8000-000000000002', '1635363638580-c2809d049eee', 'Tteokbokki for the cold walk home', 'Rice cakes, fish cakes, a lot of gochujang.', 'overcast', 6, array['energized','comforting'], array['snack'], 'Seoul', 'KR', 'Jung-gu', 'wydm9q', 'city', 'home', null,
   '[{"name": "Rice cakes", "amount": "300 g"}, {"name": "Fish cake", "amount": "2 sheets"}, {"name": "Gochujang", "amount": "2 tbsp"}, {"name": "Sugar", "amount": "1 tbsp"}, {"name": "Scallion", "amount": "1"}]', '[{"text": "Soak the rice cakes if they are hard.", "timer_sec": 600}, {"text": "Boil the sauce, add rice cakes and fish cake.", "timer_sec": 480}, {"text": "Finish with scallion."}]', 540, 2, '1.5'),
  ('b0000000-0000-4000-8000-000000000203', 'a0000000-0000-4000-8000-000000000002', '1626645738196-c2a7c87a8f58', 'Chimaek night', 'Fried chicken, cold beer, the match on.', 'clear-night', 4, array['together','celebrating'], array['dinner'], 'Seoul', 'KR', 'Jung-gu', 'wydm9t', 'city', 'travel', 'Euljiro chicken alley',
   '[]', '[]', null::int, null::int, '4'),
  ('b0000000-0000-4000-8000-000000000204', 'a0000000-0000-4000-8000-000000000001', '1569718212165-3a8278d5f624', 'Shrimp ramen with a jammy egg', 'Instant noodles, but make it Saturday.', 'cloudy', 8, array['cozy','lazy'], array['dinner'], 'Seoul', 'KR', 'Mapo-gu', 'wydjxu', null, 'home', null,
   '[{"name": "Instant ramen", "amount": "1 pack"}, {"name": "Shrimp", "amount": "6"}, {"name": "Egg", "amount": "1"}, {"name": "Bok choy", "amount": "1"}]', '[{"text": "Boil the egg for 6½ minutes.", "timer_sec": 390}, {"text": "Cook the noodles with the shrimp.", "timer_sec": 240}, {"text": "Add bok choy for the last minute."}]', 590, 1, '6'),
  ('b0000000-0000-4000-8000-000000000205', 'a0000000-0000-4000-8000-000000000001', '1499636136210-6f4ee915583e', 'Brown butter cookies', 'Baked a batch to warm the flat up.', 'overcast', 5, array['cozy','nostalgic'], array['snack'], 'Seoul', 'KR', 'Mapo-gu', 'wydjxu', null, 'home', null,
   '[{"name": "Butter", "amount": "115 g"}, {"name": "Brown sugar", "amount": "100 g"}, {"name": "Flour", "amount": "150 g"}, {"name": "Dark chocolate", "amount": "100 g"}, {"name": "Egg", "amount": "1"}]', '[{"text": "Brown the butter and let it cool.", "timer_sec": 300}, {"text": "Mix everything, chill the dough.", "timer_sec": 1800}, {"text": "Bake at 180°C.", "timer_sec": 660}]', 210, 6, '9'),
  ('b0000000-0000-4000-8000-000000000206', 'a0000000-0000-4000-8000-000000000002', '1603133872878-684f208fb84b', 'Egg fried rice, 10 minutes', 'Day-old rice is the whole trick.', 'cloudy', 9, array['energized'], array['lunch'], 'Seoul', 'KR', 'Jung-gu', 'wydm9r', null, 'home', null,
   '[]', '[]', 520, 1, '22'),
  ('b0000000-0000-4000-8000-000000000207', 'a0000000-0000-4000-8000-000000000001', '1578985545062-69928b1d9587', 'Chocolate cake for Jae', 'Three layers, a bit lopsided, all gone.', 'clear', 10, array['celebrating','together'], array['snack'], 'Seoul', 'KR', 'Mapo-gu', 'wydm1m', null, 'home', null,
   '[]', '[]', null::int, 8, '30'),
  ('b0000000-0000-4000-8000-000000000208', 'a0000000-0000-4000-8000-000000000003', '1579871494447-9811cf80d66c', 'Salmon maki on a snow day', 'Couldn''t go out, so the market came to me.', 'snow', -3, array['calm','fresh'], array['dinner'], 'Sapporo', 'JP', 'Chuo-ku', null, 'mountain', 'home', null,
   '[]', '[]', 480, 2, '3'),
  ('b0000000-0000-4000-8000-000000000209', 'a0000000-0000-4000-8000-000000000003', '1467003909585-2f8a72700288', 'Seared salmon with greens', 'Hokkaido salmon, quick pan, lots of lemon.', 'flurries', -1, array['fresh'], array['lunch'], 'Sapporo', 'JP', 'Chuo-ku', null, null, 'home', null,
   '[]', '[]', 430, 1, '27'),
  ('b0000000-0000-4000-8000-000000000210', 'a0000000-0000-4000-8000-000000000004', '1555939594-58d7cb561ad1', 'Night-market skewers', 'One of everything, then one more.', 'drizzle', 19, array['together','energized'], array['dinner'], 'Taipei', 'TW', 'Shilin District', null, 'city', 'travel', 'Shilin Night Market',
   '[]', '[]', null::int, null::int, '5'),
  ('b0000000-0000-4000-8000-000000000211', 'a0000000-0000-4000-8000-000000000004', '1490645935967-10de6ba17061', 'Soft egg breakfast bowl', 'Light start before a long day.', 'cloudy', 18, array['calm','fresh'], array['breakfast'], 'Taipei', 'TW', 'Da''an District', null, null, 'home', null,
   '[]', '[]', 380, 1, '15'),
  ('b0000000-0000-4000-8000-000000000212', 'a0000000-0000-4000-8000-000000000005', '1582878826629-29b7ad1cdc43', 'Phở tái, rare beef', 'Broth poured hot over thin raw beef.', 'fog', 20, array['comforting','calm'], array['breakfast'], 'Hanoi', 'VN', 'Hoàn Kiếm', null, 'lake', 'travel', 'Phở Gia Truyền',
   '[]', '[]', 470, null::int, '7'),
  ('b0000000-0000-4000-8000-000000000213', 'a0000000-0000-4000-8000-000000000005', '1512621776951-a57141f2eefd', 'Rainbow herb bowl', 'Too humid for anything heavy.', 'drizzle', 24, array['fresh'], array['lunch'], 'Hanoi', 'VN', 'Tây Hồ', null, 'lake', 'home', null,
   '[]', '[]', 410, 1, '38'),
  ('b0000000-0000-4000-8000-000000000214', 'a0000000-0000-4000-8000-000000000006', '1617093727343-374698b1b08d', 'Khao soi on a sticky night', 'Curry noodles, crispy on top, soft below.', 'heat', 32, array['hearty','energized'], array['dinner'], 'Bangkok', 'TH', 'Bang Rak', null, 'city', 'home', null,
   '[]', '[]', 680, 1, '8'),
  ('b0000000-0000-4000-8000-000000000215', 'a0000000-0000-4000-8000-000000000006', '1504674900247-0877df9cc836', 'Grilled beef salad', 'Lime, chilli, and the fan on full.', 'clear', 31, array['fresh'], array['lunch'], 'Bangkok', 'TH', 'Pathum Wan', null, null, 'home', null,
   '[]', '[]', 390, 2, '32'),
  ('b0000000-0000-4000-8000-000000000216', 'a0000000-0000-4000-8000-000000000007', '1551504734-5ee1c4a1479b', 'Sunday fish tacos', 'Market fish, pickled onions, too many tortillas.', 'clear', 21, array['together','fresh'], array['lunch'], 'Mexico City', 'MX', 'Coyoacán', null, 'city', 'home', null,
   '[]', '[]', 560, 4, '11'),
  ('b0000000-0000-4000-8000-000000000217', 'a0000000-0000-4000-8000-000000000008', '1574071318508-1cdbab80d002', 'Margherita from the home oven', 'Two days of dough, ninety seconds of bake.', 'overcast', 14, array['calm','celebrating'], array['dinner'], 'Rome', 'IT', 'Trastevere', null, 'city', 'home', null,
   '[{"name": "Pizza dough", "amount": "1 ball"}, {"name": "San Marzano tomatoes", "amount": "100 g"}, {"name": "Fior di latte", "amount": "100 g"}, {"name": "Basil", "amount": "a few leaves"}]', '[{"text": "Let the dough rise slowly in the fridge."}, {"text": "Stretch, top, bake as hot as the oven goes.", "timer_sec": 420}, {"text": "Basil on at the end."}]', 780, 1, '13'),
  ('b0000000-0000-4000-8000-000000000218', 'a0000000-0000-4000-8000-000000000008', '1563379926898-05f4575a45d8', 'Prawn spaghetti, lots of garlic', 'Rainy lunch, no regrets.', 'rain', 13, array['comforting','hearty'], array['lunch'], 'Rome', 'IT', 'Trastevere', null, null, 'home', null,
   '[]', '[]', 640, 2, '40'),
  ('b0000000-0000-4000-8000-000000000219', 'a0000000-0000-4000-8000-000000000009', '1600891964092-4316c288032e', 'Picanha and fries', 'Friday churrasco on the balcony.', 'clear-night', 25, array['together','celebrating'], array['dinner'], 'São Paulo', 'BR', 'Vila Madalena', null, 'city', 'home', null,
   '[]', '[]', 890, 3, '16'),
  ('b0000000-0000-4000-8000-000000000220', 'a0000000-0000-4000-8000-000000000010', '1512058564366-18510be2db19', 'Nasi kebuli with lemon', 'Spiced rice for the whole street.', 'shower', 28, array['together','hearty'], array['lunch'], 'Jakarta', 'ID', 'Kemang', null, 'city', 'home', null,
   '[]', '[]', 700, 6, '20')
) as v(id, creator, photo, name, descr, weather, temp, moods, meals, city, country, ward, cell, scape, kind, place, ingredients, steps, kcal, serv, hours)
on conflict (id) do nothing;

insert into food_images (food_id, user_id, image_url, image_type, display_order)
select id, creator_id, image_url, 'photo', 0 from foods
where id between 'b0000000-0000-4000-8000-000000000201' and 'b0000000-0000-4000-8000-000000000220'
on conflict (food_id, display_order) do nothing;

-- ---------------------------------------------------------------- 3. acorns · comments
insert into likes (food_id, user_id)
select dish.id, giver.id
from foods as dish
cross join profiles as giver
where dish.id between 'b0000000-0000-4000-8000-000000000201' and 'b0000000-0000-4000-8000-000000000220'
  and giver.id::text like 'a0000000-0000-4000-8000-%'
  and giver.id <> dish.creator_id
  and abs(hashtext(dish.id::text || giver.id::text)) % 10 < 6
on conflict do nothing;

insert into comments (food_id, user_id, body, created_at)
select v.food::uuid, v.who::uuid, v.body, now() - (v.hours || ' hours')::interval
from (values
  ('b0000000-0000-4000-8000-000000000201', 'a0000000-0000-4000-8000-000000000002', 'Banchan clean-out bowls are the best bowls.', '0.5'),
  ('b0000000-0000-4000-8000-000000000202', 'a0000000-0000-4000-8000-000000000001', 'Exactly what this weather needs.', '1.2'),
  ('b0000000-0000-4000-8000-000000000203', 'a0000000-0000-4000-8000-000000000006', 'Chimaek is a universal language 🍗', '3'),
  ('b0000000-0000-4000-8000-000000000205', 'a0000000-0000-4000-8000-000000000004', 'Brown butter makes everything better.', '8'),
  ('b0000000-0000-4000-8000-000000000208', 'a0000000-0000-4000-8000-000000000007', 'Snow and sushi, perfect pair.', '2'),
  ('b0000000-0000-4000-8000-000000000210', 'a0000000-0000-4000-8000-000000000003', 'Shilin! Which skewer was the best?', '4'),
  ('b0000000-0000-4000-8000-000000000212', 'a0000000-0000-4000-8000-000000000006', 'Tái is the only way.', '6'),
  ('b0000000-0000-4000-8000-000000000217', 'a0000000-0000-4000-8000-000000000009', 'That crust 😍', '12'),
  ('b0000000-0000-4000-8000-000000000219', 'a0000000-0000-4000-8000-000000000008', 'Invite me next Friday.', '15'),
  ('b0000000-0000-4000-8000-000000000220', 'a0000000-0000-4000-8000-000000000005', 'Saving this for the weekend.', '18')
) as v(food, who, body, hours)
where not exists (select 1 from comments as old where old.food_id = v.food::uuid and old.user_id = v.who::uuid and old.body = v.body);
