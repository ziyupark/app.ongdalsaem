-- ongdalsaem — SAMPLE DATA (dev only). Run once in the Supabase SQL Editor. Safe to re-run (fixed ids, on conflict do nothing)
-- 10 sample cooks (no sign-in: they have no password) · 24 public dishes · acorns · follows · comments.
-- Photos: Unsplash (free to use under the Unsplash License). Avatars are left empty → initials.
-- Remove everything with supabase/seed/sample_posts_cleanup.sql.

-- ---------------------------------------------------------------- 1. accounts (auth.users → profiles via trigger)
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                        confirmation_token, recovery_token, email_change_token_new, email_change)
select '00000000-0000-0000-0000-000000000000', u.id::uuid, 'authenticated', 'authenticated', u.email, '', now(),
       '{"provider":"email","providers":["email"]}', '{"sample":true}', now() - interval '30 days', now(), '', '', '', ''
from (values
  ('a0000000-0000-4000-8000-000000000001', 'sample+minji@ongdalsaem.dev'),
  ('a0000000-0000-4000-8000-000000000002', 'sample+jae@ongdalsaem.dev'),
  ('a0000000-0000-4000-8000-000000000003', 'sample+aoi@ongdalsaem.dev'),
  ('a0000000-0000-4000-8000-000000000004', 'sample+lin@ongdalsaem.dev'),
  ('a0000000-0000-4000-8000-000000000005', 'sample+linh@ongdalsaem.dev'),
  ('a0000000-0000-4000-8000-000000000006', 'sample+ploy@ongdalsaem.dev'),
  ('a0000000-0000-4000-8000-000000000007', 'sample+sofia@ongdalsaem.dev'),
  ('a0000000-0000-4000-8000-000000000008', 'sample+luca@ongdalsaem.dev'),
  ('a0000000-0000-4000-8000-000000000009', 'sample+ana@ongdalsaem.dev'),
  ('a0000000-0000-4000-8000-000000000010', 'sample+dewi@ongdalsaem.dev')
) as u(id, email)
on conflict (id) do nothing;

-- the signup trigger made empty profile rows. Fill them in (the insert covers projects without the trigger).
insert into profiles (id)
select id from auth.users where id::text like 'a0000000-0000-4000-8000-%'
on conflict (id) do nothing;

update profiles as prof set
  display_name = v.display_name, username = v.username, city = v.city, country = v.country, bio = v.bio,
  location_enabled = true
from (values
  ('a0000000-0000-4000-8000-000000000001', 'Minji', 'minji.cooks', 'Seoul', 'KR', 'Cooking for one, mostly when it rains.'),
  ('a0000000-0000-4000-8000-000000000002', 'Jae', 'jae.eats', 'Seoul', 'KR', 'Market lunches and late-shift snacks.'),
  ('a0000000-0000-4000-8000-000000000003', 'Aoi', 'aoi.sapporo', 'Sapporo', 'JP', 'Snow outside, broth inside.'),
  ('a0000000-0000-4000-8000-000000000004', 'Lin', 'lin.taipei', 'Taipei', 'TW', 'Grandma''s noodle soup, my way.'),
  ('a0000000-0000-4000-8000-000000000005', 'Linh', 'linh.hanoi', 'Hanoi', 'VN', 'Phở before sunrise.'),
  ('a0000000-0000-4000-8000-000000000006', 'Ploy', 'ploy.bkk', 'Bangkok', 'TH', 'Street-stall regular, home-cook in training.'),
  ('a0000000-0000-4000-8000-000000000007', 'Sofía', 'sofia.cdmx', 'Mexico City', 'MX', 'Tacos for every weather.'),
  ('a0000000-0000-4000-8000-000000000008', 'Luca', 'luca.cucina', 'Rome', 'IT', 'Fresh pasta on Sundays.'),
  ('a0000000-0000-4000-8000-000000000009', 'Ana', 'ana.sp', 'São Paulo', 'BR', 'Slow breakfasts, loud kitchens.'),
  ('a0000000-0000-4000-8000-000000000010', 'Dewi', 'dewi.jkt', 'Jakarta', 'ID', 'Fried rice after the rain.')
) as v(id, display_name, username, city, country, bio)
where prof.id = v.id::uuid;

-- ---------------------------------------------------------------- 2. dishes
insert into foods (id, creator_id, image_url, image_type, name, description, weather_condition, temperature_c,
                   temperature_tags, mood_tags, meal_type, city, country, neighborhood, geohash6, landscape,
                   dish_type, place_name, visibility, status, ingredients, steps, calories, created_at, taken_at)
select v.id::uuid, v.creator::uuid,
       'https://images.unsplash.com/photo-' || v.photo || '?auto=format&fit=crop&w=1080&q=80', 'photo',
       v.name, v.descr, v.weather, v.temp,
       array[case when v.temp <= 4 then 'cold' when v.temp <= 12 then 'cool' when v.temp <= 20 then 'mild' when v.temp <= 27 then 'warm' else 'hot' end],
       v.moods, v.meals, v.city, v.country, v.ward, v.cell, v.scape,
       v.kind, v.place, 'everyone', 'published', v.ingredients::jsonb, v.steps::jsonb, v.kcal,
       now() - (v.hours || ' hours')::interval, now() - (v.hours || ' hours')::interval
from (values
  -- Seoul (today: grey, ~8°) — these fill Home's meal slots and Nearby for a Seoul device
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '1777113310299-c3e41dec4e0f', 'Kimchi jjigae for one', 'Old kimchi from my mom''s fridge — the sourer, the better on a grey night.', 'cloudy', 8, array['cozy','comforting'], array['dinner'], 'Seoul', 'KR', 'Mapo-gu', 'wydjxu', 'city', 'home', null,
   '[{"name":"Aged kimchi","amount":"1 cup"},{"name":"Pork belly","amount":"100 g"},{"name":"Tofu","amount":"½ block"},{"name":"Gochugaru","amount":"1 tsp"}]',
   '[{"text":"Fry the pork and kimchi until the edges caramelise."},{"text":"Add water and gochugaru, simmer.","timer_sec":900},{"text":"Slide in the tofu and rest for 2 minutes."}]', 430, '1'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', '1718777791239-c473e9ce7376', 'Bibimbap with leftover namul', 'Three days of side dishes, one very happy bowl.', 'cloudy', 9, array['calm','hearty'], array['lunch'], 'Seoul', 'KR', 'Mapo-gu', 'wydjxu', null, 'home', null, '[]', '[]', 610, '3'),
  ('b0000000-0000-4000-8000-000000000022', 'a0000000-0000-4000-8000-000000000001', '1558220831-9ad8f955fb9b', 'Hot noodle soup on a grey afternoon', 'Anchovy broth, soft noodles, nothing fancy.', 'overcast', 8, array['comforting'], array['snack'], 'Seoul', 'KR', 'Mapo-gu', 'wydjxu', null, 'home', null, '[]', '[]', null, '0.5'),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', '1787273846279-c81fbc3b9c2a', 'Spicy kimchi stir-fry', 'Afternoon snack that turned into a meal.', 'overcast', 7, array['energized'], array['snack'], 'Seoul', 'KR', 'Jung-gu', 'wydm9q', 'city', 'home', null, '[]', '[]', 380, '2'),
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', '1590301157890-4810ed352733', 'Market bibimbap', 'Third stall from the gate — cash only, worth the queue.', 'cloudy', 8, array['together','hearty'], array['lunch'], 'Seoul', 'KR', 'Jung-gu', 'wydm9t', 'city', 'travel', 'Namdaemun Market', '[]', '[]', null, '5'),
  ('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000002', '1589047133481-02b4a5327d89', 'Mandu for the late shift', 'Folded fifty on Sunday, eating them all week.', 'cloudy', 6, array['nostalgic'], array['dinner','snack'], 'Seoul', 'KR', 'Jung-gu', 'wydm9r', null, 'home', null, '[]', '[]', 520, '20'),
  -- Japan
  ('b0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000003', '1526318896980-cf78c088247c', 'Miso butter ramen', 'Miso butter corn ramen at 11 PM. The snow can wait.', 'snow', -4, array['cozy','hearty'], array['dinner'], 'Sapporo', 'JP', 'Chuo-ku', null, 'mountain', 'home', null, '[]', '[]', 780, '6'),
  ('b0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000003', '1612927601601-6638404737ce', 'Shoyu ramen with a soft egg', 'Six-and-a-half-minute egg, every time.', 'flurries', -2, array['comforting'], array['lunch'], 'Sapporo', 'JP', 'Chuo-ku', null, null, 'home', null, '[]', '[]', null, '26'),
  ('b0000000-0000-4000-8000-000000000023', 'a0000000-0000-4000-8000-000000000003', '1758979690131-11e2aa0b142b', 'Chicken stir-fry noodles', 'Ten-minute lunch between shovelling the drive.', 'cloudy', 2, array['energized'], array['lunch'], 'Sapporo', 'JP', 'Chuo-ku', null, null, 'home', null, '[]', '[]', 560, '50'),
  -- Taiwan
  ('b0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000004', '1511910849309-0dffb8785146', 'Beef noodle soup', 'Grandma''s recipe, a little less star anise.', 'drizzle', 18, array['comforting','nostalgic'], array['dinner'], 'Taipei', 'TW', 'Da''an District', null, 'city', 'home', null, '[]', '[]', 690, '4'),
  ('b0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000004', '1604632910985-5a738e3237d2', 'Pork & chive dumplings', 'Rainy Saturday, four of us folding at the table.', 'rain', 17, array['together'], array['snack'], 'Taipei', 'TW', 'Da''an District', null, null, 'home', null, '[]', '[]', null, '30'),
  -- Vietnam
  ('b0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000005', '1555126634-323283e090fa', 'Phở bò at dawn', 'Fog on the lake, broth that simmered all night.', 'fog', 21, array['calm','fresh'], array['breakfast'], 'Hanoi', 'VN', 'Hoàn Kiếm', null, 'lake', 'home', null, '[]', '[]', 450, '8'),
  ('b0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000005', '1677011454858-8ecb6d4e6ce0', 'Meatball phở', 'For the drizzly days when one bowl isn''t enough.', 'drizzle', 22, array['comforting'], array['lunch'], 'Hanoi', 'VN', 'Hoàn Kiếm', null, null, 'home', null, '[]', '[]', null, '33'),
  -- Thailand
  ('b0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000006', '1637806930600-37fa8892069d', 'Pad thai, extra lime', 'Too hot to cook anything slow.', 'heat', 33, array['energized','fresh'], array['dinner'], 'Bangkok', 'TH', 'Pathum Wan', null, 'city', 'home', null, '[]', '[]', 640, '9'),
  ('b0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000006', '1637806931098-af30b519be53', 'Street-stall pad thai', 'Wrapped in egg, eaten standing up, no regrets.', 'clear-night', 29, array['together'], array['dinner'], 'Bangkok', 'TH', 'Phra Nakhon', null, 'city', 'travel', 'Thip Samai', '[]', '[]', null, '40'),
  -- Mexico
  ('b0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000007', '1565299585323-38d6b0865b47', 'Tacos al pastor', 'Birthday tacos for twelve, pineapple on top.', 'clear', 22, array['celebrating','together'], array['dinner'], 'Mexico City', 'MX', 'Cuauhtémoc', null, 'city', 'home', null, '[]', '[]', 720, '12'),
  ('b0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000007', '1624300629298-e9de39c13be5', 'Prawn tacos with lime crema', 'Cloudy beach day, still worth it.', 'cloudy', 20, array['fresh'], array['lunch'], 'Mexico City', 'MX', 'Cuauhtémoc', null, 'sea', 'home', null, '[]', '[]', null, '36'),
  ('b0000000-0000-4000-8000-000000000024', 'a0000000-0000-4000-8000-000000000007', '1768716575089-7ba787da9afb', 'Breakfast tacos to go', 'Three tacos, one lime, out the door.', 'clear', 18, array['fresh'], array['breakfast'], 'Mexico City', 'MX', 'Cuauhtémoc', null, null, 'home', null, '[]', '[]', null, '18'),
  -- Italy
  ('b0000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000008', '1612966893103-790e549a2ab1', 'Fresh tagliatelle, Sunday style', 'Flour everywhere, nobody minded.', 'clear', 19, array['calm','together'], array['lunch'], 'Rome', 'IT', 'Municipio I', null, 'city', 'home', null,
   '[{"name":"00 flour","amount":"200 g"},{"name":"Eggs","amount":"2"},{"name":"Butter","amount":"40 g"},{"name":"Parmigiano","amount":"to taste"}]',
   '[{"text":"Knead the dough until smooth, then rest it.","timer_sec":1800},{"text":"Roll thin and cut into ribbons."},{"text":"Boil for 2 minutes and toss with butter.","timer_sec":120}]', 590, '14'),
  ('b0000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000008', '1606091484089-089fa86fad4f', 'Cacio e pepe at midnight', 'Grey evening, three ingredients, zero effort.', 'overcast', 15, array['lazy','comforting'], array['dinner'], 'Rome', 'IT', 'Municipio I', null, null, 'home', null, '[]', '[]', null, '44'),
  -- Brazil
  ('b0000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000009', '1506084868230-bb9d95c24759', 'Pancakes for a slow Sunday', 'Showers outside, nowhere to be.', 'shower', 24, array['lazy','cozy'], array['breakfast'], 'São Paulo', 'BR', 'Pinheiros', null, 'city', 'home', null, '[]', '[]', 480, '10'),
  ('b0000000-0000-4000-8000-000000000019', 'a0000000-0000-4000-8000-000000000009', '1538220856186-0be0e085984d', 'French toast with berries', 'Mum''s birthday breakfast.', 'clear', 26, array['celebrating'], array['breakfast'], 'São Paulo', 'BR', 'Pinheiros', null, null, 'home', null, '[]', '[]', null, '46'),
  -- Indonesia
  ('b0000000-0000-4000-8000-000000000020', 'a0000000-0000-4000-8000-000000000010', '1647093953000-9065ed6f85ef', 'Nasi goreng with a fried egg', 'Yesterday''s rice, today''s rain.', 'rain', 27, array['hearty','comforting'], array['dinner'], 'Jakarta', 'ID', 'Menteng', null, 'city', 'home', null, '[]', '[]', 650, '7'),
  ('b0000000-0000-4000-8000-000000000021', 'a0000000-0000-4000-8000-000000000010', '1612929633738-8fe44f7ec841', 'Mie goreng after the storm', 'Power came back just in time.', 'thunder', 26, array['energized'], array['snack'], 'Jakarta', 'ID', 'Menteng', null, null, 'home', null, '[]', '[]', null, '28')
) as v(id, creator, photo, name, descr, weather, temp, moods, meals, city, country, ward, cell, scape, kind, place, ingredients, steps, kcal, hours)
on conflict (id) do nothing;

-- cover photo as the first gallery image (7.1 reads food_images)
insert into food_images (food_id, user_id, image_url, image_type, display_order)
select id, creator_id, image_url, 'photo', 0 from foods where id::text like 'b0000000-0000-4000-8000-%'
on conflict (food_id, display_order) do nothing;

-- ---------------------------------------------------------------- 3. acorns · follows · comments between sample cooks
insert into likes (food_id, user_id)
select dish.id, giver.id
from foods as dish
cross join profiles as giver
where dish.id::text like 'b0000000-0000-4000-8000-%'
  and giver.id::text like 'a0000000-0000-4000-8000-%'
  and giver.id <> dish.creator_id
  and abs(hashtext(dish.id::text || giver.id::text)) % 10 < 6
on conflict do nothing;

insert into follows (follower_id, followee_id)
select fan.id, cook.id
from profiles as fan
cross join profiles as cook
where fan.id::text like 'a0000000-0000-4000-8000-%'
  and cook.id::text like 'a0000000-0000-4000-8000-%'
  and cook.id <> fan.id
  and abs(hashtext(fan.id::text || cook.id::text)) % 10 < 4
on conflict do nothing;

insert into comments (food_id, user_id, body, created_at)
select v.food::uuid, v.who::uuid, v.body, now() - (v.hours || ' hours')::interval
from (values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'Sour kimchi is the secret. Saving this for tonight.', '0.5'),
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', 'Exactly what I want in the snow.', '0.3'),
  ('b0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000004', 'That butter melt 😍', '5'),
  ('b0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000006', 'Which stall? I''m in Hanoi next week!', '7'),
  ('b0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000008', 'Feliz cumpleaños! Pineapple forever.', '11'),
  ('b0000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000009', 'Flour everywhere is the right amount of flour.', '13'),
  ('b0000000-0000-4000-8000-000000000020', 'a0000000-0000-4000-8000-000000000001', 'Rain + fried egg = perfect.', '6')
) as v(food, who, body, hours)
where not exists (select 1 from comments as old where old.food_id = v.food::uuid and old.user_id = v.who::uuid and old.body = v.body);
