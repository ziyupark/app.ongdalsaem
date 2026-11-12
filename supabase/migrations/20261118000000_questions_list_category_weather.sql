-- 4.5 Questions · List / 4.6 Ask · Category
--   * questions.category → whatToEat · recipe · restaurant · groceries · tools (default whatToEat)
--     old values are mapped: where_to_eat → restaurant, recipe_help → recipe,
--     ingredients / market_deals → groceries, other → whatToEat
--   * questions.mood / temp_c = the weather when the question was asked
--   * ask_question() takes p_mood / p_temp_c
--   * area_questions() = nearby_questions() / nearby_questions_wide() with category, search and paging

-- ---------- category ---------------------------------------------------------
alter table questions add column if not exists category text not null default 'whatToEat';
alter table questions drop constraint if exists questions_category_check;
update questions set category = case category
    when 'where_to_eat' then 'restaurant'
    when 'recipe_help'  then 'recipe'
    when 'ingredients'  then 'groceries'
    when 'market_deals' then 'groceries'
    else 'whatToEat'
  end
where category not in ('whatToEat', 'recipe', 'restaurant', 'groceries', 'tools');
alter table questions alter column category set default 'whatToEat';
alter table questions add constraint questions_category_check
  check (category in ('whatToEat', 'recipe', 'restaurant', 'groceries', 'tools'));

-- ---------- weather at ask time -----------------------------------------------
alter table questions add column if not exists mood text;
alter table questions add column if not exists temp_c numeric;

-- ---------- ask_question() with weather ---------------------------------------
drop function if exists ask_question(text, text, text, text, text, text, text, uuid);

create or replace function ask_question(
  p_body text,
  p_category text,
  p_image_url text default null,
  p_neighborhood text default null,
  p_city text default null,
  p_country text default null,
  p_geohash text default null,
  p_table_id uuid default null,
  p_mood text default null,
  p_temp_c numeric default null
) returns questions
language plpgsql security definer set search_path = public as $$
declare
  v_precision text;
  q questions;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  if p_table_id is null and p_geohash is null then
    raise exception 'area_required';
  end if;

  select coalesce(shared_precision, 'city') into v_precision
  from profiles where id = auth.uid();

  insert into questions (author_id, body, category, image_url,
                         neighborhood, city, country, table_id, region_precision, mood, temp_c)
  values (
    auth.uid(), p_body, coalesce(p_category, 'whatToEat'), p_image_url,
    case when v_precision = 'neighborhood' then p_neighborhood end,
    case when v_precision in ('neighborhood', 'city') then p_city end,
    p_country,
    p_table_id, v_precision, p_mood, p_temp_c
  )
  returning * into q;

  if p_geohash is not null then
    insert into question_areas (question_id, geohash) values (q.id, left(lower(p_geohash), 5));
  end if;

  return q;
end;
$$;

revoke all on function ask_question(text, text, text, text, text, text, text, uuid, text, numeric) from public, anon;
grant execute on function ask_question(text, text, text, text, text, text, text, uuid, text, numeric) to authenticated;

-- ---------- area_questions(): same rules as nearby_questions(), filterable and paged
-- p_chars 4 = your area cell (nearby_questions), 3 = the cell and its neighbours (nearby_questions_wide).
-- Never finer than 4 characters, so the area rows stay as coarse as before.
create or replace function area_questions(
  p_geohash text,
  p_chars int default 4,
  p_category text default null,
  p_query text default null,
  p_limit int default 20,
  p_offset int default 0
) returns setof questions
language sql stable security definer set search_path = public as $$
  select q.*
  from questions q
  join question_areas a on a.question_id = q.id
  where left(a.geohash, least(greatest(p_chars, 3), 4)) = left(lower(p_geohash), least(greatest(p_chars, 3), 4))
    and q.table_id is null
    and q.moderation_state = 'visible'
    and q.expires_at > now()
    and (p_category is null or q.category = p_category)
    and (coalesce(p_query, '') = ''
         or q.body ilike '%' || replace(replace(replace(p_query, '\', '\\'), '%', '\%'), '_', '\_') || '%')
    and not exists (select 1 from blocks b
                    where b.blocker_id = auth.uid() and b.blocked_id = q.author_id)
  order by q.answer_count = 0 desc, q.created_at desc, q.id
  limit least(greatest(p_limit, 1), 50)
  offset greatest(p_offset, 0);
$$;

revoke all on function area_questions(text, int, text, text, int, int) from public, anon;
grant execute on function area_questions(text, int, text, text, int, int) to authenticated;
