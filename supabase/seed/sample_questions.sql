-- ongdalsaem — SAMPLE DATA (dev only). Run once in the Supabase SQL Editor, after sample_posts.sql (needs its sample
-- cooks). Safe to re-run (fixed ids, on conflict do nothing).
-- 3 neighbourhood questions from the sample Seoul cooks (Minji, Jae) for Explore · Our area / 3.x.
-- Area cell: Dongjak-gu 'wydm2' — nearby_questions() matches the first 4 chars ('wydm' ≈ all of Seoul). Up for 30 days.
-- Removed with the sample cooks by supabase/seed/sample_posts_cleanup.sql (questions cascade from their author).
insert into questions (id, author_id, body, category, neighborhood, city, country, expires_at, created_at) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   '비 오는 날 동작구에서 칼국수 맛있게 하는 집 있을까요? 바지락 넉넉한 곳이면 좋겠어요.',
   'where_to_eat', '동작구', '서울특별시', 'KR', now() + interval '30 days', now() - interval '3 hours'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002',
   '노량진 수산시장 요즘 제철 생선 뭐가 좋아요? 집에서 구이로 해 먹으려고요.',
   'market_deals', '동작구', '서울특별시', 'KR', now() + interval '30 days', now() - interval '1 day'),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001',
   '된장찌개에 애호박 대신 넣을 만한 채소 추천해 주세요. 냉장고에 감자랑 버섯만 있어요.',
   'recipe_help', '동작구', '서울특별시', 'KR', now() + interval '30 days', now() - interval '2 days')
on conflict (id) do nothing;

insert into question_areas (question_id, geohash) values
  ('b0000000-0000-4000-8000-000000000001', 'wydm2'),
  ('b0000000-0000-4000-8000-000000000002', 'wydm2'),
  ('b0000000-0000-4000-8000-000000000003', 'wydm2')
on conflict (question_id) do nothing;
