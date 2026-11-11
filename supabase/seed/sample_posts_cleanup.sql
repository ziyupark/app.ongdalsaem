-- ongdalsaem — remove the SAMPLE DATA from sample_posts.sql.
-- Deleting the sample accounts cascades to their profiles, dishes, photos, acorns, follows and comments.
-- Acorns / comments real users gave to sample dishes go with those dishes.
delete from auth.users where id::text like 'a0000000-0000-4000-8000-%';
-- in case a profile row exists without its auth user
delete from profiles where id::text like 'a0000000-0000-4000-8000-%';
