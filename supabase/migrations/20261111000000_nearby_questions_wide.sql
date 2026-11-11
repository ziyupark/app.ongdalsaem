-- Explore · Our area tops up questions from wider ranges when your area cell has fewer than 3.
-- nearby_questions() matches the 4-char cell; this matches one geohash level wider (3 chars, the cell and its
-- neighbours). Same rules as nearby_questions(): area rows stay private, only the question rows come back.

create or replace function nearby_questions_wide(p_geohash text, p_limit int default 20)
returns setof questions
language sql stable security definer set search_path = public as $$
  select q.*
  from questions q
  join question_areas a on a.question_id = q.id
  where left(a.geohash, 3) = left(lower(p_geohash), 3)
    and q.table_id is null
    and q.moderation_state = 'visible'
    and q.expires_at > now()
    and not exists (select 1 from blocks b
                    where b.blocker_id = auth.uid() and b.blocked_id = q.author_id)
  order by q.answer_count = 0 desc, q.created_at desc
  limit least(greatest(p_limit, 1), 50);
$$;

revoke all on function nearby_questions_wide(text, int) from public, anon;
grant execute on function nearby_questions_wide(text, int) to authenticated;
