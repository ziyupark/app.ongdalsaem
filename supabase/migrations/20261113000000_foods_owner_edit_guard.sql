-- Post edit (7.1 More → Edit): the owner may UPDATE their own foods row (policy "users can update their own foods",
-- 20260921000000) and replace its food_images rows (policies in 20260923010000). Those policies check ownership only,
-- so an owner could also rewrite fields that are not theirs to edit. This trigger keeps them as they were when the
-- owner is the one updating: moderation state (a hidden post can't be un-hidden by its author), creator,
-- created_at, and the weather snapshot taken when the dish was shared.
-- Updates by others (e.g. the report trigger that hides a post, running as the reporter) are not affected.

create or replace function foods_owner_edit_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null and auth.uid() = old.creator_id then
    new.creator_id := old.creator_id;
    new.created_at := old.created_at;
    new.moderation_state := old.moderation_state;
    new.weather_condition := old.weather_condition;
    new.temperature_c := old.temperature_c;
    new.weather_tags := old.weather_tags;
    new.temperature_tags := old.temperature_tags;
    new.taken_at := old.taken_at;
  end if;
  return new;
end;
$$;

drop trigger if exists foods_owner_edit_guard on foods;
create trigger foods_owner_edit_guard
  before update on foods
  for each row execute function foods_owner_edit_guard();
