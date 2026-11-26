-- A post's place (city · ward) in every app language, so each viewer reads it in their own:
-- { "en": { "city": "Seoul", "district": "Mapo-gu" }, "ko": { "city": "서울", "district": "마포구" }, … }
-- Filled by the app when the post is shared (or its place edited). city / neighborhood stay as they are — they are
-- still what filters and matching use; place_names is display only. Older posts have null and show city / neighborhood.
alter table public.foods add column if not exists place_names jsonb;
