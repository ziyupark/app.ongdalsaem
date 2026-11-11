-- Optional short status message shown below the nickname on Profile
-- (KakaoTalk-style "상태메시지"). Nullable, no length constraint at the DB
-- level — the UI truncates to one line, and nothing else reads this value.
alter table profiles
  add column bio text;
