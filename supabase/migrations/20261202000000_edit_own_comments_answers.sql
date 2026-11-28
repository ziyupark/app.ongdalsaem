-- Comment · answer edit (7.1 comments · 3.8 answers, "more" menu → Edit).
-- `grant update (body)` is already in place (20261121000000_ugc_safety.sql) and the length guard · ugc_filter
-- triggers already run on `update of body`; only the RLS policy was missing, so edits matched no rows.

create policy "users can edit their own comments"
  on comments for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "edit own answer"
  on answers for update
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));
