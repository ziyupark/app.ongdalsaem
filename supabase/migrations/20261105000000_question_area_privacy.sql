-- Neighborhood questions respect the 9.5 "Shared precision" setting
-- docs/04-screens/03-nearby.md (3.7 · 3.8) · 06-data-model (Question)
--   * the place label on a question follows profiles.shared_precision
--     (neighborhood → 'Mangwon-dong', city → 'Seoul', country → 'Korea')
--   * who sees it is decided by a coarse area cell (geohash, 5 chars ≈ 5 km)
--     kept in question_areas, which clients can never read
--   * questions are created only through ask_question() and listed for the
--     map/feed only through nearby_questions()

alter table questions
  add column region_precision text not null default 'neighborhood'
    check (region_precision in ('neighborhood', 'city', 'country'));

create table question_areas (
  question_id uuid primary key references questions (id) on delete cascade,
  geohash text not null check (geohash ~ '^[0-9b-hjkmnp-z]{5}$')
);
create index question_areas_cell_idx on question_areas (left(geohash, 4));

alter table question_areas enable row level security;
-- no policies: not readable or writable by anon / authenticated
revoke all on question_areas from anon, authenticated;

-- direct inserts are replaced by ask_question()
drop policy "ask a question" on questions;

create or replace function ask_question(
  p_body text,
  p_category text,
  p_image_url text default null,
  p_neighborhood text default null,
  p_city text default null,
  p_country text default null,
  p_geohash text default null,
  p_table_id uuid default null
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
    raise exception 'area_required';            -- neighborhood questions need an area
  end if;

  select coalesce(shared_precision, 'city') into v_precision
  from profiles where id = auth.uid();

  insert into questions (author_id, body, category, image_url,
                         neighborhood, city, country, table_id, region_precision)
  values (
    auth.uid(), p_body, p_category, p_image_url,
    case when v_precision = 'neighborhood' then p_neighborhood end,
    case when v_precision in ('neighborhood', 'city') then p_city end,
    p_country,
    p_table_id, v_precision
  )
  returning * into q;

  if p_geohash is not null then
    insert into question_areas (question_id, geohash) values (q.id, left(lower(p_geohash), 5));
  end if;

  return q;
end;
$$;

-- open questions in the same ≈20 km cell (first 4 geohash characters),
-- newest and least answered first; blocked authors are left out
create or replace function nearby_questions(p_geohash text, p_limit int default 20)
returns setof questions
language sql stable security definer set search_path = public as $$
  select q.*
  from questions q
  join question_areas a on a.question_id = q.id
  where left(a.geohash, 4) = left(lower(p_geohash), 4)
    and q.table_id is null
    and q.moderation_state = 'visible'
    and q.expires_at > now()
    and not exists (select 1 from blocks b
                    where b.blocker_id = auth.uid() and b.blocked_id = q.author_id)
  order by q.answer_count = 0 desc, q.created_at desc
  limit least(greatest(p_limit, 1), 50);
$$;

revoke all on function ask_question(text, text, text, text, text, text, text, uuid) from public, anon;
grant execute on function ask_question(text, text, text, text, text, text, text, uuid) to authenticated;
revoke all on function nearby_questions(text, int) from public, anon;
grant execute on function nearby_questions(text, int) to authenticated;
