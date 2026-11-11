-- Adds an optional free-text review to a Food Diary entry (per user
-- request) — written alongside the eaten date in EatenLogSection's picker,
-- shown back in the Food Diary list (Profile). Nullable: most entries may
-- have no review at all, same as food_image_snapshot above.
alter table food_eaten_logs add column review text;
