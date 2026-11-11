-- ongdalsaem — Add Food Character metadata (Phase 34.5)
--
-- Food Character ("what makes this Food feel personal or distinctive?") is
-- deliberately separate from Food Context (weather_tags/temperature_tags/
-- mood_tags/meal_type — "what situation does this Food belong to?"). MVP
-- activates only Sonmat (손맛); see src/constants/foodCharacter.ts for the
-- single source of truth on which values are active. This column supports
-- future values without another schema change.
--
-- Purely additive: existing foods get '{}' (empty array), matching the
-- convention already used by weather_tags/temperature_tags/mood_tags/
-- meal_type — no existing Food content or user data is touched.

alter table foods
  add column character_tags text[] not null default '{}';
